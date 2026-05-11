import React, { useState, useEffect } from 'react';
import { generateDailyGuidance } from '../services/ai';
import { speechService } from '../services/speech';
import type { AppData } from '../types';
import './DailyGuidance.css';

interface DailyGuidanceProps {
  appData: AppData;
  onToggleVoice: () => void;
}

export const DailyGuidance: React.FC<DailyGuidanceProps> = ({ appData }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchGuidance() {
      const result = await generateDailyGuidance(appData);
      if (isMounted) {
        setMessage(result);
        setLoading(false);
      }
    }

    fetchGuidance();
    return () => { 
      isMounted = false; 
      speechService.stop();
    };
  }, [appData]);

  const toggleAudio = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else if (message) {
      setIsSpeaking(true);
      speechService.speak(message, () => setIsSpeaking(false));
    }
  };

  if (loading) {
    return (
      <div className="daily-guidance-skeleton">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    );
  }

  return (
    <div className="daily-guidance-box fade-in">
      <div className="guidance-header">
        <span className="guidance-label">The Initiation</span>
        <button 
          className={`guidance-audio-btn ${isSpeaking ? 'speaking' : ''}`}
          onClick={toggleAudio}
        >
          {isSpeaking ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      </div>
      
      <p className="guidance-message">
        {message}
      </p>

      <div className="guidance-footer">
        <div className="guidance-indicator" />
        <span className="guidance-timestamp">Day {new Date().getDate()} of Reconstruction</span>
      </div>
    </div>
  );
};
