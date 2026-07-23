#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PRODUCT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ASSET_ROOT = path.join(PRODUCT_ROOT, 'package', 'launchers', 'assets');

function option(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  return value;
}

function copyApplication(target) {
  fs.mkdirSync(target, { recursive: true });
  for (const item of ['bin', 'src', 'package', 'package.json', 'LICENSE']) {
    fs.cpSync(path.join(PRODUCT_ROOT, item), path.join(target, item), { recursive: true });
  }
  const modules = path.join(target, 'node_modules');
  fs.mkdirSync(modules, { recursive: true });
  fs.cpSync(path.join(PRODUCT_ROOT, 'node_modules', 'yaml'), path.join(modules, 'yaml'), { recursive: true });
}

function buildMac(output, runtime) {
  const root = path.join(output, 'Buildr.app', 'Contents');
  const executableRoot = path.join(root, 'MacOS');
  const resources = path.join(root, 'Resources');
  fs.mkdirSync(executableRoot, { recursive: true });
  fs.mkdirSync(resources, { recursive: true });
  fs.copyFileSync(runtime, path.join(executableRoot, 'node'));
  fs.chmodSync(path.join(executableRoot, 'node'), 0o755);
  fs.copyFileSync(path.join(ASSET_ROOT, 'Buildr.icns'), path.join(resources, 'Buildr.icns'));
  copyApplication(path.join(resources, 'buildr'));
  fs.writeFileSync(path.join(executableRoot, 'Buildr'), `#!/bin/sh\nHERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nLOG_DIR="\${TMPDIR:-/tmp}/buildr"\nLOG_FILE="$LOG_DIR/launcher.log"\nmkdir -p "$LOG_DIR"\n"$HERE/node" "$HERE/../Resources/buildr/bin/buildr.mjs" app >"$LOG_FILE" 2>&1\nSTATUS=$?\nif [ "$STATUS" -ne 0 ]; then\n  /usr/bin/osascript -e 'display alert "Buildr 无法启动" message "请重新打开 Buildr；如果仍然失败，请查看日志：'"$LOG_FILE"'" as critical buttons {"好"} default button "好"' >/dev/null 2>&1 || true\nfi\nexit "$STATUS"\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(root, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>CFBundleName</key><string>Buildr</string><key>CFBundleDisplayName</key><string>Buildr</string><key>CFBundleIdentifier</key><string>ai.buildr.local-app</string><key>CFBundleVersion</key><string>1</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleExecutable</key><string>Buildr</string><key>CFBundleIconFile</key><string>Buildr.icns</string><key>LSBackgroundOnly</key><false/></dict></plist>\n`);
  return path.join(output, 'Buildr.app');
}

function buildWindows(output, runtime) {
  const root = path.join(output, 'Buildr');
  const runtimeRoot = path.join(root, 'runtime');
  fs.mkdirSync(runtimeRoot, { recursive: true });
  fs.copyFileSync(runtime, path.join(runtimeRoot, 'node.exe'));
  fs.copyFileSync(path.join(ASSET_ROOT, 'Buildr.ico'), path.join(root, 'Buildr.ico'));
  copyApplication(path.join(root, 'app'));
  fs.writeFileSync(path.join(root, 'Buildr.vbs'), `Set shell = CreateObject("WScript.Shell")\nbase = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)\ncommand = Chr(34) & base & "\\runtime\\node.exe" & Chr(34) & " " & Chr(34) & base & "\\app\\bin\\buildr.mjs" & Chr(34) & " app"\nexitCode = shell.Run(command, 0, True)\nIf exitCode <> 0 Then\n  MsgBox "Buildr 无法启动。请重新打开；如果仍然失败，请联系管理员。", 16, "Buildr"\nEnd If\n`);
  fs.writeFileSync(path.join(root, 'Install-Buildr-Shortcuts.ps1'), `$ErrorActionPreference = "Stop"\n$root = Split-Path -Parent $MyInvocation.MyCommand.Path\n$desktop = [Environment]::GetFolderPath("Desktop")\n$start = Join-Path $env:APPDATA "Microsoft\\Windows\\Start Menu\\Programs"\n$shell = New-Object -ComObject WScript.Shell\nforeach ($folder in @($desktop, $start)) {\n  $shortcut = $shell.CreateShortcut((Join-Path $folder "Buildr.lnk"))\n  $shortcut.TargetPath = "$env:WINDIR\\System32\\wscript.exe"\n  $shortcut.Arguments = '"' + (Join-Path $root "Buildr.vbs") + '"'\n  $shortcut.WorkingDirectory = $root\n  $shortcut.IconLocation = (Join-Path $root "Buildr.ico") + ",0"\n  $shortcut.Description = "打开 Buildr 本机 Web 应用"\n  $shortcut.Save()\n}\nWrite-Host "Buildr 已添加到桌面和开始菜单。"\n`);
  fs.writeFileSync(path.join(root, 'Install Buildr.cmd'), `@echo off\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-Buildr-Shortcuts.ps1"\npause\n`);
  return root;
}

const platform = option('--platform', process.platform);
const output = path.resolve(option('--output', path.join(PRODUCT_ROOT, 'dist', 'launcher')));
const runtime = path.resolve(option('--runtime', process.execPath));
if (!['darwin', 'win32'].includes(platform)) throw new Error(`Unsupported launcher platform: ${platform}`);
if (!fs.existsSync(runtime)) throw new Error(`Node runtime not found: ${runtime}`);
fs.mkdirSync(output, { recursive: true });
const result = platform === 'darwin' ? buildMac(output, runtime) : buildWindows(output, runtime);
console.log(result);
