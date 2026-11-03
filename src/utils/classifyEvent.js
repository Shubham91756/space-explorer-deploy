import spaceData from '@stellar/space-data';

const { isSpaceEvent } = spaceData;
export { isSpaceEvent };

export const classifyEventWithScore = (text = '') => ({
  isRelevant: isSpaceEvent(text),
});
