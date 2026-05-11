import React, { useState } from 'react';
import './TherapyPrompt.css';

interface TherapyPromptProps {
  question: string;
  subtitle?: string;
  placeholder?: string;
  onComplete: (answer: string) => void;
}

export const TherapyPrompt: React.FC<TherapyPromptProps> = ({
  question,
  subtitle,
  placeholder = 'Be completely honest with yourself...',
  onComplete,
}) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onComplete(answer.trim());
    }
  };

  return (
    <div className="therapy-container">
      <div className="therapy-question fade-up">
        <h2>{question}</h2>
        {subtitle && <p className="therapy-subtitle">{subtitle}</p>}
      </div>

      <div className="therapy-input-area fade-in" style={{ animationDelay: '0.3s' }}>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={placeholder}
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
        Reflect & Continue
      </button>
    </div>
  );
};
