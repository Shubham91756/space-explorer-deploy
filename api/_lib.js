const { getArchiveResponse, isSpaceEvent } = require('../shared/spaceData.cjs');

const WIKIMEDIA_USER_AGENT = 'Stellar.log/1.0 (space-explorer-deploy; contact via GitHub)';
const UPSTREAM_TIMEOUT_MS = 8000;

function json(res, status, body, cacheControl = 'no-store') {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cacheControl);
  return res.json(body);
}

function withTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function parseDate(value) {
  const match = /^(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const daysInMonth = new Date(Date.UTC(2000, month, 0)).getUTCDate();
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth ? { month, day } : null;
}

function parseYear(value) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1950 && year <= 2100 ? year : null;
}

function errorResponse(res, status, message) {
  return json(res, status, { error: true, message });
}

module.exports = {
  getArchiveResponse,
  isSpaceEvent,
  json,
  withTimeout,
  parseDate,
  parseYear,
  errorResponse,
  WIKIMEDIA_USER_AGENT,
};
