import express from 'express';
import NodeCache from 'node-cache';
import { getArchiveResponse, buildWikipediaUrl } from '../../src/utils/spaceArchive.js';

const router = express.Router();
const REQUEST_TIMEOUT_MS = 4500;

// ============================================================================
// CACHE SETUP
// ============================================================================
// 24 hours TTL (86400 seconds)
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse date format from "MM-DD" to month and day numbers
 * Also handles "Month_Day" format
 * @param {string} dateStr - Date string in MM-DD or Month_Day format
 * @returns {object} { month: number, day: number, isValid: boolean }
 */
function parseDateString(dateStr) {
  if (!dateStr) {
    return { isValid: false, error: 'Date parameter is missing' };
  }

  let month, day;

  // Try MM-DD format
  const mmddMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})$/);
  if (mmddMatch) {
    month = parseInt(mmddMatch[1], 10);
    day = parseInt(mmddMatch[2], 10);
  } else {
    // Try Month_Day format (e.g., January_1)
    const monthDayMatch = dateStr.match(/^([a-zA-Z]+)[_-](\d{1,2})$/);
    if (monthDayMatch) {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december',
      ];
      const monthIndex = monthNames.indexOf(monthDayMatch[1].toLowerCase());
      if (monthIndex === -1) {
        return { isValid: false, error: 'Invalid month name' };
      }
      month = monthIndex + 1;
      day = parseInt(monthDayMatch[2], 10);
    } else {
      return { isValid: false, error: 'Date format must be MM-DD or Month_Day' };
    }
  }

  // Validate month and day ranges
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Month must be between 1 and 12' };
  }
  if (day < 1 || day > 31) {
    return { isValid: false, error: 'Day must be between 1 and 31' };
  }

  return { isValid: true, month, day };
}

/**
 * Fetch Wikipedia historical events for a given date
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<object>} Events data from Wikipedia
 */
async function fetchWikipediaEvents(month, day) {
  const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Stellar.log/1.0 (Backend Proxy)',
      },
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`Wikipedia API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch from Wikipedia: ${error.message}`);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Filter events to find space-related ones
 * @param {array} events - Array of event objects
 * @returns {array} Filtered space-related events
 */
function filterSpaceEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  const spaceKeywords = [
    'space', 'nasa', 'astronaut', 'launch', 'moon', 'apollo',
    'shuttle', 'satellite', 'orbit', 'rocket', 'spaceship',
    'space station', 'spacecraft', 'mission', 'probe', 'telescope',
  ];

  return events.filter((event) => {
    const eventText = (event.text || '').toLowerCase();
    return spaceKeywords.some((keyword) => eventText.includes(keyword));
  });
}

// ============================================================================
// MAIN ROUTE HANDLER
// ============================================================================

/**
 * GET /api/space-history?date=MM-DD
 * Fetches space-related historical events for a given date
 * Results are cached with 24-hour TTL
 */
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;

    // Validate date parameter
    const parsed = parseDateString(date);
    if (!parsed.isValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parsed.error,
        example: 'Use ?date=01-15 or ?date=January_15',
      });
    }

    const { month, day } = parsed;
    const cacheKey = `space-events-${month}-${day}`;

    // ========================================================================
    // CACHE CHECK (Cache Hit)
    // ========================================================================
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`✅ Cache HIT for ${month}/${day}`);
      return res.json({
        data: cachedData,
        cached: true,
        source: cachedData.source || 'cache',
        timestamp: new Date().toISOString(),
        message: 'Data served from cache',
      });
    }

    const archiveFallback = getArchiveResponse(month, day);

    // ========================================================================
    // FETCH FROM WIKIPEDIA (Cache Miss)
    // ========================================================================
    console.log(`🔄 Cache MISS for ${month}/${day} - Fetching from Wikipedia...`);
    let wikipediaData = null;
    try {
      wikipediaData = await fetchWikipediaEvents(month, day);
    } catch (fetchError) {
      console.warn(`⚠️ Wikipedia fetch failed for ${month}/${day}: ${fetchError.message}`);
    }

    if (!wikipediaData || !Array.isArray(wikipediaData.events) || wikipediaData.events.length === 0) {
      console.log(`📚 Serving archive fallback for ${month}/${day}`);
      cache.set(cacheKey, { ...archiveFallback.data, source: 'archive' });
      return res.json(archiveFallback);
    }

    const allEvents = wikipediaData.events || [];

    // Filter for space-related events
    const spaceEvents = filterSpaceEvents(allEvents);

    // Build response with additional metadata
    const responseData = {
      month,
      day,
      totalEvents: allEvents.length,
      spaceEventsCount: spaceEvents.length,
      events: spaceEvents.map((event) => {
        const title = event.pages?.[0]?.title || event.text?.split(' - ')[0] || 'Wikipedia event';
        const pageId = event.pages?.[0]?.pageid || null;
        return {
          year: event.year,
          text: event.text,
          title,
          image: event.pages?.[0]?.thumbnail?.source || null,
          link: buildWikipediaUrl(title, pageId),
          pages: event.pages || [],
          source: 'wikipedia',
        };
      }),
      source: 'wikipedia',
    };

    // ========================================================================
    // POPULATE CACHE
    // ========================================================================
    cache.set(cacheKey, responseData);
    console.log(`💾 Cached data for ${month}/${day} (TTL: 24 hours)`);

    res.json({
      data: responseData,
      cached: false,
      source: 'wikipedia',
      timestamp: new Date().toISOString(),
      message: 'Data fetched from Wikipedia and cached',
    });
  } catch (error) {
    console.error('🔴 Error in /api/space-history:', error.message);
    const statusCode = error.message.includes('Bad Request') ? 400 : 500;
    return res.status(statusCode).json({
      error: statusCode === 400 ? 'Bad Request' : 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// CACHE INFO ENDPOINT (For debugging)
// ============================================================================

router.get('/cache/info', (req, res) => {
  const keys = cache.keys();
  const cacheStats = keys.map((key) => {
    const value = cache.get(key);
    const ttl = cache.getTtl(key);
    return {
      key,
      cachedAt: new Date(ttl - 86400000).toISOString(), // Convert TTL back to original date
      expiresAt: new Date(ttl).toISOString(),
      eventsCount: value?.events?.length || 0,
    };
  });

  res.json({
    totalCachedEntries: keys.length,
    entries: cacheStats,
    timestamp: new Date().toISOString(),
  });
});

export default router;
