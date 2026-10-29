/**
 * API Client for Stellar.log Backend
 * Handles all HTTP requests to the backend server
 */

import { getArchiveResponse } from './spaceArchive';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const REQUEST_TIMEOUT_MS = 6000;
const WIKIPEDIA_EVENTS_URL = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/events';

const SPACE_KEYWORDS = [
  'space', 'nasa', 'astronaut', 'launch', 'moon', 'apollo',
  'shuttle', 'satellite', 'orbit', 'rocket', 'spaceship',
  'space station', 'spacecraft', 'mission', 'probe', 'telescope',
];

const isSpaceEvent = (event) => {
  const eventText = (event.text || '').toLowerCase();
  return SPACE_KEYWORDS.some((keyword) => eventText.includes(keyword));
};

const fetchWikipediaEvents = async (month, day) => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(`${WIKIPEDIA_EVENTS_URL}/${month}/${day}`, {
      method: 'GET',
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`Wikipedia returned ${response.status}`);
    }

    const data = await response.json();
    const allEvents = Array.isArray(data.events) ? data.events : [];
    const events = allEvents.filter(isSpaceEvent).map((event) => {
      const page = event.pages?.[0];
      const title = page?.title || event.text?.split(' - ')[0] || 'Wikipedia event';
      const pageId = page?.pageid || null;

      return {
        year: event.year,
        text: event.text,
        title,
        image: page?.thumbnail?.source || null,
        link: pageId
          ? `https://en.wikipedia.org/?curid=${pageId}`
          : `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        pages: event.pages || [],
        source: 'wikipedia',
      };
    });

    return {
      data: {
        month,
        day,
        totalEvents: allEvents.length,
        spaceEventsCount: events.length,
        events,
      },
      cached: false,
      source: 'wikipedia-direct',
      timestamp: new Date().toISOString(),
      message: 'Data fetched directly from Wikipedia',
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

// ============================================================================
// API CLIENT
// ============================================================================

class SpaceEventAPIClient {
  /**
   * Fetch space-related historical events for a given date
   * @param {string|number} month - Month (1-12)
   * @param {string|number} day - Day (1-31)
   * @returns {Promise<object>} Events data with caching info
   * @throws {Error} If the request fails
   */
  static async getHistoricalEvents(month, day) {
    const dateString = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const url = `${API_BASE_URL}/api/space-history?date=${dateString}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      : null;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.message || 'Failed to fetch historical events');
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      const data = await response.json();
      return {
        ...data,
        source: 'backend',
      };
    } catch (error) {
      console.error(`❌ Failed to fetch historical events for ${month}/${day}:`, error.message);
      try {
        console.warn('🔄 Trying Wikipedia directly from the browser...');
        return await fetchWikipediaEvents(month, day);
      } catch (wikipediaError) {
        console.error(`❌ Direct Wikipedia request failed for ${month}/${day}:`, wikipediaError.message);
        return getArchiveResponse(month, day);
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Check if the backend server is healthy
   * @returns {Promise<boolean>} True if server is healthy, false otherwise
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Backend server health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get cache info for debugging
   * @returns {Promise<object>} Cache statistics
   */
  static async getCacheInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/space-history/cache/info`);
      if (!response.ok) throw new Error('Failed to fetch cache info');
      return await response.json();
    } catch (error) {
      console.warn('⚠️ Failed to fetch cache info:', error.message);
      return null;
    }
  }
}

export default SpaceEventAPIClient;
