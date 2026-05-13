import React, { useState, useEffect, useRef } from 'react';
import { speechService } from '../services/speech';
import { Volume2 } from 'lucide-react';
import './BreathingExercise.css';

interface BreathingExerciseProps {
  onComplete: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onComplete }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(true);
  const timeoutRef = useRef<any>(null);
  
  const [sessionState, setSessionState] = useState<'intro' | 'active' | 'complete'>('intro');
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'exhale' | 'grounding' | 'complete'>('idle');
  const [displayText, setDisplayText] = useState('');
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    isMounted.current = true;
    
    // Setup Handpan meditation music
    // Removing crossOrigin to allow simple playback from external sources
    const audio = new Audio('https://assets.mixkit.co/music/preview/mixkit-meditation-431.mp3');
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      speechService.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const wait = (ms: number) => new Promise(resolve => {
    timeoutRef.current = setTimeout(resolve, ms);
  });

  const runSession = async () => {
    setSessionState('active');
    
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error("Audio playback error:", err);
        // Fallback or just ignore if it's a browser policy issue
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
      if (!isMounted.current) return;
      setPhase(step.phase as any);
      setDisplayText(step.text);
      // Removed speechService.speak to have only handpan music
      await wait(step.delay);
    }

    if (!isMounted.current) return;

    // Final cleanup of the active session
    if (audioRef.current) {
      const fadeInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.05) {
          audioRef.current.volume -= 0.05;
        } else {
          clearInterval(fadeInterval);
          if (audioRef.current) audioRef.current.pause();
        }
      }, 200);
    }

    setSessionState('complete');
  };

  const renderIntroContent = (isComplete: boolean) => (
    <div className="breathing-intro-content fade-up">
      <span className="intro-label">{isComplete ? 'Reset Complete' : 'Step 1: The Reset'}</span>
      <h1>{isComplete ? 'A Clearer Horizon' : 'Why We Breathe'}</h1>
      
      <div className="intro-body">
        <p>
          {isComplete 
            ? "Your nervous system has shifted. The cortisol has dropped. You have reclaimed your ability to choose your next action instead of reacting to your morning stress."
            : "Your breath is the only part of your nervous system you can control. When you wake up, your body is often stuck in a fog of cortisol. If you don't reset it, you spend your day reacting instead of executing."}
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
          {isComplete 
            ? "Now, carry this stillness into your next step. You are ready."
            : "We will take one minute. No thoughts, no goals. Just the rhythm of your life."}
        </p>
      </div>

      <button 
        className="breathing-begin-btn" 
        onClick={isComplete ? onComplete : runSession}
      >
        {isComplete ? 'Proceed to Reflection' : 'Begin The Reset'}
      </button>
    </div>
  );

  return (
    <div className="breathing-session-container">
      {sessionState === 'intro' && renderIntroContent(false)}
      
      {sessionState === 'active' && (
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

      {sessionState === 'complete' && renderIntroContent(true)}

      {/* Volume Control */}
      <div className="breathing-volume-control fade-in" style={{ zIndex: 1000 }}>
        <Volume2 size={18} />
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};





