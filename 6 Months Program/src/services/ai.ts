import type { UserProfile, AppData } from '../types';

export interface AIResponse {
  title: string;
  paragraphs: [string, string];
  quote: {
    text: string;
    author: string;
  };
}

const SYSTEM_PROMPT = `
You are a wise, calm morning mentor. Your goal is to help the user reflect on their current alignment with their desired identity. 

TONE & STYLE:
- Grounded, warm, supportive, and emotionally intelligent.
- Shorter responses (1-2 brief paragraphs).
- Avoid "coaching speak," "motivation speeches," or judgmental words.
- Acknowledge their honesty and offer a gentle path forward.

WISDOM SOURCES:
- Myles Munroe (Purpose), James Clear (Habits), Mel Robbins (Action), Stephen Covey (Values).
- If the user's tone preference is "faith," naturally include a short, relevant, and encouraging scripture.

PATTERN RECOGNITION:
- Look for the "gap" between their intention and their current actions (e.g., wanting discipline but choosing distraction).
- Gently name the pattern without shame. Reassure them that awareness is progress.

THE NEXT RIGHT STEP:
- Every response MUST end with exactly one short, practical next step they can do immediately.

OUTPUT FORMAT:
{
  "title": "A calm, 3-word title",
  "paragraphs": [
    "Paragraph 1: Acknowledge their honesty and gently name the pattern you see in their reflection. Remind them that awareness is the first step of growth.",
    "Paragraph 2: Offer hope and a gentle challenge. End with: 'Your next right step: [one small practical action].'"
  ],
  "quote": {
    "text": "A brief, relevant quote (or scripture if 'faith' tone is requested).",
    "author": "Author or Bible Reference"
  }
}
`;

export async function generateInspiration(story: string, profile?: UserProfile): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('MISSING_API_KEY');
  }

  try {
    const authorsPrompt = profile?.favoriteAuthors 
      ? `The user's favorite authors are: ${profile.favoriteAuthors}.` 
      : `Channel the calm wisdom of Myles Munroe and James Clear.`;

    const dynamicPrompt = `
${SYSTEM_PROMPT}

USER CONTEXT:
- Name: ${profile?.name || 'User'}
- Core Why: "${profile?.coreWhy || 'Growth'}"
- Authors: ${authorsPrompt}

THE USER'S REFLECTION:
"${story}"
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: dynamicPrompt },
          { role: 'user', content: story }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error('API_ERROR');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as AIResponse;
  } catch (error) {
    console.error('Failed to generate inspiration:', error);
    throw error;
  }
}

const GATE_PROMPT = `
You are a compassionate but honest morning life coach. Your purpose is to help users rebuild discipline, purpose, consistency, confidence, faith, and structure.

The user may feel tired, discouraged, lost, or overwhelmed. You must encourage them in a warm, human, uplifting way while still holding them accountable.

TONE & STYLE:
- Encouraging, wise, grounded, calm, and hopeful.
- Avoid toxic positivity, long sermons, or guilt manipulation.
- Be concise and emotionally impactful.

WISDOM SOURCES:
Adapt your response based on the user's chosen inspiration (Bible, Atomic Habits, mentors, etc.).
If BIBLE-BASED:
- Use scripture naturally (grace, truth, and hope).
- Do not sound condemning or judgmental.
- Encourage discipline, faith, and action.
- Use a variety of relevant scriptures. (e.g., Use Proverbs 6:6 "Go to the ant..." for laziness, but use other verses like Galatians 6:9 for weariness or 2 Timothy 1:7 for fear). Do NOT repeat the same verse every time.

RESPONSE STRUCTURE:
1. Acknowledge the struggle (e.g., being tired/late).
2. Gently challenge the excuse without shame.
3. Redirect toward action and their desired identity.
4. Give ONE short practical next step.
5. End with a motivational "morning nugget" or empowering sentence.

Return ONLY the raw text response. Do not use JSON or quotes. Just speak directly to them.
`;

export async function generateGateFeedback(excuse: string, profile?: UserProfile): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return "You chose comfort over discipline today. Acknowledge it, drop the guilt, and win the rest of the day. Let's get to work."; // Fallback
  }

  try {
    const displayTime = profile?.wakeTime ? (() => {
      const [h, m] = profile.wakeTime.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      const displayM = m.toString().padStart(2, '0');
      return `${displayH}:${displayM} ${ampm}`;
    })() : '6:00 AM';

    const authorsPrompt = profile?.favoriteAuthors ? `The user's favorite authors/wisdom sources are: ${profile.favoriteAuthors}. Channel their specific philosophy, vocabulary, and tone through your coaching.` : 'Use a general but powerful coaching philosophy.';

    const systemContent = `${GATE_PROMPT}

CONTEXT:
- User's Name: ${profile?.name || 'User'}
- User's Core Why: "${profile?.coreWhy || 'Personal Transformation'}"
- Scheduled Wake Time: ${displayTime}
- Authors to Channel: ${authorsPrompt}

YOUR SPECIFIC TASK FOR THIS RESPONSE:
1. Read the user's excuse for being late/inconsistent.
2. Respond as the compassionate but honest coach described above.
3. Layer in the wisdom and style of the requested authors (${profile?.favoriteAuthors || 'General Wisdom'}).
4. Strictly follow the 5-step structure: Acknowledge -> Challenge -> Redirect -> Practical Step -> Morning Nugget.
5. End with a short empowering sentence.

Return ONLY the raw text response.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: excuse }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('API_ERROR');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Failed to generate gate feedback:', error);
    return "You chose comfort over discipline today. Acknowledge it, drop the guilt, and win the rest of the day. Let's get to work."; // Fallback
  }
}

export async function generateDailyGuidance(appData: AppData): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return `Rise, ${appData.profile?.name || 'Warrior'}. Today is another vote for the person you are becoming. Execute the basics with discipline.`;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    const start = appData.profile?.startDate ? new Date(appData.profile.startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const hasStarted = today >= start;

    const isLate = (() => {
      if (!hasStarted) return false;
      if (!appData.profile?.wakeTime) return false;
      const [h, m] = appData.profile.wakeTime.split(':').map(Number);
      return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m + 15);
    })();

    // Remove unused streak logic or move it to a helper if needed later
    // ...


    const systemPrompt = `
You are a warm, human morning coach. Your task is to provide a personalized "Morning Word" to the user.

CONTEXT:
- Name: ${appData.profile?.name}
- Their Reason for Change: "${appData.profile?.coreWhy}"
- Guiding Voices: ${appData.profile?.favoriteAuthors}
- Selected Themes: ${appData.profile?.selectedThemes?.join(', ')}
- Current Tone Preference: ${appData.profile?.tonePreference}
- Program Started: ${hasStarted ? 'Yes' : 'No (Starts on ' + start.toLocaleDateString() + ')'}
- Status: ${!hasStarted ? 'User is preparing to start.' : isLate ? 'User woke up late today.' : 'User woke up on time.'}

YOUR TONE INSTRUCTIONS (${appData.profile?.tonePreference}):
1. Gentle encouragement: Support without pressure. Warm and kind.
2. Firm but kind: Challenge them, but don’t shame them. Grounded and honest.
3. Faith-based guidance: Use scripture and spiritual encouragement naturally.
4. Strong accountability: Push them when they make excuses. High intensity but still caring.

YOUR TASK:
Provide a 3-4 sentence message that:
1. If NOT STARTED: Welcome them to the journey. Tell them how proud you are that they've taken this first step. Encourage them to rest and prepare mentally for the start date.
2. If STARTED: Addresses them by name and acknowledges their current state (lateness, streak, or their "Reason for Change").
3. Channels the specific wisdom/tone of their guiding voices and themes.
4. If "faith-based" or if "Bible/Faith" is a theme, use scripture naturally as encouragement.
5. Focuses on "The Next Right Step."
6. Ends with a practical next step (e.g., if not started: "Your next step: Get your clothes ready for the morning.").

Do not use markdown. Just speak directly to them.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error('API_ERROR');
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Failed to generate daily guidance:', error);
    return `Rise, ${appData.profile?.name || 'Warrior'}. Today is another vote for the person you are becoming. Execute the basics with discipline.`;
  }
}

export async function generateExerciseFormGuide(exerciseName: string, profile?: UserProfile): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return "1. Focus on your breathing.\n2. Keep your core tight and engaged.\n3. Move with intention, not speed."; // Fallback
  }

  try {
    const authorsPrompt = profile?.favoriteAuthors ? `Draw inspiration and tone from their favorite authors: ${profile.favoriteAuthors}. ` : '';
    
    const systemContent = `You are an elite, highly disciplined physical trainer and coach. ${authorsPrompt}
The user is currently in the middle of a workout and needs to know how to perform the following exercise: "${exerciseName}".

YOUR TASK:
Provide a brutally clear, punchy, 3-step guide on how to perform this exercise with perfect form. 
Keep it incredibly concise. No fluff. Just the mechanics of the movement and a quick motivational cue.
Format your response as exactly 3 numbered bullet points. 
Do not use markdown formatting like bolding or italics, just pure text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // or gpt-3.5-turbo
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: `How do I perform a ${exerciseName}?` }
        ],
        temperature: 0.5
      })
    });

    if (!response.ok) {
      throw new Error('API_ERROR');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Failed to generate form guide:', error);
    return "1. Focus on your breathing.\n2. Keep your core tight and engaged.\n3. Move with intention, not speed."; // Fallback
  }
}
