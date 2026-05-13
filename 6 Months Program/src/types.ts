// ─── Session Types ───
export type SessionType = 'morning' | 'evening';
export type SessionStepType =
  | 'breathing'
  | 'affirmation'
  | 'prompt'
  | 'intention'
  | 'emotion-checkin'
  | 'pillar-score'
  | 'silence'
  | 'summary';

export interface SessionStep {
  type: SessionStepType;
  title?: string;
  subtitle?: string;
}

// ─── Affirmations ───
export interface Affirmation {
  id: string;
  text: string;
  category: 'identity' | 'mind' | 'body' | 'soul' | 'emotions';
}

export const DEFAULT_AFFIRMATIONS: Affirmation[] = [
  { id: '1', text: 'I am a disciplined person.', category: 'identity' },
  { id: '2', text: 'I finish what I start.', category: 'identity' },
  { id: '3', text: 'I build myself daily, whether I feel like it or not.', category: 'identity' },
  { id: '4', text: 'I don\'t negotiate with distractions.', category: 'mind' },
  { id: '5', text: 'I think clearly and make decisions with confidence.', category: 'mind' },
  { id: '6', text: 'My body is strong, capable, and full of energy.', category: 'body' },
  { id: '7', text: 'I treat my body as a temple — with discipline and respect.', category: 'body' },
  { id: '8', text: 'I am grounded, calm, and connected to my purpose.', category: 'soul' },
  { id: '9', text: 'I live with intention, not reaction.', category: 'soul' },
  { id: '10', text: 'I feel my emotions without being controlled by them.', category: 'emotions' },
  { id: '11', text: 'I choose how I respond. Nothing controls me.', category: 'emotions' },
  { id: '12', text: 'I do not rely on motivation. I rely on discipline.', category: 'identity' },
  { id: '13', text: 'I do not restart every time I slip. I adjust and continue.', category: 'identity' },
];

// ─── Emotions ───
export type EmotionCategory = 'positive' | 'neutral' | 'negative';

export interface Emotion {
  name: string;
  emoji: string;
  category: EmotionCategory;
}

export const EMOTIONS: Emotion[] = [
  { name: 'Grateful', emoji: '🙏', category: 'positive' },
  { name: 'Peaceful', emoji: '😌', category: 'positive' },
  { name: 'Strong', emoji: '💪', category: 'positive' },
  { name: 'Joyful', emoji: '😊', category: 'positive' },
  { name: 'Hopeful', emoji: '🌅', category: 'positive' },
  { name: 'Focused', emoji: '🎯', category: 'positive' },
  { name: 'Calm', emoji: '🧘', category: 'neutral' },
  { name: 'Tired', emoji: '😴', category: 'neutral' },
  { name: 'Uncertain', emoji: '🤔', category: 'neutral' },
  { name: 'Restless', emoji: '😤', category: 'neutral' },
  { name: 'Anxious', emoji: '😰', category: 'negative' },
  { name: 'Frustrated', emoji: '😠', category: 'negative' },
  { name: 'Guilty', emoji: '😔', category: 'negative' },
  { name: 'Empty', emoji: '🫥', category: 'negative' },
  { name: 'Overwhelmed', emoji: '😵', category: 'negative' },
  { name: 'Lost', emoji: '🌫️', category: 'negative' },
];

// ─── Therapy Prompts ───
export const MORNING_PROMPTS = [
  'What limiting belief is holding me back right now?',
  'What would the strongest version of me do today?',
  'What am I avoiding — and why?',
  'What story am I telling myself that isn\'t true?',
  'If I had no fear, what would I do today?',
];

export const EVENING_PROMPTS = [
  'Did I act from discipline or emotion today?',
  'What did I avoid that I shouldn\'t have?',
  'Did I lie to myself about anything today?',
  'What am I most grateful for today?',
  'Where did I grow today — even slightly?',
];

// ─── Pillar Types ───
export type Pillar = 'mind' | 'body' | 'soul' | 'emotions';

export interface PillarScores {
  mind: number;
  body: number;
  soul: number;
  emotions: number;
}

// ─── Saved Session Data ───
export interface MorningSessionData {
  date: string;
  breathingCompleted: boolean;
  affirmationsRead: boolean;
  story: string;
  storyQuestion: string;
  beliefChallengeAnswer: string;
  beliefChallengeQuestion: string;
  intention: string;
  workoutCompleted?: boolean;
  timestamp: number;
}

export interface EveningSessionData {
  date: string;
  reflection: string;
  preparationChecklist: Record<string, boolean>;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  coreWhy: string;
  favoriteAuthors: string;
  selectedThemes: string[];
  tonePreference: 'gentle' | 'firm' | 'faith' | 'strong';
  wakeTime: string;
  activeDays: string[];
  programGoal: '6_month' | '3_month' | 'daily';
  exercisePreference: string;
  startDate: string;
  finishDate: string;
}

export interface WeeklyAuditData {
  weekEndingDate: string;
  disciplineScore: number;
  identityScore: number;
  executionScore: number; // Automated
  biggestWin: string;
  biggestLesson: string;
  timestamp: number;
}

export interface AppData {
  morningSessions: Record<string, MorningSessionData>;
  eveningSessions: Record<string, EveningSessionData>;
  weeklyAudits: Record<string, WeeklyAuditData>;
  customAffirmations: Affirmation[];
  profile?: UserProfile;
  voiceEnabled?: boolean;
}
