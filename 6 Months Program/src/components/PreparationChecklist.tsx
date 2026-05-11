import React, { useState } from 'react';
import './PreparationChecklist.css';

interface PreparationChecklistProps {
  onComplete: (completedItems: Record<string, boolean>) => void;
}

const CHECKLIST_ITEMS = [
  { id: 'clothes', label: 'Clothes are ready' },
  { id: 'alarm', label: 'Alarm is set' },
  { id: 'priorities', label: 'Tomorrow’s priorities are clear' },
  { id: 'phone', label: 'Phone is put away' },
  { id: 'rest', label: 'Mind is settling for rest' }
];

export const PreparationChecklist: React.FC<PreparationChecklistProps> = ({ onComplete }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: false }), {})
  );

  const allChecked = Object.values(checkedItems).every(Boolean);

  const handleToggle = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="prep-container fade-up">
      <div className="prep-header">
        <span className="prep-icon">🌙</span>
        <h2>Prepare For Tomorrow</h2>
        <p>Small preparation tonight creates a calmer morning tomorrow.</p>
      </div>

      <div className="prep-list">
        {CHECKLIST_ITEMS.map((item, index) => (
          <div 
            key={item.id} 
            className={`prep-item ${checkedItems[item.id] ? 'checked' : ''} fade-up`}
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => handleToggle(item.id)}
          >
            <div className="prep-checkbox">
              {checkedItems[item.id] && <span className="prep-checkmark">✓</span>}
            </div>
            <span className="prep-label">{item.label}</span>
          </div>
        ))}
      </div>

      <p className="prep-bottom-message fade-in">
        "You do not need to become everything overnight. Just prepare yourself to begin again tomorrow."
      </p>

      {allChecked && (
        <button 
          className="prep-complete-btn fade-in" 
          onClick={() => onComplete(checkedItems)}
        >
          Complete Evening Reset
        </button>
      )}
    </div>
  );
};
