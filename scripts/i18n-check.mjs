#!/usr/bin/env node
// Paridad es/en de los catálogos locales de la app y claves usadas (app/ + src/),
// reutilizando el CLI de @bandada/i18n. El CLI acepta un solo --src, así que unimos
// app/ (rutas de expo-router) y src/ en un directorio temporal.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const cli = resolve(repo, '../bandadau-shared/packages/i18n/bin/bandada-i18n-check.mjs');
const contracts = resolve(repo, '../bandadau-docs/contracts');

const tmp = fs.mkdtempSync(join(os.tmpdir(), 'bandada-app-i18n-'));
let result;
try {
  for (const dir of ['app', 'src']) fs.cpSync(join(repo, dir), join(tmp, dir), { recursive: true });
  result = spawnSync(
    process.execPath,
    [cli, resolve(repo, 'locales'), '--contracts', contracts, '--src', tmp, ...process.argv.slice(2)],
    { stdio: 'inherit' },
  );
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(result.status ?? 1);
