// Audio playback utility for Gemini TTS (24kHz PCM) and Web Speech API fallback
import { VoicePersona } from '../types';

let audioCtx: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass({ sampleRate: 24000 });
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Stop any ongoing speech or audio immediately
 */
export function stopCurrentAudio(): void {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
    } catch {}
    currentSourceNode = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Play raw PCM (16-bit little-endian 24kHz) or standard audio base64.
 * Supports adjustable playbackRate for dignified conversational cadence.
 * Resolves when playback has finished.
 */
export function playBase64Audio(
  base64Data: string,
  sampleRate = 24000,
  playbackRate = 1.0
): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      stopCurrentAudio();
      const ctx = getAudioContext();
      const binary = atob(base64Data);
      const len = binary.length;
      
      let audioBuffer: AudioBuffer;

      // Check if it has a RIFF/WAV header
      if (binary.startsWith('RIFF') || binary.startsWith('\x1a\x45\xdf\xa3')) {
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        audioBuffer = await ctx.decodeAudioData(bytes.buffer);
      } else {
        // Otherwise treat as 16-bit PCM little endian at 24kHz
        const pcmData = new Int16Array(Math.floor(len / 2));
        for (let i = 0; i < pcmData.length; i++) {
          const byte1 = binary.charCodeAt(i * 2);
          const byte2 = binary.charCodeAt(i * 2 + 1);
          pcmData[i] = (byte2 << 8) | byte1;
        }

        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0;
        }

        audioBuffer = ctx.createBuffer(1, floatData.length, sampleRate);
        audioBuffer.getChannelData(0).set(floatData);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      // Apply dignified playback rate (e.g. 0.90x for calm respectful pacing)
      source.playbackRate.value = Math.max(0.75, Math.min(1.3, playbackRate));
      source.connect(ctx.destination);
      currentSourceNode = source;

      source.onended = () => {
        if (currentSourceNode === source) {
          currentSourceNode = null;
        }
        resolve();
      };

      source.start(0);
    } catch (err) {
      console.warn('PCM playback error, using speech synthesis fallback:', err);
      resolve();
    }
  });
}

/**
 * Speak text out loud using browser Web Speech API.
 * Supports Kwame (Direct, firm operations stockkeeper) and Isaac (Articulate, precise cold store manager/auditor).
 * Resolves when speech has ended.
 */
export function speakWithBrowser(
  text: string,
  _lang = 'en-GH',
  persona: VoicePersona = 'kwame',
  pacing: 'dignified' | 'natural' | 'swift' = 'natural'
): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // cancel any previous utterance

      // Keep it straight and concise
      const formattedText = text.trim();

      const utterance = new SpeechSynthesisUtterance(formattedText);
      const voices = window.speechSynthesis.getVoices();
      
      const isKwame = persona === 'kwame' || persona === 'gameli' || persona === 'kofi';

      if (isKwame) {
        // Kwame: Direct, authoritative Ghanaian male lead operations stockkeeper
        let targetRate = 1.05;
        if (pacing === 'swift') targetRate = 1.15;
        else if (pacing === 'dignified') targetRate = 0.98;

        const maleVoice = voices.find(v => 
          (v.name.toLowerCase().includes('male') ||
           v.name.toLowerCase().includes('george') ||
           v.name.toLowerCase().includes('david') ||
           v.name.toLowerCase().includes('arthur') ||
           v.name.toLowerCase().includes('daniel') ||
           v.name.toLowerCase().includes('oliver')) &&
          (v.lang.startsWith('en'))
        ) || voices.find(v => v.lang.includes('GH') || v.lang.includes('NG') || v.lang.includes('GB') || v.lang.startsWith('en'));

        if (maleVoice) utterance.voice = maleVoice;
        utterance.pitch = 0.92; // Deep, solid, firm operations stockkeeper tone
        utterance.rate = targetRate;
      } else {
        // Isaac: Articulate, executive, prompt manager/auditor voice
        let targetRate = 1.12;
        if (pacing === 'swift') targetRate = 1.25;
        else if (pacing === 'dignified') targetRate = 1.0;

        const managerVoice = voices.find(v => 
          (v.name.toLowerCase().includes('charon') ||
           v.name.toLowerCase().includes('daniel') ||
           v.name.toLowerCase().includes('alex') ||
           v.name.toLowerCase().includes('guy') ||
           v.name.toLowerCase().includes('male')) &&
          (v.lang.startsWith('en'))
        ) || voices.find(v => v.lang.includes('GH') || v.lang.includes('NG') || v.lang.includes('GB') || v.lang.startsWith('en'));

        if (managerVoice) utterance.voice = managerVoice;
        utterance.pitch = 1.05; // Crisp, clear, executive clarity
        utterance.rate = targetRate;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Browser speech synthesis error:', e);
      resolve();
    }
  });
}


