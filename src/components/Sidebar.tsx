import React, { useState } from 'react';
import {
  Mic,
  Snowflake,
  Inbox,
  FileEdit,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Search,
  Bell,
  Sparkles,
  Moon,
  Sun,
  Palette,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Unlock,
  ScanFace,
  Warehouse,
  FileSpreadsheet
} from 'lucide-react';

export type AppTab =
  | 'inbox'
  | 'voice'
  | 'inventory'
  | 'manual-log'
  | 'freezer-bays'
  | 'all-records'
  | 'secret-vault'
  | 'admin-stock'
  | 'spoilage';

// Customized Cold Room Inventory Icon: Commercial multi-tier crate with freeze core
export const ColdRoomInventoryIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Cold Room Warehouse Crate Geometry */}
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

interface SidebarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  voiceAudioEnabled: boolean;
  setVoiceAudioEnabled: (enabled: boolean) => void;
  isProcessingVoice: boolean;
  lowStockCount: number;
  spoilageCount?: number;
  transactionsCount?: number;
  adminName?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isSecretVaultUnlocked?: boolean;
  bayCount?: number;
  onSelectBoss?: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  voiceAudioEnabled,
  setVoiceAudioEnabled,
  isProcessingVoice,
  lowStockCount,
  spoilageCount = 0,
  transactionsCount = 18,
  adminName = 'Mama Gloria',
  searchQuery,
  setSearchQuery,
  isOpenMobile,
  onCloseMobile,
  isSecretVaultUnlocked = false,
  bayCount = 4,
  onSelectBoss,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'slate' | 'nordic' | 'warm'>('slate');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Customized 6 to 8 Tabs as requested by user
  const menuItems = [
    {
      id: 'inbox' as AppTab,
      label: 'Inbox & Alerts',
      subtitle: 'Out of Stock & Spoilt',
      icon: Inbox,
      badge: lowStockCount + spoilageCount > 0 ? `${lowStockCount + spoilageCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'voice' as AppTab,
      label: 'Voice Stockkeeper',
      subtitle: 'AI Agent (Kwame & Isaac)',
      icon: Mic, // Voice icon as explicitly requested!
      badge: isProcessingVoice ? 'Listening' : undefined,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'inventory' as AppTab,
      label: 'Cold Room Inventory',
      subtitle: 'Cartons & Chamber Balances',
      icon: ColdRoomInventoryIcon, // Customized icon!
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'bg-[#C2410C] text-white',
    },
    {
      id: 'manual-log' as AppTab,
      label: 'Manual Log & Stock',
      subtitle: 'Boss Direct Manual Entry',
      icon: FileEdit,
      badge: 'Boss Entry',
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'freezer-bays' as AppTab,
      label: 'Cold Chambers',
      subtitle: 'Fleet Scaling & Chamber Sizing',
      icon: Snowflake, // Frozen icon as explicitly requested!
      badge: `${bayCount} Bays`,
      badgeColor: 'bg-cyan-700 text-white',
    },
    {
      id: 'secret-vault' as AppTab,
      label: 'Secret Tab (Face ID)',
      subtitle: 'Biometric Clearance & Deletion',
      icon: isSecretVaultUnlocked ? Unlock : ScanFace,
      badge: isSecretVaultUnlocked ? 'Unlocked' : 'Face ID',
      badgeColor: isSecretVaultUnlocked ? 'bg-emerald-600 text-white' : 'bg-rose-900 text-rose-200',
    },
    {
      id: 'admin-stock' as AppTab,
      label: 'Admin Stock Desk',
      subtitle: 'Pricing & Safety Thresholds',
      icon: SlidersHorizontal,
    },
    {
      id: 'spoilage' as AppTab,
      label: 'Spoilage & Waste Log',
      subtitle: 'Damaged & Condemned',
      icon: Trash2,
      badge: spoilageCount > 0 ? `${spoilageCount}` : undefined,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'all-records' as AppTab,
      label: 'All Records Ledger',
      subtitle: 'Sold, Restocked & Audit Table',
      icon: FileSpreadsheet,
      badge: transactionsCount > 0 ? `${transactionsCount}` : undefined,
      badgeColor: 'bg-indigo-600 text-white',
    },
  ];

  const handleTabSelect = (tab: AppTab) => {
    setCurrentTab(tab);
    if (window.innerWidth < 1024) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Wrapper */}
      <aside
        id="main-app-sidebar"
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex transition-all duration-300 select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ======================================================== */}
        {/* 1. LEFT-MOST SLIM ICON RAIL                              */}
        {/* ======================================================== */}
        <div className="w-[68px] h-full bg-[#FAFAFC] border-r border-[#E5E7EB] flex flex-col items-center justify-between py-4 px-2 shrink-0">
          {/* Top Section */}
          <div className="flex flex-col items-center gap-3 w-full">
            {/* Store Brand Logo */}
            <button
              onClick={() => handleTabSelect('voice')}
              title="Paradise Fisheries"
              className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-center text-blue-900 hover:scale-105 transition-transform"
            >
              <div className="relative w-6 h-6 flex items-center justify-center font-black text-xs text-blue-800">
                PF
              </div>
            </button>

            {/* Quick Search trigger */}
            <button
              onClick={() => {
                if (!isExpanded) setIsExpanded(true);
                const input = document.getElementById('sidebar-quick-search-input');
                input?.focus();
              }}
              title="Quick search"
              className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Quick Inbox Trigger */}
            <button
              onClick={() => handleTabSelect('inbox')}
              title={`Admin Inbox (${lowStockCount + spoilageCount} alerts)`}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                currentTab === 'inbox'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Inbox className="w-4 h-4" />
              {lowStockCount + spoilageCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  {lowStockCount + spoilageCount}
                </span>
              )}
            </button>

            {/* Subtle Divider */}
            <div className="w-8 h-[1px] bg-gray-200 my-0.5" />

            {/* Navigation Icons Rail Grouping */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    title={item.label}
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 ${
                        isActive
                          ? item.id === 'voice'
                            ? 'text-blue-600'
                            : item.id === 'freezer-bays'
                            ? 'text-cyan-600'
                            : item.id === 'all-records'
                            ? 'text-indigo-600'
                            : item.id === 'secret-vault'
                            ? 'text-rose-600'
                            : 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    />
                    {item.badge && !isActive && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Rail Section: Voice Output, Themes, Avatar */}
          <div className="flex flex-col items-center gap-2 w-full pt-3 border-t border-gray-200">
            {/* Sparkle Voice Action */}
            <button
              onClick={() => handleTabSelect('voice')}
              title="Activate Voice Cockpit"
              className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Sound / Voice Audio */}
            <button
              onClick={() => setVoiceAudioEnabled(!voiceAudioEnabled)}
              title={voiceAudioEnabled ? 'Voice output active' : 'Voice output muted'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                voiceAudioEnabled ? 'text-emerald-700 bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              {voiceAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Avatar */}
            <div className="relative mt-1">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-9 h-9 rounded-full ring-2 ring-gray-200 overflow-hidden bg-gray-100 hover:ring-gray-400 transition-all focus:outline-none"
              >
                <img
                  src="/src/assets/images/seller_jacob_avatar_1788596698402.jpg"
                  alt={adminName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. EXPANDED PRIMARY SIDEBAR (Full customized text menu)  */}
        {/* ======================================================== */}
        <div
          className={`h-full bg-[#F8F9FC] border-r border-[#E5E7EB] flex flex-col justify-between transition-all duration-300 overflow-hidden ${
            isExpanded ? 'w-[250px] sm:w-[270px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Panel Section */}
          <div className="flex flex-col p-4 overflow-y-auto no-scrollbar">
            {/* Header: Brand Name + Collapse Icon */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200/80">
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => handleTabSelect('voice')}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center font-black text-xs">
                  PF
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-tight text-gray-900 leading-none">
                    PARADISE
                  </h2>
                  <p className="text-[10px] font-bold tracking-wider text-blue-600 mt-0.5">
                    FISHERIES & FLEET
                  </p>
                </div>
              </div>

              {/* Panel Collapse Button */}
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse sidebar panel"
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 flex items-center justify-center transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="sidebar-quick-search-input"
                type="text"
                placeholder="Search products or logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Inbox & Alerts shortcut */}
            <div className="mt-3">
              <button
                onClick={() => handleTabSelect('inbox')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  currentTab === 'inbox'
                    ? 'bg-rose-50 text-rose-900 font-bold border border-rose-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-rose-600" />
                  <span>Admin Inbox & Alerts</span>
                </div>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  {lowStockCount + spoilageCount}
                </span>
              </button>
            </div>

            {/* Menu Header */}
            <div className="mt-4 mb-1.5 px-3 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Customized Tabs ({menuItems.length})
              </span>
            </div>

            {/* Main Menu Tabs List */}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80 font-bold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <IconComponent
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? item.id === 'voice'
                              ? 'text-blue-600'
                              : item.id === 'freezer-bays'
                              ? 'text-cyan-600'
                              : item.id === 'all-records'
                              ? 'text-indigo-600'
                              : item.id === 'secret-vault'
                              ? 'text-rose-600'
                              : 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Freezer Health Mini Card */}
            <div className="mt-5 p-3.5 rounded-2xl bg-gradient-to-br from-[#EBF2FF] via-[#F2F6FE] to-[#F5F8FF] border border-[#D6E4FF] shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-600/10 text-cyan-600 flex items-center justify-center shrink-0">
                  <Snowflake className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Freezer Bays</p>
                  <h4 className="text-xs font-bold text-gray-900 leading-snug">
                    Chambers 1-4 Active
                  </h4>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                Refrigeration steady at -21°C. Bay names and stocked cartons editable in Freezer Bays tab.
              </p>

              <button
                onClick={() => handleTabSelect('voice')}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200/80 text-xs font-bold text-blue-700 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Mic className="w-3.5 h-3.5 text-blue-600" />
                <span>Talk to Kwame / Isaac</span>
              </button>
            </div>

            {/* Bottom Menu Items */}
            <div className="mt-4 pt-3 border-t border-gray-200/80 space-y-1">
              <button
                onClick={() => handleTabSelect('admin-stock')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                <span>Price & Stock Controls</span>
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-gray-400" />
                  <span>Dark mode</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400">
                  {darkMode ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-gray-400" />
                <span>Voice Help & Triggers</span>
              </button>
            </div>
          </div>

          {/* User Profile Bar */}
          <div className="p-3 border-t border-gray-200 bg-white/60">
            <div
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center justify-between p-1.5 rounded-xl hover:bg-gray-100/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200">
                  <img
                    src="/src/assets/images/seller_jacob_avatar_1788596698402.jpg"
                    alt={adminName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                    {adminName}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    Cold Store Owner
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-gray-400">
                <ChevronUp className="w-3 h-3 -mb-1" />
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Dropdown for user options */}
            {showUserDropdown && (
              <div className="mt-2 p-2 bg-white rounded-xl border border-gray-200 shadow-md text-xs space-y-1 animate-slide-down">
                <div className="px-2 py-1 text-[11px] text-gray-500 font-semibold border-b border-gray-100 flex items-center justify-between">
                  <span>Executive Role</span>
                  <span className="text-[10px] text-blue-600 font-bold">Paradise Fisheries</span>
                </div>
                
                {/* Boss Selector */}
                {onSelectBoss && (
                  <div className="p-1.5 bg-gray-50 rounded-lg space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Switch Active Boss:</span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBoss('Mama Gloria');
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-bold transition-all ${
                        adminName === 'Mama Gloria' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      👑 Mama Gloria (Managing Director)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBoss('Boss Isaac');
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-bold transition-all ${
                        adminName === 'Boss Isaac' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      👔 Boss Isaac (Managing Director)
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    handleTabSelect('all-records');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 font-medium text-gray-700 flex items-center justify-between"
                >
                  <span>📊 All Records Ledger</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Table</span>
                </button>
                <button
                  onClick={() => {
                    handleTabSelect('manual-log');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
                >
                  📝 Manual Log Book Input
                </button>
                <button
                  onClick={() => {
                    handleTabSelect('secret-vault');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-50 font-medium text-rose-700 flex items-center justify-between"
                >
                  <span>🔒 Secret Tab (Delete Records)</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-semibold">Protected</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expand Sidebar Tab Floating Handle when collapsed */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            title="Expand menu sidebar"
            className="hidden lg:flex absolute -right-3.5 top-5 z-20 w-7 h-7 rounded-full bg-white border border-gray-300 shadow-md items-center justify-center text-gray-600 hover:text-gray-900 hover:scale-105 transition-all"
          >
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </button>
        )}
      </aside>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-slide-down">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Voice Commands & Navigation Guide
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-gray-600">
              <p>
                Talk to <strong>Kwame</strong> or <strong>Isaac</strong> in Asante Twi, English, or mixed Ghanaian market slang:
              </p>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 space-y-2 text-blue-950 font-medium">
                <p>• <em>"Mepɛ carton 5 tilapia kɔma Auntie Mansa"</em> (Sales recording)</p>
                <p>• <em>"Yɛanya carton 20 chicken thighs firi Tema harbor"</em> (Restock recording)</p>
                <p>• <em>"Nsuomnam dodoɔ sɛn na ɛwɔ Bay 1 mu?"</em> (Stock query)</p>
                <p>• <em>"Carton 2 sausage asɛe wɔ Bay 3 mu"</em> (Report spoilage)</p>
              </div>

              <div className="pt-2 text-gray-500">
                <p className="font-bold text-gray-800">Security Clearance:</p>
                <p className="mt-0.5">
                  The <strong>Secret Tab</strong> requires authorized administrator credentials to delete or purge transaction records.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
