import React from 'react';
import type { PillarScores, Pillar } from '../types';
import './PillarScore.css';

interface PillarScoreProps {
  scores: PillarScores;
  onUpdate: (pillar: Pillar, value: number) => void;
  onComplete: () => void;
}

const PILLAR_CONFIG: { key: Pillar; label: string; icon: string; color: string }[] = [
  { key: 'mind', label: 'Mind', icon: '🧠', color: 'var(--calm)' },
  { key: 'body', label: 'Body', icon: '💪', color: 'var(--earth)' },
  { key: 'soul', label: 'Soul', icon: '🕊️', color: 'var(--warm)' },
  { key: 'emotions', label: 'Emotions', icon: '❤️', color: 'var(--accent)' },
];

export const PillarScore: React.FC<PillarScoreProps> = ({ scores, onUpdate, onComplete }) => {
  const allScored = Object.values(scores).every(s => s > 0);

  return (
    <div className="pillar-container">
      <div className="pillar-header fade-in">
        <h2>Score Your Day</h2>
        <p>Rate each pillar honestly. 1 = failed, 5 = excelled.</p>
      </div>

      <div className="pillar-grid">
        {PILLAR_CONFIG.map((pillar, idx) => (
          <div
            className="pillar-card fade-up"
            key={pillar.key}
            style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
          >
            <div className="pillar-icon">{pillar.icon}</div>
            <div className="pillar-label" style={{ color: pillar.color }}>
              {pillar.label}
            </div>
            <div className="pillar-rating">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  className={`rating-dot ${scores[pillar.key] >= val ? 'filled' : ''}`}
                  style={{
                    background: scores[pillar.key] >= val ? pillar.color : undefined,
                    boxShadow: scores[pillar.key] >= val ? `0 0 10px ${pillar.color}44` : undefined,
                  }}
                  onClick={() => onUpdate(pillar.key, val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {allScored && (
        <button className="pillar-done-btn fade-in" onClick={onComplete}>
          Continue
        </button>
      )}
    </div>
  );
};
