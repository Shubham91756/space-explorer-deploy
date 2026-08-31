/**
 * API Client for Stellar.log Backend
 * Handles all HTTP requests to the backend server
 */

import { getArchiveResponse } from './spaceArchive';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const REQUEST_TIMEOUT_MS = 6000;

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
      return getArchiveResponse(month, day);
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
