import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const PRODUCT_ROOT = path.resolve(import.meta.dirname, '../..');
const BUILDER = path.join(PRODUCT_ROOT, 'package', 'launchers', 'build.mjs');

function build(t, platform) {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), `buildr-${platform}-launcher-`));
  t.after(() => fs.rmSync(output, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [BUILDER, '--platform', platform, '--runtime', process.execPath, '--output', output], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return output;
}

test('macOS launcher bundle 携带 Node runtime、Buildr Web 资源和可双击 App 入口', (t) => {
  const output = build(t, 'darwin');
  const app = path.join(output, 'Buildr.app', 'Contents');
  const node = path.join(app, 'MacOS', 'node');
  const buildr = path.join(app, 'Resources', 'buildr');
  assert.ok(fs.statSync(path.join(app, 'MacOS', 'Buildr')).mode & 0o100);
  const launcher = fs.readFileSync(path.join(app, 'MacOS', 'Buildr'), 'utf8');
  assert.match(launcher, /launcher\.log/);
  assert.match(launcher, /osascript/);
  assert.match(launcher, /Buildr 无法启动/);
  assert.ok(fs.existsSync(path.join(app, 'Resources', 'Buildr.icns')));
  assert.match(fs.readFileSync(path.join(app, 'Info.plist'), 'utf8'), /<key>CFBundleIconFile<\/key><string>Buildr\.icns<\/string>/);
  assert.ok(fs.existsSync(path.join(buildr, 'src', 'interfaces', 'local-app', 'web', 'index.html')));
  assert.ok(fs.existsSync(path.join(buildr, 'node_modules', 'yaml', 'package.json')));
  const version = spawnSync(node, [path.join(buildr, 'bin', 'buildr.mjs'), '--version'], { encoding: 'utf8' });
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /^0\.1\.0-rc\.6/);
});

test('Windows launcher bundle 携带 runtime、Web 资源与桌面/开始菜单快捷方式安装入口', (t) => {
  const output = build(t, 'win32');
  const root = path.join(output, 'Buildr');
  for (const file of ['runtime/node.exe', 'Buildr.ico', 'Buildr.vbs', 'Install-Buildr-Shortcuts.ps1', 'Install Buildr.cmd', 'app/bin/buildr.mjs', 'app/src/interfaces/local-app/web/index.html']) {
    assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
  }
  const script = fs.readFileSync(path.join(root, 'Install-Buildr-Shortcuts.ps1'), 'utf8');
  assert.match(script, /Desktop/);
  assert.match(script, /Start Menu/);
  assert.match(script, /IconLocation/);
  assert.match(script, /Buildr\.ico/);
  const launcher = fs.readFileSync(path.join(root, 'Buildr.vbs'), 'utf8');
  assert.match(launcher, /runtime\\node\.exe/);
  assert.match(launcher, /shell\.Run\(command, 0, True\)/);
  assert.match(launcher, /MsgBox "Buildr 无法启动/);
});
