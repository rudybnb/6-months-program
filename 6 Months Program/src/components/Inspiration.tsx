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
      "It sounds like you are carrying the heavy weight of doubt right now. You want to grow, but these feelings of inadequacy make every step feel uncertain.",
      "This doesn't mean you lack potential; it means your mind is stuck in an old story. Today, choose to trust your efforts over your doubts. Your next right step: Complete one small task you've been avoiding."
    ],
    quote: {
      text: "The greatest tragedy in life is not death, but a life without a purpose.",
      author: "Myles Munroe",
    },
  },
  {
    keywords: /afraid|fear|scared|terrif|anxious|worry|panic|what if|nervous|dread|overwhelming/i,
    title: 'Fear Is Not Your Master',
    paragraphs: [
      "You seem to be facing a lot of uncertainty, and it's making you feel hesitant. It's natural to feel guarded when things feel overwhelming.",
      "Courage is not the absence of fear, but the decision that something else is more important. You are capable of moving forward even while feeling anxious. Your next right step: Take five deep breaths and name one thing you can control."
    ],
    quote: {
      text: "Everything you want is on the other side of fear.",
      author: "Robin Sharma",
    },
  },
  {
    keywords: /lazy|procrastin|distract|wasting time|no discipline|can't focus|scrolling|unmotivated|no motivation|putting off/i,
    title: 'Discipline Over Feeling',
    paragraphs: [
      "You are frustrated by your inconsistency and the feeling that you are wasting time. You want to be disciplined, but distractions keep pulling you away.",
      "This is not a character flaw; it's a sign that your systems need more support than your willpower. Discipline is a muscle built through small, boring choices. Your next right step: Put your phone in another room for the next 30 minutes."
    ],
    quote: {
      text: "You do not rise to the level of your goals. You fall to the level of your systems.",
      author: "James Clear",
    },
  },
  {
    keywords: /tired|exhausted|burnt out|no energy|drained|overwhelm|too much|can't keep up|breaking|falling apart|sleep/i,
    title: 'Rest Is Not Defeat',
    paragraphs: [
      "You sound truly exhausted, as if you've been carrying too much for too long. It’s hard to stay focused when your energy is depleted.",
      "Taking time to recover is not a sign of weakness; it's an essential part of sustainable growth. You cannot pour from an empty cup. Your next right step: Schedule a 15-minute block today for total rest."
    ],
    quote: {
      text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
      author: "Stephen R. Covey",
    },
  },
  {
    keywords: /lost|no purpose|no direction|meaningless|what's the point|empty|don't know why|no goals|aimless|wander|confused about life/i,
    title: 'Direction From Movement',
    paragraphs: [
      "You are feeling aimless and unsure if your efforts have a real point. It’s painful to feel like you’re wandering without a clear destination.",
      "Purpose is often found in the doing, not just the thinking. Clarity comes from taking small actions even when the path is foggy. Your next right step: Write down one thing that felt meaningful to you this week."
    ],
    quote: {
      text: "The greatest discovery in life is self-discovery.",
      author: "Myles Munroe",
    },
  },
  {
    keywords: /angry|frustrat|bitter|resent|hate|unfair|rage|pissed|betrayed|let down|disrespect/i,
    title: 'Channel The Fire',
    paragraphs: [
      "You are feeling a lot of justified anger right now. It seems like you’ve been let down or treated unfairly, and that fire is burning hot.",
      "Anger is powerful energy, but it can consume you if it isn't directed toward growth. You have the power to choose how you respond. Your next right step: Channel this energy into a brief, intense physical activity."
    ],
    quote: {
      text: "Your response is always your choice.",
      author: "Stephen R. Covey",
    },
  },
  {
    keywords: /sad|depressed|cry|grief|loss|lonely|alone|nobody|isolated|miss|gone|hurt|heartbr/i,
    title: 'Pain Is Not The End',
    paragraphs: [
      "What you're going through is very heavy, and it’s okay to acknowledge the pain you feel. You seem to be carrying a lot of sadness right now.",
      "Growth doesn't mean ignoring your hurt; it means learning to walk with it until it becomes lighter. You are not alone in this struggle. Your next right step: Reach out to one person or write one honest sentence about your feelings."
    ],
    quote: {
      text: "On your worst days, don't stop. Just go smaller.",
      author: "James Clear",
    },
  },
  {
    keywords: /body|fat|ugly|overweight|unfit|out of shape|weak|physically|gym|health|eating|weight|mirror/i,
    title: 'Your Body Is Your Ally',
    paragraphs: [
      "You are feeling disconnected or frustrated with your physical state. It’s difficult when you don’t feel comfortable in your own skin.",
      "Your body is the foundation of everything you want to achieve. Treat it with the respect it deserves, one small choice at a time. Your next right step: Drink a full glass of water and take a 5-minute walk."
    ],
    quote: {
      text: "Take care of your body. It's the only place you have to live.",
      author: "Robin Sharma",
    },
  },
  {
    keywords: /god|pray|faith|spirit|soul|church|believ|sin|guilt|forgiv|righteous|grace|heaven/i,
    title: 'Your Spirit Knows The Way',
    paragraphs: [
      "You are seeking a deeper connection and feeling the weight of spiritual questions. It seems like you are looking for a more solid foundation.",
      "Your faith is a source of strength that can guide you through the noise of daily life. Trust that there is a purpose for your journey. Your next right step: Spend three minutes in quiet prayer or meditation."
    ],
    quote: {
      text: "When purpose is not known, abuse is inevitable.",
      author: "Myles Munroe",
    },
  },
];

// Fallback response
const FALLBACK_RESPONSE: ThemeResponse = {
  keywords: /./,
  title: 'You Showed Up',
  paragraphs: [
    "It takes courage to be honest about where you are. You've named the thoughts that are usually left silent, and that is a significant first step.",
    "Now that you've acknowledged the pattern, you have the power to change it. Transformation starts with these small moments of awareness. Your next right step: Do one thing that aligns with the person you want to be."
  ],
  quote: {
    text: "Believe that life is worth living, and your belief will help create the fact.",
    author: "William James",
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
