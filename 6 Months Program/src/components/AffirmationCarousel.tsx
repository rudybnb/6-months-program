import React, { useState } from 'react';
import type { Affirmation } from '../types';
import { speechService } from '../services/speech';
import './AffirmationCarousel.css';

interface AffirmationCarouselProps {
  affirmations: Affirmation[];
  onComplete: () => void;
}

export const AffirmationCarousel: React.FC<AffirmationCarouselProps> = ({ affirmations, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleAudio = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else if (affirmations && affirmations[currentIndex]) {
      setIsSpeaking(true);
      speechService.speak(affirmations[currentIndex].text, () => setIsSpeaking(false));
    }
  };

  const current = affirmations[currentIndex];
  if (!current) return null;

  const isLast = currentIndex === affirmations.length - 1;

  const handleNext = () => {
    speechService.stop();
    setIsSpeaking(false);
    if (isLast) {
      onComplete();
      return;
    }
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsTransitioning(false);
    }, 400);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'identity': return 'var(--accent)';
      case 'mind': return 'var(--calm)';
      case 'body': return 'var(--earth)';
      case 'soul': return 'var(--warm)';
      case 'emotions': return 'var(--accent)';
      default: return 'var(--accent)';
    }
  };

  return (
    <div className="affirmation-container">
      <div className="affirmation-header fade-in">
        <div className="affirmation-title-row">
          <h2>Speak Your Truth</h2>
          <button 
            className={`affirmation-audio-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={toggleAudio}
            title={isSpeaking ? "Stop Audio" : "Listen to Mentor"}
          >
            {isSpeaking ? '🔊' : '🔈'}
          </button>
        </div>
        <p>Read each declaration aloud. Mean every word.</p>
      </div>

      <div className={`affirmation-card ${isTransitioning ? 'exiting' : 'entering'}`} key={currentIndex}>
        <span
          className="affirmation-category"
          style={{ color: getCategoryColor(current.category) }}
        >
          {current.category}
        </span>
        <blockquote
          className="affirmation-text"
          style={{
            textShadow: `0 0 40px ${getCategoryColor(current.category)}33`,
          }}
        >
          {current.text}
        </blockquote>
      </div>

      <div className="affirmation-controls">
        <div className="affirmation-dots">
          {affirmations.map((_, i) => (
            <div
              key={i}
              className={`dot ${i === currentIndex ? 'active' : ''} ${i < currentIndex ? 'done' : ''}`}
            />
          ))}
        </div>

        <button className="affirmation-next-btn" onClick={handleNext}>
          {isLast ? 'I Declare This' : 'Next Declaration'}
        </button>

        <span className="affirmation-counter">
          {currentIndex + 1} / {affirmations.length}
        </span>
      </div>
    </div>
  );
};
