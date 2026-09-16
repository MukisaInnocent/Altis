import { describeEnvSources, loadEnvironment } from './load-env.js';

const DEFAULT_ACCOUNT_PREFIX = 'u989298385';
const DEFAULT_DB_HOST = 'auth-db657.hstgr.io';
const DEFAULT_DB_PORT = 3306;
const DEFAULT_DB_NAME = 'Altis';
const DEFAULT_DB_USER = 'mukisa';
const DEFAULT_ADMIN_EMAIL = 'admin@altistravels.com';
const FALLBACK_ADMIN_PASSWORD = 'admin123';

const PLACEHOLDER_PREFIXES = ['your-', 'your_', 'replace-', 'replace_', 'change-', 'changeme', 'xxx', 'todo', '<'];

export function isUsable(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  const lowered = trimmed.toLowerCase();
  return !PLACEHOLDER_PREFIXES.some((prefix) => lowered.startsWith(prefix));
}

function read(key, fallback) {
  return isUsable(process.env[key]) ? process.env[key].trim() : fallback;
}

function applyPrefix(prefix, value) {
  return value.includes('_') ? value : `${prefix}_${value}`;
}

export function getDriver() {
  loadEnvironment();
  const forced = read('DATABASE_DRIVER', '').toLowerCase();
  if (forced === 'sqlite' || forced === 'mysql') return forced;
  return isUsable(process.env.DB_HOST) ? 'mysql' : 'sqlite';
}

export function isMysql() {
  return getDriver() === 'mysql';
}

export function getMysqlConfig() {
  loadEnvironment();

  const accountPrefix = read('DB_ACCOUNT_PREFIX', DEFAULT_ACCOUNT_PREFIX);
  const database = applyPrefix(accountPrefix, read('DB_NAME', DEFAULT_DB_NAME));
  const user = applyPrefix(accountPrefix, read('DB_USER', DEFAULT_DB_USER));

  return {
    host: read('DB_HOST', DEFAULT_DB_HOST),
    port: Number(read('DB_PORT', String(DEFAULT_DB_PORT))) || DEFAULT_DB_PORT,
    user,
    password: isUsable(process.env.DB_PASSWORD) ? process.env.DB_PASSWORD : '',
    database
  };
}

export function getAdminCredentials() {
  loadEnvironment();
  return {
    email: read('ADMIN_EMAIL', DEFAULT_ADMIN_EMAIL),
    password: read('ADMIN_PASSWORD', ''),
    usingFallbackPassword: !isUsable(process.env.ADMIN_PASSWORD)
  };
}

export function resolveAdminPassword() {
  const { password, usingFallbackPassword } = getAdminCredentials();
  return usingFallbackPassword ? FALLBACK_ADMIN_PASSWORD : password;
}

export function getMissingMysqlSettings() {
  loadEnvironment();
  const missing = [];
  if (!isUsable(process.env.DB_HOST)) missing.push('DB_HOST');
  if (!isUsable(process.env.DB_PASSWORD)) missing.push('DB_PASSWORD');
  return missing;
}

export function describeDatabaseTarget() {
  const driver = getDriver();
  const sources = describeEnvSources();

  if (driver === 'sqlite') {
    return { driver, envSources: sources };
  }

  const config = getMysqlConfig();
  return {
    driver,
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    passwordConfigured: config.password.length > 0,
    envSources: sources
  };
}
