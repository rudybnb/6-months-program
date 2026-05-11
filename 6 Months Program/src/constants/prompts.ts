export interface DeepPrompt {
  question: string;
  subtitle: string;
  placeholder: string;
}

export const DEEP_REFLECTION_PROMPTS: DeepPrompt[] = [
  {
    question: "What narrative am I carrying right now?",
    subtitle: "Sometimes a story plays on repeat in our minds — a doubt, a hesitation, or an old habit. What is yours today?",
    placeholder: "Write the narrative as it feels right now — the thoughts that are circling..."
  },
  {
    question: "What needs my attention today?",
    subtitle: "Is there something you've been putting off? Let’s look at why it feels heavy, and how we can make it lighter.",
    placeholder: "Be gentle with yourself. What are you avoiding, and what would it feel like to resolve it?"
  },
  {
    question: "Am I moving with intention or reaction?",
    subtitle: "In the quiet of this morning, notice if you are following your chosen path or responding to a passing feeling.",
    placeholder: "Describe the inner tug-of-war. Where is your intention meeting a moment of resistance?"
  },
  {
    question: "What gentle truth am I ready to face?",
    subtitle: "Real growth happens when we stop negotiating with ourselves. What is one thing you know needs to change?",
    placeholder: "Name the truth. Not with guilt, but with the intent to grow."
  },
  {
    question: "If I continue this path for 100 days, who do I become?",
    subtitle: "Our daily choices are small votes for the person we are building. Where is your current momentum taking you?",
    placeholder: "Does today's direction feel like it leads toward the version of yourself you trust most?"
  },
  {
    question: "What weight can I set down today?",
    subtitle: "We often carry mental weights — fears, regrets, or expectations. What is one thing you don't need to carry today?",
    placeholder: "Describe the weight. Acknowledge its presence. Then, give yourself permission to let it go."
  },
  {
    question: "What would the most peaceful version of me do right now?",
    subtitle: "Step into the mindset of the person you are becoming — the one who is already grounded and disciplined.",
    placeholder: "If you were already that person, what would your next small, purposeful step be?"
  },
  {
    question: "Which part of my old self am I ready to outgrow?",
    subtitle: "We often hold onto old habits because they are familiar. What are you ready to leave behind to make room for growth?",
    placeholder: "I am ready to outgrow the version of me that... I am making space for..."
  },
  {
    question: "Who am I seeking approval from today?",
    subtitle: "Sometimes we work for an audience that isn't even there. Who are you really trying to prove something to?",
    placeholder: "Be honest with yourself. Whose validation are you still holding onto?"
  },
  {
    question: "If the journey was the only reward, would I still be here?",
    subtitle: "This helps us see if we value the process of growth itself, or if we are only focused on the finish line.",
    placeholder: "Does the act of building yourself feel meaningful today, regardless of the end result?"
  },
  {
    question: "What truth am I most ready to bring into the light?",
    subtitle: "The things we hide often lose their power once we acknowledge them. What is one thing you're ready to be honest about?",
    placeholder: "The truth I am acknowledging today is..."
  },
  {
    question: "Where am I out of alignment?",
    subtitle: "Sometimes our actions don't quite match who we want to be. This isn't about shame — it's about finding your way back.",
    placeholder: "I want to be X, but today I am doing Y. I am out of alignment because..."
  }
];

export const getDailyPrompt = (dateStr: string): DeepPrompt => {
  // Use the date string to create a stable index
  const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEEP_REFLECTION_PROMPTS[hash % DEEP_REFLECTION_PROMPTS.length];
};
