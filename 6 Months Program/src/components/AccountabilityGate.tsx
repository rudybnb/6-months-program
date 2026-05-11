import React, { useState } from 'react';
import { generateGateFeedback } from '../services/ai';
import { speechService } from '../services/speech';
import type { UserProfile } from '../types';
import './AccountabilityGate.css';

interface AccountabilityGateProps {
  profile?: UserProfile;
  onPass: (excuse: string) => void;
  onExit: () => void;
}

export const AccountabilityGate: React.FC<AccountabilityGateProps> = ({ profile, onPass, onExit }) => {
  const [excuse, setExcuse] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleAudio = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else if (feedback) {
      setIsSpeaking(true);
      speechService.speak(feedback, () => setIsSpeaking(false));
    }
  };

  const handleSubmit = async () => {
    if (excuse.trim().length > 5) {
      setLoading(true);
      const aiFeedback = await generateGateFeedback(excuse.trim(), profile);
      setFeedback(aiFeedback);
      setLoading(false);
    }
  };

  const handleFinalPass = () => {
    onPass(excuse.trim());
  };

  const getDisplayTime = (timeStr?: string) => {
    if (!timeStr) return '6:00 AM';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m.toString().padStart(2, '0');
    return `${displayH}:${displayM} ${ampm}`;
  };

  return (
    <div className="gate-container fade-in">
      <button className="gate-exit-btn" onClick={onExit}>✕</button>

      <div className="gate-content">
        <div className="gate-header fade-up">
          <span className="reset-icon">🌿</span>
          <h2>Let’s take a moment to reset.</h2>
        </div>

        <div className="gate-message fade-up" style={{ animationDelay: '0.2s' }}>
          <p className="gate-context">
            You missed your start time of <strong>{getDisplayTime(profile?.wakeTime)}</strong> today. 
            Remember, discipline isn't about never falling — it is about how quickly you choose to rise again.
          </p>
          
          {profile?.coreWhy && (
            <div className="gate-why-reminder">
              <span className="why-label">Your reason for being here:</span>
              <p className="why-text">“{profile.coreWhy}”</p>
            </div>
          )}

          <p className="gate-question">
            What happened this morning? Be honest with yourself so we can move forward together.
          </p>
        </div>

        {/* Feedback State */}
        {feedback && (
          <div className="gate-feedback-area fade-in">
            <div className="gate-feedback-card">
              <p className="gate-ai-response">{feedback}</p>
              <div className="gate-feedback-footer">
                <button 
                  className={`gate-audio-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={toggleAudio}
                >
                  {isSpeaking ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                  )}
                  <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                </button>
              </div>
            </div>
            <button className="gate-submit-btn active" onClick={handleFinalPass}>
              I’m ready to start today
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="gate-feedback-area fade-in">
            <div className="loading-spinner" />
            <p className="loading-text">Finding the right words for you...</p>
          </div>
        )}

        {/* Input State */}
        {!feedback && !loading && (
          <>
            <div className="gate-input-area fade-up" style={{ animationDelay: '0.4s' }}>
              <textarea
                value={excuse}
                onChange={(e) => setExcuse(e.target.value)}
                placeholder="Be honest. No hiding..."
                rows={4}
                autoFocus
              />
            </div>

            <button
              className={`gate-submit-btn fade-in ${excuse.trim().length > 5 ? 'active' : ''}`}
              style={{ animationDelay: '0.6s' }}
              onClick={handleSubmit}
              disabled={excuse.trim().length <= 5}
            >
              Let’s Start Today
            </button>
          </>
        )}
      </div>
    </div>
  );
};
