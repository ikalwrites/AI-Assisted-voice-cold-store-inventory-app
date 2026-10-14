import React from 'react';
import { Mic, Package, History, Snowflake, FileText, Volume2, VolumeX, ClipboardCheck, Sparkles, Smartphone } from 'lucide-react';
import { LanguageMode } from '../locales/translations';

export type AppTab = 'showcase' | 'voice' | 'manual-stock' | 'inventory' | 'transactions' | 'zones' | 'logbook';

interface HeaderProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  lang: LanguageMode;
  setLang: (lang: LanguageMode) => void;
  voiceAudioEnabled: boolean;
  setVoiceAudioEnabled: (enabled: boolean) => void;
  isProcessingVoice: boolean;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  voiceAudioEnabled,
  setVoiceAudioEnabled,
  isProcessingVoice,
  lowStockCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-emerald-950/10 shadow-xs font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Tri-tone Accent Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#29533E] via-[#F59E0B] to-[#386F55]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 gap-3">
          {/* Brand & Realistic Human Avatar */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => setCurrentTab('showcase')}>
              <div className="w-11 h-11 rounded-2xl ring-2 ring-[#386F55]/40 p-0.5 overflow-hidden bg-[#F2F5F0] shadow-sm flex items-center justify-center">
                <img
                  src="/src/assets/images/akosua_human_avatar_1788535176637.jpg"
                  alt="Paradise Fisheries Assistant"
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  isProcessingVoice ? 'bg-[#F59E0B] animate-ping' : 'bg-emerald-600'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#1E3A2B] flex items-center gap-1.5">
                  <span>PARADISE</span>
                  <span className="text-[#386F55]">FISHERIES</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100/70 text-[#254F3A] border border-emerald-300/60">
                  Tema Harbour & Cold Fleet
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#5B6D62]">
                Commercial Cold Storage Complex • <span className="text-[#1E3A2B] font-bold">AI Voice Ops & Fleet Sizing</span>
              </p>
            </div>
          </div>

          {/* Controls: Manager Chip & Audio Talk Toggle */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {/* Store Admin Tag */}
            <div className="hidden lg:block text-right pr-2 border-r border-emerald-950/10">
              <p className="text-xs font-bold text-[#1E3A2B]">Mama Gloria & Isaac</p>
              <p className="text-[10px] uppercase text-[#386F55] font-black tracking-wider">Executive Management</p>
            </div>

            {/* Audio Speech Talk Toggle */}
            <button
              id="header-voice-audio-toggle"
              onClick={() => setVoiceAudioEnabled(!voiceAudioEnabled)}
              title={voiceAudioEnabled ? 'Voice output active' : 'Voice output muted'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                voiceAudioEnabled
                  ? 'bg-[#2A523D] text-white border-[#2A523D] shadow-sm'
                  : 'bg-[#F4F7F3] text-[#5B6D62] border-emerald-950/10 hover:bg-[#EAF0E9]'
              }`}
            >
              {voiceAudioEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#FCD34D] animate-pulse" />
                  <span>Voice: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                  <span>Voice: Muted</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Intuitive Navigation Menu */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar border-t border-emerald-950/10">
          {/* Primary Inspo Showcase Tab */}
          <button
            id="nav-tab-showcase"
            onClick={() => setCurrentTab('showcase')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'showcase'
                ? 'bg-[#386F55] text-white shadow-md shadow-emerald-950/20 scale-102'
                : 'text-[#4A5D52] hover:text-[#1E3A2B] hover:bg-emerald-50/80'
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#FCD34D]" />
            <span>Inspo Showcase (Dual Mobile & 360°)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-[#F59E0B] text-[#1E3A2B]">
              New
            </span>
          </button>

          <button
            id="nav-tab-voice"
            onClick={() => setCurrentTab('voice')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'voice'
                ? 'bg-[#386F55] text-white shadow-md shadow-emerald-950/20'
                : 'text-[#4A5D52] hover:text-[#1E3A2B] hover:bg-emerald-50/80'
            }`}
          >
            <Mic className="w-4 h-4 text-[#FCD34D]" />
            <span>Voice Stockkeeper</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
          </button>

          {/* Dedicated Admin Manual Stock Keeping Tab */}
          <button
            id="nav-tab-manual-stock"
            onClick={() => setCurrentTab('manual-stock')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'manual-stock'
                ? 'bg-[#386F55] text-white shadow-md shadow-emerald-950/20'
                : 'text-[#4A5D52] hover:text-[#1E3A2B] hover:bg-emerald-50/80'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Manual Stock Desk</span>
          </button>

          <button
            id="nav-tab-inventory"
            onClick={() => setCurrentTab('inventory')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'inventory'
                ? 'bg-[#386F55] text-white shadow-md shadow-emerald-950/20'
                : 'text-[#4A5D52] hover:text-[#1E3A2B] hover:bg-emerald-50/80'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Cold Store Catalog</span>
            {lowStockCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#EF4444] text-white">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-logbook"
            onClick={() => setCurrentTab('logbook')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'logbook'
                ? 'bg-[#386F55] text-white shadow-md shadow-emerald-950/20'
                : 'text-[#4A5D52] hover:text-[#1E3A2B] hover:bg-emerald-50/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Log Book</span>
          </button>

          <button
            id="nav-tab-transactions"
            onClick={() => setCurrentTab('transactions')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'transactions'
                ? 'bg-[#386F55] text-white shadow-md shadow-emerald-950/20'
                : 'text-[#4A5D52] hover:text-[#1E3A2B] hover:bg-emerald-50/80'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Transactions</span>
          </button>

          <button
            id="nav-tab-zones"
            onClick={() => setCurrentTab('zones')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'zones'
                ? 'bg-[#386F55] text-white shadow-md shadow-emerald-950/20'
                : 'text-[#4A5D52] hover:text-[#1E3A2B] hover:bg-emerald-50/80'
            }`}
          >
            <Snowflake className="w-4 h-4" />
            <span>Cold Bays</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
