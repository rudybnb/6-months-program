import React from 'react';
import type { MorningSessionData } from '../types';
import './HomeScreen.css'; // Reusing some layout styles

interface IdentityTimelineProps {
  morningSessions: Record<string, MorningSessionData>;
  onBack: () => void;
}

export const IdentityTimeline: React.FC<IdentityTimelineProps> = ({ morningSessions, onBack }) => {
  // Sort sessions by date descending
  const sortedDates = Object.keys(morningSessions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="identity-timeline-view fade-in">
      <header className="timeline-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>Identity Timeline</h1>
        <p className="timeline-subtitle">The evolution of your narrative over time.</p>
      </header>

      <div className="timeline-container">
        {sortedDates.length === 0 ? (
          <div className="empty-state">
            <p>No reflections recorded yet. Start your morning sessions to build your timeline.</p>
          </div>
        ) : (
          sortedDates.map((date) => {
            const data = morningSessions[date];
            return (
              <div key={date} className="timeline-item fade-up">
                <div className="timeline-date">
                  <span className="date-pill">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="timeline-content">
                  <div className="reflection-block">
                    <h3>{data.storyQuestion || 'What story am I telling myself?'}</h3>
                    <p className="reflection-text">{data.story}</p>
                  </div>
                  {data.beliefChallengeAnswer && (
                    <div className="reflection-block truth">
                      <h3>The Truth</h3>
                      <p className="reflection-text">{data.beliefChallengeAnswer}</p>
                    </div>
                  )}
                  {data.intention && (
                    <div className="reflection-block intention">
                      <h3>Daily Intention</h3>
                      <p className="reflection-text">{data.intention}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .identity-timeline-view {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
          min-height: 100vh;
        }
        .timeline-header {
          margin-bottom: 3rem;
          text-align: center;
        }
        .timeline-header h1 {
          font-family: var(--font-display);
          font-size: 3rem;
          margin: 1rem 0;
          background: linear-gradient(to right, var(--text-main), var(--accent-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .timeline-subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
          opacity: 0.8;
        }
        .back-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-main);
        }
        .timeline-container {
          position: relative;
          padding-left: 2rem;
          border-left: 1px solid rgba(255,255,255,0.1);
        }
        .timeline-item {
          margin-bottom: 4rem;
          position: relative;
        }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: -2.35rem;
          top: 0.5rem;
          width: 0.6rem;
          height: 0.6rem;
          background: var(--accent-primary);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent-primary);
        }
        .date-pill {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
          display: block;
        }
        .timeline-content {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }
        .reflection-block {
          margin-bottom: 1.5rem;
        }
        .reflection-block:last-child {
          margin-bottom: 0;
        }
        .reflection-block h3 {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .reflection-text {
          font-size: 1.1rem;
          line-height: 1.6;
          color: var(--text-main);
          white-space: pre-wrap;
        }
        .reflection-block.truth {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 1.5rem;
        }
        .reflection-block.truth .reflection-text {
          color: var(--accent-primary);
          font-style: italic;
        }
        .reflection-block.intention .reflection-text {
          font-weight: 600;
          color: #fff;
        }
        .empty-state {
          text-align: center;
          padding: 4rem 0;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
