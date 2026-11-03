import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ContentSection from './components/ContentSection';
import PlanetShowcase from './components/PlanetShowcase';
import SpaceShowcase from './components/SpaceShowcase';
import ChatWidget from './components/ChatWidget';
import AsteroidDeflector from './components/AsteroidDeflector';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [gameOpen, setGameOpen] = useState(false);

  return (
    <div className="App">
      <>
          <Navbar />
          <Hero />
          <ContentSection />
          <PlanetShowcase />
          <SpaceShowcase />
          <Footer />

          {/* Floating Buttons Container - Stacked with proper spacing */}
          <div className="floating-buttons-container">
            {/* Game Button (Top) */}
            <button
              className="floating-game-button"
              onClick={() => setGameOpen(true)}
              title="Launch Asteroid Deflector"
            >
              ⏱️ GAME
            </button>

            {/* Chat Widget Button (Bottom) */}
            <ChatWidget />
          </div>

          {/* Game Modal */}
          <AsteroidDeflector isOpen={gameOpen} onClose={() => setGameOpen(false)} />
      </>
    </div>
  );
}

export default App;
