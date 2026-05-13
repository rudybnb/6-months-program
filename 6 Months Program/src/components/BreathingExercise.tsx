import React, { useState, useEffect, useRef } from 'react';
import { speechService } from '../services/speech';
import './BreathingExercise.css';

interface BreathingExerciseProps {
  onComplete: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onComplete }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'exhale' | 'grounding' | 'complete'>('idle');
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    // Setup audio object but don't play yet
    const audio = new Audio('https://assets.mixkit.co/music/preview/mixkit-soft-ambient-627.mp3');
    audio.loop = true;
    audio.volume = 0.25; // Slightly louder but still soft
    audioRef.current = audio;

    return () => {
      speechService.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const runSession = async () => {
    setStarted(true);
    
    // Attempt to play music - triggered by user click
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
    
    const steps = [
      { text: "Take a slow breath in.", phase: 'inhale', delay: 4000 },
      { text: "And slowly breathe out.", phase: 'exhale', delay: 5000 },
      { text: "Again. Inhale gently.", phase: 'inhale', delay: 4000 },
      { text: "Exhale the tension you’ve been carrying.", phase: 'exhale', delay: 6000 },
      { text: "You do not need to solve everything right now.", phase: 'grounding', delay: 6000 },
      { text: "This moment is simply about slowing down and being honest with yourself.", phase: 'grounding', delay: 7000 },
      { text: "Breathe in slowly.", phase: 'inhale', delay: 4000 },
      { text: "And let your shoulders relax as you breathe out.", phase: 'exhale', delay: 6000 },
      { text: "You are here because part of you still wants change.", phase: 'grounding', delay: 6000 },
      { text: "That matters.", phase: 'grounding', delay: 4000 },
      { text: "Take one final slow breath.", phase: 'inhale', delay: 4000 },
      { text: "When you are ready, continue forward.", phase: 'complete', delay: 4000 }
    ];

    for (const step of steps) {
      setPhase(step.phase as any);
      setDisplayText(step.text);
      speechService.speak(step.text);
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }

    // Fade out music
    if (audioRef.current) {
      const fadeInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.02) {
          audioRef.current.volume -= 0.02;
        } else {
          clearInterval(fadeInterval);
          if (audioRef.current) audioRef.current.pause();
        }
      }, 100);
    }

    onComplete();
  };

  return (
    <div className="breathing-session-container">
      {!started ? (
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
                <strong>Robin Sharma</strong> calls this the "Victory Hour" foundation. 
                He teaches that controlled breathing prepares your brain for focus by quieting the "monkey mind."
              </div>
              <div className="expert-cite">
                <strong>Dr. Andrew Huberman</strong> uses the "Physiological Sigh" to rapidly lower heart rate and switch the brain from stress to calm.
              </div>
            </div>

            <p className="intro-instruction">
              We will take one minute. No thoughts, no goals. Just the rhythm of your life.<br />
              Sit tall. Relax your shoulders.
            </p>
          </div>

          <button className="breathing-begin-btn" onClick={runSession}>
            Begin The Reset
          </button>
        </div>
      ) : (
        <div className="breathing-active-content">
          <div className={`breathing-orb-center ${phase}`}>
            <div className="breathing-orb-core" />
            <div className="breathing-orb-ripple" />
          </div>
          
          <div className="breathing-guidance-text fade-in" key={displayText}>
            <p>{displayText}</p>
          </div>
        </div>
      )}
    </div>
  );
};


