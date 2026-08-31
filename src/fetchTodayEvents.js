// src/fetchTodayEvents.js
import SpaceEventAPIClient from './utils/spaceEventAPI';

export async function fetchTodayEvents() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  try {
    const response = await SpaceEventAPIClient.getHistoricalEvents(month, day);
    const events = response.data?.events || [];

    // Limit to top 5 events
    return events.slice(0, 5);
  } catch (error) {
    console.error('❌ Failed to fetch today\'s events:', error.message);
    return [];
  }
}
