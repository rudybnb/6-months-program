import React, { useState } from 'react';
import type { WeeklyAuditData, AppData } from '../types';
import './WeeklyAudit.css';

interface WeeklyAuditProps {
  appData: AppData;
  onComplete: (data: WeeklyAuditData) => void;
  onExit: () => void;
}

export const WeeklyAudit: React.FC<WeeklyAuditProps> = ({ appData, onComplete, onExit }) => {
  const [step, setStep] = useState<'intro' | 'scores' | 'growth' | 'reflection'>('intro');
  const [disciplineScore, setDisciplineScore] = useState(5);
  const [identityScore, setIdentityScore] = useState(5);
  const [biggestWin, setBiggestWin] = useState('');
  const [biggestLesson, setBiggestLesson] = useState('');

  // Calculate execution score automatically
  const calculateExecutionScore = () => {
    const today = new Date();
    let completed = 0;
    const totalPossible = 14; // 7 days * 2 sessions

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (appData.morningSessions[key]) completed++;
      if (appData.eveningSessions[key]) completed++;
    }

    return Math.round((completed / totalPossible) * 10);
  };

  const executionScore = calculateExecutionScore();

  // Get data from 7 days ago
  const getPastReflection = () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const key = pastDate.toISOString().split('T')[0];
    return appData.morningSessions[key]?.story || null;
  };

  const pastReflection = getPastReflection();

  const handleFinish = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const data: WeeklyAuditData = {
      weekEndingDate: todayStr,
      disciplineScore,
      identityScore,
      executionScore,
      biggestWin,
      biggestLesson,
      timestamp: Date.now(),
    };
    onComplete(data);
  };

  const prevStep = () => {
    if (step === 'scores') setStep('intro');
    else if (step === 'growth') setStep('scores');
    else if (step === 'reflection') setStep(pastReflection ? 'growth' : 'scores');
  };

  return (
    <div className="audit-container">
      {step !== 'intro' && (
        <button className="session-back-btn" onClick={prevStep} title="Back">←</button>
      )}
      <button className="session-exit-btn" onClick={onExit}>✕</button>

      {step === 'intro' && (
        <div className="audit-step fade-up">
          <span className="audit-icon">🦅</span>
          <h1>Weekly Audit</h1>
          <p>The week is done. No hiding. No excuses. Look at the data and speak the truth.</p>
          <button className="audit-next-btn" onClick={() => setStep('scores')}>Begin Audit</button>
        </div>
      )}

      {step === 'scores' && (
        <div className="audit-step fade-up">
          <h2>Rate Your Performance</h2>
          
          <div className="score-item">
            <label>Execution Score: <span>{executionScore}/10</span></label>
            <p className="score-desc">Automatically calculated based on your consistency.</p>
            <div className="score-bar-bg">
              <div className="score-bar-fill" style={{ width: `${executionScore * 10}%` }} />
            </div>
          </div>

          <div className="score-item">
            <label>Discipline Score: <span>{disciplineScore}/10</span></label>
            <p className="score-desc">Did you act from discipline or emotion?</p>
            <input 
              type="range" min="1" max="10" 
              value={disciplineScore} 
              onChange={(e) => setDisciplineScore(Number(e.target.value))} 
            />
          </div>

          <div className="score-item">
            <label>Identity Score: <span>{identityScore}/10</span></label>
            <p className="score-desc">How much did you show up as the person you are becoming?</p>
            <input 
              type="range" min="1" max="10" 
              value={identityScore} 
              onChange={(e) => setIdentityScore(Number(e.target.value))} 
            />
          </div>

          <button className="audit-next-btn" onClick={() => setStep(pastReflection ? 'growth' : 'reflection')}>Next Step</button>
        </div>
      )}

      {step === 'growth' && (
        <div className="audit-step fade-up">
          <h2>Growth Documentation</h2>
          <p className="growth-instruction">Read what you wrote exactly 7 days ago. Who was that person? How has your narrative shifted since then?</p>
          
          <div className="past-reflection-card">
            <span className="past-date-label">7 Days Ago</span>
            <blockquote className="past-reflection-text">
              "{pastReflection}"
            </blockquote>
          </div>

          <div className="reflection-input" style={{ marginTop: '2rem' }}>
            <label>How has your identity shifted since you wrote this?</label>
            <textarea 
              placeholder="What do you see now that you didn't see then?" 
              value={biggestWin}
              onChange={(e) => setBiggestWin(e.target.value)}
            />
          </div>

          <button className="audit-next-btn" onClick={() => setStep('reflection')}>Finalize Reflection</button>
        </div>
      )}

      {step === 'reflection' && (
        <div className="audit-step fade-up">
          <h2>Weekly Reflection</h2>
          
          <div className="reflection-input">
            <label>Biggest Win of the Week</label>
            <textarea 
              placeholder="What was your most disciplined moment?" 
              value={biggestWin}
              onChange={(e) => setBiggestWin(e.target.value)}
            />
          </div>

          <div className="reflection-input">
            <label>Biggest Lesson Learned</label>
            <textarea 
              placeholder="Where did you slip, and what did you learn?" 
              value={biggestLesson}
              onChange={(e) => setBiggestLesson(e.target.value)}
            />
          </div>

          <button 
            className="audit-finish-btn" 
            disabled={!biggestWin || !biggestLesson}
            onClick={handleFinish}
          >
            Finalize Weekly Audit
          </button>
        </div>
      )}
    </div>
  );
};
