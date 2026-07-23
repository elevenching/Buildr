import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const MAX_JSON_BODY_BYTES = 32 * 1024;
const STATIC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web');
const APP_ROUTES = new Set(['/', '/settings/workspace', '/projects', '/services', '/changes']);
const PROJECT_DETAIL_ROUTE = /^\/projects\/[A-Za-z0-9][A-Za-z0-9._-]*$/;
const CHANGE_DETAIL_ROUTE = /^\/changes\/[A-Za-z0-9][A-Za-z0-9._-]*\/[^/]+$/;
const STATIC_ASSETS = new Map([
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/api-client.js', ['api-client.js', 'text/javascript; charset=utf-8']],
  ['/router.js', ['router.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/features/workspace.js', ['features/workspace.js', 'text/javascript; charset=utf-8']],
  ['/features/projects.js', ['features/projects.js', 'text/javascript; charset=utf-8']],
  ['/features/project-detail.js', ['features/project-detail.js', 'text/javascript; charset=utf-8']],
  ['/features/services.js', ['features/services.js', 'text/javascript; charset=utf-8']],
  ['/features/changes.js', ['features/changes.js', 'text/javascript; charset=utf-8']],
  ['/features/change-detail.js', ['features/change-detail.js', 'text/javascript; charset=utf-8']],
  ['/features/agent-actions.js', ['features/agent-actions.js', 'text/javascript; charset=utf-8']],
]);

function jsonResponse(response, status, value) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(`${JSON.stringify(value)}\n`);
}

function textResponse(response, status, content, contentType) {
  response.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'",
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  });
  response.end(content);
}

function apiError(response, error) {
  const status = Number.isInteger(error.status) ? error.status : 500;
  jsonResponse(response, status, {
    error: {
      code: error.code || 'internal_error',
      message: status >= 500 ? 'Buildr 本地应用处理请求失败。' : error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    },
  });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_JSON_BODY_BYTES) {
        tooLarge = true;
      } else {
        chunks.push(chunk);
      }
    });
    request.on('end', () => {
      if (tooLarge) {
        const error = new Error('请求体超过允许大小。');
        error.code = 'request_body_too_large';
        error.status = 413;
        reject(error);
        return;
      }
      try {
        const content = Buffer.concat(chunks).toString('utf8');
        resolve(content ? JSON.parse(content) : {});
      } catch {
        const error = new Error('请求体必须是合法 JSON。');
        error.code = 'invalid_json';
        error.status = 400;
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function assertWriteRequest(request, origin, sessionToken) {
  if (request.headers.origin !== origin) {
    const error = new Error('写请求必须来自当前 Buildr 本地应用。');
    error.code = 'origin_forbidden';
    error.status = 403;
    throw error;
  }
  if (request.headers['x-buildr-session'] !== sessionToken) {
    const error = new Error('Buildr 本地应用 session 已失效，请刷新页面。');
    error.code = 'session_forbidden';
    error.status = 403;
    throw error;
  }
  if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    const error = new Error('写请求 content type 必须是 application/json。');
    error.code = 'content_type_unsupported';
    error.status = 415;
    throw error;
  }
}

function staticFile(name) {
  return fs.readFileSync(path.join(STATIC_ROOT, name), 'utf8');
}

export function createLocalWorkspaceServer(runtime, { targetRoot, port = 0 } = {}) {
  const root = path.resolve(targetRoot || process.cwd());
  runtime.assertInitializedBuildrWorkspace(root);
  runtime.getWorkspace(root);
  const sessionToken = crypto.randomBytes(32).toString('hex');
  let origin = null;

  const server = http.createServer((request, response) => {
    Promise.resolve().then(async () => {
      const requestUrl = new URL(request.url || '/', origin || 'http://127.0.0.1');
      if (requestUrl.searchParams.has('target') || requestUrl.searchParams.has('path')) {
        const error = new Error('本地应用 target 在启动时已经固定，API 不接受 filesystem path。');
        error.code = 'target_forbidden';
        error.status = 400;
        throw error;
      }
      if (request.method === 'GET' && (APP_ROUTES.has(requestUrl.pathname) || PROJECT_DETAIL_ROUTE.test(requestUrl.pathname) || CHANGE_DETAIL_ROUTE.test(requestUrl.pathname))) {
        textResponse(response, 200, staticFile('index.html').replace('__BUILDR_SESSION_TOKEN__', sessionToken), 'text/html; charset=utf-8');
        return;
      }
      const staticAsset = STATIC_ASSETS.get(requestUrl.pathname);
      if (request.method === 'GET' && staticAsset) {
        textResponse(response, 200, staticFile(staticAsset[0]), staticAsset[1]);
        return;
      }
      if (request.method === 'GET' && requestUrl.pathname === '/api/v1/workspace') {
        jsonResponse(response, 200, runtime.getWorkspace(root));
        return;
      }
      if (request.method === 'PUT' && requestUrl.pathname === '/api/v1/workspace') {
        assertWriteRequest(request, origin, sessionToken);
        jsonResponse(response, 200, runtime.updateWorkspaceMetadata(root, await readJsonBody(request)));
        return;
      }
      if (request.method === 'GET' && requestUrl.pathname === '/api/v1/projects') {
        jsonResponse(response, 200, runtime.listProjects(root));
        return;
      }
      if (request.method === 'GET' && requestUrl.pathname === '/api/v1/changes') {
        jsonResponse(response, 200, runtime.listChanges(root));
        return;
      }
      const projectMatch = requestUrl.pathname.match(/^\/api\/v1\/projects\/([A-Za-z0-9][A-Za-z0-9._-]*)$/);
      if (request.method === 'GET' && projectMatch) {
        jsonResponse(response, 200, runtime.projectDetail(root, projectMatch[1]));
        return;
      }
      if (request.method === 'PUT' && projectMatch) {
        assertWriteRequest(request, origin, sessionToken);
        jsonResponse(response, 200, runtime.updateProjectMetadata(root, projectMatch[1], await readJsonBody(request)));
        return;
      }
      const servicesMatch = requestUrl.pathname.match(/^\/api\/v1\/projects\/([A-Za-z0-9][A-Za-z0-9._-]*)\/services$/);
      if (request.method === 'GET' && servicesMatch) {
        jsonResponse(response, 200, runtime.listServices(root, servicesMatch[1]));
        return;
      }
      const serviceMatch = requestUrl.pathname.match(/^\/api\/v1\/projects\/([A-Za-z0-9][A-Za-z0-9._-]*)\/services\/([A-Za-z0-9][A-Za-z0-9._-]*)$/);
      if (request.method === 'GET' && serviceMatch) {
        jsonResponse(response, 200, runtime.serviceDetail(root, serviceMatch[1], serviceMatch[2]));
        return;
      }
      if (request.method === 'PUT' && serviceMatch) {
        assertWriteRequest(request, origin, sessionToken);
        jsonResponse(response, 200, runtime.updateServiceMetadata(root, serviceMatch[1], serviceMatch[2], await readJsonBody(request)));
        return;
      }
      const changesMatch = requestUrl.pathname.match(/^\/api\/v1\/projects\/([A-Za-z0-9][A-Za-z0-9._-]*)\/changes$/);
      if (request.method === 'GET' && changesMatch) {
        jsonResponse(response, 200, runtime.listProjectChanges(root, changesMatch[1]));
        return;
      }
      const changeMatch = requestUrl.pathname.match(/^\/api\/v1\/projects\/([A-Za-z0-9][A-Za-z0-9._-]*)\/changes\/([^/]+)$/);
      if (request.method === 'GET' && changeMatch) {
        jsonResponse(response, 200, runtime.changeDetail(root, changeMatch[1], decodeURIComponent(changeMatch[2])));
        return;
      }
      if (request.method === 'POST' && requestUrl.pathname === '/api/v1/prompts/workspace-create') {
        assertWriteRequest(request, origin, sessionToken);
        jsonResponse(response, 200, runtime.generateWorkspaceCreatePrompt(await readJsonBody(request)));
        return;
      }
      if (request.method === 'POST' && requestUrl.pathname === '/api/v1/prompts/project-create') {
        assertWriteRequest(request, origin, sessionToken);
        jsonResponse(response, 200, runtime.generateProjectCreatePrompt(await readJsonBody(request)));
        return;
      }
      if (request.method === 'POST' && requestUrl.pathname === '/api/v1/prompts/service-create') {
        assertWriteRequest(request, origin, sessionToken);
        jsonResponse(response, 200, runtime.generateServiceCreatePrompt(await readJsonBody(request)));
        return;
      }
      if (request.method === 'POST' && requestUrl.pathname === '/api/v1/prompts/change-create') {
        assertWriteRequest(request, origin, sessionToken);
        jsonResponse(response, 200, runtime.generateChangeCreatePrompt(root, await readJsonBody(request)));
        return;
      }
      if (request.method === 'POST' && requestUrl.pathname === '/api/v1/prompts/change-action') {
        assertWriteRequest(request, origin, sessionToken);
        jsonResponse(response, 200, runtime.generateChangeActionPrompt(root, await readJsonBody(request)));
        return;
      }
      jsonResponse(response, 404, { error: { code: 'not_found', message: '请求的 Buildr 本地应用资源不存在。' } });
    }).catch((error) => apiError(response, error));
  });

  const ready = new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', reject);
      const address = server.address();
      origin = `http://127.0.0.1:${address.port}`;
      resolve({ server, url: origin, targetRoot: root, sessionToken });
    });
  });
  return { server, ready };
}

export function registerLocalWorkspaceAppInterface(runtime) {
  function startLocalWorkspaceApp(args) {
    runtime.assertNoUnknownOptions(args, new Set(['--target', '--port']));
    const targetRoot = path.resolve(runtime.optionValue(args, '--target', process.cwd()));
    const rawPort = runtime.optionValue(args, '--port', '0');
    const port = Number(rawPort);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Invalid app port: ${rawPort}`);
    const instance = createLocalWorkspaceServer(runtime, { targetRoot, port });
    instance.ready.then(({ url }) => {
      console.log(`Buildr 本地应用：${url}`);
      console.log(`Workspace：${targetRoot}`);
      console.log('仅限本机访问；按 Ctrl+C 停止。');
    }).catch((error) => {
      console.error(`Buildr 本地应用启动失败：${error.message}`);
      process.exitCode = 1;
      instance.server.close();
    });
    return instance;
  }

  Object.assign(runtime, { startLocalWorkspaceApp });
  return runtime;
}
