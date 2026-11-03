const {
  getArchiveResponse, isSpaceEvent, json, withTimeout, parseDate, errorResponse, WIKIMEDIA_USER_AGENT,
} = require('./_lib');

module.exports = async function handler(req, res) {
  const date = parseDate(req.query.date);
  if (!date) return errorResponse(res, 400, 'date must be a real date in MM-DD format');

  const fallback = () => json(res, 200, getArchiveResponse(date.month, date.day), 'public, s-maxage=60, stale-while-revalidate=300');
  try {
    const upstream = await withTimeout(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${date.month}/${date.day}`, {
      headers: { Accept: 'application/json', 'User-Agent': WIKIMEDIA_USER_AGENT },
    });
    if (!upstream.ok) return fallback();
    const payload = await upstream.json();
    const events = Array.isArray(payload.events) ? payload.events.map((event) => {
      const page = event.pages?.[0];
      return {
        year: event.year,
        text: event.text,
        title: page?.title || event.text,
        image: page?.thumbnail?.source || null,
        link: page?.content_urls?.desktop?.page || (page?.pageid ? `https://en.wikipedia.org/?curid=${page.pageid}` : null),
        pages: event.pages || [],
        isRelevant: isSpaceEvent(event.text),
        source: 'wikipedia',
      };
    }) : [];
    return json(res, 200, {
      data: { month: date.month, day: date.day, totalEvents: events.length, spaceEventsCount: events.filter((event) => event.isRelevant).length, events },
      cached: false, source: 'wikipedia', timestamp: new Date().toISOString(),
    }, 'public, s-maxage=86400, stale-while-revalidate=172800');
  } catch (error) {
    return fallback();
  }
};
