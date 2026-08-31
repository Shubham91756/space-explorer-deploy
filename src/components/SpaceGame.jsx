import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameAudio from '../hooks/useGameAudio';
import './SpaceGame.css';

const SpaceGame = ({ isOpen, onClose }) => {
  // ==================== STATE MANAGEMENT ====================
  const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'won', 'lost'
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(30);
  const [currentRoundEvents, setCurrentRoundEvents] = useState([]);
  const [shuffledEvents, setShuffledEvents] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [highScore, setHighScore] = useState(localStorage.getItem('chrono-nav-highscore') || 0);

  // ==================== AUDIO HOOK ====================
  const {
    playSequence,
    playSelectSound,
    playSwapSound,
    playSuccessSound,
    playFailSound,
    cleanup: cleanupAudio,
  } = useGameAudio();

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // ==================== EVENT DATA ====================
  const SPACE_EVENTS_DB = [
    { year: 1957, title: 'Sputnik 1', description: 'First artificial satellite launched by Soviet Union.' },
    { year: 1961, title: 'Yuri Gagarin in Space', description: 'First human spaceflight aboard Vostok 1.' },
    { year: 1969, title: 'Moon Landing', description: 'Apollo 11 lands on the Moon.' },
    { year: 1981, title: 'Space Shuttle Columbia', description: 'First Space Shuttle mission launched.' },
    { year: 1986, title: 'Mir Space Station', description: 'Soviet space station Mir is launched.' },
    { year: 1990, title: 'Hubble Deployed', description: 'Hubble Space Telescope deployed into orbit.' },
    { year: 1998, title: 'ISS Assembly Begins', description: 'International Space Station assembly begins.' },
    { year: 2003, title: 'SpaceShipOne', description: 'First private spacecraft reaches space.' },
    { year: 2012, title: 'Curiosity on Mars', description: 'NASA Curiosity rover successfully lands on Mars.' },
    { year: 2016, title: 'SpaceX Falcon 9 Landing', description: 'SpaceX successfully lands orbital rocket booster.' },
    { year: 2020, title: 'SpaceX Crew Demo-2', description: 'First commercial crew spacecraft reaches ISS.' },
    { year: 2021, title: 'James Webb Deployed', description: 'James Webb Space Telescope launched.' },
  ];

  // ==================== SHUFFLE FUNCTION ====================
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // ==================== GAME INITIALIZATION ====================
  const initializeGame = useCallback(() => {
    const eventCount = round === 1 ? 3 : round === 2 ? 4 : 4;
    const selectedEvents = SPACE_EVENTS_DB.sort(() => 0.5 - Math.random()).slice(0, eventCount);
    setCurrentRoundEvents(selectedEvents);
    setShuffledEvents(shuffleArray(selectedEvents));
    setSelectedIndices([]);
    setTimer(30);
    setGameState('playing');
    playSequence([523.25, 659.25], 150);
  }, [round, playSequence]);

  // ==================== START GAME ====================
  useEffect(() => {
    if (gameState === 'idle' && isOpen) {
      initializeGame();
    }
  }, [gameState, isOpen, initializeGame]);

  // ==================== COUNTDOWN TIMER ====================
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timerInterval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setGameState('lost');
          playFailSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [gameState, playFailSound]);

  // ==================== CARD INTERACTION ====================
  const handleCardClick = (index) => {
    if (gameState !== 'playing') return;

    playSelectSound();
    
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const swapCards = (index1, index2) => {
    const newShuffled = [...shuffledEvents];
    [newShuffled[index1], newShuffled[index2]] = [newShuffled[index2], newShuffled[index1]];
    setShuffledEvents(newShuffled);
    playSwapSound();
  };

  // ==================== VERIFY CHRONOLOGICAL ORDER ====================
  const verifyOrder = () => {
    if (gameState !== 'playing') return;

    const isCorrect = shuffledEvents.every((event, idx) => event.year === currentRoundEvents[idx].year);

    if (isCorrect) {
      const roundPoints = (timer * 10) + (round * 50);
      setScore(score + roundPoints);
      if (score + roundPoints > parseInt(highScore)) {
        setHighScore(score + roundPoints);
        localStorage.setItem('chrono-nav-highscore', score + roundPoints);
      }
      setGameState('won');
      playSuccessSound();
    } else {
      setGameState('lost');
      playFailSound();
    }
  };

  // ==================== NEXT ROUND ====================
  const nextRound = () => {
    setRound(round + 1);
    setGameState('idle');
    setSelectedIndices([]);
  };

  // ==================== RESTART GAME ====================
  const restartGame = () => {
    setScore(0);
    setRound(1);
    setGameState('idle');
    setSelectedIndices([]);
  };

  // ==================== RENDER ====================
  if (!isOpen) return null;

  return (
    <motion.div
      className="space-game-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="space-game-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="game-header">
          <div className="game-title">
            <span className="title-icon">⏱️</span>
            CHRONO-NAVIGATOR
            <span className="subtitle">Time-Loop Repair System</span>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* STATS BAR */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">SCORE</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ROUND</span>
            <span className="stat-value">{round}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">HIGH SCORE</span>
            <span className="stat-value">{highScore}</span>
          </div>
        </div>

        {/* TIMER */}
        {gameState === 'playing' && (
          <motion.div
            className={`timer-display ${timer < 10 ? 'critical' : ''}`}
            animate={{ scale: timer < 10 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.6, repeat: timer < 10 ? Infinity : 0 }}
          >
            <div className="timer-label">TIME-LOOP STABILITY</div>
            <div className="timer-value">{timer}s</div>
          </motion.div>
        )}

        {/* GAME CONTENT */}
        <AnimatePresence mode="wait">
          {gameState === 'playing' && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="game-content"
            >
              <div className="instructions">
                Arrange the timeline from oldest to newest
              </div>

              <div className="cards-grid">
                {shuffledEvents.map((event, index) => (
                  <motion.div
                    key={`${event.year}-${index}`}
                    layout
                    layoutId={event.year}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className={`event-card ${selectedIndices.includes(index) ? 'selected' : ''}`}
                      whileHover={{ scale: 1.05, y: -10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCardClick(index)}
                      drag
                      onDragEnd={(event, info) => {
                        // Simple drag-based reordering
                        if (Math.abs(info.offset.x) > 50) {
                          const nextIdx = info.offset.x > 0 ? index + 1 : index - 1;
                          if (nextIdx >= 0 && nextIdx < shuffledEvents.length) {
                            swapCards(index, nextIdx);
                          }
                        }
                      }}
                      dragElastic={0.2}
                      dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
                    >
                      <div className="card-inner">
                        <div className="card-year">{event.year}</div>
                        <div className="card-title">{event.title}</div>
                        <div className="card-description">{event.description}</div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className="stabilize-button"
                onClick={verifyOrder}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                STABILIZE TIMELINE
              </motion.button>
            </motion.div>
          )}

          {gameState === 'won' && (
            <motion.div
              key="won"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="game-result won"
            >
              <div className="result-icon">✨</div>
              <h2 className="result-title">TIMELINE STABILIZED!</h2>
              <div className="result-message">
                Timeline successfully repaired
              </div>
              <div className="round-points">
                +{(timer * 10) + (round * 50)} Points
              </div>
              <motion.button
                className="next-round-button"
                onClick={nextRound}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                NEXT ROUND
              </motion.button>
            </motion.div>
          )}

          {gameState === 'lost' && (
            <motion.div
              key="lost"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="game-result lost"
            >
              <div className="result-icon">⚠️</div>
              <h2 className="result-title">TIME-LOOP COLLAPSED!</h2>
              <div className="result-message">
                {timer === 0 ? 'Time limit exceeded' : 'Incorrect timeline order'}
              </div>
              <div className="final-score">
                FINAL SCORE: {score}
              </div>
              <div className="button-group">
                <motion.button
                  className="restart-button"
                  onClick={restartGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  RESTART GAME
                </motion.button>
                <motion.button
                  className="exit-button"
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  EXIT
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SpaceGame;
