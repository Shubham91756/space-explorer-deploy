const { json, withTimeout, parseYear, errorResponse } = require('./_lib');

const API_ROOT = 'https://ll.thespacedevs.com/2.2.0/launch/';
const cache = new Map();
const launchCacheControl = (upcoming) => upcoming ? 'public, s-maxage=3600, stale-while-revalidate=7200' : 'public, s-maxage=86400, stale-while-revalidate=172800';

async function wikipediaLink(name) {
  const fallback = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`;
  try {
    const response = await withTimeout(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(name)}&limit=1&namespace=0&format=json`, { headers: { Accept: 'application/json' } });
    const data = await response.json();
    return data?.[3]?.[0] || fallback;
  } catch (error) {
    return fallback;
  }
}

async function fetchLaunches({ upcoming, year }) {
  const key = upcoming ? 'upcoming' : String(year);
  if (cache.has(key)) return cache.get(key);
  const params = new URLSearchParams({ limit: '100', ordering: 'net' });
  if (upcoming) params.set('net__gte', new Date().toISOString());
  else {
    params.set('window_start__gte', `${year}-01-01T00:00:00Z`);
    params.set('window_start__lt', `${year + 1}-01-01T00:00:00Z`);
  }
  const launches = [];
  let next = `${API_ROOT}?${params}`;
  const visited = new Set();
  while (next && !visited.has(next) && visited.size < 20) {
    visited.add(next);
    const response = await withTimeout(next, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Launch Library returned ${response.status}`);
    const data = await response.json();
    launches.push(...(data.results || []));
    next = data.next || null;
  }
  const events = await Promise.all(launches
    .filter((launch) => launch.net && (upcoming || new Date(launch.net).getUTCFullYear() === year))
    .map(async (launch) => ({
      id: launch.id,
      date: launch.net,
      year: new Date(launch.net).getUTCFullYear(),
      text: `${launch.name} - ${launch.mission?.description || 'Launch mission'}`,
      title: launch.name,
      image: launch.image || null,
      link: await wikipediaLink(launch.name),
      launchUrl: launch.webcast_live ? launch.webcast_live : launch.url || null,
      source: 'launch-library-2',
    })));
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  const result = { data: { events }, source: 'launch-library-2', cached: false, timestamp: new Date().toISOString() };
  cache.set(key, result);
  return result;
}

module.exports = async function handler(req, res) {
  const upcoming = req.url.split('?')[0].endsWith('/upcoming');
  const year = upcoming ? null : parseYear(req.query.year);
  if (!upcoming && !year) return errorResponse(res, 400, 'year must be an integer from 1950 to 2100');
  try {
    const result = await fetchLaunches({ upcoming, year });
    return json(res, 200, result, launchCacheControl(upcoming || year === new Date().getUTCFullYear()));
  } catch (error) {
    const stale = cache.get(upcoming ? 'upcoming' : String(year));
    if (stale) return json(res, 200, { ...stale, cached: true, source: 'launch-library-2-stale' }, 'public, s-maxage=60, stale-while-revalidate=300');
    return json(res, 502, { error: true, message: 'Launch provider is temporarily unavailable.' }, 'public, s-maxage=60, stale-while-revalidate=300');
  }
};
