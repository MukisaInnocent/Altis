import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
export const repoRoot = path.resolve(appRoot, '..');

const MAX_ENV_FILE_BYTES = 64 * 1024;
const loadedSources = [];
const staleKeys = new Set();

const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const LEGACY_CREDENTIAL_FILE_PATTERN = /^(DB_|MYSQL_|ADMIN_|NODE_ENV)/;

function stripQuotes(rawValue) {
  const value = rawValue.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }

  const commentIndex = value.indexOf(' #');
  return commentIndex === -1 ? value : value.slice(0, commentIndex).trim();
}

export function parseEnvFile(contents) {
  const parsed = {};
  const lines = contents.replace(/\r\n?/g, '\n').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 1) continue;

    const rawKey = trimmed.slice(0, separatorIndex).trim().replace(/^export\s+/, '');
    if (!ENV_KEY_PATTERN.test(rawKey)) continue;

    parsed[rawKey] = stripQuotes(trimmed.slice(separatorIndex + 1));
  }

  return parsed;
}

function applyEnvValues(values, sourceLabel) {
  let applied = 0;

  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] !== undefined) {
      staleKeys.add(key);
      continue;
    }
    process.env[key] = value;
    applied += 1;
  }

  if (applied > 0 || Object.keys(values).length > 0) {
    loadedSources.push(`${sourceLabel} (${applied} applied)`);
  }

  return applied;
}

export function loadEnvFile(filePath, sourceLabel = filePath) {
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch {
    return 0;
  }

  if (!stats.isFile() || stats.size === 0 || stats.size > MAX_ENV_FILE_BYTES) return 0;

  let contents;
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch {
    return 0;
  }

  return applyEnvValues(parseEnvFile(contents), sourceLabel);
}

function listLegacyCredentialFiles(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory);
  } catch {
    return [];
  }

  return entries
    .filter((name) => LEGACY_CREDENTIAL_FILE_PATTERN.test(name) && name.endsWith('.env'))
    .map((name) => path.join(directory, name));
}

export function loadEnvironment({ extraFiles = [] } = {}) {
  if (loadedSources.length > 0) return [...loadedSources];

  const candidates = [
    process.env.ENV_FILE,
    path.join(appRoot, '.env'),
    path.join(appRoot, '.env.production'),
    path.join(appRoot, '.env.local'),
    path.join(appRoot, 'env', 'database.env'),
    path.join(repoRoot, '.env'),
    ...extraFiles
  ].filter(Boolean);

  for (const candidate of candidates) {
    loadEnvFile(path.resolve(candidate));
  }

  for (const legacyFile of listLegacyCredentialFiles(appRoot)) {
    loadEnvFile(legacyFile, `legacy ${path.basename(legacyFile)}`);
  }

  for (const legacyFile of listLegacyCredentialFiles(repoRoot)) {
    loadEnvFile(legacyFile, `legacy ${path.basename(legacyFile)}`);
  }

  return describeEnvSources();
}

export function describeEnvSources() {
  return [...loadedSources];
}

export function describeStaleKeys() {
  return [...staleKeys];
}

loadEnvironment();
