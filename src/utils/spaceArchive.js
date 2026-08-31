const archive = [
  {
    month: 1,
    day: 4,
    year: 1959,
    title: 'Luna 1 Flyby',
    description: 'The first spacecraft to reach the vicinity of the Moon and enter heliocentric orbit.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Luna1.jpg',
    link: 'https://en.wikipedia.org/wiki/Luna_1',
  },
  {
    month: 2,
    day: 18,
    year: 2021,
    title: 'Perseverance on Mars',
    description: 'NASA rover Perseverance successfully lands in Jezero Crater.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/PIA24264-Mars2020Mission-MarsRoverPerseverance-20210218.jpg',
    link: 'https://en.wikipedia.org/wiki/Mars_2020',
  },
  {
    month: 3,
    day: 18,
    year: 1965,
    title: 'First Spacewalk',
    description: 'Cosmonaut Alexei Leonov performs the first extravehicular activity.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Alexei_Leonov_in_space.jpg',
    link: 'https://en.wikipedia.org/wiki/Alexei_Leonov',
  },
  {
    month: 4,
    day: 12,
    year: 1961,
    title: 'Yuri Gagarin in Space',
    description: 'Yuri Gagarin becomes the first human in space aboard Vostok 1.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Vostok_1_mission_patch.png',
    link: 'https://en.wikipedia.org/wiki/Yuri_Gagarin',
  },
  {
    month: 4,
    day: 24,
    year: 1990,
    title: 'Hubble Deployed',
    description: 'The Hubble Space Telescope is deployed into low Earth orbit.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Hubble_Space_Telescope.jpg',
    link: 'https://en.wikipedia.org/wiki/Hubble_Space_Telescope',
  },
  {
    month: 5,
    day: 25,
    year: 1961,
    title: 'Moon Goal Set',
    description: 'President John F. Kennedy announces the goal of landing a man on the Moon.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/John_F_Kennedy_1962.jpg',
    link: 'https://en.wikipedia.org/wiki/We_choose_to_go_to_the_Moon',
  },
  {
    month: 6,
    day: 16,
    year: 1963,
    title: 'Valentina Tereshkova Launches',
    description: 'Valentina Tereshkova becomes the first woman in space.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Tereshkova_prepares_for_flight.jpg',
    link: 'https://en.wikipedia.org/wiki/Valentina_Tereshkova',
  },
  {
    month: 7,
    day: 20,
    year: 1969,
    title: 'Apollo 11 Moon Landing',
    description: 'Apollo 11 lands the first humans on the Moon.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Aldrin_Apollo_11_original.jpg/800px-Aldrin_Apollo_11_original.jpg',
    link: 'https://en.wikipedia.org/wiki/Apollo_11',
  },
  {
    month: 7,
    day: 14,
    year: 2015,
    title: 'New Horizons Pluto Flyby',
    description: 'NASA’s New Horizons spacecraft performs the first flyby of Pluto.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/New_Horizons_2015.JPG',
    link: 'https://en.wikipedia.org/wiki/New_Horizons',
  },
  {
    month: 8,
    day: 6,
    year: 2012,
    title: 'Curiosity Lands on Mars',
    description: 'Mars rover Curiosity lands safely on the Red Planet.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Mars_Curiosity_Rover.jpg',
    link: 'https://en.wikipedia.org/wiki/Curiosity_(rover)',
  },
  {
    month: 8,
    day: 23,
    year: 2023,
    title: 'Chandrayaan-3 Moon Landing',
    description: 'India’s Chandrayaan-3 becomes the first mission to land near the Moon’s south pole.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Chandrayaan-3_landing_site_image.jpg',
    link: 'https://en.wikipedia.org/wiki/Chandrayaan-3',
  },
  {
    month: 9,
    day: 5,
    year: 1977,
    title: 'Voyager 1 Launch',
    description: 'Voyager 1 begins its grand tour of the outer planets.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Voyager.jpg',
    link: 'https://en.wikipedia.org/wiki/Voyager_1',
  },
  {
    month: 10,
    day: 4,
    year: 1957,
    title: 'Sputnik 1 Launch',
    description: 'The first artificial Earth satellite is launched by the Soviet Union.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Sputnik_asm.jpg',
    link: 'https://en.wikipedia.org/wiki/Sputnik_1',
  },
  {
    month: 11,
    day: 16,
    year: 2022,
    title: 'Artemis I Launch',
    description: 'NASA launches Artemis I, the first integrated test of the Space Launch System and Orion.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Artemis_I_launch.jpg',
    link: 'https://en.wikipedia.org/wiki/Artemis_1',
  },
  {
    month: 12,
    day: 6,
    year: 1998,
    title: 'ISS Assembly Begins',
    description: 'The first elements of the International Space Station are assembled in orbit.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/International_Space_Station_after_undocking_of_STS-132.jpg/1280px-International_Space_Station_after_undocking_of_STS-132.jpg',
    link: 'https://en.wikipedia.org/wiki/International_Space_Station',
  },
  {
    month: 12,
    day: 25,
    year: 2021,
    title: 'James Webb Launch',
    description: 'The James Webb Space Telescope launches on Christmas Day.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/James_Webb_Space_Telescope_Artist_Concept.png',
    link: 'https://en.wikipedia.org/wiki/James_Webb_Space_Telescope',
  },
];

const toEvent = (item) => ({
  year: item.year,
  text: `${item.title} - ${item.description}`,
  title: item.title,
  image: item.image || null,
  link: item.link || null,
  pages: item.link ? [{ pageid: null, title: item.title, link: item.link }] : [],
  source: 'archive',
});

export const getArchiveEventsForDate = (month, day) => {
  const matches = archive.filter((item) => item.month === month && item.day === day);
  if (matches.length > 0) {
    return matches.map(toEvent);
  }

  const seed = month * 37 + day * 17;
  const start = seed % archive.length;
  const sampled = [];

  for (let offset = 0; offset < Math.min(5, archive.length); offset += 1) {
    sampled.push(archive[(start + offset) % archive.length]);
  }

  return sampled.map(toEvent);
};

export const getArchiveResponse = (month, day) => {
  const events = getArchiveEventsForDate(month, day);
  return {
    data: {
      month,
      day,
      totalEvents: events.length,
      spaceEventsCount: events.length,
      events,
    },
    cached: true,
    source: 'archive',
    timestamp: new Date().toISOString(),
    message: 'Served from local archive fallback',
  };
};

export const buildWikipediaUrl = (title, pageId = null) =>
  pageId
    ? `https://en.wikipedia.org/?curid=${pageId}`
    : `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

