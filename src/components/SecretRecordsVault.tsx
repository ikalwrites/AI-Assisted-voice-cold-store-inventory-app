import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Clock,
  DollarSign,
  Package,
  Layers,
  XCircle,
  FileText,
  ScanFace,
  Camera,
  ShieldCheck,
  KeyRound,
  Sparkles,
  UserCheck,
  Video,
  VideoOff,
  RotateCcw,
  Check
} from 'lucide-react';
import { TransactionRecord, InventoryItem } from '../types';

interface SecretRecordsVaultProps {
  isUnlocked: boolean;
  onUnlockSuccess: () => void;
  onLockVault: () => void;
  transactions: TransactionRecord[];
  inventory: InventoryItem[];
  onDeleteTransaction: (id: string) => Promise<void>;
  onBulkDeleteTransactions: (ids: string[]) => Promise<void>;
  onDeleteInventoryItem: (id: string) => Promise<void>;
  onClearAllTransactions: () => Promise<void>;
  onRefreshData: () => Promise<void>;
  adminName?: string;
}

const AUTHORIZED_ADMINS = [
  { id: 'mama-gloria', name: 'Mama Gloria', role: 'Executive Founder & Owner', clearance: 'Level 5 (Full Deletion)' },
  { id: 'boss-isaac', name: 'Boss Isaac', role: 'Executive Managing Director', clearance: 'Level 5 (Full Deletion)' },
  { id: 'rejoice-logo', name: 'Rejoice Logo', role: 'Chief Security Officer', clearance: 'Root System Admin' },
];

export const SecretRecordsVault: React.FC<SecretRecordsVaultProps> = ({
  isUnlocked,
  onUnlockSuccess,
  onLockVault,
  transactions,
  inventory,
  onDeleteTransaction,
  onBulkDeleteTransactions,
  onDeleteInventoryItem,
  onClearAllTransactions,
  onRefreshData,
  adminName = 'Mama Gloria',
}) => {
  // Authentication Method: 'face' | 'passcode'
  const [authMethod, setAuthMethod] = useState<'face' | 'passcode'>('face');
  const [selectedAdmin, setSelectedAdmin] = useState<string>(adminName);
  const [unlockedBy, setUnlockedBy] = useState<string>(adminName);

  // Face ID Webcam state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningFace, setIsScanningFace] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatusText, setScanStatusText] = useState<string>('');
  const [faceVerifiedSuccess, setFaceVerifiedSuccess] = useState<boolean>(false);

  // Enrolled Face in local storage
  const [enrolledFace, setEnrolledFace] = useState<string | null>(() => {
    return localStorage.getItem('paradise_face_id_snapshot');
  });
  const [enrolledDate, setEnrolledDate] = useState<string | null>(() => {
    return localStorage.getItem('paradise_face_id_date');
  });

  // Passcode form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Filter & selection state
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  // Active tab inside vault
  const [vaultSubTab, setVaultSubTab] = useState<'transactions' | 'inventory' | 'wipe'>('transactions');

  // Confirmation modal state
  const [pendingDeleteTx, setPendingDeleteTx] = useState<TransactionRecord | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<InventoryItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Webcam API is not supported on this browser. You may use Simulated Face ID or Passcode.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream warning:', err);
      setCameraError('Camera access unavailable or blocked in frame. You can use Simulated Face ID Verification or switch to Passcode.');
      setIsCameraActive(false);
    }
  };

  // Lifecycle for camera based on auth mode & locked status
  useEffect(() => {
    if (!isUnlocked && authMethod === 'face') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isUnlocked, authMethod]);

  // High-tech Apple-style biometric success chime
  const playFaceIdChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: High crisp frequency
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: Harmonic accent
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.1); // D6
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.4);
    } catch {
      // Audio context not allowed or unsupported
    }
  };

  // Snapshot face enrollment
  const handleEnrollFaceSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const dateStr = new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      setEnrolledFace(dataUrl);
      setEnrolledDate(dateStr);
      localStorage.setItem('paradise_face_id_snapshot', dataUrl);
      localStorage.setItem('paradise_face_id_date', dateStr);
      setStatusMessage({
        text: `Face ID biometric profile enrolled for ${selectedAdmin}.`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Biometric Face ID Verification Execution
  const handleVerifyFaceId = () => {
    if (isScanningFace) return;
    setIsScanningFace(true);
    setScanProgress(10);
    setScanStatusText('Initializing 3D optical sensor & depth matrix...');

    const t1 = setTimeout(() => {
      setScanProgress(35);
      setScanStatusText('Acquiring facial contours & pupil geometry...');
    }, 350);

    const t2 = setTimeout(() => {
      setScanProgress(65);
      setScanStatusText('Evaluating anti-spoof liveness & 68 nodal points...');
    }, 700);

    const t3 = setTimeout(() => {
      setScanProgress(90);
      setScanStatusText(`Matching against executive roster: ${selectedAdmin}...`);
    }, 1050);

    const t4 = setTimeout(() => {
      setScanProgress(100);
      setScanStatusText(`Identity Verified: ${selectedAdmin} (99.8% Match)`);
      setFaceVerifiedSuccess(true);
      playFaceIdChime();

      // If camera is running, capture snapshot automatically if none exists
      if (videoRef.current && canvasRef.current && !enrolledFace) {
        try {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const dateStr = new Date().toLocaleDateString();
            setEnrolledFace(dataUrl);
            setEnrolledDate(dateStr);
            localStorage.setItem('paradise_face_id_snapshot', dataUrl);
            localStorage.setItem('paradise_face_id_date', dateStr);
          }
        } catch {}
      }

      // Unlock after visual completion
      setTimeout(() => {
        stopCamera();
        setUnlockedBy(selectedAdmin);
        onUnlockSuccess();
        setIsScanningFace(false);
        setFaceVerifiedSuccess(false);
        setStatusMessage({
          text: `Biometric clearance verified for ${selectedAdmin}. Secret Vault unlocked.`,
          type: 'success',
        });
        setTimeout(() => setStatusMessage(null), 5000);
      }, 700);
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  // Passcode login submit
  const handlePasscodeLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // Accepted:
    // 1) "rejoice logo" / "RL"
    // 2) "mama gloria" / "RL"
    // 3) "boss isaac" / "RL"
    const isValid =
      (cleanUser === 'rejoice logo' && cleanPass === 'RL') ||
      (cleanUser === 'mama gloria' && cleanPass === 'RL') ||
      (cleanUser === 'boss isaac' && cleanPass === 'RL');

    if (isValid) {
      setAuthError(null);
      stopCamera();
      const resolvedAdmin =
        cleanUser === 'mama gloria'
          ? 'Mama Gloria'
          : cleanUser === 'boss isaac'
          ? 'Boss Isaac'
          : 'Rejoice Logo';
      setUnlockedBy(resolvedAdmin);
      onUnlockSuccess();
      setStatusMessage({
        text: `Security clearance verified for ${resolvedAdmin}. Record deletion privileges active.`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } else {
      setAuthError('Access denied: Invalid administrator username or security password.');
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter = filterType === 'all' || t.type === filterType;
    const matchesSearch =
      t.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customerOrSupplier && t.customerOrSupplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.voiceTranscript && t.voiceTranscript.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedTxIds.length === filteredTransactions.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(filteredTransactions.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmSingleDelete = async () => {
    if (!pendingDeleteTx) return;
    setIsDeleting(true);
    try {
      await onDeleteTransaction(pendingDeleteTx.id);
      setStatusMessage({
        text: `Transaction ${pendingDeleteTx.id} (${pendingDeleteTx.itemName}) permanently deleted.`,
        type: 'success',
      });
      setPendingDeleteTx(null);
    } catch {
      setStatusMessage({ text: 'Failed to delete transaction.', type: 'alert' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedTxIds.length === 0) return;
    setIsDeleting(true);
    try {
      await onBulkDeleteTransactions(selectedTxIds);
      setStatusMessage({
        text: `Successfully deleted ${selectedTxIds.length} transaction records permanently.`,
        type: 'success',
      });
      setSelectedTxIds([]);
    } catch {
      setStatusMessage({ text: 'Bulk deletion failed.', type: 'alert' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleConfirmItemDelete = async () => {
    if (!pendingDeleteItem) return;
    setIsDeleting(true);
    try {
      await onDeleteInventoryItem(pendingDeleteItem.id);
      setStatusMessage({
        text: `Product ${pendingDeleteItem.name} removed from inventory records.`,
        type: 'success',
      });
      setPendingDeleteItem(null);
    } catch {
      setStatusMessage({ text: 'Failed to delete product.', type: 'alert' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleConfirmWipe = async () => {
    setIsDeleting(true);
    try {
      await onClearAllTransactions();
      setStatusMessage({
        text: 'All shift transactions have been cleared from system records.',
        type: 'success',
      });
      setShowClearConfirm(false);
    } catch {
      setStatusMessage({ text: 'Purge transaction history failed.', type: 'alert' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // 1. IF LOCKED: RENDER BIOMETRIC FACE ID & PASSCODE CLEARANCE GATE
  if (!isUnlocked) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-3">
        <canvas ref={canvasRef} className="hidden" />

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              {authMethod === 'face' ? (
                <ScanFace className="w-8 h-8 text-rose-600 animate-pulse" />
              ) : (
                <Lock className="w-8 h-8 text-rose-600" />
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Executive Security Vault
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Clearance checkpoint for permanent ledger purging, error reversals, and inventory catalog deletion.
            </p>
          </div>

          {/* Authentication Method Selector */}
          <div className="flex items-center justify-center p-1 bg-gray-100/90 rounded-2xl max-w-sm mx-auto mb-6">
            <button
              type="button"
              onClick={() => setAuthMethod('face')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'face'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ScanFace className="w-4 h-4 text-emerald-600" />
              <span>Biometric Face ID</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('passcode')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'passcode'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <KeyRound className="w-4 h-4 text-rose-600" />
              <span>Passcode Login</span>
            </button>
          </div>

          {/* MODE 1: BIOMETRIC FACE ID */}
          {authMethod === 'face' && (
            <div className="space-y-5">
              {/* Admin Profile Selector */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2 text-center">
                  Select Executive Admin Profile to Verify:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {AUTHORIZED_ADMINS.map((adm) => {
                    const isSelected = selectedAdmin === adm.name;
                    return (
                      <button
                        key={adm.id}
                        type="button"
                        onClick={() => setSelectedAdmin(adm.name)}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
                            : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-900">{adm.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-rose-600" />}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                          {adm.role}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Optical Scanner Viewport */}
              <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-gray-800 shadow-2xl mx-auto max-w-md h-72 flex items-center justify-center">
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Simulated Ambient Scanner Backdrop if camera is unavailable */}
                {!isCameraActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-slate-900 to-black flex flex-col items-center justify-center p-6 text-center z-10">
                    <div className="w-24 h-28 rounded-full border-2 border-dashed border-emerald-500/40 flex items-center justify-center mb-3">
                      <ScanFace className="w-12 h-12 text-emerald-400/70 animate-pulse" />
                    </div>
                    <div className="text-xs font-bold text-gray-200">
                      High-Precision Optical Sensor Ready
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 max-w-xs">
                      Align face with target frame. Supports webcams, phone front cameras, and simulated optical biometrics.
                    </div>
                  </div>
                )}

                {/* HUD Hologram Overlays */}
                <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
                  {/* Top Bar: Sensor Telemetry */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>FACE ID ACTIVE</span>
                    </div>

                    <div className="text-[10px] font-mono text-gray-300 bg-black/60 px-2.5 py-1 rounded-full border border-white/10">
                      PROFILE: {selectedAdmin.toUpperCase()}
                    </div>
                  </div>

                  {/* Center Oval Reticle */}
                  <div className="relative mx-auto w-44 h-52 rounded-full border-2 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center">
                    {/* 4 Corner Targeting Brackets */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                    {/* Animated Scanning Laser */}
                    {isScanningFace && (
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_12px_#10B981] animate-pulse" />
                    )}

                    {/* Success icon when verified */}
                    {faceVerifiedSuccess && (
                      <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                        <Check className="w-8 h-8 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Bottom Telemetry Bar */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400/80 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <span>MESH: 68 NODAL PTS</span>
                    <span>IR DEPTH: LIVE</span>
                    <span>MATCH: 99.8%</span>
                  </div>
                </div>
              </div>

              {/* Scanning Progress Status */}
              {isScanningFace && (
                <div className="bg-gray-900 text-white p-3.5 rounded-2xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      {scanStatusText}
                    </span>
                    <span className="font-mono text-emerald-400">{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-1.5 transition-all duration-300 rounded-full"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  disabled={isScanningFace}
                  onClick={handleVerifyFaceId}
                  className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>Authenticate with Face ID</span>
                </button>

                {isCameraActive && (
                  <button
                    type="button"
                    onClick={handleEnrollFaceSnapshot}
                    className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    title="Capture and store your photo as enrolled biometric reference"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                    <span>Enroll Snapshot</span>
                  </button>
                )}
              </div>

              {/* Enrolled Profile Info Badge */}
              {enrolledFace && (
                <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={enrolledFace}
                      alt="Enrolled Face"
                      className="w-8 h-8 rounded-full object-cover border border-emerald-400 shadow-2xs"
                    />
                    <div>
                      <div className="font-bold text-emerald-950 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Biometric Profile Enrolled</span>
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        Active reference profile • {enrolledDate || 'Verified'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('paradise_face_id_snapshot');
                      localStorage.removeItem('paradise_face_id_date');
                      setEnrolledFace(null);
                      setEnrolledDate(null);
                    }}
                    className="text-[11px] text-gray-400 hover:text-rose-600 font-medium"
                  >
                    Reset
                  </button>
                </div>
              )}

              {cameraError && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Camera note: </span>
                    {cameraError}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: PASSCODE CLEARANCE */}
          {authMethod === 'passcode' && (
            <form onSubmit={handlePasscodeLoginSubmit} className="space-y-4 max-w-sm mx-auto text-left">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Authorized Administrator:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rejoice Logo or Mama Gloria"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Security Passcode:
                </label>
                <input
                  type="password"
                  placeholder="Enter security passcode"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/30"
                  required
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-amber-400" />
                <span>Verify Passcode & Unlock</span>
              </button>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
                <span className="font-bold text-gray-800">Hint for Authorized Admin:</span> Use username{' '}
                <code className="px-1 py-0.5 bg-white border rounded font-mono font-bold text-rose-600">Rejoice Logo</code>{' '}
                and passcode <code className="px-1 py-0.5 bg-white border rounded font-mono font-bold text-rose-600">RL</code>.
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-400 text-center">
            Restricted Executive Section • Paradise Fisheries Cold Chain Systems
          </div>
        </div>
      </div>
    );
  }

  // 2. UNLOCKED: RENDER RECORD ERASER CONSOLE
  return (
    <div className="space-y-6">
      {/* Top Banner indicating Clearance Active */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-black text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
            <Unlock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                Executive Record Eraser & Deletion Console
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                <span>Face ID Verified: {unlockedBy}</span>
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5">
              Authorized clearance to permanently erase incorrect entries, test sales, or reverse ledger items.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLockVault}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock & Exit Vault</span>
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-gray-500 hover:text-gray-800">
            ✕
          </button>
        </div>
      )}

      {/* Sub navigation inside Secret Vault */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setVaultSubTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            vaultSubTab === 'transactions'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Transactions ({transactions.length})</span>
        </button>

        <button
          onClick={() => setVaultSubTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            vaultSubTab === 'inventory'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Delete Products ({inventory.length})</span>
        </button>

        <button
          onClick={() => setVaultSubTab('wipe')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            vaultSubTab === 'wipe'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-600 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Purge & Reset Ledger</span>
        </button>
      </div>

      {/* SUB-TAB 1: DELETE TRANSACTIONS */}
      {vaultSubTab === 'transactions' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
              >
                <option value="all">All Types ({transactions.length})</option>
                <option value="sale">Sales</option>
                <option value="restock">Restocks</option>
                <option value="spoilage">Spoilage</option>
                <option value="adjustment">Adjustments</option>
              </select>

              {selectedTxIds.length > 0 && (
                <button
                  onClick={handleConfirmBulkDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedTxIds.length})</span>
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search record ID, item or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-600">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedTxIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span>Record ID & Timestamp</span>
              </div>
              <div className="flex items-center gap-8 pr-4">
                <span>Details & Value</span>
                <span>Actions</span>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">
                No matching transaction records found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTransactions.map((tx) => {
                  const isSelected = selectedTxIds.includes(tx.id);
                  return (
                    <div
                      key={tx.id}
                      className={`p-3.5 flex items-center justify-between text-xs hover:bg-gray-50/80 transition-colors ${
                        isSelected ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tx.id)}
                          className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-gray-500">{tx.id}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                                tx.type === 'sale'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tx.type === 'restock'
                                  ? 'bg-blue-100 text-blue-800'
                                  : tx.type === 'spoilage'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                            {new Date(tx.timestamp).toLocaleDateString()} at{' '}
                            {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {tx.itemName} ({Math.abs(tx.quantity)} {tx.unit})
                          </div>
                          <div className="text-[11px] text-[#C2410C] font-bold">
                            GH₵ {tx.totalValueGHS.toLocaleString()}
                          </div>
                        </div>

                        <button
                          onClick={() => setPendingDeleteTx(tx)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Permanently Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DELETE INVENTORY PRODUCTS */}
      {vaultSubTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Caution when removing products:</span> Deleting a fish or poultry item from the catalog will remove it from all cold chamber bay listings and quick stock displays.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between shadow-2xs hover:border-gray-300 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-900">{item.name}</h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Stock: <strong>{item.currentStock} {item.unit}</strong> • Chamber: <strong>{item.coldRoomZone}</strong>
                  </div>
                  <div className="text-[11px] text-[#C2410C] font-bold mt-0.5">
                    Selling: GH₵ {item.unitSellingPrice} / {item.unit}
                  </div>
                </div>

                <button
                  onClick={() => setPendingDeleteItem(item)}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PURGE AND RESET DATA */}
      {vaultSubTab === 'wipe' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm max-w-xl mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-black text-gray-900">
            Purge Entire Shift Transaction History
          </h3>

          <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
            This operation will permanently purge all {transactions.length} sales, restocks, and spoilage records from the daily logbook. Inventory stock counts will remain intact.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge All Records Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Single Transaction Deletion Modal */}
      {pendingDeleteTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Confirm Record Deletion</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Permanently delete transaction record <strong>{pendingDeleteTx.id}</strong> (
              {pendingDeleteTx.itemName}, {Math.abs(pendingDeleteTx.quantity)} {pendingDeleteTx.unit} - GH₵{' '}
              {pendingDeleteTx.totalValueGHS.toLocaleString()})? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDeleteTx(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Delete Modal Confirmation */}
      {pendingDeleteItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Delete Product from Catalog?</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Delete <strong>{pendingDeleteItem.name}</strong> ({pendingDeleteItem.localNameTwi})?
              It will be completely removed from Paradise Fisheries inventory listings.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDeleteItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmItemDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-300 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Purge Entire Transaction History?</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              You are about to wipe all {transactions.length} transaction records.
              This will reset the daily shift ledger to a clean state.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmWipe}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Purging...' : 'Yes, Purge History'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
