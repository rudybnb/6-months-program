import React from 'react';
import './BreathingIntro.css';

interface BreathingIntroProps {
  onStart: () => void;
}

export const BreathingIntro: React.FC<BreathingIntroProps> = ({ onStart }) => {
  return (
    <div className="breathing-intro-container">
      <div className="breathing-intro-content fade-up">
        <span className="intro-label">Step 1: The Reset</span>
        <h1>Why We Breathe</h1>
        
        <div className="intro-body">
          <p>
            Your breath is the only part of your nervous system you can control. 
            When you wake up, your body is often stuck in a fog of cortisol (the stress hormone). 
            If you don't reset it, you spend your day <strong>reacting</strong> instead of <strong>executing</strong>.
          </p>

          <div className="expert-box">
            <div className="expert-cite">
              <strong>Robin Sharma</strong> (The 5 AM Club) calls this the "Victory Hour" foundation. 
              He teaches that controlled breathing prepares your brain for elite-level focus by quieting the "monkey mind."
            </div>
            <div className="expert-cite">
              <strong>Dr. Andrew Huberman</strong> uses the "Physiological Sigh" to rapidly lower heart rate and switch the brain from stress to calm within seconds.
            </div>
          </div>

          <p className="intro-instruction">
            We will take 2 minutes. No thoughts, no goals. Just the rhythm of your life.
            Sit tall. Relax your shoulders.
          </p>
        </div>

        <button className="start-breathing-btn" onClick={onStart}>
          Begin The Reset
        </button>
      </div>
    </div>
  );
};
