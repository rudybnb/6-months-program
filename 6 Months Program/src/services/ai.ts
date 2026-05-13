import type { UserProfile, AppData } from '../types';

export interface AIResponse {
  title: string;
  paragraphs: [string, string];
  quote: {
    text: string;
    author: string;
  };
}

const STRICT_CONTENT_POLICY = `
STRICT CONTENT & QUOTE POLICY:
1. PURPOSE: Emotional support, gentle accountability, reflective guidance, calm motivation.
2. ORIGINALITY: Generate MOSTLY ORIGINAL CONTENT. Use themes and principles rather than reproducing texts.
3. QUOTE LIMITS: 
   - Max ONE short quote OR ONE short scripture per response.
   - Length: Under 1-2 sentences.
   - Quotes must support the message, not replace it.
4. CONTENT RESTRICTIONS:
   - NEVER generate long copyrighted passages, pages, or chapters.
   - NEVER heavily imitate an author's exact writing style.
   - NEVER overload with multiple quotes.
5. GUIDANCE SOURCES: If referencing sources (Bible, James Clear, etc.), reference themes and principles. Provide original reflections inspired by them.
6. TONE: Calm, grounded, emotionally intelligent, supportive, wise, human. 
7. AVOID: Manipulative, cult-like, aggressive, superior, or preachy language.
`;

const SYSTEM_PROMPT = `
You are a wise, calm morning mentor. Your goal is to help the user reflect on their current alignment with their desired identity.

${STRICT_CONTENT_POLICY}

RESPONSE STRUCTURE (Every response MUST follow this exact 5-step flow):
1. ACKNOWLEDGEMENT: Recognize what the user shared calmly and honestly.
2. REFLECTION: Briefly highlight the pattern or conflict (e.g., wanting structure but choosing distraction).
3. ENCOURAGEMENT: Offer grounded encouragement without exaggeration.
4. OPTIONAL QUOTE OR SCRIPTURE: Include exactly ONE short (1-2 sentence) quote or scripture if relevant.
5. PRACTICAL NEXT STEP: End with one simple, immediate action.

OUTPUT FORMAT:
{
  "title": "A calm, 3-word title",
  "paragraphs": [
    "Step 1 & 2: Acknowledgement and Reflection. Calmly name the pattern without shame.",
    "Step 3 & 5: Encouragement and the Practical Next Step. Offer hope and one simple action."
  ],
  "quote": {
    "text": "The ONE short quote or scripture (optional, max 1-2 sentences).",
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
      ? `The user's favorite guidance sources/authors are: ${profile.favoriteAuthors}. Reference their themes and principles while providing original reflections.` 
      : `Reference themes of purpose and habits (inspired by Myles Munroe and James Clear) with original guidance.`;

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

${STRICT_CONTENT_POLICY}

RESPONSE STRUCTURE (Every response MUST follow this exact 5-step flow):
1. ACKNOWLEDGEMENT: Recognize the user's struggle (e.g., being late) calmly and honestly.
2. REFLECTION: Briefly highlight the pattern or conflict without shame.
3. ENCOURAGEMENT: Offer grounded encouragement.
4. OPTIONAL QUOTE OR SCRIPTURE: Include exactly ONE short (1-2 sentence) quote or scripture.
5. PRACTICAL NEXT STEP: End with one simple, immediate action.

TONE:
- Encouraging, wise, grounded, calm, and hopeful.
- Avoid toxic positivity, long sermons, or guilt manipulation.

WISDOM SOURCES:
If Bible guidance is selected, use scripture naturally and gently. Focus on encouragement, hope, and perseverance. Avoid excessive preaching.

Return ONLY the raw text response. Do not use JSON. Just speak directly to them following the 5-step structure.
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

    const authorsPrompt = profile?.favoriteAuthors ? `The user's favorite guidance sources are: ${profile.favoriteAuthors}. Reference their themes and principles with original reflections.` : 'Use general but powerful guidance principles.';

    const systemContent = `${GATE_PROMPT}

CONTEXT:
- User's Name: ${profile?.name || 'User'}
- User's Core Why: "${profile?.coreWhy || 'Personal Transformation'}"
- Scheduled Wake Time: ${displayTime}
- Authors/Sources: ${authorsPrompt}

YOUR SPECIFIC TASK:
1. Read the user's excuse.
2. Respond following the 5-step structure: Acknowledge -> Reflect -> Encourage -> Optional Quote -> Practical Step.
3. Ensure original guidance dominates. Max one short quote.

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

${STRICT_CONTENT_POLICY}

RESPONSE STRUCTURE (Every response MUST follow this exact 5-step flow):
1. ACKNOWLEDGEMENT: Address the user by name and acknowledge their current state (lateness, streak, or readiness).
2. REFLECTION: Briefly highlight a theme or principle from their guiding voices.
3. ENCOURAGEMENT: Offer grounded encouragement.
4. OPTIONAL QUOTE OR SCRIPTURE: Include exactly ONE short (1-2 sentence) quote or scripture naturally.
5. PRACTICAL NEXT STEP: End with one simple action for the day.

CONTEXT:
- Name: ${appData.profile?.name}
- Their Reason for Change: "${appData.profile?.coreWhy}"
- Guiding Voices: ${appData.profile?.favoriteAuthors}
- Selected Themes: ${appData.profile?.selectedThemes?.join(', ')}
- Current Tone Preference: ${appData.profile?.tonePreference}
- Program Started: ${hasStarted ? 'Yes' : 'No (Starts on ' + start.toLocaleDateString() + ')'}
- Status: ${!hasStarted ? 'User is preparing to start.' : isLate ? 'User woke up late today.' : 'User woke up on time.'}

YOUR TONE INSTRUCTIONS (${appData.profile?.tonePreference}):
- Follow the tone preference while adhering to the STRICT CONTENT POLICY.
- If "faith-based", use scripture naturally and gently.

Do not use markdown. Just speak directly to them following the 5-step structure.`;

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
