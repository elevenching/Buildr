import assert from 'node:assert/strict';
import test from 'node:test';

import { openDefaultBrowser } from '../../src/interfaces/local-app/runtime/instance-manager.mjs';
import { pickWorkspaceDirectory } from '../../src/interfaces/local-app/runtime/directory-picker.mjs';

function opener(platform) {
  const calls = [];
  const spawnProcess = (command, args, options) => {
    calls.push({ command, args, options });
    return { unref() {} };
  };
  return { result: openDefaultBrowser('http://127.0.0.1:4321', { platform, spawnProcess }), calls };
}

test('默认浏览器 opener 为 macOS、Windows 和 Linux 生成平台命令', () => {
  assert.deepEqual(opener('darwin').result, { command: 'open', args: ['http://127.0.0.1:4321'] });
  assert.deepEqual(opener('win32').result, { command: 'cmd.exe', args: ['/d', '/s', '/c', 'start', '', 'http://127.0.0.1:4321'] });
  assert.deepEqual(opener('linux').result, { command: 'xdg-open', args: ['http://127.0.0.1:4321'] });
});

test('Workspace 目录选择器复用 macOS 与 Windows 系统对话框', () => {
  const calls = [];
  const execute = (command, args) => {
    calls.push({ command, args });
    return command === 'osascript' ? '/Users/demo/Workspace/\n' : 'C:\\Work\\Buildr\r\n';
  };
  assert.equal(pickWorkspaceDirectory({ platform: 'darwin', execute }), '/Users/demo/Workspace/');
  assert.equal(pickWorkspaceDirectory({ platform: 'win32', execute }), 'C:\\Work\\Buildr');
  assert.equal(calls[0].command, 'osascript');
  assert.equal(calls[1].command, 'powershell.exe');
  assert.throws(() => pickWorkspaceDirectory({ platform: 'linux', execute }), (error) => error.code === 'workspace_picker_unsupported');
});
