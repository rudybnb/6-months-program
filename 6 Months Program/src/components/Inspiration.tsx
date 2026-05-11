import React, { useState, useEffect } from 'react';
import { generateInspiration } from '../services/ai';
import type { AIResponse } from '../services/ai';
import { speechService } from '../services/speech';
import './Inspiration.css';

import type { UserProfile } from '../types';

interface InspirationProps {
  story: string;
  profile?: UserProfile;
  onContinue: () => void;
}

// ─── Quote type ───
interface AuthorQuote {
  text: string;
  author: string;
}

// ─── Inspirational responses mapped to themes ───
interface ThemeResponse {
  keywords: RegExp;
  title: string;
  paragraphs: [string, string];
  quote: AuthorQuote;
}

const THEME_RESPONSES: ThemeResponse[] = [
  {
    keywords: /not good enough|not enough|worthless|imposter|fraud|fake|don't deserve|unworthy|inadequa/i,
    title: 'You Are Enough',
    paragraphs: [
      `The story of "not enough" is one of the oldest lies the mind tells. Myles Munroe taught that the wealthiest place on earth is the cemetery — because people die with their dreams, gifts, and potential still inside them. Not because they lacked ability, but because they believed the lie that they weren't enough to begin with. Bob Proctor spent his life reminding people that your self-image is the thermostat of your life — if you see yourself as unworthy, you will unconsciously sabotage every opportunity that comes your way. But the moment you change that image, everything shifts.`,
      `James Clear wrote that every action you take is a vote for the type of person you wish to become. You don't need to be perfect — you need to cast enough votes in the right direction. Today, you don't need to silence the doubt completely. You just need to stop obeying it. As Mel Robbins says: you are never going to feel like it. So stop waiting. Count 5-4-3-2-1 and move. Your actions will rewrite the story over time — not in one dramatic moment, but in the quiet, daily repetition of showing up.`,
    ],
    quote: {
      text: 'The greatest tragedy in life is not death, but a life without a purpose.',
      author: 'Myles Munroe',
    },
  },
  {
    keywords: /afraid|fear|scared|terrif|anxious|worry|panic|what if|nervous|dread|overwhelming/i,
    title: 'Fear Is Not Your Master',
    paragraphs: [
      `Robin Sharma wrote: "The fears you don't face become your walls." Fear is not a signal to stop — it's a signal that something matters to you deeply. Every meaningful act you've ever taken was done while afraid. Mel Robbins discovered the 5 Second Rule precisely because she was paralysed by fear — and she learned that if you don't act within five seconds, your brain will talk you out of it. The courage isn't the absence of fear. It's the decision to move before fear finishes its sentence.`,
      `Bob Proctor taught that fear and faith have the same definition — both are believing in something you cannot see. The only difference is which direction you point that belief. Stephen Covey reminded us to "live out of your imagination, not your history." Your past fears don't have to dictate your future. Today, take one step toward the thing you're avoiding. Just one. That is how chains are broken — link by link, not all at once. As John Maxwell said: "You'll never change your life until you change something you do daily."`,
    ],
    quote: {
      text: 'Everything you want is on the other side of fear.',
      author: 'Robin Sharma',
    },
  },
  {
    keywords: /lazy|procrastin|distract|wasting time|no discipline|can't focus|scrolling|unmotivated|no motivation|putting off/i,
    title: 'Discipline Over Feeling',
    paragraphs: [
      `James Clear wrote in Atomic Habits: "You do not rise to the level of your goals. You fall to the level of your systems." Motivation is a visitor — it comes and goes without warning. If you build your life around waiting for it, you'll spend most of your days standing still. The people you admire for their consistency don't feel like doing it most of the time either. As Mel Robbins says: "If you only did things when you felt like it, you'd never do anything." The 5 Second Rule exists because hesitation is the killer — not inability.`,
      `Stephen Covey taught us to "begin with the end in mind" and to put first things first. Robin Sharma wrote that "your daily behaviour reveals your deepest beliefs" — so if you say you want change but keep choosing comfort, you're voting for the old you. Today, don't aim for a perfect day. Just start the first task. That's it. As James Clear says: "Every action is a vote for the person you wish to become." One honest rep, one focused hour, one meal with intention — these aren't small things. They are everything.`,
    ],
    quote: {
      text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
      author: 'James Clear',
    },
  },
  {
    keywords: /tired|exhausted|burnt out|no energy|drained|overwhelm|too much|can't keep up|breaking|falling apart|sleep/i,
    title: 'Rest Is Not Defeat',
    paragraphs: [
      `Stephen Covey called it "sharpening the saw" — the 7th habit, and the one most people skip. He taught that without renewal, we gradually destroy ourselves. Your body and mind are not machines. Robin Sharma wrote: "Rest and recovery are not luxuries. They are necessities for world-class performance." The fact that you're tired doesn't mean you're weak. It means you've been carrying weight. Acknowledging that takes more strength than pretending everything is fine.`,
      `But here's the key — rest with intention, not with guilt. As Bob Proctor taught: "Be like a postage stamp — stick to one thing until you get there." Give yourself permission to recover today, and then set a clear time to start again. The danger isn't in resting — it's in letting rest become avoidance. As John Maxwell says: "The secret of your success is determined by your daily agenda." Today, take care of yourself first. Then come back with one small act of discipline. That is enough. You don't need to catch up. You just need to continue.`,
    ],
    quote: {
      text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.',
      author: 'Stephen R. Covey',
    },
  },
  {
    keywords: /lost|no purpose|no direction|meaningless|what's the point|empty|don't know why|no goals|aimless|wander|confused about life/i,
    title: 'Direction Comes From Movement',
    paragraphs: [
      `Myles Munroe spent his entire life teaching one truth: "The greatest tragedy is not death, but life without purpose." He believed that every person on earth was sent here with an assignment — and that the restlessness you feel is not a weakness, it's your potential demanding to be used. You don't need to see the whole path. Most people who found their purpose didn't discover it sitting still. Stephen Covey taught us to "begin with the end in mind" — not because you need a perfect plan, but because direction matters more than speed.`,
      `John Maxwell wrote: "Life is a matter of choices, and every choice you make makes you." Stop asking "What is my purpose?" and start asking "What needs my attention right now?" As James Clear teaches, identity change is the real goal — decide who you want to become, then prove it to yourself with small wins. Robin Sharma reminds us: "Don't live the same year 75 times and call it a life." Today, your only job is to invest in yourself with one deliberate act. That act is the seed. Trust the process.`,
    ],
    quote: {
      text: 'The greatest discovery in life is self-discovery. Until you find yourself you will always be someone else.',
      author: 'Myles Munroe',
    },
  },
  {
    keywords: /angry|frustrat|bitter|resent|hate|unfair|rage|pissed|betrayed|let down|disrespect/i,
    title: 'Channel The Fire',
    paragraphs: [
      `John Maxwell wrote: "A leader is one who knows the way, goes the way, and shows the way." And right now, you need to lead yourself through this fire. Anger is energy — one of the most powerful forces inside you. The question isn't whether you should feel it. As Mel Robbins teaches, your feelings are real but they are not always facts. You have every right to feel what you feel. The question is: what will you do with this fire? Will you let it consume you, or will you channel it into building something they can't take from you?`,
      `Bob Proctor taught that "thinking is the highest function a human being can perform" — so don't react blindly. Think. Redirect. Robin Sharma wrote: "Victims recite problems. Leaders provide solutions." Take that frustration into your training, into your work, into your discipline. Stephen Covey's first habit was "Be Proactive" — meaning, you choose your response. Nothing and nobody controls your next move. Today, prove to yourself that you are bigger than what happened to you. Not by pretending it doesn't hurt, but by refusing to let it define you.`,
    ],
    quote: {
      text: 'People cannot make you angry. Your response is always your choice.',
      author: 'Stephen R. Covey',
    },
  },
  {
    keywords: /sad|depressed|cry|grief|loss|lonely|alone|nobody|isolated|miss|gone|hurt|heartbr/i,
    title: 'Pain Is Not The End',
    paragraphs: [
      `What you're feeling right now is heavy. And it's real. Don't let anyone — including yourself — tell you that you should be over it by now. Myles Munroe taught that "your setback is a setup for your comeback." The pain you carry is not the final chapter. Robin Sharma wrote: "Suffering has been the fire that has forged the most brilliant of souls." Not that pain is good — but that you can emerge from it stronger, if you choose to keep building while you heal.`,
      `As Bob Proctor said: "See yourself living in abundance and you will attract it." Even now — especially now — your thoughts are shaping your tomorrow. James Clear reminds us that on hard days, showing up for just two minutes still counts. It keeps the habit alive. It keeps you alive. Today, do one thing for the person you're becoming — even something small. Read a page. Move your body. Write one honest sentence. As John Maxwell says: "The pessimist complains about the wind. The optimist expects it to change. The leader adjusts the sails." Adjust your sails today.`,
    ],
    quote: {
      text: 'On your worst days, don\'t stop. Just go smaller. Two minutes is better than nothing.',
      author: 'James Clear',
    },
  },
  {
    keywords: /body|fat|ugly|overweight|unfit|out of shape|weak|physically|gym|health|eating|weight|mirror/i,
    title: 'Your Body Is Your Ally',
    paragraphs: [
      `Robin Sharma wrote: "Take care of your body. It's the only place you have to live." Your body has carried you through every hard season of your life without fail. Every sleepless night, every stressful day — it kept going. Now it's time to stop working against it and start working with it. James Clear teaches that transformation doesn't require perfection — it requires small, repeated habits. "Getting 1% better every day counts for a lot in the long run." You don't need a complete overhaul. You need one honest choice, repeated.`,
      `Bob Proctor taught: "The body is the servant of the mind. It obeys the operations of the mind." If you change how you think about your body — from enemy to ally — your actions will follow. As Mel Robbins says, stop waiting to feel ready. You will never feel ready. 5-4-3-2-1 — move. Stephen Covey's 7th habit, "Sharpen the Saw," teaches that physical renewal is not optional — it's the foundation everything else is built on. Today, move for 20 minutes. Choose one meal that fuels you. Your body will respond. It always does.`,
    ],
    quote: {
      text: 'Take care of your body. It\'s the only place you have to live.',
      author: 'Robin Sharma',
    },
  },
  {
    keywords: /god|pray|faith|spirit|soul|church|believ|sin|guilt|forgiv|righteous|grace|heaven/i,
    title: 'Your Spirit Knows The Way',
    paragraphs: [
      `Myles Munroe built his entire ministry around one conviction: "You were not created to just exist. You were created to fulfill a purpose that only you can fulfill." There is a deeper part of you — beyond the noise, beyond the doubt, beyond the daily grind — that already knows who you are. You've felt it in moments of silence, in prayer, in those quiet whispers that tell you there's more. Stephen Covey taught that true leadership is "principle-centred" — rooted in timeless truths, not fleeting emotions. Your spiritual life is that root system.`,
      `As Bob Proctor said: "Faith and fear both demand you believe in something you cannot see. You choose which one to feed." Today, feed your faith. Give yourself permission to be still. Not to escape the world, but to reconnect with your foundation. Robin Sharma reminds us: "Silence is the doorway to the soul." Your spiritual life is not separate from your discipline — it is the source of it. When you know why you're building, the how becomes clearer. Breathe. Pray. Listen. Then go and live like someone who knows exactly where they're going.`,
    ],
    quote: {
      text: 'When purpose is not known, abuse is inevitable.',
      author: 'Myles Munroe',
    },
  },
];

// Fallback response
const FALLBACK_RESPONSE: ThemeResponse = {
  keywords: /./,
  title: 'You Showed Up',
  paragraphs: [
    `The hardest part of any day is the moment of honesty — and you just did it. As James Clear writes: "The most practical way to change who you are is to change what you do." You named the story running through your head instead of letting it run you silently. Most people never do that. They carry their narratives like invisible weights, never questioning them, never writing them down. John Maxwell teaches that "the greatest day in your life is when you take total responsibility for your attitudes." That's what you just did.`,
    `Now here's what matters: the story you wrote is just that — a story. As Bob Proctor taught: "Thoughts become things. If you see it in your mind, you will hold it in your hand." Your thoughts have been creating your reality — but you get to choose new thoughts. Robin Sharma wrote: "Your life does not get better by chance, it gets better by change." The affirmations ahead are not empty words. They are the new story. Speak them like you mean them — because as Myles Munroe said, "Your words have creative power. When you speak, things happen."`,
  ],
  quote: {
    text: 'Be not afraid of life. Believe that life is worth living, and your belief will help create the fact.',
    author: 'John Maxwell',
  },
};

function getInspirationForStory(storyText: string): ThemeResponse {
  let bestMatch: ThemeResponse | null = null;
  let bestScore = 0;

  for (const theme of THEME_RESPONSES) {
    const matches = storyText.match(theme.keywords);
    if (matches && matches.length > bestScore) {
      bestScore = matches.length;
      bestMatch = theme;
    }
  }

  return bestMatch || FALLBACK_RESPONSE;
}

export const Inspiration: React.FC<InspirationProps> = ({ story, profile, onContinue }) => {
  const [loading, setLoading] = useState(true);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const response = aiResponse || getInspirationForStory(story);
  
  const toggleAudio = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      const textToSpeak = `
        ${response.title}. 
        ${response.paragraphs[0]}
        ${response.paragraphs[1]}
        The mentor ${response.quote.author} once said: ${response.quote.text}
      `;
      setIsSpeaking(true);
      speechService.speak(textToSpeak, () => setIsSpeaking(false));
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchInspiration() {
      try {
        const result = await generateInspiration(story, profile);
        if (isMounted) {
          setAiResponse(result);
          setLoading(false);
        }
      } catch (err) {
        console.error('AI generation failed, falling back to local:', err);
        if (isMounted) {
          setAiResponse(getInspirationForStory(story));
          setLoading(false);
        }
      }
    }

    fetchInspiration();

    return () => {
      isMounted = false;
      speechService.stop();
    };
  }, [story]);

  if (loading) {
    return (
      <div className="inspiration-container">
        <div className="inspiration-loading fade-in">
          <div className="loading-orb" />
          <p>Consulting your mentors...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="inspiration-container">
      <div className="inspiration-content">
        <div className="inspiration-header">
          <div className="inspiration-label fade-in">
            Based on what you shared
          </div>
          <button 
            className={`audio-toggle-btn fade-in ${isSpeaking ? 'speaking' : ''}`}
            onClick={toggleAudio}
            title={isSpeaking ? "Stop Audio" : "Listen to Response"}
          >
            {isSpeaking ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            <span>{isSpeaking ? 'Stop Listening' : 'Listen to Mentor'}</span>
          </button>
        </div>

        <h2 className="inspiration-title fade-up">{response.title}</h2>

        <div className="inspiration-text fade-up" style={{ animationDelay: '0.2s' }}>
          <p>{response.paragraphs[0]}</p>
        </div>

        <div className="inspiration-text fade-up" style={{ animationDelay: '0.4s' }}>
          <p>{response.paragraphs[1]}</p>
        </div>

        {/* Author Quote */}
        <div className="inspiration-quote fade-up" style={{ animationDelay: '0.6s' }}>
          <blockquote>"{response.quote.text}"</blockquote>
          <cite>— {response.quote.author}</cite>
        </div>

        <div className="inspiration-divider fade-in" style={{ animationDelay: '0.8s' }} />

        <button
          className="inspiration-continue-btn fade-in"
          style={{ animationDelay: '1s' }}
          onClick={onContinue}
        >
          Now Declare Who I Am
        </button>
      </div>
    </div>
  );
};
