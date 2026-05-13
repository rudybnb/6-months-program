import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateExerciseFormGuide } from '../services/ai';
import type { UserProfile } from '../types';
import './WorkoutSession.css';

interface Exercise {
  name: string;
  duration: number; // seconds (0 = rep-based, user taps when done)
  reps?: string;
  icon: string;
  gifUrl?: string;
  videoUrl?: string;
  sprite?: {
    row: number;
    col: number;
    frames: number;
  };
}

interface WorkoutPlan {
  name: string;
  focus: string;
  exercises: Exercise[];
}

// ─── Rotating workout plans ───
const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    name: 'Day 1 — Push',
    focus: 'Chest · Shoulders · Triceps',
    exercises: [
      { name: 'Warm-up Jog in Place', duration: 60, icon: '🏃', videoUrl: '/animations/Man_wants_to_jog_in_202605091320.mp4' },
      { name: 'Push-ups', duration: 0, reps: '3 × 15', icon: '💪', videoUrl: '/animations/push_ups.mp4' },
      { name: 'Bodyweight Squats', duration: 0, reps: '3 × 20', icon: '🏋️', videoUrl: '/animations/squats.mp4' },
      { name: 'Plank Hold', duration: 60, icon: '🧱', videoUrl: '/animations/plank.mp4' },
      { name: 'Plank Leg Raises', duration: 45, icon: '🙌', videoUrl: '/animations/plank_leg_raises.mp4' },
      { name: 'Cool-down Stretch', duration: 90, icon: '🧘' },
    ],
  },
  {
    name: 'Day 2 — Pull',
    focus: 'Back · Biceps · Core',
    exercises: [
      { name: 'Warm-up Jumping Jacks', duration: 60, icon: '⭐', videoUrl: '/animations/Him_do_jumping_jacks_202605091316.mp4' },
      { name: 'Superman Hold', duration: 45, icon: '🦸', videoUrl: '/animations/Superman_hold_202605091431.mp4' },
      { name: 'Inverted Rows (Table)', duration: 0, reps: '3 × 12', icon: '🔄', videoUrl: '/animations/Inverted_rows_202605091443.mp4' },
      { name: 'Bicep Towel Curls', duration: 0, reps: '3 × 15', icon: '💪', videoUrl: '/animations/Bicep_Towel_Curls_202605091449.mp4' },
      { name: 'Dead Hang (if bar available)', duration: 30, icon: '🙆', videoUrl: '/animations/Man_doing_dead_hang_exercise_202605121449.mp4' },
      { name: 'Reverse Snow Angels', duration: 0, reps: '3 × 12', icon: '👼', videoUrl: '/animations/Prone_Y-Extensions_exercise_202605121512.mp4' },
      { name: 'Bicycle Crunches', duration: 45, icon: '🚴', sprite: { row: 4, col: 0, frames: 4 } },
      { name: 'Cool-down Stretch', duration: 90, icon: '🧘' },
    ],
  },
  {
    name: 'Day 3 — Legs',
    focus: 'Quads · Glutes · Hamstrings · Calves',
    exercises: [
      { name: 'Warm-up High Knees', duration: 60, icon: '🦵', videoUrl: '/animations/High_knees_exercise_202605121434.mp4' },
      { name: 'Bodyweight Squats', duration: 0, reps: '3 × 20', icon: '🏋️', videoUrl: '/animations/squats.mp4' },
      { name: 'Bulgarian Split Squats', duration: 0, reps: '3 × 12 each', icon: '🔀', videoUrl: '/animations/bulgarian_split_squats.mp4' },
      { name: 'Glute Bridges', duration: 0, reps: '3 × 15', icon: '🌉', videoUrl: '/animations/glute_briges_exercise_202605121542.mp4' },
      { name: 'Wall Sit', duration: 45, icon: '🧱', videoUrl: '/animations/wall_sit_202605121547.mp4' },
      { name: 'Calf Raises', duration: 0, reps: '3 × 20', icon: '⬆️', sprite: { row: 1, col: 1, frames: 4 } },
      { name: 'Jump Squats', duration: 0, reps: '3 × 10', icon: '🦘', videoUrl: '/animations/jump_squats.mp4' },
      { name: 'Cool-down Stretch', duration: 90, icon: '🧘' },
    ],
  },
  {
    name: 'Day 4 — Full Body',
    focus: 'Total Body Activation',
    exercises: [
      { name: 'Warm-up Jog in Place', duration: 60, icon: '🏃', videoUrl: '/animations/Man_wants_to_jog_in_202605091320.mp4' },
      { name: 'Burpees', duration: 0, reps: '3 × 8', icon: '🔥', videoUrl: '/animations/Professional_burpees_202605091344.mp4' },
      { name: 'Mountain Climbers', duration: 45, icon: '⛰️', videoUrl: '/animations/Mountain Climbers.mp4' },
      { name: 'Lunges (Alternating)', duration: 0, reps: '3 × 12 each', icon: '🚶', videoUrl: '/animations/lunges.mp4' },
      { name: 'Push-ups', duration: 0, reps: '3 × 15', icon: '💪', videoUrl: '/animations/push_ups.mp4' },
      { name: 'Plank to Down Dog', duration: 45, icon: '🐕', videoUrl: '/animations/Plank_to_down_dog_exercise_202605121555.mp4' },
      { name: 'Squat Jumps', duration: 0, reps: '3 × 10', icon: '🦘', videoUrl: '/animations/jump_squats.mp4' },
      { name: 'Cool-down Stretch', duration: 90, icon: '🧘' },
    ],
  },
  {
    name: 'Day 5 — Core & Cardio',
    focus: 'Abs · Obliques · Heart Rate',
    exercises: [
      { name: 'Warm-up Star Jumps', duration: 60, icon: '⭐', videoUrl: '/animations/Him_do_jumping_jacks_202605091316.mp4' },
      { name: 'Plank Hold', duration: 60, icon: '🧱', videoUrl: '/animations/plank.mp4' },
      { name: 'Russian Twists', duration: 0, reps: '3 × 20', icon: '🔄', videoUrl: '/animations/Russian_twist_exercise_202605121439.mp4' },
      { name: 'High Knees Sprint', duration: 45, icon: '🏃', videoUrl: '/animations/High_knees_exercise_202605121434.mp4' },
      { name: 'Leg Raises', duration: 0, reps: '3 × 12', icon: '🦵', videoUrl: '/animations/Leg_Raises_exercise_202605121557.mp4' },
      { name: 'Burpees', duration: 0, reps: '3 × 8', icon: '🔥', videoUrl: '/animations/Professional_burpees_202605091344.mp4' },
      { name: 'Side Plank (Each Side)', duration: 30, icon: '📐', videoUrl: '/animations/Side_Plank_exercise_202605121558.mp4' },
      { name: 'Cool-down Stretch', duration: 90, icon: '🧘' },
    ],
  },
];

interface WorkoutSessionProps {
  onComplete: () => void;
  profile?: UserProfile;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const WorkoutSession: React.FC<WorkoutSessionProps> = ({ onComplete, profile }) => {
  // Pick workout based on day of year (rotates through 5 plans)
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const plan = WORKOUT_PLANS[dayOfYear % WORKOUT_PLANS.length];

  const [phase, setPhase] = useState<'overview' | 'active' | 'done'>('overview');
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Coaching state
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachingData, setCoachingData] = useState<string | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exercise = plan.exercises[currentExercise];
  const isTimed = exercise?.duration > 0;

  // Timer logic
  useEffect(() => {
    if (isRunning && isTimed) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            // Timer done — auto advance
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isTimed]);

  // When timer hits 0 on a timed exercise, auto-advance
  useEffect(() => {
    if (phase === 'active' && isTimed && timer === 0 && !isRunning && currentExercise < plan.exercises.length) {
      // Small delay before auto-advancing
      const timeout = setTimeout(() => {
        goToNext();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [timer, isRunning, phase, isTimed]);

  const startWorkout = () => {
    setPhase('active');
    setCurrentExercise(0);
    if (plan.exercises[0].duration > 0) {
      setTimer(plan.exercises[0].duration);
    }
  };

  const startTimer = () => {
    if (isTimed) {
      setTimer(exercise.duration);
      setIsRunning(true);
    }
  };

  const goToNext = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCoachingData(null);
    setIsCoaching(false);

    if (currentExercise + 1 >= plan.exercises.length) {
      setPhase('done');
    } else {
      const nextIdx = currentExercise + 1;
      setCurrentExercise(nextIdx);
      const nextEx = plan.exercises[nextIdx];
      if (nextEx.duration > 0) {
        setTimer(nextEx.duration);
      } else {
        setTimer(0);
      }
    }
  }, [currentExercise, plan.exercises]);

  const handleGetCoaching = async () => {
    if (isRunning) setIsRunning(false); // Pause timer if coaching requested
    setIsCoaching(true);
    const data = await generateExerciseFormGuide(exercise.name, profile);
    setCoachingData(data);
  };

  // ─── Overview ───
  if (phase === 'overview') {
    return (
      <div className="workout-container">
        <div className="workout-overview fade-up">
          <span className="workout-badge">💪 BODY</span>
          <h2>{plan.name}</h2>
          <p className="workout-focus">{plan.focus}</p>

          <div className="workout-exercise-list">
            {plan.exercises.map((ex, i) => (
              <div className="exercise-preview" key={i}>
                <span className="exercise-preview-icon">{ex.icon}</span>
                <span className="exercise-preview-name">{ex.name}</span>
                <span className="exercise-preview-detail">
                  {ex.duration > 0 ? formatTime(ex.duration) : ex.reps}
                </span>
              </div>
            ))}
          </div>

          <button className="workout-start-btn" onClick={startWorkout}>
            Begin Workout
          </button>

          <button className="workout-skip-btn" onClick={onComplete}>
            Skip Today
          </button>
        </div>
      </div>
    );
  }

  // ─── Done ───
  if (phase === 'done') {
    return (
      <div className="workout-container">
        <div className="workout-done fade-up">
          <span className="done-icon">🔥</span>
          <h2>Workout Complete.</h2>
          <p>Your body showed up today. That's discipline.</p>
          <button className="workout-start-btn" onClick={onComplete}>
            Continue Session
          </button>
        </div>
      </div>
    );
  }

  // ─── Active Exercise ───
  return (
    <div className="workout-container">
      <div className="workout-active">
        <div className="exercise-counter fade-in">
          {currentExercise + 1} / {plan.exercises.length}
        </div>

        <div className="exercise-media-container fade-up">
          {exercise.videoUrl ? (
            <video 
              src={exercise.videoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="exercise-video"
            />
          ) : exercise.sprite ? (
            <div 
              className="exercise-sprite-animation"
              style={{
                '--row': exercise.sprite.row,
                '--col': exercise.sprite.col,
                '--frames': exercise.sprite.frames,
              } as React.CSSProperties}
            />
          ) : exercise.gifUrl ? (
            <img 
              src={exercise.gifUrl} 
              alt={exercise.name} 
              className="exercise-gif"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.exercise-icon-fallback')?.classList.remove('hidden');
              }}
            />
          ) : (
            <div className="exercise-icon-large">
              {exercise.icon}
            </div>
          )}
        </div>

        <h2 className="exercise-name fade-up" style={{ animationDelay: '0.1s' }}>
          {exercise.name}
        </h2>

        {/* AI Coaching Section */}
        <div className="exercise-coaching-container fade-up" style={{ animationDelay: '0.15s' }}>
          {!isCoaching && !coachingData && (
            <button className="exercise-help-btn" onClick={handleGetCoaching}>
              <span>💡</span> How do I do this?
            </button>
          )}
          
          {isCoaching && !coachingData && (
            <div className="coaching-loading">
              <div className="loading-orb small" />
              <span>Analyzing movement...</span>
            </div>
          )}

          {coachingData && (
            <div className="coaching-card fade-in">
              <h4>Perfect Form Guide</h4>
              <div className="coaching-steps">
                {coachingData.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
              <button className="coaching-close-btn" onClick={() => {
                setCoachingData(null);
                setIsCoaching(false);
              }}>Got it</button>
            </div>
          )}
        </div>

        {isTimed ? (
          <div className="timer-display fade-up" style={{ animationDelay: '0.2s' }}>
            <span className={`timer-value ${timer <= 5 && isRunning ? 'ending' : ''}`}>
              {formatTime(timer)}
            </span>
            {!isRunning && timer === exercise.duration && (
              <button className="timer-start-btn" onClick={startTimer}>
                Start Timer
              </button>
            )}
            {!isRunning && timer === 0 && (
              <span className="timer-done">Done ✓</span>
            )}
            {isRunning && (
              <span className="timer-active">Keep going...</span>
            )}
          </div>
        ) : (
          <div className="reps-display fade-up" style={{ animationDelay: '0.2s' }}>
            <span className="reps-value">{exercise.reps}</span>
            <p className="reps-hint">Complete all sets, then continue</p>
          </div>
        )}

        {(!isTimed || (isTimed && !isRunning && timer === 0)) && (
          <button
            className="exercise-next-btn fade-in"
            style={{ animationDelay: '0.3s' }}
            onClick={goToNext}
          >
            {currentExercise + 1 === plan.exercises.length ? 'Finish Workout' : 'Next Exercise →'}
          </button>
        )}
      </div>
    </div>
  );
};
