const sessionToken = document.querySelector('meta[name="buildr-session"]').content;
let workspaceId = null;

export function setWorkspaceId(value) {
  workspaceId = value || null;
}

function scopedResource(resource) {
  if (!workspaceId || !resource.startsWith('/api/v1/')) return resource;
  if (resource === '/api/v1/workspaces' || resource.startsWith('/api/v1/workspaces/') || resource.startsWith('/api/v1/app/') || resource === '/api/v1/prompts/workspace-create') return resource;
  if (resource === '/api/v1/workspace') return `/api/v1/workspaces/${encodeURIComponent(workspaceId)}`;
  return `/api/v1/workspaces/${encodeURIComponent(workspaceId)}${resource.slice('/api/v1'.length)}`;
}

export async function api(resource, options = {}) {
  const response = await fetch(scopedResource(resource), {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json', 'x-buildr-session': sessionToken } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error?.message || 'Buildr 请求失败。');
    error.code = body.error?.code;
    error.details = body.error?.details;
    throw error;
  }
  return body;
}
