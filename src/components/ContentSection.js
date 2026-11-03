import React, { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ContentSection.css';
import { classifyEventWithScore } from '../utils/classifyEvent';
import { getZodiacSign } from '../utils/getZodiacSign';
import { getMoonPhase } from '../utils/getMoonPhase';
import SpaceEventAPIClient from '../utils/spaceEventAPI';

const EventCard = ({ event }) => (
  <article className="event-card">
    {event.image && <div className="card-image-container"><img src={event.image} alt={event.title || 'Space event'} className="card-image" /></div>}
    <div className="card-content">
      <time className="card-year">{event.year || new Date(event.date).getUTCFullYear()}</time>
      <h3 className="card-title">{event.title || event.text?.split(' - ')[0]}</h3>
      <p className="card-description">{event.text}</p>
      {event.link && <a href={event.link} className="card-link" target="_blank" rel="noopener noreferrer">Read Wikipedia article →</a>}
      {event.launchUrl && <a href={event.launchUrl} className="card-link" target="_blank" rel="noopener noreferrer">Launch details →</a>}
    </div>
  </article>
);

const ContentSection = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historical, setHistorical] = useState({ events: [], loading: true, error: null });
  const [view, setView] = useState('historical');
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearInput, setYearInput] = useState(String(new Date().getFullYear()));
  const [launches, setLaunches] = useState({ events: [], loading: false, error: null });
  const [showFiltered, setShowFiltered] = useState(true);
  const [search, setSearch] = useState('');
  const requestId = useRef(0);

  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  const selectedDateKey = `${selectedDate.getFullYear()}-${month}-${day}`;

  useEffect(() => {
    const id = ++requestId.current;
    setHistorical({ events: [], loading: true, error: null });
    SpaceEventAPIClient.getHistoricalEvents(month, day)
      .then((response) => {
        if (id !== requestId.current) return;
        setHistorical({ events: response.data?.events || [], loading: false, error: null });
      })
      .catch((error) => {
        if (id === requestId.current) setHistorical({ events: [], loading: false, error: error.message });
      });
  }, [selectedDateKey, month, day]);

  useEffect(() => {
    if (view === 'historical') return undefined;
    const id = ++requestId.current;
    setLaunches({ events: [], loading: true, error: null });
    const promise = view === 'upcoming'
      ? SpaceEventAPIClient.getUpcomingLaunches()
      : SpaceEventAPIClient.getLaunches(year);
    promise.then((response) => {
      if (id !== requestId.current) return;
      setLaunches({ events: response.data?.events || [], loading: false, error: null });
    }).catch((error) => {
      if (id === requestId.current) setLaunches({ events: [], loading: false, error: error.message });
    });
    return () => { requestId.current += 1; };
  }, [view, year]);

  const historicalEvents = useMemo(() => historical.events
    .map((event) => ({ ...event, isRelevant: classifyEventWithScore(event.text).isRelevant }))
    .filter((event) => !showFiltered || event.isRelevant)
    .filter((event) => !search || event.text.toLowerCase().includes(search.toLowerCase())), [historical.events, showFiltered, search]);
  const launchEvents = launches.events.filter((event) => !search || event.text.toLowerCase().includes(search.toLowerCase()));
  const events = view === 'historical' ? historicalEvents : launchEvents;
  const dateString = selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const loadYear = (event) => {
    event.preventDefault();
    const value = Number(yearInput);
    if (Number.isInteger(value) && value >= 1950 && value <= 2100) {
      setYear(value);
      setView('year');
    }
  };

  return (
    <section className="parallax-container" id="on-this-day">
      <div className="content-container">
        <div className="content-wrapper">
          <h2>{view === 'historical' ? 'HISTORICAL EVENTS' : view === 'year' ? `LAUNCH ARCHIVE: ${year}` : 'UPCOMING LAUNCHES'}</h2>
          <div className="calendar-section">
            <div className="today-heading">
              <h3>{view === 'historical' ? `Viewing events for ${dateString}` : 'Space launch data'}</h3>
              {view === 'historical' && <div className="astro-badges"><span className="badge-zodiac">Zodiac: {getZodiacSign(day, month)}</span><span className="badge-moon">Moon: {getMoonPhase(selectedDate)}</span></div>}
            </div>
            <div className="view-tabs" role="tablist">
              <button className="toggle-button" onClick={() => setView('historical')}>Historical</button>
              <button className="toggle-button" onClick={() => setView('year')}>Year archive</button>
              <button className="toggle-button" onClick={() => setView('upcoming')}>Upcoming</button>
            </div>
            {view === 'historical' && <DatePicker selected={selectedDate} onChange={(date) => date && setSelectedDate(date)} dateFormat="MMMM d" className="custom-datepicker no-year" showMonthDropdown showDayDropdown dropdownMode="select" />}
            {view === 'year' && <form className="current-events-year-form" onSubmit={loadYear}><label htmlFor="launch-year">Year:</label><input id="launch-year" type="number" min="1950" max="2100" value={yearInput} onChange={(event) => setYearInput(event.target.value)} /><button className="toggle-button" type="submit">Load archive</button></form>}
            <label className="filter-toggle"><input type="checkbox" checked={showFiltered} onChange={(event) => setShowFiltered(event.target.checked)} /> Show only space-related events</label>
            <input type="search" placeholder="Search events" value={search} onChange={(event) => setSearch(event.target.value)} className="search-input" />
          </div>
          {(view === 'historical' ? historical.loading : launches.loading) && <div className="loader" aria-label="Loading events" />}
          {(view === 'historical' ? historical.error : launches.error) && <div className="error-card"><h3>{view === 'historical' ? historical.error : launches.error}</h3></div>}
          {!(view === 'historical' ? historical.loading : launches.loading) && !(view === 'historical' ? historical.error : launches.error) && !events.length && <div className="no-events-card"><h3>No events found.</h3></div>}
          {!!events.length && <div className="event-list">{events.map((event) => <EventCard key={event.id || `${event.year}-${event.title}`} event={event} />)}</div>}
        </div>
      </div>
    </section>
  );
};

export default ContentSection;
