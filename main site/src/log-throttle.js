// When the database is unreachable, every page view and API call fails the same way. Logging each
// failure buries the useful first line, so repeats of the same message are suppressed for a while.
const lastLogged = new Map();

export function logThrottled(key, message, intervalMs = 60000, level = 'error') {
  const now = Date.now();
  if (now - (lastLogged.get(key) || 0) < intervalMs) return false;
  lastLogged.set(key, now);
  console[level](message);
  return true;
}
