// eslint-disable-next-line global-require
const spaceData = require('@stellar/space-data');

const { isSpaceEvent } = spaceData;
export { isSpaceEvent };

export const classifyEventWithScore = (text = '') => ({
  isRelevant: isSpaceEvent(text),
});
