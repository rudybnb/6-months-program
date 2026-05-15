import React from 'react';
import { User, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import type { AppData } from '../types';
import { DailyGuidance } from './DailyGuidance';
import { PartnerStatus } from './PartnerStatus';
import './HomeScreen.css';

interface HomeScreenProps {
  onStartSession: (type: 'morning' | 'evening') => void;
  onStartAudit: () => void;
  onShowTimeline: () => void;
  onStartCommunity: () => void;
  onEditProfile: () => void;
  onToggleVoice: () => void;
  onReset: () => void;
  appData: AppData;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onStartSession, 
  onStartAudit, 
  onShowTimeline,
  onStartCommunity,
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

  // Simulated partner data for demonstration
  const simulatedPartner = {
    name: 'Alex',
    lastActive: todayStr,
    completedToday: true, // You could toggle this to see the pending state
  };

  return (
    <div className="home-container">
      <div className="home-ambient-orb" />

      <div className="home-content">
        <header className="home-header">
          <div className="header-top">
            <div className="user-greeting fade-up">
              <h1>{greetingMsg}, {firstName}</h1>
              <p className="header-quote">“Today is not about doing everything. It is about taking the next right step.”</p>
            </div>
            
            <div className="header-actions fade-in">
              <button 
                className={`voice-toggle-minimal ${appData.voiceEnabled ? 'active' : ''}`}
                onClick={onToggleVoice}
                title="Toggle Mentor Voice"
              >
                {appData.voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                <span>{appData.voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
              </button>
              
              <button className="settings-trigger" onClick={onEditProfile} title="Your Profile">
                <User size={20} />
              </button>

              <button className="reset-trigger-minimal" onClick={onReset} title="Reset All Data">
                <RefreshCw size={18} />
              </button>
            </div>
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

        <div className="fade-up" style={{ animationDelay: '0.3s' }}>
          <PartnerStatus partner={simulatedPartner} />
        </div>

        <div className="home-secondary-grid fade-up" style={{ animationDelay: '0.4s' }}>
          <button className="secondary-card" onClick={onShowTimeline}>
            <span className="card-icon">📈</span>
            <span className="card-label">My Progress</span>
          </button>
          <button className="secondary-card" onClick={onStartCommunity}>
            <span className="card-icon">🤝</span>
            <span className="card-label">Community</span>
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
