import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ContentSection.css';

import starfield from '../assets/starfield.png';
import nebula from '../assets/nebula.png';

import { classifyEventWithScore } from '../utils/classifyEvent';
import { getZodiacSign } from '../utils/getZodiacSign';
import { getMoonPhase } from '../utils/getMoonPhase';
import SpaceEventAPIClient from '../utils/spaceEventAPI';

const ContentSection = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltered, setShowFiltered] = useState(true);
  const [showCurrentEvents, setShowCurrentEvents] = useState(false);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [showAllCurrent, setShowAllCurrent] = useState(false);
  const [currentEventsYear, setCurrentEventsYear] = useState(new Date().getFullYear());
  const [currentEventsYearInput, setCurrentEventsYearInput] = useState(String(new Date().getFullYear()));
  const [currentEventsLoading, setCurrentEventsLoading] = useState(false);
  const [currentEventsError, setCurrentEventsError] = useState(null);

  const eventsRef = useRef(null);
  const historicalEventsRef = useRef(null);
  const requestIdRef = useRef(0);
  const [scrollY, setScrollY] = useState(0);

  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();

  const dateString = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  const zodiac = getZodiacSign(day, month);
  const moonPhase = getMoonPhase(selectedDate);
  const moonClass = moonPhase.includes('Full') ? 'badge-moon full-moon' : 'badge-moon';
  const selectedDateKey = `${selectedDate.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getEventWikipediaUrl = (event) =>
    event.year === 1990 || /hubble/i.test(`${event.title || ''} ${event.text || ''}`)
      ? event.link ||
        (event.pages?.[0]?.pageid ? `https://en.wikipedia.org/?curid=${event.pages[0].pageid}` : null) ||
        (event.pages?.[0]?.title
          ? `https://en.wikipedia.org/wiki/${encodeURIComponent(event.pages[0].title.replace(/ /g, '_'))}`
          : null)
      : null;

  const getCurrentEventWikipediaUrl = (event) =>
    event.text
      ? `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(event.text.split(' - ')[0])}`
      : null;

  const handleDateChange = (date) => {
    if (!date) return;

    setSelectedDate(date);
    setShowAll(false);
    setSearchMode(false);
    setSearchQuery('');
    setError(null);
    setEvents([]);
    setLoading(true);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchAndClassify = async () => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      setShowAll(false);
      setEvents([]);

      try {
        // Fetch from backend API
        console.log(`📡 Fetching events for ${month}/${day}...`);
        const response = await SpaceEventAPIClient.getHistoricalEvents(month, day);
        if (requestId !== requestIdRef.current) {
          return;
        }
        console.log('✅ Backend response:', response);
        const allEvents = response.data?.events || [];
        console.log(`📊 Total events received: ${allEvents.length}`);

        if (allEvents.length === 0) {
          console.warn('⚠️ No events found for this date');
          setEvents([]);
          setLoading(false);
          return;
        }

        const classified = await Promise.all(
          allEvents.map(async (event) => {
            try {
              const result = await classifyEventWithScore(event.text);
              const imageUrl = event.image || null;
              return {
                ...event,
                isRelevant: result.isRelevant,
                confidence: result.confidence,
                image: imageUrl,
                link: getEventWikipediaUrl(event),
              };
            } catch (classifyErr) {
              console.warn('⚠️ Classification failed for event:', event.text, classifyErr);
              return {
                ...event,
                isRelevant: true,
                confidence: 0.5,
                image: event.image || null,
                link: getEventWikipediaUrl(event),
              };
            }
          })
        );

        if (requestId !== requestIdRef.current) {
          return;
        }

        const filtered = showFiltered
          ? classified.filter((e) => e.isRelevant && e.confidence >= 0.6)
          : classified;

        console.log(`📈 Filtered events: ${filtered.length}`);
        setEvents(filtered.sort((a, b) => b.confidence - a.confidence));
        if (historicalEventsRef.current) {
          setTimeout(() => {
            historicalEventsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        console.error('❌ Failed to load or classify:', err);
        setError(`Error: ${err.message}`);
      } finally {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setLoading(false);
      }
    };

    fetchAndClassify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKey, showFiltered]);

  useEffect(() => {
    const fetchCurrentEvents = async () => {
      setCurrentEventsLoading(true);
      setCurrentEventsError(null);
      try {
        const start = `${currentEventsYear}-01-01T00:00:00Z`;
        const end = `${currentEventsYear}-12-31T23:59:59Z`;
        const params = new URLSearchParams({
          limit: '100',
          window_start__gte: start,
          window_start__lte: end,
        });
        let nextUrl = `https://ll.thespacedevs.com/2.2.0/launch/?${params}`;
        const launches = [];
        const visitedUrls = new Set();

        while (nextUrl && !visitedUrls.has(nextUrl)) {
          visitedUrls.add(nextUrl);
          const res = await fetch(nextUrl);
          if (!res.ok) {
            throw new Error(`SpaceDevs returned ${res.status}`);
          }

          const data = await res.json();
          launches.push(...(data.results || []));
          nextUrl = data.next || null;
        }

        const yearLaunches = launches.filter((launch) => {
          const launchYear = new Date(launch.net).getFullYear();
          return launchYear === currentEventsYear;
        });

        const mappedEvents = yearLaunches.map((launch) => ({
          date: new Date(launch.net),
          year: new Date(launch.net).getFullYear(),
          text: `${launch.name} - ${launch.mission?.description || 'No mission description available.'}`,
          confidence: 1.0,
          image: launch.image || null,
          link: launch.url || null, // ✅ Use SpaceDevs launch page
        }));

        setCurrentEvents(mappedEvents.sort((a, b) => a.date - b.date));
      } catch (err) {
        console.error('❌ Failed to fetch current events:', err);
        setCurrentEvents([]);
        setCurrentEventsError(`Unable to load space events for ${currentEventsYear}.`);
      } finally {
        setCurrentEventsLoading(false);
      }
    };

    if (showCurrentEvents) {
      fetchCurrentEvents();
    }
  }, [showCurrentEvents, currentEventsYear]);

  const handleCurrentEventsYearSubmit = (event) => {
    event.preventDefault();
    const year = Number(currentEventsYearInput);
    if (!Number.isInteger(year) || year < 1950 || year > 2100) {
      setCurrentEventsError('Enter a year between 1950 and 2100.');
      return;
    }

    setShowAllCurrent(false);
    setCurrentEventsYear(year);
  };

  const cardVariants = {
    offscreen: { y: 100, opacity: 0 },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', bounce: 0.4, duration: 1.0 },
    },
  };

  const filteredEvents = searchMode
    ? events.filter((e) => e.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : events;

  const filteredCurrentEvents = searchMode
    ? currentEvents.filter((e) => e.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentEvents;

  const displayedEvents = showAll ? filteredEvents : filteredEvents.slice(0, 6);
  const displayedCurrentEvents = showAllCurrent ? filteredCurrentEvents : filteredCurrentEvents.slice(0, 6);

  const openEventLink = (link) => {
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="parallax-container">
      {/* ✅ Fixed z-index and pointer-events for parallax layers */}
      <div className="stars" style={{
        backgroundImage: `url(${nebula})`,
        backgroundRepeat: 'repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: -10,
        transform: `translateY(${scrollY * 0.2}px)`,
        opacity: Math.max(1 - scrollY * 0.0012, 0.3),
        transition: 'transform 0.05s linear, opacity 0.2s ease-out',
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }} />
      <div className="nebula-layer" style={{
        backgroundImage: `url(${starfield})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: -9,
        transform: `translateY(${scrollY * 0.5}px)`,
        opacity: Math.max(0.3 - scrollY * 0.0015, 0.25),
        transition: 'transform 0.05s linear, opacity 0.2s ease-out',
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }} />
      <div className="gradient-overlay" style={{ zIndex: -8, pointerEvents: 'none' }} />

      <div className="content-container scroll-anchor" id="on-this-day">
        <div className="content-wrapper">
          <motion.h2 initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {showFiltered ? 'SPACE HISTORY TODAY' : 'ALL EVENTS TODAY'}
          </motion.h2>

          <motion.div className="calendar-section" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <div className="today-heading">
              <h3>📅 Viewing Events For: {dateString}</h3>
              <div className="astro-badges">
                <span className="badge-zodiac">🔮 Zodiac: {zodiac}</span>
                <span className={moonClass}>🌒 Moon Phase: {moonPhase}</span>
              </div>
            </div>

            <div className="calendar-container">
              <label className="calendar-label">Pick a date:</label>
              <DatePicker selected={selectedDate} onChange={handleDateChange} dateFormat="MMMM d" className="custom-datepicker no-year" maxDate={new Date(2099, 11, 31)} minDate={new Date(2000, 0, 1)} fixedHeight showPopperArrow={false} showMonthDropdown showDayDropdown dropdownMode="select" />
            </div>

            <div className="filter-toggle">
              <label>
                <input type="checkbox" checked={showFiltered} onChange={() => setShowFiltered(!showFiltered)} /> Show only space-related events
              </label>
            </div>

            <div className="search-toggle">
              <button className="toggle-button" onClick={() => setSearchMode(!searchMode)}>
                {searchMode ? 'Close Search' : 'Search Events'}
              </button>
              {searchMode && (
                <input type="text" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
              )}
            </div>

            <div className="current-events-toggle">
              <form className="current-events-year-form" onSubmit={handleCurrentEventsYearSubmit}>
                <label htmlFor="current-events-year">Events year:</label>
                <input
                  id="current-events-year"
                  type="number"
                  min="1950"
                  max="2100"
                  value={currentEventsYearInput}
                  onChange={(event) => setCurrentEventsYearInput(event.target.value)}
                />
                <button className="toggle-button" type="submit">Load Year</button>
              </form>
              <button className="toggle-button" onClick={() => setShowCurrentEvents(!showCurrentEvents)}>
                {showCurrentEvents ? 'Hide Upcoming Events' : 'Show Upcoming Events'}
              </button>
            </div>
          </motion.div>

          {/* 🚀 Current Events */}
          {showCurrentEvents && currentEventsLoading && <div className="loader" />}
          {showCurrentEvents && currentEventsError && <motion.div className="error-card"><h3>{currentEventsError}</h3></motion.div>}
          {showCurrentEvents && !currentEventsLoading && !currentEventsError && filteredCurrentEvents.length > 0 && (
            <>
              <h3 className="section-heading">🚀 Space Events in {currentEventsYear}</h3>
              <div className="event-meta">
                <p>Showing {displayedCurrentEvents.length} of {filteredCurrentEvents.length} events.</p>
                {filteredCurrentEvents.length > 6 && (
                  <button className="toggle-button" onClick={() => setShowAllCurrent(!showAllCurrent)}>
                    {showAllCurrent ? 'Show Less' : 'Show More →'}
                  </button>
                )}
              </div>
              <div className="event-list" ref={eventsRef}>
                {displayedCurrentEvents.map((event, i) => (
                  <motion.article key={`current-${i}`} className="event-card parallax-card" initial="offscreen" whileInView="onscreen" variants={cardVariants} viewport={{ once: true }} onClick={() => openEventLink(getCurrentEventWikipediaUrl(event))} role="link" tabIndex={0}>
                    {event.image && <div className="card-image-container"><img src={event.image} alt="Event" className="card-image" /></div>}
                    <div className="card-content">
                      <time className="card-year">{event.year}</time>
                      <h3 className="card-title">{event.text.split('.')[0]}</h3>
                      <p className="card-description">{event.text}</p>
                      <p className="confidence-score">Confidence: 100%</p>
                      {getCurrentEventWikipediaUrl(event) && <a href={getCurrentEventWikipediaUrl(event)} className="card-link" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Learn More →</a>}
                    </div>
                  </motion.article>
                ))}
              </div>
            </>
          )}
          {showCurrentEvents && !currentEventsLoading && !currentEventsError && filteredCurrentEvents.length === 0 && (
            <motion.div className="no-events-card"><h3>No space events found for {currentEventsYear}.</h3></motion.div>
          )}

          {/* 📜 Historical Events */}
          {error ? (
            <motion.div className="error-card"><h3>{error}</h3></motion.div>
          ) : loading ? (
            <div className="loader" />
          ) : filteredEvents.length > 0 ? (
            <>
              <div className="event-meta">
                <p>Showing {displayedEvents.length} of {filteredEvents.length} events.</p>
                {filteredEvents.length > 6 && (
                  <button className="toggle-button" onClick={() => setShowAll(!showAll)}>
                    {showAll ? 'Show Less' : 'Show More →'}
                  </button>
                )}
              </div>
              <div className="event-list" ref={historicalEventsRef} key={selectedDateKey}>
                {displayedEvents.map((event, i) => (
                  <motion.article
                    key={i}
                    className="event-card parallax-card"
                    initial="offscreen"
                    whileInView="onscreen"
                    variants={cardVariants}
                    viewport={{ once: true }}
                    onClick={() => openEventLink(getEventWikipediaUrl(event))}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openEventLink(getEventWikipediaUrl(event));
                      }
                    }}
                  >
                    {event.image && <div className="card-image-container"><img src={event.image} alt="Event" className="card-image" /></div>}
                    <div className="card-content">
                      <time className="card-year">{event.year}</time>
                      <h3 className="card-title">{event.text.split('.')[0]}</h3>
                      <p className="card-description">{event.text}</p>
                      <p className="confidence-score">Confidence: {(event.confidence * 100).toFixed(1)}%</p>
                      {getEventWikipediaUrl(event) && (
                        <a href={getEventWikipediaUrl(event)} className="card-link" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                          Learn More →
                        </a>
                      )}
                    </div>
                  </motion.article>
                ))}
              </div>
            </>
          ) : (
            <motion.div
              className="no-events-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Orbital Animation */}
              <div className="no-events-orbital">
                <motion.div
                  className="orbital-dot"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, linear: true }}
                />
              </div>
              
              <motion.h3
                className="no-events-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                📡 Deep Space Scan
              </motion.h3>
              
              <motion.p
                className="no-events-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                No signals detected for this cosmic coordinate. Try picking another date!
              </motion.p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentSection;
