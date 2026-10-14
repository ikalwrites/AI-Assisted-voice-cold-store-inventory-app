// Web Speech Recognition and MediaRecorder helper with 3-Second Silence Detection
// for Royal Atlantic Cold Store Voice Stockkeeper
import { stopCurrentAudio } from './audioPlayer';

export interface SpeechRecognitionListener {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onSilenceDetected?: (transcript: string) => void;
  onSilenceCountdown?: (secondsRemaining: number) => void;
  onVolumeChange?: (volumePercent: number) => void;
  onInactiveCountdown?: (secondsRemaining: number) => void;
  onTenSecondsSilenceTimeout?: () => void;
}

export class VoiceRecorderManager {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private stream: MediaStream | null = null;

  // Audio analysis for real-time Voice Activity Detection (VAD)
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  // High-precision timers:
  // - 10-second timeout if boss remains silent / does not speak
  // - 3-second silence detector after boss speaks
  private timerInterval: any = null;
  private recordingStartTimestamp = 0;
  private lastSpeechTimestamp = 0;
  private hasDetectedSpeech = false;
  private currentTranscript = '';
  private currentListener: SpeechRecognitionListener | null = null;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US'; // English voice
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  /**
   * Starts the supervisor check loop that handles:
   * 1. 10-second total silence timeout if boss remains silent or doesn't speak
   * 2. 3-second silence auto-response after speech
   */
  private startTimerLoop() {
    this.clearTimers();
    this.recordingStartTimestamp = Date.now();
    this.hasDetectedSpeech = false;
    this.currentListener?.onInactiveCountdown?.(10);

    this.timerInterval = setInterval(() => {
      if (!this.isRecording) {
        this.clearTimers();
        return;
      }

      const now = Date.now();

      // Case A: Boss has NOT spoken anything yet since tapping microphone
      if (!this.hasDetectedSpeech) {
        const elapsedSinceStart = now - this.recordingStartTimestamp;
        const remainingMs = Math.max(0, 10000 - elapsedSinceStart);
        const remainingSec = Math.ceil(remainingMs / 1000);

        this.currentListener?.onInactiveCountdown?.(remainingSec);

        // After 10 continuous seconds of silence: assistant must go quiet
        if (elapsedSinceStart >= 10000) {
          console.log('10 seconds of silence from the boss without speech. Auto-quiet standby.');
          this.clearTimers();
          this.stopSpeechRecognition();
          this.stopAudioRecording().catch(() => {});
          if (this.currentListener?.onTenSecondsSilenceTimeout) {
            this.currentListener.onTenSecondsSilenceTimeout();
          }
        }
        return;
      }

      // Case B: Boss has spoken: run high-precision 3-second silence detection
      const elapsedSinceSpeech = now - this.lastSpeechTimestamp;
      const silenceMs = Math.max(0, 3000 - elapsedSinceSpeech);
      const silenceSec = Math.ceil(silenceMs / 1000);

      this.currentListener?.onSilenceCountdown?.(silenceSec);

      // Exactly 3 seconds of unbroken silence after boss finished speaking
      if (elapsedSinceSpeech >= 3000) {
        const finalSpoken = this.currentTranscript.trim();
        console.log('3-Second silence detected! Triggering auto-response for:', finalSpoken);
        this.clearTimers();
        if (this.currentListener?.onSilenceDetected) {
          this.currentListener.onSilenceDetected(finalSpoken);
        }
      }
    }, 100);
  }

  /**
   * Called whenever user speaks words or voice energy is detected.
   * Immediately stops assistant speech and activates the 3-second silence countdown.
   */
  public reportVoiceActivity(text?: string) {
    // Cut off any assistant speech immediately: boss is talking
    stopCurrentAudio();

    if (text) {
      this.currentTranscript = text;
    }
    this.hasDetectedSpeech = true;
    this.lastSpeechTimestamp = Date.now();
  }

  private clearTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.hasDetectedSpeech = false;
    this.lastSpeechTimestamp = 0;
    this.currentListener?.onSilenceCountdown?.(3);
    this.currentListener?.onInactiveCountdown?.(10);
  }

  public startSpeechRecognition(listener: SpeechRecognitionListener, lang = 'en-US') {
    this.currentListener = listener;
    this.currentTranscript = '';
    this.startTimerLoop();

    if (!this.recognition) {
      listener.onError('Speech recognition not supported in this browser');
      return;
    }

    this.recognition.lang = lang;

    // Immediately cut off any assistant audio when user voice or speech begins
    this.recognition.onaudiostart = () => {
      stopCurrentAudio();
    };

    this.recognition.onspeechstart = () => {
      stopCurrentAudio();
    };

    this.recognition.onresult = (event: any) => {
      stopCurrentAudio();
      let accumulatedFinal = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          accumulatedFinal += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullText = (accumulatedFinal + interimTranscript).trim();
      if (fullText) {
        this.currentTranscript = fullText;
        this.reportVoiceActivity(fullText);
      }

      listener.onResult(fullText, !!accumulatedFinal);
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition event:', event.error);
      if (event.error !== 'no-speech') {
        listener.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      listener.onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Recognition start caught:', err);
    }
  }

  public stopSpeechRecognition() {
    this.clearTimers();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }

  // Audio capture with MediaRecorder and Web Audio API VAD (Voice Activity Detection)
  public async startAudioRecording(listener?: SpeechRecognitionListener): Promise<boolean> {
    if (listener) {
      this.currentListener = listener;
    }
    this.startTimerLoop();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Set up Web Audio AnalyserNode for volume monitoring & hardware-level silence detection
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
          const source = this.audioContext.createMediaStreamSource(this.stream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 512;
          this.analyser.smoothingTimeConstant = 0.2;
          source.connect(this.analyser);

          const bufferLength = this.analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkAudioLevel = () => {
            if (!this.isRecording || !this.analyser) return;

            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const volumePercent = Math.min(100, Math.round((average / 128) * 100));

            if (this.currentListener?.onVolumeChange) {
              this.currentListener.onVolumeChange(volumePercent);
            }

            // Audio threshold for genuine human speech (avoid background noise triggers)
            if (volumePercent > 20) {
              stopCurrentAudio();
              this.reportVoiceActivity();
            }

            this.animFrameId = requestAnimationFrame(checkAudioLevel);
          };

          this.animFrameId = requestAnimationFrame(checkAudioLevel);
        }
      } catch (audioErr) {
        console.warn('AudioContext analyzer setup note:', audioErr);
      }

      this.mediaRecorder.start(250);
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      return false;
    }
  }

  public async stopAudioRecording(): Promise<{ blob: Blob; base64: string; mimeType: string } | null> {
    this.clearTimers();

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (_e) {
        // ignore
      }
      this.audioContext = null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });

        // Stop all audio tracks from stream
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.isRecording = false;

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1] || '';
          resolve({ blob, base64: base64Data, mimeType });
        };
        reader.readAsDataURL(blob);
      };

      try {
        this.mediaRecorder.stop();
      } catch (_e) {
        this.isRecording = false;
        resolve(null);
      }
    });
  }
}
