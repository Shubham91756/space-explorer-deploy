const SPACE_KEYWORDS = [
  /\bspace(?:craft|flight|mission|station|walk|exploration)?\b/i,
  /\bastronaut|cosmonaut|rocket|launch vehicle|orbital|orbiting|satellite|telescope|observatory\b/i,
  /\bNASA|ESA|ISRO|Roscosmos|JAXA|SpaceX|Blue Origin|Virgin Galactic\b/i,
  /\bHubble|James Webb|Apollo|Sputnik|Soyuz|Shuttle|Voyager|Pioneer|Cassini|Galileo spacecraft|Chandrayaan|Mangalyaan|Perseverance|Curiosity|Insight lander|New Horizons\b/i,
  /\bmoon landing|mars landing|lunar module|lunar rover|mars rover|lunar orbit|mars orbit|lunar eclipse|solar eclipse\b/i,
  /\bexoplanet|planetary system|protoplanetary disk|habitable zone|gas giant|terrestrial planet|supernova|nebula|Milky Way|galaxy|black hole|event horizon|cosmic microwave background|big bang|redshift|dark matter|dark energy|comet|asteroid|meteor shower|meteorite|asteroid belt|meteoroid|solar system|solar flare|solar wind\b/i,
  /\b(?:Mercury|Venus|Earth|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Ceres|Eris|Makemake|Haumea)\s+(?:mission|rover|landing|orbit|flyby|probe|exploration|spacecraft)\b/i,
  /\b(?:mission|rover|landing|orbit|flyby|probe|exploration|spacecraft)\s+(?:of|on|to)?\s*(?:Mercury|Venus|Earth|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Ceres|Eris|Makemake|Haumea)\b/i,
];

const archive = [
  [1, 4, 1959, 'Luna 1 Flyby', 'The first spacecraft to reach the vicinity of the Moon and enter heliocentric orbit.', 'https://en.wikipedia.org/wiki/Luna_1'],
  [2, 18, 2021, 'Perseverance on Mars', 'NASA rover Perseverance successfully lands in Jezero Crater.', 'https://en.wikipedia.org/wiki/Mars_2020'],
  [3, 18, 1965, 'First Spacewalk', 'Cosmonaut Alexei Leonov performs the first extravehicular activity.', 'https://en.wikipedia.org/wiki/Alexei_Leonov'],
  [4, 12, 1961, 'Yuri Gagarin in Space', 'Yuri Gagarin becomes the first human in space aboard Vostok 1.', 'https://en.wikipedia.org/wiki/Vostok_1'],
  [4, 24, 1990, 'Hubble Deployed', 'The Hubble Space Telescope is deployed into low Earth orbit.', 'https://en.wikipedia.org/wiki/Hubble_Space_Telescope'],
  [5, 25, 1961, 'Moon Goal Set', 'President John F. Kennedy announces the goal of landing a man on the Moon.', 'https://en.wikipedia.org/wiki/We_choose_to_go_to_the_Moon'],
  [6, 16, 1963, 'Valentina Tereshkova Launches', 'Valentina Tereshkova becomes the first woman in space.', 'https://en.wikipedia.org/wiki/Valentina_Tereshkova'],
  [7, 20, 1969, 'Apollo 11 Moon Landing', 'Apollo 11 lands the first humans on the Moon.', 'https://en.wikipedia.org/wiki/Apollo_11'],
  [7, 14, 2015, 'New Horizons Pluto Flyby', 'NASA’s New Horizons spacecraft performs the first flyby of Pluto.', 'https://en.wikipedia.org/wiki/New_Horizons'],
  [8, 6, 2012, 'Curiosity Lands on Mars', 'Mars rover Curiosity lands safely on the Red Planet.', 'https://en.wikipedia.org/wiki/Curiosity_(rover)'],
  [8, 23, 2023, 'Chandrayaan-3 Moon Landing', 'India’s Chandrayaan-3 becomes the first mission to land near the Moon’s south pole.', 'https://en.wikipedia.org/wiki/Chandrayaan-3'],
  [9, 5, 1977, 'Voyager 1 Launch', 'Voyager 1 begins its grand tour of the outer planets.', 'https://en.wikipedia.org/wiki/Voyager_1'],
  [10, 4, 1957, 'Sputnik 1 Launch', 'The first artificial Earth satellite is launched by the Soviet Union.', 'https://en.wikipedia.org/wiki/Sputnik_1'],
  [11, 16, 2022, 'Artemis I Launch', 'NASA launches Artemis I, the first integrated test of the Space Launch System and Orion.', 'https://en.wikipedia.org/wiki/Artemis_1'],
  [12, 6, 1998, 'ISS Assembly Begins', 'The first elements of the International Space Station are assembled in orbit.', 'https://en.wikipedia.org/wiki/International_Space_Station'],
  [12, 25, 2021, 'James Webb Launch', 'The James Webb Space Telescope launches on Christmas Day.', 'https://en.wikipedia.org/wiki/James_Webb_Space_Telescope'],
];

function isSpaceEvent(text = '') {
  return SPACE_KEYWORDS.some((pattern) => pattern.test(text));
}

function archiveEvent(item) {
  return {
    year: item[2],
    text: `${item[3]} - ${item[4]}`,
    title: item[3],
    image: null,
    link: item[5],
    pages: [{ title: item[3], link: item[5] }],
    source: 'archive',
  };
}

function getArchiveEventsForDate(month, day) {
  const matches = archive.filter((item) => item[0] === month && item[1] === day);
  const selected = matches.length ? matches : archive.slice((month * 37 + day * 17) % archive.length, (month * 37 + day * 17) % archive.length + 5);
  return (selected.length ? selected : archive.slice(0, 5)).map(archiveEvent);
}

function getArchiveResponse(month, day) {
  const events = getArchiveEventsForDate(month, day);
  return {
    data: { month, day, totalEvents: events.length, spaceEventsCount: events.length, events },
    cached: true,
    source: 'archive',
    timestamp: new Date().toISOString(),
    message: 'Served from local archive fallback',
  };
}

module.exports = { SPACE_KEYWORDS, isSpaceEvent, getArchiveEventsForDate, getArchiveResponse };
