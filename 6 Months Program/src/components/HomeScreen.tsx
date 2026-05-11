import React from 'react';
import type { AppData } from '../types';
import { DailyGuidance } from './DailyGuidance';
import './HomeScreen.css';

interface HomeScreenProps {
  onStartSession: (type: 'morning' | 'evening') => void;
  onStartAudit: () => void;
  onShowTimeline: () => void;
  onEditProfile: () => void;
  onToggleVoice: () => void;
  onReset: () => void;
  appData: AppData;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onStartSession, 
  onStartAudit, 
  onShowTimeline, 
  onEditProfile, 
  onToggleVoice,
  onReset,
  appData 
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const morningDone = !!appData.morningSessions[todayStr];
  const eveningDone = !!appData.eveningSessions[todayStr];

  const isSunday = new Date().getDay() === 0;
  const auditDone = !!(appData.weeklyAudits || {})[todayStr];

  const getStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (appData.morningSessions[key] || appData.eveningSessions[key]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const getProgramProgress = () => {
    if (!appData.profile?.startDate || !appData.profile?.finishDate) return null;
    
    const start = new Date(appData.profile.startDate);
    const finish = new Date(appData.profile.finishDate);
    const today = new Date(todayStr);
    
    const totalDays = Math.ceil((finish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      current: Math.min(Math.max(elapsedDays, 1), totalDays),
      total: totalDays,
      percent: Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)
    };
  };

  const totalSessions = Object.keys(appData.morningSessions).length + Object.keys(appData.eveningSessions).length;
  const streak = getStreak();
  const programProgress = getProgramProgress();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = appData.profile?.startDate ? new Date(appData.profile.startDate) : new Date();
  start.setHours(0, 0, 0, 0);
  const hasStarted = today >= start;

  const hour = new Date().getHours();
  let greetingMsg = 'Good evening';
  if (hour < 12) greetingMsg = 'Good morning';
  else if (hour < 17) greetingMsg = 'Good afternoon';

  const firstName = appData.profile?.name?.split(' ')[0] || 'there';

  return (
    <div className="home-container">
      <div className="home-ambient-orb" />

      <div className="home-content">
        <header className="home-header">
          <div className="home-greeting fade-up">
            <h1>{greetingMsg}, {firstName}</h1>
            <p className="home-subtitle">“Today is not about doing everything. It is about taking the next right step.”</p>
          </div>
          <div className="header-actions fade-in">
            <button 
              className={`voice-toggle-btn ${appData.voiceEnabled ? 'enabled' : ''}`} 
              onClick={onToggleVoice}
            >
              <span>{appData.voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
            <button className="settings-btn" onClick={onEditProfile} title="Your Profile">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
            <button className="reset-btn-nuclear" onClick={onReset} title="Clear all data permanently">
              FORCE NUCLEAR RESET
            </button>
            <button className="test-btn-evening" onClick={() => onStartSession('evening')} title="Skip to evening for testing">
              TEST EVENING
            </button>
          </div>
        </header>

        <div className="home-guidance-container fade-up" style={{ animationDelay: '0.1s' }}>
          <DailyGuidance appData={appData} onToggleVoice={onToggleVoice} />
        </div>

        <div className="home-primary-actions fade-up" style={{ animationDelay: '0.2s' }}>
          {!hasStarted ? (
            <div className="prep-wait-msg">
              <h3>Your journey begins tomorrow.</h3>
              <p>Rest well tonight. We start at {appData.profile?.wakeTime}.</p>
            </div>
          ) : !morningDone ? (
            <button
              className="action-btn main-start"
              onClick={() => onStartSession('morning')}
            >
              Start Morning Routine
            </button>
          ) : !eveningDone ? (
            <button
              className="action-btn main-start"
              onClick={() => onStartSession('evening')}
            >
              Start Evening Reflection
            </button>
          ) : (
            <div className="day-complete-msg">You showed up today. Rest well.</div>
          )}
        </div>

        <div className="home-secondary-grid fade-up" style={{ animationDelay: '0.4s' }}>
          <button className="secondary-card" onClick={onShowTimeline}>
            <span className="card-icon">📈</span>
            <span className="card-label">My Progress</span>
          </button>
          {isSunday && (
            <button className={`secondary-card ${auditDone ? 'done' : ''}`} onClick={onStartAudit}>
              <span className="card-icon">📋</span>
              <span className="card-label">Weekly Audit</span>
            </button>
          )}
        </div>

        {programProgress && (
          <div className="home-program-progress fade-up" style={{ animationDelay: '0.5s' }}>
            <div className="progress-header">
              <span className="progress-title">Your New Start</span>
              <span className="progress-value">Day {programProgress.current}</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${programProgress.percent}%` }} />
            </div>
          </div>
        )}

        {totalSessions > 0 && (
          <div className="home-stats fade-up" style={{ animationDelay: '0.6s' }}>
            <div className="stat">
              <span className="stat-value">{streak}</span>
              <span className="stat-label">Day Streak</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
