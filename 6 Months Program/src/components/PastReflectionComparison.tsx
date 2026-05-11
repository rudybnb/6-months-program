import React from 'react';
import './TherapyPrompt.css'; // Reusing styles

interface PastReflectionComparisonProps {
  pastDate: string;
  pastStory: string;
  pastQuestion: string;
  onComplete: (answer: string) => void;
}

export const PastReflectionComparison: React.FC<PastReflectionComparisonProps> = ({
  pastDate,
  pastStory,
  pastQuestion,
  onComplete,
}) => {
  const [answer, setAnswer] = React.useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onComplete(answer.trim());
    }
  };

  return (
    <div className="therapy-container">
      <div className="therapy-question fade-up">
        <span className="reflection-badge">7 DAYS AGO</span>
        <h2 style={{ fontSize: '1.2rem', opacity: 0.7, marginBottom: '0.5rem' }}>
          {pastQuestion}
        </h2>
        <blockquote className="past-story-quote">
          "{pastStory}"
        </blockquote>
        <div style={{ marginTop: '2rem' }}>
          <h2>How has your mindset shifted since then?</h2>
          <p className="therapy-subtitle">
            Look at who you were on {pastDate}. Are you still telling the same story, or have you evolved?
          </p>
        </div>
      </div>

      <div className="therapy-input-area fade-in" style={{ animationDelay: '0.3s' }}>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Reflecting on my growth (or lack thereof)..."
          rows={5}
          autoFocus
        />
      </div>

      <button
        className={`therapy-submit-btn fade-in ${answer.trim() ? 'active' : ''}`}
        style={{ animationDelay: '0.5s' }}
        onClick={handleSubmit}
        disabled={!answer.trim()}
      >
        Acknowledge My Evolution
      </button>

      <style>{`
        .reflection-badge {
          display: inline-block;
          padding: 4px 12px;
          background: var(--accent-primary);
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        .past-story-quote {
          border-left: 3px solid var(--accent-primary);
          padding-left: 1.5rem;
          margin: 1rem 0;
          font-style: italic;
          color: var(--text-secondary);
          font-size: 1.1rem;
          line-height: 1.6;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};
