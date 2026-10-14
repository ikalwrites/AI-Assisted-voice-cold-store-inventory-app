import React, { useState, useEffect } from 'react';
import {
  Mic,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Plus,
  Snowflake,
  Volume2,
  FileText,
  ClipboardCheck,
  Menu,
  Bell,
  Search,
  ArrowRight,
  TrendingUp,
  Building2,
  Trash2,
  History,
  ShieldCheck,
  Calendar,
  Clock,
  Inbox,
  Lock,
  FileEdit,
  SlidersHorizontal
} from 'lucide-react';
import { Sidebar, AppTab } from './components/Sidebar';
import { InboxAlerts } from './components/InboxAlerts';
import { VoiceStockkeeper } from './components/VoiceStockkeeper';
import { ManualStockKeeper } from './components/ManualStockKeeper';
import { InventoryGrid } from './components/InventoryGrid';
import { TransactionHistory } from './components/TransactionHistory';
import { ColdRoomZones } from './components/ColdRoomZones';
import { SecretRecordsVault } from './components/SecretRecordsVault';
import { StockKeepingLogBook } from './components/StockKeepingLogBook';
import { AllRecordsTable } from './components/AllRecordsTable';
import { AddItemModal } from './components/AddItemModal';
import { EditItemModal } from './components/EditItemModal';
import { LanguageMode } from './locales/translations';
import {
  InventoryItem,
  TransactionRecord,
  InventoryStats,
  VoiceProcessResult,
  FreezerBayConfig
} from './types';
import { INITIAL_INVENTORY, INITIAL_TRANSACTIONS } from './data/initialInventory';

const INITIAL_BAYS: FreezerBayConfig[] = [
  {
    id: 'bay-1',
    name: 'Freezer Bay 1 - Sea Catch & Fish',
    nameTwi: 'Freezer Bea 1 - Nsuomnam & Fish Bay',
    tempCelsius: -22.4,
    capacityCartons: 400,
    powerSource: 'Main Grid (ECG)',
    status: 'Optimal Freezing',
  },
  {
    id: 'bay-2',
    name: 'Freezer Bay 2 - Poultry Block',
    nameTwi: 'Freezer Bea 2 - Akokɔ & Akwantuo',
    tempCelsius: -19.2,
    capacityCartons: 350,
    powerSource: 'Main Grid (ECG)',
    status: 'Optimal Freezing',
  },
  {
    id: 'bay-3',
    name: 'Freezer Bay 3 - Deli & Sausages',
    nameTwi: 'Freezer Bea 3 - Sausages & Nsosoe',
    tempCelsius: -15.8,
    capacityCartons: 300,
    powerSource: 'Main Grid (ECG)',
    status: 'Optimal Freezing',
  },
  {
    id: 'bay-4',
    name: 'Freezer Bay 4 - Deep Meat Chamber',
    nameTwi: 'Freezer Bea 4 - Nantwi & Prako Nam',
    tempCelsius: -24.1,
    capacityCartons: 300,
    powerSource: 'Main Grid (ECG)',
    status: 'Optimal Freezing',
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('voice');
  const [lang, setLang] = useState<LanguageMode>('en');
  const [voiceAudioEnabled, setVoiceAudioEnabled] = useState(true);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Boss persona state: 'Mama Gloria' or 'Boss Isaac'
  const [currentBoss, setCurrentBoss] = useState<'Mama Gloria' | 'Boss Isaac'>('Mama Gloria');

  // Secret Vault authentication state
  const [isSecretVaultUnlocked, setIsSecretVaultUnlocked] = useState(false);

  // Core Data States
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [freezerBays, setFreezerBays] = useState<FreezerBayConfig[]>(INITIAL_BAYS);

  const [stats, setStats] = useState<InventoryStats>({
    totalItemsCount: INITIAL_INVENTORY.length,
    totalCartonsInStock: INITIAL_INVENTORY.reduce((a, b) => a + b.currentStock, 0),
    totalInventoryValueGHS: INITIAL_INVENTORY.reduce((a, b) => a + b.currentStock * b.unitSellingPrice, 0),
    lowStockAlertsCount: INITIAL_INVENTORY.filter((i) => i.currentStock <= i.minThreshold).length,
    todaySalesGHS: 7680,
    todayCartonsSold: 18,
  });

  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'alert';
  } | null>(null);

  // Spoilage transactions count
  const spoilageCount = transactions.filter((t) => t.type === 'spoilage').length;

  // Fetch initial data from server
  const loadData = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        if (data.inventory) setInventory(data.inventory);
        if (data.stats) setStats(data.stats);
      }

      const txRes = await fetch('/api/transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.transactions) setTransactions(txData.transactions);
      }

      const baysRes = await fetch('/api/freezer-bays');
      if (baysRes.ok) {
        const bData = await baysRes.json();
        if (bData.bays) setFreezerBays(bData.bays);
      }
    } catch (err) {
      console.warn('Using local fallback state:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update stats on change
  useEffect(() => {
    const totalCartons = inventory.reduce((a, b) => a + b.currentStock, 0);
    const totalVal = inventory.reduce((a, b) => a + b.currentStock * b.unitSellingPrice, 0);
    const lowCount = inventory.filter((i) => i.currentStock <= i.minThreshold).length;

    const today = new Date().toISOString().split('T')[0];
    const todaySales = transactions.filter((t) => t.type === 'sale' && t.timestamp.startsWith(today));
    const todaySalesGHS = todaySales.reduce((a, b) => a + b.totalValueGHS, 0);
    const todayCartons = todaySales.reduce((a, b) => a + Math.abs(b.quantity), 0);

    setStats({
      totalItemsCount: inventory.length,
      totalCartonsInStock: totalCartons,
      totalInventoryValueGHS: totalVal,
      lowStockAlertsCount: lowCount,
      todaySalesGHS: todaySalesGHS,
      todayCartonsSold: todayCartons,
    });
  }, [inventory, transactions]);

  // Voice command results handler
  const handleVoiceResultApplied = (result: VoiceProcessResult) => {
    if (result.updatedInventory) {
      setInventory(result.updatedInventory);
    }
    if (result.transactions) {
      setTransactions(result.transactions);
    }
    // Refresh all global state (inventory, transactions, stats) in background
    loadData();

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    setToastMessage({
      title: `Recorded to Stock & Log Book (${nowDate} • ${nowTime})`,
      desc: result.replyTextEn,
      type: result.lowStockWarnings && result.lowStockWarnings.length > 0 ? 'alert' : 'success',
    });

    setTimeout(() => setToastMessage(null), 7000);
  };

  // Stock Adjustment for inventory grid (+/-)
  const handleUpdateStock = async (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, item.currentStock + delta);
    const updated = { ...item, currentStock: newStock };
    setInventory((prev) => prev.map((i) => (i.id === item.id ? updated : i)));

    try {
      const res = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  // Direct manual stock level setting
  const handleManualStockSet = async (itemId: string, newStock: number, reason?: string) => {
    const target = inventory.find((i) => i.id === itemId);
    if (!target) return;

    const updated = { ...target, currentStock: Math.max(0, newStock) };
    setInventory((prev) => prev.map((i) => (i.id === itemId ? updated : i)));

    try {
      const res = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        loadData();
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setToastMessage({
          title: `Stock Level Reconciled (${nowTime})`,
          desc: `${target.name} set to ${newStock} ${target.unit}.${reason ? ` (${reason})` : ''}`,
          type: 'success',
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (e) {
      console.error('Manual stock update failed:', e);
    }
  };

  // Manual Transaction creation (Intake, Sale, Spoilage, Audit)
  const handleAddManualTransaction = async (newTx: Omit<TransactionRecord, 'id' | 'timestamp'>) => {
    try {
      const res = await fetch('/api/transactions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error('Add transaction failed:', e);
    }
  };

  // Save changes from EditItemModal
  const handleSaveEditedItem = async (updatedItem: InventoryItem) => {
    setInventory((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    try {
      const res = await fetch('/api/inventory/update?skipAutoTx=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      if (res.ok) {
        loadData();
        setToastMessage({
          title: 'Product Details Updated',
          desc: `${updatedItem.name}: GH₵ ${updatedItem.unitSellingPrice.toLocaleString()}/ctn in ${updatedItem.coldRoomZone}.`,
          type: 'success',
        });
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (e) {
      console.error('Save edited item failed:', e);
    }
  };

  // Add new item
  const handleSaveNewItem = async (newItem: InventoryItem) => {
    setInventory((prev) => [...prev, newItem]);
    try {
      await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      loadData();
      setToastMessage({
        title: 'New Product Added',
        desc: `${newItem.name} has been placed into ${newItem.coldRoomZone}.`,
        type: 'success',
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (e) {
      console.error('Add item failed:', e);
    }
  };

  // Update Freezer Bay configuration (Name, Twi Name, Temp, Capacity)
  const handleUpdateBay = async (updatedBay: FreezerBayConfig, previousBayName?: string) => {
    setFreezerBays((prev) => prev.map((b) => (b.id === updatedBay.id ? updatedBay : b)));

    const bayIdx = freezerBays.findIndex((b) => b.id === updatedBay.id);
    const bayNum = bayIdx >= 0 ? bayIdx + 1 : 1;
    const oldName = previousBayName || (bayIdx >= 0 ? freezerBays[bayIdx]?.name : '');

    // Optimistically cascade the bay name change to all corresponding inventory items in state
    if (updatedBay.name) {
      setInventory((prev) =>
        prev.map((item) => {
          const zone = (item.coldRoomZone || '').toLowerCase();
          const matchesPrev = oldName && zone.includes(oldName.toLowerCase());
          const matchesNum = zone.includes(`bay ${bayNum}`) || zone.includes(`chamber ${bayNum}`);
          const matchesId = zone.includes(updatedBay.id.toLowerCase());
          const matchesDefaultCategory =
            (bayNum === 1 && item.category === 'fish' && !zone.includes('bay 2') && !zone.includes('bay 3') && !zone.includes('bay 4')) ||
            (bayNum === 2 && item.category === 'poultry' && !zone.includes('bay 1') && !zone.includes('bay 3') && !zone.includes('bay 4')) ||
            (bayNum === 3 && item.category === 'sausage' && !zone.includes('bay 1') && !zone.includes('bay 2') && !zone.includes('bay 4')) ||
            (bayNum === 4 && item.category === 'meat' && !zone.includes('bay 1') && !zone.includes('bay 2') && !zone.includes('bay 3'));

          if (matchesPrev || matchesNum || matchesId || (matchesDefaultCategory && !oldName)) {
            return { ...item, coldRoomZone: updatedBay.name, lastUpdated: new Date().toISOString() };
          }
          return item;
        })
      );
    }

    try {
      const res = await fetch('/api/freezer-bays/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bay: updatedBay, oldName, bayNumber: bayNum }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.inventory && Array.isArray(data.inventory)) {
          setInventory(data.inventory);
        } else {
          loadData();
        }
        setToastMessage({
          title: 'Freezer Bay Updated Everywhere',
          desc: `"${updatedBay.name}" configured and synchronized across all products, ledger & audit views.`,
          type: 'success',
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (e) {
      console.error('Update bay failed:', e);
    }
  };

  // Reassign product to another bay
  const handleReassignItemBay = async (item: InventoryItem, newBayZone: string) => {
    const updated = { ...item, coldRoomZone: newBayZone };
    setInventory((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    try {
      await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      loadData();
      setToastMessage({
        title: 'Chamber Location Updated',
        desc: `${item.name} transferred to ${newBayZone}.`,
        type: 'success',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Quick restock from Inbox
  const handleQuickRestock = async (item: InventoryItem, additionalCartons: number) => {
    const updatedStock = item.currentStock + additionalCartons;
    const updatedItem = { ...item, currentStock: updatedStock };
    setInventory((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));

    const newTx = {
      type: 'restock' as const,
      itemId: item.id,
      itemName: item.name,
      quantity: additionalCartons,
      unit: item.unit,
      unitPrice: item.unitCostPrice,
      totalValueGHS: additionalCartons * item.unitCostPrice,
      customerOrSupplier: 'Admin Inbox Quick Restock',
      voiceTranscript: `Restocked ${additionalCartons} ${item.unit} via Admin Inbox`,
      detectedLanguage: 'English' as const,
    };

    try {
      await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      await fetch('/api/transactions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      loadData();
      setToastMessage({
        title: `Restocked ${additionalCartons} Cartons`,
        desc: `${item.name} is now at ${updatedStock} ${item.unit}. Stamped in Log Book.`,
        type: 'success',
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  // Log Spoilage from Inbox
  const handleLogSpoilage = async (itemId: string, cartons: number, reason: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;
    const newStock = Math.max(0, item.currentStock - cartons);
    const updatedItem = { ...item, currentStock: newStock };
    setInventory((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));

    const newTx = {
      type: 'spoilage' as const,
      itemId: item.id,
      itemName: item.name,
      quantity: -cartons,
      unit: item.unit,
      unitPrice: item.unitCostPrice,
      totalValueGHS: cartons * item.unitCostPrice,
      customerOrSupplier: `Spoilage: ${reason}`,
      voiceTranscript: `Reported spoilage of ${cartons} ${item.unit}: ${reason}`,
      detectedLanguage: 'English' as const,
    };

    try {
      await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      await fetch('/api/transactions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      loadData();
      setToastMessage({
        title: `Spoilage Condemned (-${cartons} Cartons)`,
        desc: `${item.name} written off. Loss: GH₵ ${(cartons * item.unitCostPrice).toLocaleString()}.`,
        type: 'alert',
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  // Secret Vault: Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch('/api/transactions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Secret Vault: Bulk Delete Transactions
  const handleBulkDeleteTransactions = async (ids: string[]) => {
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
    try {
      await fetch('/api/transactions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Secret Vault: Delete Inventory Item
  const handleDeleteInventoryItem = async (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch('/api/inventory/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Secret Vault: Clear all transactions
  const handleClearAllTransactions = async () => {
    setTransactions([]);
    try {
      await fetch('/api/transactions/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Header Titles
  const getTabMeta = (tab: AppTab) => {
    switch (tab) {
      case 'inbox':
        return { title: 'Admin Inbox & Alerts', subtitle: "Live Out of Stock & Cold Store Spoilt Goods" };
      case 'voice':
        return { title: 'Voice Stockkeeper', subtitle: 'AI Voice Cockpit with Kwame & Isaac' };
      case 'inventory':
        return { title: 'Cold Room Inventory', subtitle: 'Live Chamber Stock Balances & Carton Valuation' };
      case 'manual-log':
        return { title: 'Manual Log & Stock', subtitle: 'Boss Direct Manual Entries & Shift Notes' };
      case 'freezer-bays':
        return { title: 'Freezer Bays', subtitle: `Chambers 1-${freezerBays.length} • Edit Bay Names, Add Chambers & Live Stock` };
      case 'secret-vault':
        return { title: 'Secret Tab (Face ID Protected)', subtitle: 'Executive Biometric Clearance & Record Eraser' };
      case 'admin-stock':
        return { title: 'Admin Stock Desk', subtitle: 'Direct Stock Reconciliation & Price Management' };
      case 'spoilage':
        return { title: 'Waste & Spoilage Log', subtitle: 'Condemned Cartons & Defrost Damage Records' };
      case 'all-records':
        return {
          title: 'All Records & Transactions Ledger',
          subtitle: 'Tabular Form of All Sold Goods, Restocked Deliveries & Stock History',
        };
      default:
        return { title: 'Dashboard', subtitle: 'Paradise Fisheries' };
    }
  };

  const currentMeta = getTabMeta(currentTab);

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 flex font-['Plus_Jakarta_Sans',sans-serif] selection:bg-blue-600 selection:text-white">
      {/* 1. Left Side Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        voiceAudioEnabled={voiceAudioEnabled}
        setVoiceAudioEnabled={setVoiceAudioEnabled}
        isProcessingVoice={isProcessingVoice}
        lowStockCount={stats.lowStockAlertsCount}
        spoilageCount={spoilageCount}
        transactionsCount={transactions.length}
        adminName={currentBoss}
        onSelectBoss={(boss) => setCurrentBoss(boss as 'Mama Gloria' | 'Boss Isaac')}
        bayCount={freezerBays.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOpenMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        isSecretVaultUnlocked={isSecretVaultUnlocked}
      />

      {/* 2. Main Application Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Control Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              id="mobile-nav-toggle-btn"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb & View Title */}
            <div className="truncate">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span
                  className="hover:text-gray-700 cursor-pointer"
                  onClick={() => setCurrentTab('voice')}
                >
                  Paradise Fisheries
                </span>
                <span>/</span>
                <span className="text-gray-900 font-bold">{currentMeta.title}</span>
              </div>
              <p className="text-[11px] text-gray-500 truncate hidden sm:block">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Top Right Status Badges */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Freezer Health Status */}
            <div
              onClick={() => setCurrentTab('freezer-bays')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/60 text-xs font-semibold text-blue-900 cursor-pointer hover:bg-blue-100/70 transition-colors"
            >
              <Snowflake className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
              <span>{freezerBays.length} Chambers Steady at -21°C</span>
            </div>

            {/* Total Stock Pill */}
            <div
              onClick={() => setCurrentTab('inventory')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <span>Total: <strong>{stats.totalCartonsInStock}</strong> ctns</span>
            </div>

            {/* Add Product Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-white border border-gray-200 shadow-md flex items-start justify-between gap-3 animate-slide-down">
              <div className="flex items-start gap-3">
                {toastMessage.type === 'alert' ? (
                  <div className="w-8 h-8 rounded-lg bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-black text-gray-900">{toastMessage.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {toastMessage.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setToastMessage(null)}
                className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: INBOX & ALERTS (Out of Stock & Spoiled items) */}
          {currentTab === 'inbox' && (
            <InboxAlerts
              inventory={inventory}
              transactions={transactions}
              onQuickRestock={handleQuickRestock}
              onLogSpoilage={handleLogSpoilage}
              onSwitchToVoice={() => setCurrentTab('voice')}
              adminName={currentBoss}
            />
          )}

          {/* TAB 2: VOICE STOCKKEEPER (Mic Voice Icon) */}
          {currentTab === 'voice' && (
            <VoiceStockkeeper
              lang={lang}
              stats={stats}
              voiceAudioEnabled={voiceAudioEnabled}
              onVoiceResultApplied={handleVoiceResultApplied}
              isProcessing={isProcessingVoice}
              setIsProcessing={setIsProcessingVoice}
            />
          )}

          {/* TAB 3: COLD ROOM INVENTORY (Customized Icon) */}
          {currentTab === 'inventory' && (
            <InventoryGrid
              items={inventory}
              lang={lang}
              onUpdateStock={handleUpdateStock}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onEditItem={(item) => {
                setEditingItem(item);
                setIsEditModalOpen(true);
              }}
              externalSearchQuery={searchQuery}
            />
          )}

          {/* TAB 4: MANUAL LOG & STOCK TAB (Boss Direct Input) */}
          {currentTab === 'manual-log' && (
            <div className="space-y-6">
              <ManualStockKeeper
                inventory={inventory}
                transactions={transactions}
                onUpdateStock={handleManualStockSet}
                onAddTransaction={handleAddManualTransaction}
                onOpenEditModal={(item) => {
                  setEditingItem(item);
                  setIsEditModalOpen(true);
                }}
                adminName={currentBoss}
                bays={freezerBays}
              />

              {/* Seamless integration of Daily Shift Log Book */}
              <div className="pt-4">
                <StockKeepingLogBook
                  inventory={inventory}
                  transactions={transactions}
                  adminName={currentBoss}
                  onRefreshData={loadData}
                />
              </div>
            </div>
          )}

          {/* TAB 5: FREEZER BAYS (Frozen Icon: Snowflake, Edit Bay Names & Live Stock) */}
          {currentTab === 'freezer-bays' && (
            <ColdRoomZones
              items={inventory}
              lang={lang}
              bays={freezerBays}
              onUpdateBay={handleUpdateBay}
              onUpdateItemStock={async (item, newStock) => {
                await handleManualStockSet(item.id, newStock, `Adjusted in chamber ${item.coldRoomZone}`);
              }}
              onReassignItemBay={handleReassignItemBay}
            />
          )}

          {/* TAB 6: SECRET TAB (Face ID Biometric Clearance & Record Eraser) */}
          {currentTab === 'secret-vault' && (
            <SecretRecordsVault
              isUnlocked={isSecretVaultUnlocked}
              onUnlockSuccess={() => setIsSecretVaultUnlocked(true)}
              onLockVault={() => setIsSecretVaultUnlocked(false)}
              transactions={transactions}
              inventory={inventory}
              onDeleteTransaction={handleDeleteTransaction}
              onBulkDeleteTransactions={handleBulkDeleteTransactions}
              onDeleteInventoryItem={handleDeleteInventoryItem}
              onClearAllTransactions={handleClearAllTransactions}
              onRefreshData={loadData}
              adminName={currentBoss}
            />
          )}

          {/* TAB 7: ADMIN STOCK DESK */}
          {currentTab === 'admin-stock' && (
            <ManualStockKeeper
              inventory={inventory}
              transactions={transactions}
              onUpdateStock={handleManualStockSet}
              onAddTransaction={handleAddManualTransaction}
              onOpenEditModal={(item) => {
                setEditingItem(item);
                setIsEditModalOpen(true);
              }}
              adminName={currentBoss}
              bays={freezerBays}
            />
          )}

          {/* TAB 8: SPOILAGE & WASTE LOG */}
          {currentTab === 'spoilage' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                    <span>Cold Store Spoilage & Condemned Stock Register</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Defrost damage, puncture bursts, and carton write-offs stamped with date and time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTab('inbox')}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors"
                  >
                    + Report Spoilage in Inbox
                  </button>
                  <button
                    onClick={() => setCurrentTab('voice')}
                    className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5 text-blue-400" />
                    <span>Report by Voice</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Registered Spoilage Events ({spoilageCount})</span>
                  <span>Total Loss: GH₵ {transactions.filter((t) => t.type === 'spoilage').reduce((a, b) => a + b.totalValueGHS, 0).toLocaleString()}</span>
                </div>
                {spoilageCount === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-xs flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="font-bold text-gray-800">No spoilage registered!</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">All cartons in chambers are in optimal deep-freeze condition.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {transactions
                      .filter((t) => t.type === 'spoilage')
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50"
                        >
                          <div>
                            <div className="flex items-center gap-2 font-bold text-gray-900">
                              <span>{tx.itemName}</span>
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-black border border-rose-200">
                                {tx.quantity} {tx.unit}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
                              {new Date(tx.timestamp).toLocaleDateString()} at{' '}
                              {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {tx.customerOrSupplier ? ` • ${tx.customerOrSupplier}` : ''}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="font-bold text-rose-600">
                              Loss: GH₵ {tx.totalValueGHS.toLocaleString()}
                            </span>
                            <p className="text-[10px] text-gray-400">Written Off</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: ALL RECORDS LEDGER (TABULAR FORM) */}
          {currentTab === 'all-records' && (
            <AllRecordsTable
              transactions={transactions}
              inventory={inventory}
              onRefreshData={loadData}
              onNavigateToVoice={() => setCurrentTab('voice')}
              onNavigateToManualLog={() => setCurrentTab('manual-log')}
            />
          )}
        </main>

        {/* Floating Quick Voice Button when on other tabs */}
        {currentTab !== 'voice' && (
          <button
            id="floating-voice-quick-btn"
            onClick={() => setCurrentTab('voice')}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-blue-600 text-white font-black shadow-xl hover:scale-105 transition-transform ring-4 ring-blue-200"
          >
            <Mic className="w-5 h-5 text-white" />
            <span>Speak to Voice Stockkeeper</span>
          </button>
        )}

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNewItem}
          lang={lang}
          bays={freezerBays}
        />

        {/* Edit Item Modal */}
        <EditItemModal
          isOpen={isEditModalOpen}
          item={editingItem}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveEditedItem}
          bays={freezerBays}
        />

        {/* Footer */}
        <footer className="mt-auto border-t border-gray-200 bg-white py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-black text-gray-900 uppercase">Paradise Fisheries</span>
              <span className="text-blue-600 font-bold">•</span>
              <span>Tema Fishing Harbour & Cold Storage Hub</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-gray-800">Voice Stockkeeper Active</span>
              </span>
              <span>•</span>
              <span className="font-medium">Direct Voice & Manual Control</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
