import React, { useState, useEffect, useRef } from 'react';
import { speechService } from '../services/speech';
import './BreathingExercise.css';

interface BreathingExerciseProps {
  onComplete: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onComplete }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Pre-load audio
    const audio = new Audio('https://assets.mixkit.co/music/preview/mixkit-soft-ambient-627.mp3');
    audio.loop = true;
    audio.volume = 0.15; // Soft volume
    audioRef.current = audio;

    return () => {
      speechService.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'exhale' | 'grounding' | 'complete'>('idle');
  const [displayText, setDisplayText] = useState('');

  const runSession = async () => {
    setStarted(true);
    
    // Start music
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log("Audio playback failed:", err));
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
        if (audioRef.current && audioRef.current.volume > 0.01) {
          audioRef.current.volume -= 0.01;
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
        <div className="breathing-start fade-up">
          <span className="breathing-prep">Find a comfortable seat.</span>
          <h1>A Moment of Calm</h1>
          <p>We will take one minute to slow down and listen to what’s real.</p>
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

