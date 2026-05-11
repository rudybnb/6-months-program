import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BreathingExercise } from './BreathingExercise';
import { AffirmationCarousel } from './AffirmationCarousel';
import { TherapyPrompt } from './TherapyPrompt';
import { Inspiration } from './Inspiration';
import { WorkoutSession } from './WorkoutSession';
import { PreparationChecklist } from './PreparationChecklist';
import { PastReflectionComparison } from './PastReflectionComparison';
import { BreathingIntro } from './BreathingIntro';
import { speechService } from '../services/speech';
import {
  DEFAULT_AFFIRMATIONS,
  EVENING_QUOTES,
} from '../types';
import type {
  SessionType,
  Affirmation,
  EveningSessionData,
  UserProfile,
  MorningSessionData,
} from '../types';
import { getDailyPrompt } from '../constants/prompts';
import './SessionFlow.css';

// ─── Story-to-affirmation mapping ───
// Based on what the user's story touches, we prioritize relevant affirmations
function getRelevantAffirmations(storyText: string): Affirmation[] {
  if (!storyText) return DEFAULT_AFFIRMATIONS;
  const lower = storyText.toLowerCase();

  // Detect which pillar(s) the story relates to
  const scores: Record<string, number> = {
    identity: 0,
    mind: 0,
    body: 0,
    soul: 0,
    emotions: 0,
  };

  // Identity keywords
  if (/not good enough|worthless|failure|can't|won't|never|loser|weak|fake|imposter|fraud|behind|late|stuck/i.test(lower)) {
    scores.identity += 3;
  }

  // Mind keywords
  if (/focus|distract|procrastin|lazy|overthink|confused|stupid|dumb|can't think|scatter|unclear|indecisi/i.test(lower)) {
    scores.mind += 3;
  }

  // Body keywords
  if (/fat|ugly|tired|exhausted|unfit|overweight|unhealthy|pain|sick|sleep|energy|eat|body|weight|gym|train/i.test(lower)) {
    scores.body += 3;
  }

  // Soul keywords
  if (/purpose|meaning|lost|direction|empty|spiritual|god|pray|faith|soul|why|point|hopeless|alone|abandon/i.test(lower)) {
    scores.soul += 3;
  }

  // Emotions keywords
  if (/angry|anxious|scared|fear|sad|depressed|overwhelm|stress|guilt|shame|hurt|bitter|resent|jealous|hate|cry|broken/i.test(lower)) {
    scores.emotions += 3;
  }

  // Find the top category
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topCategory = entries[0][1] > 0 ? entries[0][0] : null;

  if (topCategory) {
    // Put matching affirmations first, then identity (always important), then the rest
    const matched = DEFAULT_AFFIRMATIONS.filter(a => a.category === topCategory);
    const identity = DEFAULT_AFFIRMATIONS.filter(a => a.category === 'identity' && a.category !== topCategory);
    const rest = DEFAULT_AFFIRMATIONS.filter(a => a.category !== topCategory && a.category !== 'identity');
    return [...matched, ...identity, ...rest];
  }

  // Default: identity first
  return DEFAULT_AFFIRMATIONS;
}

interface SessionFlowProps {
  type: SessionType;
  profile?: UserProfile;
  morningSessions?: Record<string, MorningSessionData>;
  onComplete: (data: MorningSessionData | EveningSessionData) => void;
  onExit: () => void;
  initialStepIndex?: number;
  startAtWorkout?: boolean;
}

export const SessionFlow: React.FC<SessionFlowProps> = ({ type, profile, morningSessions, onComplete, onExit, initialStepIndex = 0 }) => {
  const [stepIndex, setStepIndex] = useState(initialStepIndex);
  const todayStr = new Date().toISOString().split('T')[0];

  // Morning session state
  const [story, setStory] = useState('');
  const [beliefAnswer, setBeliefAnswer] = useState('');
  const [intention, setIntention] = useState('');

  // Affirmations — dynamically ordered after story is written
  const [orderedAffirmations, setOrderedAffirmations] = useState<Affirmation[]>(DEFAULT_AFFIRMATIONS);

  // Evening session state
  const [reflection, setReflection] = useState('');
  const [isSpeakingQuote, setIsSpeakingQuote] = useState(false);

  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  const eveningQuote = useMemo(() => {
    return EVENING_QUOTES[Math.floor(Math.random() * EVENING_QUOTES.length)];
  }, []);

  const dailyPrompt = useMemo(() => {
    return getDailyPrompt(todayStr);
  }, [todayStr]);

  // ─── Past Reflection Discovery ───
  const pastReflection = useMemo(() => {
    if (type !== 'morning' || !morningSessions) return null;
    
    // Calculate 7 days ago
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const sevenDaysAgoStr = d.toISOString().split('T')[0];
    
    return morningSessions[sevenDaysAgoStr] || null;
  }, [type, morningSessions]);

  const nextStep = useCallback(() => {
    setStepIndex(prev => prev + 1);
  }, []);

  // ─── MORNING STEPS ───
  const morningSteps = useMemo(() => [
    { id: 'breathing-intro', component: <BreathingIntro onStart={nextStep} /> },
    { id: 'breathing', component: <BreathingExercise onComplete={nextStep} /> },
    { id: 'story', component: (
      <TherapyPrompt
        question={dailyPrompt.question}
        subtitle={dailyPrompt.subtitle}
        placeholder={dailyPrompt.placeholder}
        onComplete={(answer) => {
          setStory(answer);
          setOrderedAffirmations(getRelevantAffirmations(answer));
          nextStep();
        }}
      />
    )},
    ...(pastReflection ? [{
      id: 'past-comparison',
      component: (
        <PastReflectionComparison
          pastDate={pastReflection.date}
          pastStory={pastReflection.story}
          pastQuestion={pastReflection.storyQuestion}
          onComplete={nextStep}
        />
      )
    }] : []),
    { id: 'inspiration', component: <Inspiration story={story} profile={profile} onContinue={nextStep} /> },
    { id: 'affirmations', component: <AffirmationCarousel affirmations={orderedAffirmations} onComplete={nextStep} /> },
    { id: 'truth', component: (
      <TherapyPrompt
        question="What quiet truth needs your attention?"
        subtitle="Breathe slowly. You do not need perfect words. Just honesty."
        placeholder="I know I want to become someone I can trust..."
        onComplete={(answer) => {
          setBeliefAnswer(answer);
          nextStep();
        }}
      />
    )},
    { id: 'truth-inspiration', component: (
      <Inspiration 
        story={beliefAnswer} 
        profile={profile} 
        onContinue={nextStep} 
      />
    )},
    { id: 'intention', component: (
      <TherapyPrompt
        question="What is your one clear intention for today?"
        placeholder="One thing. Make it count..."
        onComplete={(answer) => {
          setIntention(answer);
          nextStep();
        }}
      />
    )},
    { id: 'workout', component: (
      <WorkoutSession
        profile={profile}
        onComplete={() => {
          const data: MorningSessionData = {
            date: todayStr,
            breathingCompleted: true,
            affirmationsRead: true,
            story: story,
            storyQuestion: dailyPrompt.question,
            beliefChallengeAnswer: beliefAnswer,
            beliefChallengeQuestion: 'Now speak the truth. What do you actually know to be real?',
            intention: intention,
            workoutCompleted: true,
            timestamp: Date.now(),
          };
          onComplete(data);
        }}
      />
    )},
  ], [todayStr, profile, story, dailyPrompt, pastReflection, beliefAnswer, intention, onComplete, nextStep]);

  const eveningSteps = useMemo(() => [
    { id: 'quote', component: (
      <div className="quote-wrapper fade-up">
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <button 
            className={`quote-audio-btn ${isSpeakingQuote ? 'speaking' : ''}`}
            onClick={() => {
              if (isSpeakingQuote) {
                speechService.stop();
                setIsSpeakingQuote(false);
              } else {
                setIsSpeakingQuote(true);
                speechService.speak(eveningQuote, () => setIsSpeakingQuote(false));
              }
            }}
          >
            {isSpeakingQuote ? '🔊' : '🔈'}
          </button>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--text-main)', opacity: 0.5 }}>
            "
          </h2>
          <blockquote style={{ fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {eveningQuote}
          </blockquote>
        </div>
        <button className="step-continue-btn fade-in" onClick={() => {
          speechService.stop();
          nextStep();
        }}>
          Enter Reflection
        </button>
      </div>
    )},
    { id: 'reflection', component: (
      <TherapyPrompt
        question="How did today feel?"
        subtitle="Take a moment to reflect without judging yourself. What went well today? What needs more attention tomorrow?"
        placeholder="Today I..."
        onComplete={(answer) => {
          setReflection(answer);
          nextStep();
        }}
      />
    )},
    { id: 'reflection-inspiration', component: (
      <Inspiration 
        story={reflection} 
        profile={profile} 
        onContinue={nextStep} 
      />
    )},
    { id: 'affirmations', component: <AffirmationCarousel affirmations={orderedAffirmations} onComplete={nextStep} /> },
    { id: 'prep', component: (
      <PreparationChecklist
        onComplete={(completedItems) => {
          const data: EveningSessionData = {
            date: todayStr,
            reflection: reflection,
            preparationChecklist: completedItems,
            timestamp: Date.now(),
          };
          onComplete(data);
        }}
      />
    )},
  ], [todayStr, reflection, onComplete, eveningQuote, isSpeakingQuote, nextStep]);

  const currentSteps = type === 'morning' ? morningSteps : eveningSteps;

  useEffect(() => {
    if (type === 'morning' && initialStepIndex === -1) {
      const workoutIdx = morningSteps.findIndex(s => s.id === 'workout');
      if (workoutIdx !== -1) setStepIndex(workoutIdx);
    }
  }, [type, initialStepIndex, morningSteps]);

  if (stepIndex === -1 && type === 'morning') {
    return (
      <div className="session-flow-loading">
        <div className="loading-orb" />
        <p>Initializing Workout Session...</p>
      </div>
    );
  }

  const currentStep = currentSteps[stepIndex];
  if (!currentStep) return null;

  const totalSteps = currentSteps.length;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="session-flow">
      {/* Progress bar */}
      <div className="session-progress-bar">
        <div className="session-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Exit button */}
      <button className="session-exit-btn" onClick={onExit}>
        ✕
      </button>

      {/* Current step */}
      <div className="session-step" key={currentStep?.id || stepIndex}>
        {currentStep?.component || null}
      </div>
    </div>
  );
};
