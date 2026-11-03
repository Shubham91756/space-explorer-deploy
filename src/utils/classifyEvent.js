const spaceKeywords = [
  /\bspace(?:craft|flight|mission|station|walk|exploration)?\b/i,
  /\bastronaut|cosmonaut|rocket|launch vehicle|orbital|orbiting|satellite|telescope|observatory\b/i,
  /\bNASA|ESA|ISRO|Roscosmos|JAXA|SpaceX|Blue Origin|Virgin Galactic\b/i,
  /\bHubble|James Webb|Apollo|Sputnik|Soyuz|Shuttle|Voyager|Pioneer|Cassini|Chandrayaan|Perseverance|Curiosity|New Horizons\b/i,
  /\bmoon landing|mars landing|lunar module|lunar rover|mars rover|lunar orbit|mars orbit|lunar eclipse|solar eclipse\b/i,
  /\bexoplanet|planetary system|supernova|nebula|Milky Way|galaxy|black hole|comet|asteroid|meteor shower|meteorite|solar system|solar flare|solar wind\b/i,
];

const isSpaceEvent = (text = '') => spaceKeywords.some((pattern) => pattern.test(text));
export { isSpaceEvent };

export const classifyEventWithScore = (text = '') => ({
  isRelevant: isSpaceEvent(text),
});
