#!/usr/bin/env node
// Paridad es/en de los catálogos locales de la app, reutilizando el CLI de @bandada/i18n.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const cli = resolve(repo, '../bandadau-shared/packages/i18n/bin/bandada-i18n-check.mjs');
const contracts = resolve(repo, '../bandadau-docs/contracts');

const result = spawnSync(
  process.execPath,
  [cli, resolve(repo, 'locales'), '--contracts', contracts, ...process.argv.slice(2)],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
