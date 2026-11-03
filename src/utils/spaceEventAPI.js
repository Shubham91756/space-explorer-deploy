// eslint-disable-next-line global-require
const spaceData = require('@stellar/space-data');

const { getArchiveResponse } = spaceData;

if (typeof getArchiveResponse !== 'function') {
  throw new Error('The shared space archive could not be loaded.');
}

const request = async (url) => {
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.message || 'The space data service is unavailable.');
    error.status = response.status;
    throw error;
  }
  return payload;
};

const SpaceEventAPIClient = {
  async getHistoricalEvents(month, day) {
    try {
      return await request(`/api/space-history?date=${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    } catch (error) {
      return getArchiveResponse(month, day);
    }
  },
  async getLaunches(year) {
    return request(`/api/launches?year=${year}`);
  },
  async getUpcomingLaunches() {
    return request('/api/launches/upcoming');
  },
};

export default SpaceEventAPIClient;
