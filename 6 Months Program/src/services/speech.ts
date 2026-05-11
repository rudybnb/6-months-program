/**
 * A simple wrapper for the Web Speech API's SpeechSynthesis.
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    
    const setVoice = () => {
      const voices = this.synth!.getVoices();
      // Try to find a premium/natural sounding male voice for the "coaching" feel
      // or just a clear English voice.
      this.voice = voices.find(v => 
        (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')) && 
        v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en')) || null;
    };

    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = setVoice;
    }
    setVoice();
  }

  speak(text: string, onEnd?: () => void) {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    utterance.rate = 0.95; // Slightly slower for better gravity
    utterance.pitch = 0.95; // Slightly deeper
    
    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  get isSpeaking() {
    return this.synth?.speaking || false;
  }
}

export const speechService = new SpeechService();
