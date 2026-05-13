import React, { useState } from 'react';
import type { UserProfile } from '../types';
import './Onboarding.css';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
  initialProfile?: UserProfile;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel, initialProfile }) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [coreWhy, setCoreWhy] = useState(initialProfile?.coreWhy || '');
  const [favoriteAuthors, setFavoriteAuthors] = useState(initialProfile?.favoriteAuthors || '');
  const [wakeTime, setWakeTime] = useState(initialProfile?.wakeTime || '06:00');
  const [activeDays, setActiveDays] = useState<string[]>(initialProfile?.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(initialProfile?.selectedThemes || []);
  const [tonePreference, setTonePreference] = useState<'gentle' | 'firm' | 'faith' | 'strong'>(initialProfile?.tonePreference || 'firm');

  const [programGoal, setProgramGoal] = useState<'3_month' | '6_month'>('6_month');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const THEME_OPTIONS = ['Bible', 'Discipline', 'Healing', 'Confidence', 'Focus', 'Fitness', 'Faith', 'Purpose'];

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev => 
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );
  };

  const handleComplete = () => {
    const start = new Date(startDate);
    const months = programGoal === '3_month' ? 3 : 6;
    const finish = new Date(start);
    finish.setMonth(finish.getMonth() + months);

    const profile: UserProfile = {
      name,
      coreWhy,
      favoriteAuthors,
      selectedThemes,
      tonePreference,
      wakeTime,
      activeDays,
      programGoal,
      exercisePreference: 'Walking',
      startDate: start.toISOString(),
      finishDate: finish.toISOString(),
    };
    onComplete(profile);
  };

  const toggleDay = (day: string) => {
    setActiveDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1) as any);
  };

  return (
    <div className="onboarding-container">
      {step > 1 && (
        <button className="session-back-btn" onClick={prevStep} title="Back">←</button>
      )}
      {onCancel && (
        <button className="gate-exit-btn" onClick={onCancel} style={{ zIndex: 10 }}>✕</button>
      )}
      <div className="onboarding-content">
        
        {/* PAGE 1: Let's Start With You */}
        {step === 1 && (
          <div className="onboarding-step fade-up">
            <h1 className="onboarding-title">Let’s Start With You</h1>
            <p className="onboarding-subtitle">
              “You are not here by accident. Something in you wants change — and that matters.”
            </p>
            
            <div className="onboarding-group">
              <label className="onboarding-label">What should I call you?</label>
              <input
                type="text"
                className="onboarding-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setStep(2); }}
                autoFocus
              />
            </div>

            <div className="onboarding-group">
              <label className="onboarding-label">What made you open this app today?</label>
              <p className="onboarding-helper">Be honest. You do not need perfect words. Just tell the truth.</p>
              <textarea
                className="onboarding-textarea"
                placeholder="Examples: I feel lost and need structure / I keep starting and stopping / I want to turn my life around..."
                value={coreWhy}
                onChange={(e) => setCoreWhy(e.target.value)}
                rows={3}
              />
            </div>
            
            <button
              className={`onboarding-btn ${name.trim().length > 0 && coreWhy.trim().length > 5 ? 'active' : ''}`}
              onClick={() => setStep(2)}
              disabled={name.trim().length === 0 || coreWhy.trim().length <= 5}
            >
              Continue
            </button>
          </div>
        )}

        {/* PAGE 2: Choose Your Guidance */}
        {step === 2 && (
          <div className="onboarding-step fade-up">
            <h1 className="onboarding-title">Choose Your Guidance</h1>
            <p className="onboarding-subtitle">
              “When mornings feel hard, your guidance should speak in a voice you trust.”
            </p>
            
            <div className="onboarding-group">
              <label className="onboarding-label">What books, authors, faith, teachers, or mentors inspire you?</label>
              <textarea
                className="onboarding-textarea small"
                placeholder="Example: The Bible, Proverbs, Atomic Habits, David Goggins, Myles Munroe, Marcus Aurelius"
                value={favoriteAuthors}
                onChange={(e) => setFavoriteAuthors(e.target.value)}
                rows={2}
              />
            </div>

            <div className="onboarding-group">
              <div className="theme-chips">
                {THEME_OPTIONS.map(theme => (
                  <button
                    key={theme}
                    className={`theme-chip ${selectedThemes.includes(theme) ? 'selected' : ''}`}
                    onClick={() => toggleTheme(theme)}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-group">
              <label className="onboarding-label">How do you want the app to speak to you?</label>
              <div className="tone-options">
                <button 
                  className={`tone-btn ${tonePreference === 'gentle' ? 'selected' : ''}`}
                  onClick={() => setTonePreference('gentle')}
                >
                  <span className="tone-title">Gentle encouragement</span>
                  <span className="tone-desc">“Support me without pressure.”</span>
                </button>
                <button 
                  className={`tone-btn ${tonePreference === 'firm' ? 'selected' : ''}`}
                  onClick={() => setTonePreference('firm')}
                >
                  <span className="tone-title">Firm but kind</span>
                  <span className="tone-desc">“Challenge me, but don’t shame me.”</span>
                </button>
                <button 
                  className={`tone-btn ${tonePreference === 'faith' ? 'selected' : ''}`}
                  onClick={() => setTonePreference('faith')}
                >
                  <span className="tone-title">Faith-based guidance</span>
                  <span className="tone-desc">“Use scripture and spiritual encouragement.”</span>
                </button>
                <button 
                  className={`tone-btn ${tonePreference === 'strong' ? 'selected' : ''}`}
                  onClick={() => setTonePreference('strong')}
                >
                  <span className="tone-title">Strong accountability</span>
                  <span className="tone-desc">“Push me when I make excuses.”</span>
                </button>
              </div>
            </div>

            <button
              className={`onboarding-btn active`}
              onClick={() => setStep(3)}
            >
              Build My Morning Guide
            </button>
          </div>
        )}

        {/* PAGE 3: Your Morning Routine */}
        {step === 3 && (
          <div className="onboarding-step fade-up">
            <h1 className="onboarding-title">Your Morning Routine</h1>
            <p className="onboarding-subtitle">
              “Structure is not a cage. It is the framework for your freedom.”
            </p>
            
            <div className="onboarding-group">
              <label className="onboarding-label">What time do you want to wake up?</label>
              <input
                type="time"
                className="onboarding-input time-input"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
              />
            </div>

            <div className="onboarding-group">
              <label className="onboarding-label">Which days do you want to commit to?</label>
              <div className="days-grid">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    className={`day-btn ${activeDays.includes(day) ? 'selected' : ''}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={`onboarding-btn ${activeDays.length > 0 && wakeTime ? 'active' : ''}`}
              onClick={() => setStep(4)}
              disabled={activeDays.length === 0 || !wakeTime}
            >
              Set My Commitment
            </button>
          </div>
        )}

        {/* PAGE 4: Your Commitment */}
        {step === 4 && (
          <div className="onboarding-step fade-up">
            <h1 className="onboarding-title">Your Commitment</h1>
            <p className="onboarding-subtitle">
              “Every journey begins with a single date and a clear horizon.”
            </p>
            
            <div className="onboarding-group">
              <label className="onboarding-label">When do you want to begin?</label>
              <input
                type="date"
                className="onboarding-input date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="onboarding-group">
              <label className="onboarding-label">How long is your initial focus?</label>
              <div className="tone-options">
                <button 
                  className={`tone-btn ${programGoal === '3_month' ? 'selected' : ''}`}
                  onClick={() => setProgramGoal('3_month')}
                >
                  <span className="tone-title">3 Month Reset</span>
                  <span className="tone-desc">“A focused sprint to rebuild the basics.”</span>
                </button>
                <button 
                  className={`tone-btn ${programGoal === '6_month' ? 'selected' : ''}`}
                  onClick={() => setProgramGoal('6_month')}
                >
                  <span className="tone-title">6 Month Transformation</span>
                  <span className="tone-desc">“A deep rebuild of my entire identity.”</span>
                </button>
              </div>
            </div>

            <div className="promise-preview-card">
              <p className="promise-text">
                “{name}, your {programGoal === '3_month' ? '90-day' : '180-day'} journey begins on {new Date(startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.<br /><br />
                This is your promise to show up, reset, and continue until the person you want to become is the person you are.”
              </p>
            </div>

            <button
              className={`onboarding-btn active`}
              onClick={handleComplete}
            >
              I’m Ready To Start
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
