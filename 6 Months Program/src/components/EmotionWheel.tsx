import React from 'react';
import { EMOTIONS } from '../types';
import type { Emotion } from '../types';
import './EmotionWheel.css';

interface EmotionWheelProps {
  onSelect: (emotion: string) => void;
  selected?: string;
}

export const EmotionWheel: React.FC<EmotionWheelProps> = ({ onSelect, selected }) => {
  const groups = {
    positive: EMOTIONS.filter(e => e.category === 'positive'),
    neutral: EMOTIONS.filter(e => e.category === 'neutral'),
    negative: EMOTIONS.filter(e => e.category === 'negative'),
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'positive': return 'Light';
      case 'neutral': return 'Between';
      case 'negative': return 'Heavy';
      default: return '';
    }
  };

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case 'positive': return 'cat-positive';
      case 'neutral': return 'cat-neutral';
      case 'negative': return 'cat-negative';
      default: return '';
    }
  };

  return (
    <div className="emotion-container">
      <div className="emotion-header fade-in">
        <h2>How Do You Honestly Feel?</h2>
        <p>No judgement. Just truth.</p>
      </div>

      <div className="emotion-groups">
        {Object.entries(groups).map(([category, emotions]) => (
          <div key={category} className="emotion-group fade-up">
            <span className={`group-label ${getCategoryClass(category)}`}>
              {getCategoryLabel(category)}
            </span>
            <div className="emotion-items">
              {emotions.map((emotion: Emotion) => (
                <button
                  key={emotion.name}
                  className={`emotion-btn ${selected === emotion.name ? 'selected' : ''} ${getCategoryClass(category)}`}
                  onClick={() => onSelect(emotion.name)}
                >
                  <span className="emotion-emoji">{emotion.emoji}</span>
                  <span className="emotion-name">{emotion.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
