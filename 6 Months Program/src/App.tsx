import { useState } from 'react';
import './App.css';
import { HomeScreen } from './components/HomeScreen';
import { SessionFlow } from './components/SessionFlow';
import { Onboarding } from './components/Onboarding';
import { useLocalStorage } from './hooks/useLocalStorage';
import type {
  AppData,
  SessionType,
  MorningSessionData,
  EveningSessionData,
  UserProfile,
  WeeklyAuditData,
} from './types';
import { WeeklyAudit } from './components/WeeklyAudit';
import { IdentityTimeline } from './components/IdentityTimeline';

function App() {
  const [appData, setAppData] = useLocalStorage<AppData>('inner-work-data', {
    morningSessions: {},
    eveningSessions: {},
    weeklyAudits: {},
    customAffirmations: [],
    voiceEnabled: true,
  });

  const [activeSession, setActiveSession] = useState<SessionType | 'weekly-audit' | 'identity-timeline' | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleStartSession = (type: SessionType) => {
    setActiveSession(type);
    setShowCompletion(false);
  };

  const handleStartAudit = () => {
    setActiveSession('weekly-audit');
    setShowCompletion(false);
  };

  const handleShowTimeline = () => {
    setActiveSession('identity-timeline');
    setShowCompletion(false);
  };

  const handleSessionComplete = (data: MorningSessionData | EveningSessionData) => {
    if (activeSession === 'morning') {
      const morningData = data as MorningSessionData;
      setAppData(prev => ({
        ...prev,
        morningSessions: { ...prev.morningSessions, [morningData.date]: morningData },
      }));
    } else {
      const eveningData = data as EveningSessionData;
      setAppData(prev => ({
        ...prev,
        eveningSessions: { ...prev.eveningSessions, [eveningData.date]: eveningData },
      }));
    }
    setShowCompletion(true);
  };

  const handleAuditComplete = (data: WeeklyAuditData) => {
    setAppData(prev => ({
      ...prev,
      weeklyAudits: { ...(prev.weeklyAudits || {}), [data.weekEndingDate]: data },
    }));
    setShowCompletion(true);
  };

  const handleExitSession = () => {
    setActiveSession(null);
    setShowCompletion(false);
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setAppData((prev) => ({
      ...prev,
      profile,
    }));
    setIsEditingProfile(false);
  };

  const handleToggleVoice = () => {
    setAppData(prev => ({
      ...prev,
      voiceEnabled: !prev.voiceEnabled
    }));
  };

  const handleReset = () => {
    // No confirmation - immediate action to bypass browser blocks
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.origin + window.location.pathname + '?reset=true';
  };

  // Completion screen
  if (showCompletion) {
    return (
      <div className="completion-screen">
        <div className="completion-content fade-up">
          <div className="completion-glow" />
          <span className="completion-icon">
            {activeSession === 'morning' ? '🌅' : '🌙'}
          </span>
          <h1>Session Complete.</h1>
          <p className="completion-subtitle">
            {activeSession === 'weekly-audit' 
              ? 'The audit is final. You have the data. Go win the next week.'
              : activeSession === 'morning'
              ? 'You showed up. You did the work. Now go execute.'
              : 'You reflected honestly. Rest well. Tomorrow, rise stronger.'}
          </p>
          <blockquote className="completion-quote">
            "Don't try to be perfect — be consistent."
          </blockquote>
          <button className="completion-btn" onClick={handleExitSession}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Active session
  if (activeSession) {
    if (activeSession === 'identity-timeline') {
      return (
        <IdentityTimeline
          morningSessions={appData.morningSessions}
          onBack={handleExitSession}
        />
      );
    }

    if (activeSession === 'weekly-audit') {
      return (
        <WeeklyAudit
          appData={appData}
          onComplete={handleAuditComplete}
          onExit={handleExitSession}
        />
      );
    }

    return (
      <SessionFlow
        type={activeSession as SessionType}
        profile={appData.profile}
        morningSessions={appData.morningSessions}
        onComplete={handleSessionComplete}
        onExit={handleExitSession}
      />
    );
  }

  // Onboarding / Edit Profile
  if (!appData.profile || isEditingProfile) {
    return (
      <Onboarding 
        initialProfile={appData.profile}
        onComplete={handleOnboardingComplete} 
        onCancel={appData.profile ? () => setIsEditingProfile(false) : undefined}
      />
    );
  }

  // Home
  return (
    <>
      <HomeScreen 
        onStartSession={handleStartSession} 
        onStartAudit={handleStartAudit}
        onShowTimeline={handleShowTimeline}
        onEditProfile={() => setIsEditingProfile(true)}
        onToggleVoice={handleToggleVoice}
        onReset={handleReset}
        appData={appData} 
      />
    </>
  );
}

export default App;
