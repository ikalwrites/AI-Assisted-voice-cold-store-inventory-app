import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  HelpCircle,
  Radio,
  UserCheck,
  StopCircle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { LanguageMode } from '../locales/translations';
import { VoiceProcessResult, InventoryStats, ConversationTurn, VoicePersona, PendingDialogueContext } from '../types';
import { VoiceRecorderManager } from '../utils/speechRecorder';
import { playBase64Audio, speakWithBrowser, stopCurrentAudio } from '../utils/audioPlayer';

const ISAAC_AVATAR = '/src/assets/images/seller_jacob_avatar_1788596698402.jpg';
const KWAME_AVATAR = '/src/assets/images/kofi_human_avatar_1788535194928.jpg';

interface VoiceStockkeeperProps {
  lang: LanguageMode;
  stats: InventoryStats;
  voiceAudioEnabled: boolean;
  onVoiceResultApplied: (result: VoiceProcessResult) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const ADMIN_TITLE_PRESETS = [
  'Mama Gloria',
  'Boss Isaac',
  'Director Gloria',
  'Executive Isaac',
];

const DIRECT_ACTIONS = [
  { label: '👋 Say "Hello"', text: 'Hello' },
  { label: '🐟 Multi-Sale: 10 Tilapia & 5 Red Fish', text: 'Sold 10 cartons of Tilapia to Sister Akua for cash, and 5 cartons of Red Fish on momo' },
  { label: '📦 Multi-Action: Sell & Restock', text: 'Sold 8 cartons of Chicken Wings for cash, and restock 20 cartons of Turkey Wings from Pioneer Food' },
  { label: '🍗 Triple Sale: 15 Wings, 10 Tilapia, 5 Beef', text: 'Sold 15 cartons of Chicken Wings, 10 cartons of Tilapia, and 5 cartons of Boneless Beef' },
  { label: '❄️ Query & Sale: Check Tilapia & Sell Mackerel', text: 'Check stock of Tilapia and record sale of 10 cartons of Titus Mackerel' },
];

export const VoiceStockkeeper: React.FC<VoiceStockkeeperProps> = ({
  stats,
  voiceAudioEnabled,
  onVoiceResultApplied,
  isProcessing,
  setIsProcessing,
}) => {
  const [adminName, setAdminName] = useState('Mama Gloria');
  const [isEditingAdminName, setIsEditingAdminName] = useState(false);
  const [adminNameInput, setAdminNameInput] = useState('Mama Gloria');

  // Realistic Voice Personas: 'kwame' (Lead Operations Stockkeeper) or 'isaac' (Cold Room Systems Engineer)
  const [voicePersona, setVoicePersona] = useState<VoicePersona>('kwame');

  // Active dialogue context from storekeeper
  const [pendingContext, setPendingContext] = useState<PendingDialogueContext | null>(null);

  const [transcriptInput, setTranscriptInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Default to false: assistant stays quiet until called after an instruction
  const [autoListenEnabled, setAutoListenEnabled] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Activation Gate: Agent only acts when microphone is tapped and hears "Hello"
  const [isActivated, setIsActivated] = useState<boolean>(false);
  // 10-Second Silence & Inactivity Countdown
  const [inactiveCountdown, setInactiveCountdown] = useState<number | null>(null);
  // Reason / Status for Quiet Standby
  const [agentQuietStatus, setAgentQuietStatus] = useState<
    'quiet_standby' | 'listening_hello' | 'listening_instruction' | 'auto_quiet_10s' | 'instruction_completed'
  >('quiet_standby');

  // 3-Second Silence Detection States
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [audioLevelPercent, setAudioLevelPercent] = useState<number>(0);

  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isGreetingLoading, setIsGreetingLoading] = useState(false);

  const recorderManagerRef = useRef<VoiceRecorderManager | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const postActionQuietTimerRef = useRef<any>(null);

  useEffect(() => {
    recorderManagerRef.current = new VoiceRecorderManager();
  }, []);

  // Auto-scroll conversation to bottom inside its dedicated pane
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isProcessing, isSpeaking]);

  // Initialize in complete Quiet Standby: NO unsolicited spoken audio on mount
  useEffect(() => {
    const isIsaac = voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua';
    const initialTurn: ConversationTurn = {
      id: `standby-init-${Date.now()}`,
      speaker: 'yami',
      voicePersona,
      textEn: isIsaac
        ? `Isaac is in Quiet Standby for Paradise Fisheries. Tap microphone and say "Hello" to activate me.`
        : `Kwame is in Quiet Standby for Paradise Fisheries. Tap microphone and say "Hello" to activate me.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: 'GREETING',
      suggestedReplies: [
        '👋 Say "Hello"',
        '💰 "Hello, sold 10 cartons Tilapia"',
        '🚚 "Hello, received 25 Titus Mackerel"',
        '📦 "Hello, check Chicken Thighs"',
      ],
      isGreeting: true,
    };
    setConversation([initialTurn]);
  }, []);

  const handleSwitchPersona = (newPersona: VoicePersona) => {
    setVoicePersona(newPersona);
    stopCurrentAudio();
    setIsSpeaking(false);
    const isIsaac = newPersona === 'isaac' || newPersona === 'gdzigbodi' || newPersona === 'akosua';
    const switchTurn: ConversationTurn = {
      id: `switch-${Date.now()}`,
      speaker: 'yami',
      voicePersona: newPersona,
      textEn: isIsaac
        ? `Switched to Isaac (Cold Fleet Dispatcher). Tap microphone and say "Hello" to activate.`
        : `Switched to Kwame (Lead Stockkeeper). Tap microphone and say "Hello" to activate.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: 'GENERAL_TALK',
      suggestedReplies: [
        '👋 Say "Hello"',
        '💰 "Hello, sold 10 cartons Tilapia"',
        '📦 "Hello, check stock"',
      ],
    };
    setConversation((prev) => [...prev, switchTurn]);
  };

  // Audio Playback helper
  const playSpokenAudio = async (
    textToSpeak: string,
    base64Audio?: string | null,
    targetPersona: VoicePersona = voicePersona
  ) => {
    // If the user is currently speaking or recording, NEVER talk over the user!
    if (isRecording || (recorderManagerRef.current && recorderManagerRef.current.isCurrentlyRecording())) {
      console.log('User is currently speaking or recording; assistant speech suppressed.');
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      if (base64Audio) {
        await playBase64Audio(base64Audio, 24000);
      } else {
        await speakWithBrowser(textToSpeak, 'en-US', targetPersona);
      }
    } catch (e) {
      console.warn('Speech playback note:', e);
      await speakWithBrowser(textToSpeak, 'en-US', targetPersona);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Start microphone with 10s Inactivity & 3s Silence Detection
  const startMicrophoneRecording = async () => {
    if (postActionQuietTimerRef.current) {
      clearTimeout(postActionQuietTimerRef.current);
      postActionQuietTimerRef.current = null;
    }
    setRecordingError(null);
    setSilenceCountdown(null);
    setInactiveCountdown(10);
    setAudioLevelPercent(0);
    setAgentQuietStatus(isActivated ? 'listening_instruction' : 'listening_hello');

    // Boss began speaking or called mic: immediately kill assistant speech
    stopCurrentAudio();
    setIsSpeaking(false);
    setIsRecording(true);
    latestTranscriptRef.current = '';

    const listener = {
      onResult: (text: string) => {
        // User speech detected: ensure assistant is completely silenced
        stopCurrentAudio();
        setIsSpeaking(false);
        latestTranscriptRef.current = text;
        setTranscriptInput(text);
        recorderManagerRef.current?.reportVoiceActivity(text);
      },
      onError: (err: string) => {
        console.warn('Recognition warning:', err);
      },
      onEnd: () => {},
      onSilenceCountdown: (remainingSec: number) => {
        setSilenceCountdown(remainingSec);
      },
      onInactiveCountdown: (remainingSec: number) => {
        setInactiveCountdown(remainingSec);
      },
      onTenSecondsSilenceTimeout: () => {
        // Requirement: "after 10 seconds if the boss does not turn on the microphone or remain silent the ai agent should be quite"
        console.log('10s silence timeout reached: turning off microphone and entering quiet standby.');
        stopMicrophoneRecording(undefined, true);
      },
      onSilenceDetected: (transcriptFromRecorder?: string) => {
        // Requirement: "The ai agent should respond after 3 seconds of silence from the boss"
        const finalText = (transcriptFromRecorder || latestTranscriptRef.current || transcriptInput).trim();
        console.log('3-Second silence detected! Triggering auto-response for:', finalText);
        stopMicrophoneRecording(finalText);
      },
      onVolumeChange: (vol: number) => {
        setAudioLevelPercent(vol);
        if (vol > 20) {
          stopCurrentAudio();
          setIsSpeaking(false);
        }
      },
    };

    const audioStarted = await recorderManagerRef.current?.startAudioRecording(listener);

    if (recorderManagerRef.current?.isSpeechRecognitionSupported()) {
      recorderManagerRef.current.startSpeechRecognition(listener, 'en-US');
    }

    if (!audioStarted && !recorderManagerRef.current?.isSpeechRecognitionSupported()) {
      setRecordingError('Microphone permission not granted or not supported.');
      setIsRecording(false);
      setInactiveCountdown(null);
    }
  };

  // Stop microphone and trigger processing or quiet mode
  const stopMicrophoneRecording = async (forcedTranscript?: string, isTenSecondTimeout = false) => {
    setIsRecording(false);
    setSilenceCountdown(null);
    setInactiveCountdown(null);
    setAudioLevelPercent(0);

    recorderManagerRef.current?.stopSpeechRecognition();
    recorderManagerRef.current?.stopAudioRecording().catch(() => {});

    if (isTenSecondTimeout) {
      setAgentQuietStatus('auto_quiet_10s');
      // Boss remained silent for 10 seconds: agent is quiet
      return;
    }

    const spokenText = (forcedTranscript || latestTranscriptRef.current || transcriptInput).trim();
    latestTranscriptRef.current = '';

    if (spokenText) {
      handleBossVoiceInput(spokenText);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopMicrophoneRecording();
      setAgentQuietStatus('quiet_standby');
    } else {
      startMicrophoneRecording();
    }
  };

  // Schedule 10-second inactivity quiet window
  const scheduleTenSecondQuietTimeout = () => {
    if (postActionQuietTimerRef.current) {
      clearTimeout(postActionQuietTimerRef.current);
    }
    postActionQuietTimerRef.current = setTimeout(() => {
      setAgentQuietStatus('quiet_standby');
      console.log('10s silence elapsed: assistant remains strictly quiet.');
    }, 10000);
  };

  // Main Handler enforcing "Hello" activation and 3-second auto-response
  const handleBossVoiceInput = async (spokenText: string) => {
    const textToSend = spokenText.trim();
    if (!textToSend) return;

    // Check for "Hello" (case-insensitive)
    const hasHelloKeyword = /\b(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening)\b/i.test(textToSend);

    // RULE: "it should only act when microphone is tap and hears 'Hello'"
    if (!isActivated && !hasHelloKeyword) {
      const adminTurn: ConversationTurn = {
        id: `admin-${Date.now()}`,
        speaker: 'admin',
        textEn: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const reminderText = `${adminName}, please say "Hello" first to activate me. I will only act when I hear "Hello".`;
      const guardTurn: ConversationTurn = {
        id: `guard-${Date.now()}`,
        speaker: 'yami',
        voicePersona,
        textEn: reminderText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: 'GREETING',
        suggestedReplies: [
          '👋 Say "Hello"',
          '💰 "Hello, record 10 cartons Tilapia"',
          '🚚 "Hello, received 25 Titus Mackerel"',
        ],
      };

      setConversation((prev) => [...prev, adminTurn, guardTurn]);
      setTranscriptInput('');
      setAgentQuietStatus('quiet_standby');

      if (voiceAudioEnabled) {
        await playSpokenAudio(reminderText, null, voicePersona);
      }

      scheduleTenSecondQuietTimeout();
      return;
    }

    // Agent is now activated!
    setIsActivated(true);

    // Is it a standalone greeting? e.g. "Hello", "Hello Isaac", "Hello Kwame", "Hi Boss Isaac", "Hi Mama Gloria"
    const isPureGreeting = /^(hello|hi|hey|good\s+(morning|afternoon|evening))\s*(boss|kwame|isaac|supervisor|manager|stockkeeper|gloria|paradise)?\s*[.!?]?$/i.test(textToSend);

    if (isPureGreeting) {
      const adminTurn: ConversationTurn = {
        id: `admin-${Date.now()}`,
        speaker: 'admin',
        textEn: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const isIsaac = voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua';
      const greetingResponse = isIsaac
        ? `Hello ${adminName}! Isaac is active and ready for your instruction.`
        : `Hello ${adminName}! Kwame is active and ready for your instruction.`;

      const responseTurn: ConversationTurn = {
        id: `yami-${Date.now()}`,
        speaker: 'yami',
        voicePersona,
        textEn: greetingResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: 'GREETING',
        suggestedReplies: [
          '💰 Sold 10 cartons of Tilapia Big Cut',
          '🚚 Received 25 cartons of Titus Mackerel',
          '📦 What is the stock of Chicken Thighs?',
          '❄️ Check Freezer Bay temperatures',
        ],
      };

      setConversation((prev) => [...prev, adminTurn, responseTurn]);
      setTranscriptInput('');
      setAgentQuietStatus('listening_instruction');

      if (voiceAudioEnabled) {
        await playSpokenAudio(greetingResponse, null, voicePersona);
      }

      // Automatically open mic for 10 seconds to listen for the instruction
      startMicrophoneRecording();
      return;
    }

    // User spoke an instruction with "Hello" or while already activated
    await executeVoiceInstruction(textToSend);
  };

  // Process voice/text command with backend
  const executeVoiceInstruction = async (text: string, audioBase64?: string, mimeType?: string) => {
    const textToSend = text.trim();
    if (!textToSend && !audioBase64) return;

    const adminTurn: ConversationTurn = {
      id: `admin-${Date.now()}`,
      speaker: 'admin',
      textEn: textToSend || 'Spoken instruction',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversation((prev) => [...prev, adminTurn]);
    setTranscriptInput('');
    setIsProcessing(true);
    setRecordingError(null);
    stopCurrentAudio();

    try {
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToSend,
          audioBase64,
          mimeType,
          preferredLanguage: 'en',
          adminName,
          voicePersona,
          pendingContext,
          conversationHistory: conversation.map((c) => ({
            speaker: c.speaker,
            text: c.textEn,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: VoiceProcessResult = await res.json();

      if (data.pendingContext) {
        setPendingContext(data.pendingContext);
      } else {
        setPendingContext(null);
      }

      if (data.itemsAffected && data.itemsAffected.length > 0) {
        onVoiceResultApplied(data);
      }

      const activeTurnPersona = data.voicePersona || voicePersona;
      const yamiTurn: ConversationTurn = {
        id: `yami-${Date.now()}`,
        speaker: 'yami',
        voicePersona: activeTurnPersona,
        textEn: data.replyTextEn,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        pendingContext: data.pendingContext,
        followUpQuestion: data.followUpQuestionEn,
        suggestedReplies: data.suggestedQuickReplies || [],
        audioBase64: data.audioBase64,
        itemsAffected: data.itemsAffected,
        summaryGHS: data.summaryGHS,
      };

      setConversation((prev) => [...prev, yamiTurn]);

      if (voiceAudioEnabled) {
        // Speak ONLY the direct instruction execution confirmation out loud
        await playSpokenAudio(data.replyTextEn, data.audioBase64, activeTurnPersona);
        setIsSpeaking(false);
      }

      // After instruction, assistant stays quiet until called or tapped
      setAgentQuietStatus('instruction_completed');
      scheduleTenSecondQuietTimeout();
    } catch (err: any) {
      console.warn('Voice command error:', err);
      setRecordingError('Command processed with local fallback. Speak or type next instruction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectQuickReply = (reply: string) => {
    stopCurrentAudio();
    if (reply === '👋 Say "Hello"' || reply === '👋 Tap Mic & Say "Hello"') {
      handleBossVoiceInput('Hello');
    } else {
      handleBossVoiceInput(reply);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Compact Non-Scrolling Header Bar */}
      <div className="bg-white rounded-2xl p-3 border border-[#E8E2D3] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Persona Switcher with Real Human Avatars & Direct Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl p-0.5 bg-[#F1EDE2] border border-[#E8E2D3]">
            <button
              id="persona-tab-kwame"
              onClick={() => handleSwitchPersona('kwame')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                voicePersona === 'kwame' || voicePersona === 'gameli' || voicePersona === 'kofi'
                  ? 'bg-[#1E3A1E] text-white shadow-xs'
                  : 'text-[#5D544F] hover:text-[#1E3A1E]'
              }`}
            >
              <img
                src={KWAME_AVATAR}
                alt="Kwame Portrait"
                className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
              />
              <span>Kwame (Lead Stockkeeper)</span>
            </button>

            <button
              id="persona-tab-isaac"
              onClick={() => handleSwitchPersona('isaac')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua'
                  ? 'bg-[#C2410C] text-white shadow-xs'
                  : 'text-[#5D544F] hover:text-[#1E3A1E]'
              }`}
            >
              <img
                src={ISAAC_AVATAR}
                alt="Isaac Portrait"
                className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
              />
              <span>Isaac (Cold Fleet Dispatcher)</span>
            </button>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[11px] font-semibold text-[#5D544F]">
            <Zap className="w-3 h-3 text-[#C2410C]" />
            <span>Direct & Factual • 3s Silence Sensor</span>
          </span>
        </div>

        {/* Center: Live Store Metrics */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <div className="px-2.5 py-0.5 rounded-lg bg-[#FCF9F1] border border-[#E8E2D3] font-medium text-[#5D544F]">
            Today's Sales: <strong className="text-[#C2410C] font-bold">GH₵ {stats.todaySalesGHS.toLocaleString()}</strong>
          </div>
          <div className="px-2.5 py-0.5 rounded-lg bg-[#FCF9F1] border border-[#E8E2D3] font-medium text-[#5D544F]">
            In Stock: <strong className="text-[#1E3A1E] font-bold">{stats.totalCartonsInStock} cartons</strong>
          </div>
          <div className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>3s Silence Sensor</span>
          </div>
        </div>

        {/* Right: Addressing Pill & Re-speak */}
        <div className="flex items-center gap-2">
          <div className="text-xs flex items-center gap-1 bg-[#F8F5EE] px-2 py-1 rounded-lg border border-[#E8E2D3]">
            <span className="text-[#5D544F] text-[11px]">Boss:</span>
            {isEditingAdminName ? (
              <span className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={adminNameInput}
                  onChange={(e) => setAdminNameInput(e.target.value)}
                  className="w-20 px-1 text-xs rounded border border-[#1E3A1E] focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (adminNameInput.trim()) {
                      setAdminName(adminNameInput.trim());
                      setIsEditingAdminName(false);
                    }
                  }}
                  className="px-1.5 py-0.5 rounded bg-[#1E3A1E] text-white text-[10px] font-bold"
                >
                  OK
                </button>
              </span>
            ) : (
              <button
                onClick={() => setIsEditingAdminName(true)}
                className="font-bold text-[#1E3A1E] hover:underline"
              >
                {adminName} ✎
              </button>
            )}
          </div>

          <button
            id="voice-start-greeting-btn"
            onClick={() => handleBossVoiceInput('Hello')}
            disabled={isGreetingLoading || isProcessing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFD700] text-[#1E3A1E] hover:bg-[#ffe033] transition-all"
            title="Say 'Hello' to activate"
          >
            <Radio className="w-3.5 h-3.5 text-[#C2410C]" />
            <span className="hidden sm:inline">Say "Hello"</span>
          </button>
        </div>
      </div>

      {/* 2. Self-Contained Non-Scrolling Workspace Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-175px)] min-h-[540px] max-h-[700px]">
        {/* Left Column: Live Dialogue Feed (Scrolls internally) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 border border-[#E8E2D3] shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E8E2D3] shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1E3A1E]" />
              <h3 className="text-xs font-black text-[#1E3A1E] uppercase tracking-wider">
                Store Dialogue • English Only
              </h3>
            </div>

            <label className="text-[11px] font-semibold text-[#5D544F] flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoListenEnabled}
                onChange={(e) => setAutoListenEnabled(e.target.checked)}
                className="rounded border-[#E8E2D3] text-[#1E3A1E] focus:ring-[#1E3A1E] w-3.5 h-3.5"
              />
              <span>{autoListenEnabled ? 'Auto-listen Active' : 'Quiet Mode (Quiet until called)'}</span>
            </label>
          </div>

          {/* Internal Scrollable Conversation Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 py-3">
            {conversation.map((turn) => {
              const isTurnIsaac = turn.voicePersona === 'isaac' || turn.voicePersona === 'gdzigbodi' || turn.voicePersona === 'akosua';
              const turnAvatar = isTurnIsaac ? ISAAC_AVATAR : KWAME_AVATAR;

              return (
                <div
                  key={turn.id}
                  className={`flex flex-col ${turn.speaker === 'admin' ? 'items-end' : 'items-start'}`}
                >
                  {/* Speaker Label */}
                  <div className="flex items-center gap-1.5 text-[10px] text-[#5D544F] mb-1 px-1">
                    {turn.speaker === 'yami' ? (
                      <div className="flex items-center gap-1.5">
                        <img
                          src={turnAvatar}
                          alt={isTurnIsaac ? 'Isaac' : 'Kwame'}
                          className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-[#1E3A1E]"
                        />
                        <span className="font-bold text-[#1E3A1E]">
                          {isTurnIsaac ? 'Isaac (Cold Fleet Dispatcher)' : 'Kwame (Lead Stockkeeper)'}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-[#1E3A1E]">👤 {adminName}</span>
                    )}
                    <span>•</span>
                    <span>{turn.timestamp}</span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[88%] rounded-xl p-3 shadow-2xs text-xs sm:text-sm ${
                      turn.speaker === 'admin'
                        ? 'bg-[#1E3A1E] text-white rounded-tr-none'
                        : 'bg-[#F8F5EE] border border-[#E8E2D3] text-[#2C241F] rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed font-medium">
                      {turn.textEn}
                    </p>

                    {/* Stock Impact summary badges */}
                    {turn.itemsAffected && turn.itemsAffected.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#E8E2D3]/60 space-y-1.5 bg-[#FCF9F1] p-2.5 rounded-xl border border-[#E8E2D3]">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#1E3A1E]">
                          <span className="flex items-center gap-1 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Recorded to Stock & Log Book</span>
                          </span>
                          <span className="font-mono text-[10px] text-gray-500 font-semibold">
                            {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {turn.timestamp}
                          </span>
                        </div>
                        {turn.itemsAffected.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-lg border border-[#E8E2D3] shadow-2xs"
                          >
                            <span className="font-bold text-[#1E3A1E]">{item.itemName}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-black px-1.5 py-0.5 rounded text-[11px] ${
                                  item.action === 'deduct' ? 'bg-amber-100 text-[#C2410C]' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {item.action === 'deduct' ? `-${item.quantity}` : `+${item.quantity}`} {item.unit}
                              </span>
                              <ArrowRight className="w-3 h-3 text-[#5D544F]" />
                              <span className="font-bold text-[#1E3A1E]">Balance: {item.newStock}</span>
                            </div>
                          </div>
                        ))}
                        {turn.summaryGHS && turn.summaryGHS > 0 ? (
                          <div className="flex items-center justify-between pt-1 text-[11px] border-t border-[#E8E2D3]/60">
                            <span className="text-[10px] text-gray-500 font-medium">Logged in Shift Ledger</span>
                            <span className="font-black text-[#C2410C]">
                              Value: GH₵ {turn.summaryGHS.toLocaleString()}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Follow-up question banner */}
                    {turn.followUpQuestion && (
                      <div className="mt-2.5 p-2 rounded-lg bg-white border border-[#FFD700] shadow-2xs">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#C2410C] mb-0.5">
                          <HelpCircle className="w-3.5 h-3.5 text-[#C2410C]" />
                          <span>Question:</span>
                        </div>
                        <p className="text-xs font-bold text-[#1E3A1E]">
                          "{turn.followUpQuestion}"
                        </p>

                        {/* Interactive Quick Reply Chips */}
                        {turn.suggestedReplies && turn.suggestedReplies.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {turn.suggestedReplies.map((reply, rIdx) => (
                              <button
                                key={rIdx}
                                onClick={() => handleSelectQuickReply(reply)}
                                disabled={isProcessing}
                                className="px-2 py-0.5 rounded bg-[#FCF9F1] hover:bg-[#FFD700]/30 border border-[#E8E2D3] text-[11px] font-bold text-[#1E3A1E] hover:border-[#FFD700] transition-all flex items-center gap-1"
                              >
                                <span>{reply}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-[#C2410C] font-bold p-2.5 rounded-lg bg-[#F8F5EE] border border-[#E8E2D3] w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C2410C]" />
                <span>Processing stock entry...</span>
              </div>
            )}

            <div ref={conversationEndRef} />
          </div>

          {/* Bottom Interactive Input Bar */}
          <div className="pt-2 border-t border-[#E8E2D3] shrink-0">
            {pendingContext && pendingContext.questionTextEn && (
              <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between gap-1 mb-1 text-[11px] font-bold text-amber-900">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Next action:</span>
                  </span>
                  <button
                    onClick={() => setPendingContext(null)}
                    className="text-[10px] text-amber-700 hover:text-amber-900 underline"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-xs font-semibold text-amber-950">
                  {pendingContext.questionTextEn}
                </p>

                {pendingContext.suggestedAnswers && pendingContext.suggestedAnswers.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {pendingContext.suggestedAnswers.map((answer, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSelectQuickReply(answer)}
                        disabled={isProcessing}
                        className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-950 transition-all"
                      >
                        <span>{answer}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleBossVoiceInput(transcriptInput);
                  }
                }}
                placeholder={
                  !isActivated
                    ? `Type "Hello" to activate ${voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? 'Isaac' : 'Kwame'}...`
                    : `Instruction for ${voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? 'Isaac' : 'Kwame'} (e.g. Sold 10 Tilapia)...`
                }
                className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#F8F5EE] border border-[#E8E2D3] text-[#2C241F] placeholder-[#5D544F]/60 focus:outline-none focus:ring-2 focus:ring-[#1E3A1E] focus:border-transparent transition-all"
              />

              <button
                id="voice-send-turn-btn"
                onClick={() => handleBossVoiceInput(transcriptInput)}
                disabled={isProcessing || !transcriptInput.trim()}
                className="px-3 py-2 rounded-xl bg-[#1E3A1E] text-white hover:bg-[#162a16] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Send className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Microphone Console & 3s Silence Sensor (Fixed view, no scroll) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 border border-[#E8E2D3] shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            {/* Top Mic Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D3]">
              <div className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-[#C2410C]" />
                <h3 className="text-xs font-black text-[#1E3A1E] uppercase tracking-wider">
                  Mic & 3s Silence Sensor
                </h3>
              </div>

              {isRecording ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C2410C]/10 text-[#C2410C] text-[11px] font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C]"></span>
                  <span>Mic Live</span>
                </div>
              ) : isActivated ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>Activated (Hello)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  <span>Quiet Standby</span>
                </div>
              )}
            </div>

            {/* Active Persona Mini-Card */}
            <div className="mt-2.5 p-2 rounded-xl bg-[#FCF9F1] border border-[#E8E2D3] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? ISAAC_AVATAR : KWAME_AVATAR}
                  alt={voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? 'Isaac' : 'Kwame'}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#1E3A1E]"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#1E3A1E]">
                      {voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? 'Isaac' : 'Kwame'}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase text-white ${
                        voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? 'bg-[#C2410C]' : 'bg-[#1E3A1E]'
                      }`}
                    >
                      {voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? 'Cold Fleet Dispatcher' : 'Lead Stockkeeper'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5D544F]">
                    {isSpeaking
                      ? 'Speaking...'
                      : isRecording
                      ? !isActivated
                        ? 'Waiting for "Hello"...'
                        : 'Listening to instruction...'
                      : !isActivated
                      ? 'Quiet • Tap mic and say "Hello"'
                      : 'Active • Responds after 3s silence'}
                  </p>
                </div>
              </div>

              {isSpeaking && (
                <button
                  onClick={() => {
                    stopCurrentAudio();
                    setIsSpeaking(false);
                  }}
                  className="px-2 py-1 rounded bg-[#C2410C] text-white text-[10px] font-bold flex items-center gap-1 hover:bg-[#a33508]"
                >
                  <StopCircle className="w-3 h-3" />
                  <span>Stop</span>
                </button>
              )}
            </div>

            {/* Center Mic Button & 3-Second Silence Sensor */}
            <div className="py-3 flex flex-col items-center justify-center">
              <button
                id="voice-main-mic-button"
                onClick={handleToggleRecord}
                disabled={isProcessing}
                className={`w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all shadow-md ${
                  isRecording
                    ? 'border-[#C2410C] bg-[#C2410C]/10 ring-6 ring-[#C2410C]/20 scale-105'
                    : !isActivated
                    ? 'border-amber-500 bg-amber-50 hover:scale-105 ring-4 ring-amber-200/50'
                    : 'border-[#1E3A1E] bg-[#F1EDE2] hover:scale-105'
                }`}
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-inner transition-colors ${
                    isRecording ? 'bg-[#C2410C]' : !isActivated ? 'bg-amber-600' : 'bg-[#1E3A1E]'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-9 h-9 text-white animate-pulse" />
                  ) : (
                    <Mic className="w-9 h-9 text-white" />
                  )}
                </div>
              </button>

              <h4 className="text-xs sm:text-sm font-bold text-[#1E3A1E] mt-2 text-center">
                {isRecording
                  ? !isActivated
                    ? `Tap mic & say "Hello" to activate ${voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? 'Isaac' : 'Kwame'}`
                    : `Listening to ${adminName}... (Responds after 3s silence)`
                  : isSpeaking
                  ? `${voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? 'Isaac' : 'Kwame'} speaking... (Tap to stop)`
                  : !isActivated
                  ? `Quiet Mode • Tap mic & say "Hello" to activate`
                  : `Quiet Mode • Tap mic or speak next instruction`}
              </h4>

              {/* Real-Time Live Speech Transcription Box */}
              {isRecording && (
                <div className="mt-2 w-full max-w-sm bg-[#1E3A1E]/5 border border-[#1E3A1E]/15 rounded-xl p-2.5 text-left transition-all">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#1E3A1E] mb-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#C2410C] animate-ping" />
                      <span className="uppercase tracking-wider">Live Transcription</span>
                    </span>
                    <span className="text-[10px] text-[#5D544F]">
                      {latestTranscriptRef.current ? 'Transcribing words...' : 'Listening...'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#1E3A1E] bg-white/90 p-2 rounded-lg border border-[#E8E2D3] min-h-[36px] flex items-center">
                    {latestTranscriptRef.current || transcriptInput || (
                      !isActivated ? 'Say "Hello" to activate AI stockkeeper...' : 'Speak stock instruction (e.g. Sold 10 Tilapia)...'
                    )}
                  </p>
                </div>
              )}

              {/* 3-Second Silence & 10-Second Inactivity Indicators */}
              {isRecording ? (
                <div className="mt-1.5 text-center space-y-1.5 w-full max-w-xs">
                  {/* 3s silence countdown when speech has paused */}
                  {silenceCountdown !== null && silenceCountdown < 3 ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold animate-pulse shadow-xs">
                      <Clock className="w-3 h-3" />
                      <span>3s Silence: Auto-responding in {silenceCountdown}s...</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1E3A1E]/10 text-[#1E3A1E] text-[10px] font-semibold">
                      <Mic className="w-2.5 h-2.5 text-[#C2410C]" />
                      <span>Auto-responds after 3s silence</span>
                    </div>
                  )}

                  {/* 10s silence timeout countdown */}
                  {inactiveCountdown !== null && (
                    <div className="text-[10px] font-bold text-[#5D544F] flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Silence timeout: auto-quiet in <strong>{inactiveCountdown}s</strong> if silent</span>
                    </div>
                  )}

                  {/* Volume meter */}
                  <div className="w-36 bg-gray-200 rounded-full h-1.5 overflow-hidden mx-auto">
                    <div
                      className="bg-[#C2410C] h-full transition-all duration-100"
                      style={{ width: `${Math.min(100, audioLevelPercent * 2)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex flex-col items-center gap-1">
                  {agentQuietStatus === 'auto_quiet_10s' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>10s Silence Timeout • AI is Quiet (Tap Mic & say "Hello")</span>
                    </div>
                  ) : !isActivated ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-300 text-stone-800 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
                      <span>Quiet Standby • Only acts when mic tapped & hears "Hello"</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      <span>Active • Responds after 3s silence • Quiet after instruction</span>
                    </div>
                  )}
                  <p className="text-[11px] text-center text-[#5D544F] max-w-xs">
                    {!isActivated
                      ? 'AI remains strictly quiet. Tap microphone and say "Hello" to activate.'
                      : 'AI will respond after 3 seconds of silence. If silent for 10s, AI stays quiet.'}
                  </p>
                </div>
              )}

              {/* Sound Wave Bars */}
              <div className="flex gap-1 items-center h-6 mt-2">
                <div className={`w-1 bg-[#C2410C] ${isRecording || isSpeaking ? 'h-5 animate-bounce' : 'h-2'} rounded-full transition-all`}></div>
                <div className={`w-1 bg-[#FFD700] ${isRecording || isSpeaking ? 'h-6 animate-pulse' : 'h-4'} rounded-full transition-all`}></div>
                <div className={`w-1 bg-[#1E3A1E] ${isRecording || isSpeaking ? 'h-5 animate-bounce' : 'h-3'} rounded-full transition-all`}></div>
                <div className={`w-1 bg-[#C2410C] ${isRecording || isSpeaking ? 'h-6 animate-pulse' : 'h-4'} rounded-full transition-all`}></div>
                <div className={`w-1 bg-[#FFD700] ${isRecording || isSpeaking ? 'h-4 animate-bounce' : 'h-2'} rounded-full transition-all`}></div>
              </div>

              {recordingError && (
                <div className="mt-2 text-[11px] text-[#C2410C] flex items-center gap-1 bg-[#C2410C]/10 px-2.5 py-1 rounded border border-[#C2410C]/30">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{recordingError}</span>
                </div>
              )}
            </div>

            {/* Fast Action Shortcuts */}
            <div className="mt-1 pt-2 border-t border-[#E8E2D3]">
              <span className="text-[10px] font-black uppercase text-[#1E3A1E] tracking-wider block mb-1">
                Fast Action Shortcuts:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {DIRECT_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleBossVoiceInput(action.text)}
                    disabled={isProcessing}
                    className="text-left px-2 py-1.5 rounded-lg bg-[#F8F5EE] hover:bg-[#F1EDE2] border border-[#E8E2D3] text-[11px] font-bold text-[#1E3A1E] transition-all truncate"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Console Footer */}
          <div className="pt-2 border-t border-[#E8E2D3] flex items-center justify-between text-[11px] text-[#5D544F]">
            <span>Voice: <strong className="text-[#1E3A1E]">{voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua' ? 'Isaac' : 'Kwame'}</strong></span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>3s Silence & 10s Timeout Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
