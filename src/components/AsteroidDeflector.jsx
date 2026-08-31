import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AsteroidDeflector.css';

const AsteroidDeflector = ({ isOpen, onClose }) => {
  // ==================== UI STATE (React re-renders only when these change) ====================
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [missionMessage, setMissionMessage] = useState('Protect Earth');
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0, visible: false });
  const [impactPulse, setImpactPulse] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // ==================== PERSISTENT REFS (Completely isolated from React render cycle) ====================
  // DOM refs
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // Game state refs - these survive React re-renders
  const gameStateRef = useRef('START');
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const waveRef = useRef(1);

  // Game data arrays stored in refs
  const asteroidsRef = useRef([]);
  const particlesRef = useRef([]);
  const earthRef = useRef({ x: 0, y: 0, radius: 30 });

  // Animation loop control
  const gameLoopRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const impactTimerRef = useRef(null);
  const missionTimerRef = useRef(null);

  // ==================== STEP 1: DYNAMIC CANVAS SIZING & CONTEXT BINDING ====================
  // FIX: The container <div> only mounts to the DOM once gameState === 'PLAYING'
  // AND the AnimatePresence exit animation for the previous screen has finished
  // (mode="wait"). A fixed setTimeout(150ms) was racing against that animation —
  // sometimes winning, sometimes not, which is why asteroids appeared inconsistently.
  // This now retries on every animation frame until the container actually exists,
  // with no arbitrary delay assumption, and cleans up properly if the effect re-runs.
  useEffect(() => {
    if (!isOpen || gameState !== 'PLAYING') return;
    setCanvasReady(false);

    let cancelled = false;
    let retryId = null;

    const initCanvas = () => {
      if (cancelled) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;

      if (!container || !canvas) {
        // Container hasn't mounted yet (exit animation of previous screen
        // still running) — try again next frame instead of giving up.
        retryId = requestAnimationFrame(initCanvas);
        return;
      }

      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) {
        // Mounted but not laid out yet — try again next frame.
        retryId = requestAnimationFrame(initCanvas);
        return;
      }

      // Set canvas internal resolution to match display size
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      canvasSizeRef.current = { width, height };

      // Bind 2D context with optimizations
      const ctx = canvas.getContext('2d', {
        alpha: false,
        willReadFrequently: false,
      });

      if (!ctx) {
        console.error('❌ Failed to get 2D canvas context');
        return;
      }

      ctxRef.current = ctx;

      // Clear canvas with background
      ctx.fillStyle = 'rgba(5, 10, 30, 1)';
      ctx.fillRect(0, 0, width, height);

      // Initialize Earth at bottom center
      earthRef.current = {
        x: width / 2,
        y: height - 110,
        radius: 34,
      };

      setCanvasReady(true);

      console.log(`✅ Canvas initialized successfully: ${width}x${height}`);
    };

    initCanvas();

    return () => {
      cancelled = true;
      if (retryId) cancelAnimationFrame(retryId);
    };
  }, [isOpen, gameState]);

  // ==================== DRAW FUNCTIONS ====================
  const drawBackdrop = useCallback((ctx, width, height) => {
    // Dark semi-transparent background for trail effect
    ctx.fillStyle = 'rgba(5, 8, 20, 0.25)';
    ctx.fillRect(0, 0, width, height);
  }, []);

  const drawGridBackground = useCallback((ctx, width, height) => {
    // Grid for visual verification that canvas is rendering
    ctx.strokeStyle = 'rgba(0, 150, 200, 0.06)';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  const drawStarfield = useCallback((ctx, width, height) => {
    // Twinkling stars
    ctx.fillStyle = 'rgba(180, 200, 255, 0.6)';
    for (let i = 0; i < 100; i++) {
      const seed = i * 12847;
      const x = (seed * 17 + Date.now() * 0.001) % width;
      const y = (seed * 31) % height;
      const brightness = 0.3 + Math.sin(seed * 0.01 + Date.now() * 0.001) * 0.3;
      ctx.globalAlpha = brightness;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  }, []);

  const drawAsteroids = useCallback((ctx) => {
    asteroidsRef.current.forEach(asteroid => {
      // Update position
      if (!asteroid.destroyed) {
        asteroid.y += asteroid.vy;
        asteroid.x += asteroid.vx;
        asteroid.rotation = (asteroid.rotation || 0) + (asteroid.spin || 0.06);
      } else {
        // Fade out destroyed asteroids
        asteroid.life = (asteroid.life || 1) - 0.05;
        if (asteroid.life <= 0) return;
      }

      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation || 0);
      ctx.globalAlpha = asteroid.life || 1;

      // Draw asteroid body
      if (!asteroid.destroyed) {
        const bodyGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, asteroid.radius);
        bodyGradient.addColorStop(0, '#ffd3a1');
        bodyGradient.addColorStop(0.5, '#ff7d5c');
        bodyGradient.addColorStop(1, '#a7362c');
        ctx.fillStyle = bodyGradient;
        ctx.shadowColor = 'rgba(255, 107, 90, 0.75)';
        ctx.shadowBlur = 14;
      } else {
        ctx.fillStyle = '#ffd166';
        ctx.shadowColor = 'rgba(255, 208, 80, 0.6)';
        ctx.shadowBlur = 8;
      }

      // Draw jagged asteroid shape
      ctx.beginPath();
      const sides = 6 + Math.floor(asteroid.radius / 5);
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const r = asteroid.radius * (0.5 + Math.sin(i) * 0.4);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Outline
      ctx.strokeStyle = '#ffaa77';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 1;
      ctx.restore();
    });

    // Remove fully faded asteroids
    asteroidsRef.current = asteroidsRef.current.filter(a => !a.destroyed || (a.life || 1) > 0);
  }, []);

  const drawEarth = useCallback((ctx) => {
    const earth = earthRef.current;

    // Outer protective glow
    ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, earth.radius + 25, 0, Math.PI * 2);
    ctx.fill();

    // Mid glow layer
    ctx.fillStyle = 'rgba(0, 200, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, earth.radius + 12, 0, Math.PI * 2);
    ctx.fill();

    // Planet body with radial gradient
    const gradient = ctx.createRadialGradient(
      earth.x - 6,
      earth.y - 6,
      0,
      earth.x,
      earth.y,
      earth.radius
    );
    gradient.addColorStop(0, '#1fffff');
    gradient.addColorStop(0.5, '#00aaff');
    gradient.addColorStop(1, '#0055aa');

    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0, 200, 255, 0.9)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, earth.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bright outline
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, earth.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.shadowColor = 'rgba(0,255,255,0.8)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }, []);

  const drawParticles = useCallback((ctx) => {
    particlesRef.current.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.15; // gravity effect
      particle.life -= 0.03;

      if (particle.life <= 0) return;

      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  }, []);

  const flashImpact = useCallback(() => {
    setImpactPulse(true);
    if (impactTimerRef.current) {
      clearTimeout(impactTimerRef.current);
    }

    impactTimerRef.current = setTimeout(() => {
      setImpactPulse(false);
      impactTimerRef.current = null;
    }, 180);
  }, []);

  const showMissionMessage = useCallback((message, duration = 1400) => {
    setMissionMessage(message);

    if (missionTimerRef.current) {
      clearTimeout(missionTimerRef.current);
    }

    missionTimerRef.current = setTimeout(() => {
      setMissionMessage('Protect Earth');
      missionTimerRef.current = null;
    }, duration);
  }, []);

  // ==================== PARTICLE EXPLOSION ====================
  const createExplosion = useCallback((x, y, color) => {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
      });
    }
  }, []);

  // ==================== AUDIO SYNTHESIS ====================
  const playClickSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      // Frequency sweep for satisfying "pew" sound
      osc.frequency.setValueAtTime(950, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.log('Audio unavailable:', err.message);
    }
  }, []);

  const resetGameData = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    waveRef.current = 1;
    asteroidsRef.current = [];
    particlesRef.current = [];
    gameStateRef.current = 'START';
    setGameState('START');
    setScore(0);
    setLives(3);
    setWave(1);
    setMissionMessage('Protect Earth');
    setPointerPosition({ x: 0, y: 0, visible: false });
    setImpactPulse(false);
    setCanvasReady(false);

    if (missionTimerRef.current) {
      clearTimeout(missionTimerRef.current);
      missionTimerRef.current = null;
    }
  }, []);

  const stopGameLoops = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    if (spawnIntervalRef.current) {
      clearTimeout(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }

    if (impactTimerRef.current) {
      clearTimeout(impactTimerRef.current);
      impactTimerRef.current = null;
    }

    if (missionTimerRef.current) {
      clearTimeout(missionTimerRef.current);
      missionTimerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopGameLoops();
    resetGameData();
    onClose();
  }, [onClose, resetGameData, stopGameLoops]);

  // ==================== STEP 2: GAME LOOP (THE HEARTBEAT) ====================
  const runGameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!canvas || !ctx) {
      console.error('Canvas or context not available for game loop');
      return;
    }

    const { width, height } = canvasSizeRef.current;

    const gameLoop = () => {
      let gameOver = false;

      // Clear and render backdrop
      drawBackdrop(ctx, width, height);
      drawGridBackground(ctx, width, height);

      // Render all game elements
      drawStarfield(ctx, width, height);
      drawAsteroids(ctx);
      drawEarth(ctx);
      drawParticles(ctx);

      // ==================== COLLISION DETECTION ====================
      for (const asteroid of asteroidsRef.current) {
        if (!asteroid.destroyed) {
          const dist = Math.hypot(
            asteroid.x - earthRef.current.x,
            asteroid.y - earthRef.current.y
          );

          // Collision with Earth
          if (dist < asteroid.radius + earthRef.current.radius) {
            asteroid.destroyed = true;

            livesRef.current = Math.max(livesRef.current - 1, 0);
            setLives(livesRef.current);
            showMissionMessage('Earth impact! Defend faster!', 1800);
            flashImpact();

            createExplosion(asteroid.x, asteroid.y, 'rgba(255, 100, 80, 1)');

            // Game over
            if (livesRef.current === 0) {
              gameStateRef.current = 'GAME_OVER';
              setGameState('GAME_OVER');
              gameOver = true;
              break;
            }
          }
        }
      }

      // Remove off-screen asteroids
      asteroidsRef.current = asteroidsRef.current.filter(
        a => a.y < height + 100 && a.x > -100 && a.x < width + 100
      );

      if (gameOver) {
        stopGameLoops();
        return;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, [drawBackdrop, drawGridBackground, drawStarfield, drawAsteroids, drawEarth, drawParticles, createExplosion, flashImpact, showMissionMessage, stopGameLoops]);

  // ==================== STEP 3: SPAWN ASTEROIDS ====================
  const spawnAsteroids = useCallback(() => {
    const { width, height } = canvasSizeRef.current;
    const count = Math.min(2 + Math.floor(waveRef.current / 2), 7);
    const difficulty = 1 + waveRef.current * 0.15;
    const earth = earthRef.current;

    // Guaranteed visible target so the first wave is always obvious.
    asteroidsRef.current.push({
      x: width * 0.5,
      y: Math.max(120, height * 0.18),
      radius: 24,
      vx: 0.15,
      vy: 0.9 + waveRef.current * 0.12,
      rotation: Math.random() * Math.PI * 2,
      spin: 0.08,
      destroyed: false,
      life: 1,
    });

    for (let i = 0; i < count; i++) {
      const spawnRoll = Math.random();
      let x;
      let y;

      if (spawnRoll < 0.7) {
        x = Math.random() * width;
        y = -60;
      } else if (spawnRoll < 0.85) {
        x = -60;
        y = Math.random() * height * 0.6;
      } else {
        x = width + 60;
        y = Math.random() * height * 0.6;
      }

      const angleToEarth = Math.atan2(earth.y - y, earth.x - x);
      const angleJitter = (Math.random() - 0.5) * 0.8;
      const speed = 1.5 + Math.random() * 1.8 + difficulty * 0.2;

      asteroidsRef.current.push({
        x,
        y,
        radius: 18 + Math.random() * 16,
        vx: Math.cos(angleToEarth + angleJitter) * speed,
        vy: Math.sin(angleToEarth + angleJitter) * speed,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.1,
        destroyed: false,
        life: 1,
      });
    }
  }, []);

  // ==================== START GAME ====================
  const startGame = () => {
    stopGameLoops();
    resetGameData();
    gameStateRef.current = 'PLAYING';
    showMissionMessage('Mission started. Click the incoming asteroids.', 2000);
    setGameState('PLAYING');
  };

  // ==================== EFFECT: Initialize game loop when playing ====================
  useEffect(() => {
    if (gameState !== 'PLAYING' || !canvasReady) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!canvas || !ctx) {
      console.error('Canvas setup incomplete for game start');
      return;
    }

    console.log('🎮 Starting game loop...');
    runGameLoop();

    // Spawn initial wave
    spawnAsteroids();
    spawnAsteroids();

    // Continuous spawning interval
    const scheduleNextSpawn = () => {
      if (gameStateRef.current === 'PLAYING') {
        spawnAsteroids();
        spawnIntervalRef.current = setTimeout(scheduleNextSpawn, Math.max(1000 - waveRef.current * 85, 320));
      }
    };

    spawnIntervalRef.current = setTimeout(scheduleNextSpawn, Math.max(1000 - waveRef.current * 85, 320));

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      if (spawnIntervalRef.current) {
        clearTimeout(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
  }, [gameState, canvasReady, runGameLoop, spawnAsteroids]);

  useEffect(() => {
    return () => {
      stopGameLoops();
    };
  }, [stopGameLoops]);

  // ==================== STEP 4: BULLETPROOF POINTER EVENTS ====================
  const handleCanvasClick = useCallback((e) => {
    if (gameStateRef.current !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get exact canvas position and size on screen
    const rect = canvas.getBoundingClientRect();

    // Calculate click position relative to canvas
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale to canvas internal coordinates (accounting for CSS scaling)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = clickX * scaleX;
    const canvasY = clickY * scaleY;

    // Hit detection - check each asteroid
    let hitCount = 0;
    for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
      const asteroid = asteroidsRef.current[i];

      if (asteroid.destroyed) continue;

      const distance = Math.hypot(
        asteroid.x - canvasX,
        asteroid.y - canvasY
      );

      // Hit tolerance
      if (distance < asteroid.radius + 8) {
        asteroid.destroyed = true;

        const points = Math.floor(15 + asteroid.radius * 1.2);
        scoreRef.current += points;
        setScore(scoreRef.current);
        showMissionMessage(`Direct hit! +${points} points`, 1200);
        flashImpact();

        createExplosion(asteroid.x, asteroid.y, '#ffaa44');
        playClickSound();

        // Wave progression every 100 points
        if (scoreRef.current % 100 === 0 && scoreRef.current > 0) {
          waveRef.current += 1;
          setWave(waveRef.current);
          showMissionMessage(`Wave ${waveRef.current} incoming`, 1500);
          createExplosion(canvasX, canvasY, 'rgba(0, 255, 255, 0.8)');
        }

        hitCount++;
        break; // Only register one hit per click
      }
    }

    if (hitCount === 0) {
      showMissionMessage('Missed shot. Keep tracking the target.', 1000);
    }
  }, [createExplosion, flashImpact, playClickSound, showMissionMessage]);

  // ==================== RESTART GAME ====================
  const restartGame = () => {
    stopGameLoops();
    resetGameData();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="asteroid-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        className="asteroid-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="asteroid-header">
          <h2 className="asteroid-title">🚀 ASTEROID DEFLECTOR</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>

        {/* Stats Display */}
        <div className="asteroid-stats">
          <div className="stat">
            <span className="stat-label">SCORE</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat">
            <span className="stat-label">LIVES</span>
            <span className="stat-value">{'❤️ '.repeat(lives)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">WAVE</span>
            <span className="stat-value">{wave}</span>
          </div>
        </div>

        {/* Game Content */}
        <AnimatePresence mode="wait">
          {gameState === 'PLAYING' && (
            <motion.div
              key="canvas-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`canvas-wrapper ${impactPulse ? 'impact-pulse' : ''}`}
              ref={containerRef}
            >
              <div className="game-hud">
                <div className="hud-pill">{missionMessage}</div>
                <div className="hud-progress">
                  <span>WAVE PROGRESS</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${score % 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setPointerPosition({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                    visible: true,
                  });
                }}
                onMouseLeave={() => setPointerPosition(prev => ({ ...prev, visible: false }))}
                className="game-canvas"
                style={{
                  display: 'block',
                  cursor: 'crosshair',
                  background: 'radial-gradient(ellipse at center, rgba(20,40,80,1) 0%, rgba(5,10,30,1) 100%)',
                }}
              />
              <div
                className={`crosshair ${pointerPosition.visible ? 'visible' : ''}`}
                style={{
                  left: `${pointerPosition.x}px`,
                  top: `${pointerPosition.y}px`,
                }}
              />
              <div className="canvas-instructions">
                💥 Click asteroids to destroy them before they hit Earth!
              </div>
            </motion.div>
          )}

          {gameState === 'START' && (
            <motion.div
              key="start-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="game-start-screen"
            >
              <div className="start-content">
                <h3>🌍 PROTECT EARTH 🌍</h3>
                <p>
                  Asteroids are incoming! Click them to destroy them before they collide with Earth.
                  Each asteroid destroyed gives you points. Lose 3 lives and it's game over!
                </p>
                <div className="difficulty-info">
                  <p>🌊 Wave difficulty increases as you progress. Can you survive?</p>
                </div>
                <motion.button
                  className="start-button"
                  onClick={startGame}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,255,255,0.8)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  ▶ START MISSION
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameState === 'GAME_OVER' && (
            <motion.div
              key="gameover-screen"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="game-over-screen"
            >
              <div className="gameover-content">
                <h3 className="gameover-title">💥 MISSION FAILED 💥</h3>
                <p className="gameover-subtitle">Earth has been destroyed!</p>
                <div className="final-stats">
                  <div className="final-stat">
                    <span className="label">🏆 Final Score</span>
                    <span className="value">{score}</span>
                  </div>
                  <div className="final-stat">
                    <span className="label">📈 Wave Reached</span>
                    <span className="value">{wave}</span>
                  </div>
                </div>
                <div className="button-group">
                  <motion.button
                    className="retry-button"
                    onClick={restartGame}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,255,255,0.8)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🔄 TRY AGAIN
                  </motion.button>
                  <motion.button
                    className="exit-button"
                    onClick={handleClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✕ EXIT
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AsteroidDeflector;