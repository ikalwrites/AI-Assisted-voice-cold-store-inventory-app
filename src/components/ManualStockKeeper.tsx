import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  PackagePlus,
  PackageMinus,
  ClipboardCheck,
  AlertTriangle,
  RotateCcw,
  Check,
  Search,
  Filter,
  User,
  DollarSign,
  Layers,
  ArrowUpDown,
  Edit3,
  Calendar,
  Building2,
  TrendingUp,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { InventoryItem, TransactionRecord, TransactionType, FreezerBayConfig } from '../types';

interface ManualStockKeeperProps {
  inventory: InventoryItem[];
  transactions: TransactionRecord[];
  onUpdateStock: (itemId: string, newStock: number, reason?: string) => Promise<void>;
  onAddTransaction: (transaction: Omit<TransactionRecord, 'id' | 'timestamp'>) => Promise<void>;
  onOpenEditModal: (item: InventoryItem) => void;
  adminName?: string;
  bays?: FreezerBayConfig[];
}

export const ManualStockKeeper: React.FC<ManualStockKeeperProps> = ({
  inventory,
  transactions,
  onUpdateStock,
  onAddTransaction,
  onOpenEditModal,
  adminName = 'Boss Isaac',
  bays = []
}) => {
  // Selected item for transaction form
  const [selectedItemId, setSelectedItemId] = useState<string>(inventory[0]?.id || '');
  const [actionType, setActionType] = useState<TransactionType>('restock');
  const [quantity, setQuantity] = useState<number>(10);
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [partyName, setPartyName] = useState<string>('Tema Harbor Cold Van');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Consignment Delivery'>('Cash');
  const [assignedStocker, setAssignedStocker] = useState<string>('Kwame (Lead Stockkeeper)');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick Audit sheet state
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);

  const selectedItem = inventory.find(i => i.id === selectedItemId) || inventory[0];

  // Price calculation for manual entry
  const effectivePrice = typeof customPrice === 'number'
    ? customPrice
    : (actionType === 'sale' ? (selectedItem?.unitSellingPrice || 0) : (selectedItem?.unitCostPrice || 0));
  const totalValueGHS = Math.abs(quantity) * effectivePrice;

  // Filtered items for audit sheet
  const filteredInventory = inventory.filter(item => {
    let matchesZone = zoneFilter === 'all';
    if (!matchesZone) {
      const z = (item.coldRoomZone || '').toLowerCase();
      matchesZone = z === zoneFilter.toLowerCase() || z.includes(zoneFilter.toLowerCase());
    }
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.localNameTwi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.assignedStocker || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.coldRoomZone || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesZone && matchesSearch;
  });

  // KPI Calculations
  const totalCartons = inventory.reduce((acc, curr) => acc + curr.currentStock, 0);
  const totalValuationGHS = inventory.reduce((acc, curr) => acc + (curr.currentStock * curr.unitCostPrice), 0);
  const lowStockCount = inventory.filter(i => i.currentStock <= i.minThreshold).length;
  const recentManualTransactions = transactions.slice(0, 5);

  const handleCommitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;

    setIsSubmitting(true);
    try {
      let stockDelta = quantity;
      if (actionType === 'sale' || actionType === 'spoilage') {
        stockDelta = -quantity;
      }

      const newStock = Math.max(0, selectedItem.currentStock + stockDelta);

      // Record transaction
      await onAddTransaction({
        type: actionType,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        quantity: actionType === 'sale' || actionType === 'spoilage' ? -quantity : quantity,
        unit: selectedItem.unit,
        unitPrice: effectivePrice,
        totalValueGHS,
        customerOrSupplier: `${partyName} [Stocker: ${assignedStocker}]${notes ? ` - ${notes}` : ''}`,
        paymentMethod
      });

      // Update item stock
      await onUpdateStock(selectedItem.id, newStock, `Manual entry: ${actionType.toUpperCase()}`);

      setSuccessToast(`Logged ${quantity} ${selectedItem.unit} of ${selectedItem.name} (${actionType.toUpperCase()}). New stock: ${newStock}`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Reset fields
      setNotes('');
    } catch (err) {
      console.error('Failed to commit manual stock record', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdjust = async (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, item.currentStock + delta);
    setSyncingItemId(item.id);
    try {
      const type: TransactionType = delta > 0 ? 'restock' : 'sale';
      await onAddTransaction({
        type,
        itemId: item.id,
        itemName: item.name,
        quantity: delta,
        unit: item.unit,
        unitPrice: delta > 0 ? item.unitCostPrice : item.unitSellingPrice,
        totalValueGHS: Math.abs(delta) * (delta > 0 ? item.unitCostPrice : item.unitSellingPrice),
        customerOrSupplier: `Floor Quick Count (${adminName})`,
        paymentMethod: 'Cash'
      });
      await onUpdateStock(item.id, newStock, `Quick ${delta > 0 ? '+' : ''}${delta}`);
    } finally {
      setSyncingItemId(null);
    }
  };

  const handleSyncPhysicalCount = async (item: InventoryItem) => {
    const counted = physicalCounts[item.id];
    if (counted === undefined || counted === item.currentStock) return;

    setSyncingItemId(item.id);
    const diff = counted - item.currentStock;
    try {
      await onAddTransaction({
        type: 'adjustment',
        itemId: item.id,
        itemName: item.name,
        quantity: diff,
        unit: item.unit,
        unitPrice: item.unitCostPrice,
        totalValueGHS: Math.abs(diff) * item.unitCostPrice,
        customerOrSupplier: `Physical Stock Count Reconciled by ${adminName}`,
        paymentMethod: 'Cash'
      });
      await onUpdateStock(item.id, counted, 'Physical Stock Audit Reconciliation');
      setSuccessToast(`Reconciled ${item.name}: Stock set to ${counted} ${item.unit}`);
      setTimeout(() => setSuccessToast(null), 3500);
    } finally {
      setSyncingItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Company Header */}
      <div className="bg-[#1F2937] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              Paradise Fisheries • Manual Stock Keeping Desk
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Admin Stock Register & Physical Count Audit
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Manually receive deliveries, log store dispatches, adjust inventory counts, and assign cold chamber stockers.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/60">
            <User className="w-4 h-4 text-[#F97316]" />
            <div className="text-xs">
              <span className="text-slate-400 block">Active Supervisor:</span>
              <span className="font-bold text-white">{adminName}</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Cartons In Stock</span>
            <span className="text-lg sm:text-xl font-bold text-white">{totalCartons.toLocaleString()}</span>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] font-semibold text-slate-400 block">Chamber Stock Valuation</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400">GH₵ {totalValuationGHS.toLocaleString()}</span>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] font-semibold text-slate-400 block">Low Stock Items</span>
            <span className={`text-lg sm:text-xl font-bold ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {lowStockCount} items
            </span>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] font-semibold text-slate-400 block">Assigned Lead Stockers</span>
            <span className="text-xs sm:text-sm font-bold text-[#F97316]">Kwame & Isaac</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </motion.div>
      )}

      {/* Main 2-Column Grid: Form & Physical Count Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Manual Entry Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[#E5DEC9] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EBE3D5] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Manual Stock Transaction</h3>
                  <p className="text-[11px] text-slate-500">Record intake, customer sale, or floor deduction</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCommitTransaction} className="space-y-4">
              {/* Transaction Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Transaction Action
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setActionType('restock'); setPartyName('Tema Harbor Cold Van'); }}
                    className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${actionType === 'restock' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20' : 'bg-white border-[#E5DEC9] text-slate-600 hover:bg-[#FAF7EE]'}`}
                  >
                    <PackagePlus className="w-4 h-4 text-emerald-600" />
                    <span>Intake (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActionType('sale'); setPartyName('Walk-in Customer / Chop Bar'); }}
                    className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${actionType === 'sale' ? 'bg-orange-50 border-[#C2410C] text-[#C2410C] ring-2 ring-orange-500/20' : 'bg-white border-[#E5DEC9] text-slate-600 hover:bg-[#FAF7EE]'}`}
                  >
                    <PackageMinus className="w-4 h-4 text-[#C2410C]" />
                    <span>Sale (-)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActionType('spoilage'); setPartyName('Damaged / Defrosted in Bay'); }}
                    className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${actionType === 'spoilage' ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-500/20' : 'bg-white border-[#E5DEC9] text-slate-600 hover:bg-[#FAF7EE]'}`}
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Damaged (-)</span>
                  </button>
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Product Item
                </label>
                <select
                  value={selectedItemId}
                  onChange={e => {
                    setSelectedItemId(e.target.value);
                    setCustomPrice('');
                  }}
                  className="w-full px-3 py-2.5 bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                >
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.currentStock} {item.unit} in {item.coldRoomZone.split(' - ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Item Quick Stats preview */}
              {selectedItem && (
                <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#E5DEC9] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="w-10 h-10 rounded-lg object-cover border border-[#D9CEB8]"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/src/assets/images/coldstore_hero_1788486806736.jpg'; }}
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">{selectedItem.name}</span>
                      <span className="text-slate-500 text-[11px]">{selectedItem.coldRoomZone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Current Count</span>
                    <span className="font-extrabold text-sm text-[#C2410C]">{selectedItem.currentStock} {selectedItem.unit}</span>
                  </div>
                </div>
              )}

              {/* Quantity & Quick Pill selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Quantity ({selectedItem?.unit || 'cartons'})
                  </label>
                  <div className="flex gap-1">
                    {[5, 10, 20, 50].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuantity(amt)}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition ${quantity === amt ? 'bg-[#C2410C] text-white border-[#C2410C]' : 'bg-white text-slate-600 border-[#E5DEC9] hover:bg-slate-100'}`}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
              </div>

              {/* Price & Computed Total */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Price (GH₵)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={effectivePrice}
                    onChange={e => setCustomPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Value (GH₵)
                  </label>
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-extrabold text-emerald-900">
                    GH₵ {totalValueGHS.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Party Name & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer / Supplier / Van
                  </label>
                  <input
                    type="text"
                    value={partyName}
                    onChange={e => setPartyName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    placeholder="e.g. Tema Van / Customer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  >
                    <option value="Cash">Cash at Counter</option>
                    <option value="Mobile Money">Mobile Money (MTN/Telecel)</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Consignment Delivery">Van Consignment</option>
                  </select>
                </div>
              </div>

              {/* Stocker Assigned */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stocker Handling Shift
                </label>
                <select
                  value={assignedStocker}
                  onChange={e => setAssignedStocker(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                >
                  <option value="Kwame (Lead Stockkeeper)">Kwame (Lead Stockkeeper)</option>
                  <option value="Isaac (Cold Fleet Dispatcher)">Isaac (Cold Fleet Dispatcher)</option>
                  <option value="Mama Gloria (Executive Director)">Mama Gloria (Executive Director)</option>
                  <option value="Boss Isaac (Proprietor)">Boss Isaac (Proprietor)</option>
                  <option value="Kweku Mensah (Freezer Bay Staff)">Kweku Mensah (Freezer Bay Staff)</option>
                </select>
              </div>

              {/* Reference note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference Note / Waybill # (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Waybill #TM-4921 or Box batch #B2"
                  className="w-full px-3 py-1.5 bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-900/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Logging Transaction...' : 'Commit Stock Record'}
              </button>
            </form>
          </div>

          {/* Recent Manual Logs Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5DEC9] shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-[#C2410C]" />
              Recent Audit & Transaction Records
            </h4>
            <div className="space-y-2">
              {recentManualTransactions.map((tx) => (
                <div key={tx.id} className="p-2.5 rounded-xl bg-[#FCF9F1] border border-[#EAE3D2] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{tx.itemName}</span>
                    <span className="text-[10px] text-slate-500">{tx.customerOrSupplier || tx.type}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${tx.quantity > 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {tx.unit}
                    </span>
                    <span className="text-[10px] text-slate-500">GH₵ {tx.totalValueGHS.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {recentManualTransactions.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No manual transactions logged yet today.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Physical Stock Audit Sheet & Floor Count (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E5DEC9] shadow-sm space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE3D5] pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Physical Stock Count & Floor Audit Sheet
                </h3>
                <p className="text-xs text-slate-500">Verify actual cold chamber stock against the digital register</p>
              </div>

              {/* Bay Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setZoneFilter('all')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition shrink-0 ${zoneFilter === 'all' ? 'bg-[#C2410C] text-white border-[#C2410C]' : 'bg-[#FAF7EE] text-slate-700 border-[#E5DEC9]'}`}
                >
                  All Bays
                </button>
                {bays && bays.length > 0 ? (
                  bays.map((bay, idx) => {
                    const isSelected = zoneFilter === bay.name;
                    return (
                      <button
                        key={bay.id}
                        type="button"
                        onClick={() => setZoneFilter(isSelected ? 'all' : bay.name)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition shrink-0 ${isSelected ? 'bg-[#C2410C] text-white border-[#C2410C]' : 'bg-[#FAF7EE] text-slate-700 border-[#E5DEC9]'}`}
                        title={bay.name}
                      >
                        Bay {idx + 1}: {bay.name.replace(/Freezer Bay \d+\s*[-–]?\s*/i, '') || bay.name}
                      </button>
                    );
                  })
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setZoneFilter('Bay 1')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition shrink-0 ${zoneFilter === 'Bay 1' ? 'bg-[#C2410C] text-white border-[#C2410C]' : 'bg-[#FAF7EE] text-slate-700 border-[#E5DEC9]'}`}
                    >
                      Bay 1 (Fish)
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoneFilter('Bay 2')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition shrink-0 ${zoneFilter === 'Bay 2' ? 'bg-[#C2410C] text-white border-[#C2410C]' : 'bg-[#FAF7EE] text-slate-700 border-[#E5DEC9]'}`}
                    >
                      Bay 2 (Poultry)
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoneFilter('Bay 3')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition shrink-0 ${zoneFilter === 'Bay 3' ? 'bg-[#C2410C] text-white border-[#C2410C]' : 'bg-[#FAF7EE] text-slate-700 border-[#E5DEC9]'}`}
                    >
                      Bay 3 (Deli)
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoneFilter('Bay 4')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition shrink-0 ${zoneFilter === 'Bay 4' ? 'bg-[#C2410C] text-white border-[#C2410C]' : 'bg-[#FAF7EE] text-slate-700 border-[#E5DEC9]'}`}
                    >
                      Bay 4 (Meat)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by product name, Twi name, or stocker..."
                className="w-full pl-9 pr-4 py-2 bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>

            {/* Audit Table */}
            <div className="space-y-3">
              {filteredInventory.map((item) => {
                const enteredCount = physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : item.currentStock;
                const variance = enteredCount - item.currentStock;
                const isSyncing = syncingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#FFFDF9] rounded-xl border border-[#E5DEC9] hover:border-[#C2410C]/40 transition shadow-sm space-y-3"
                  >
                    {/* Top Row: Thumbnail, Name, Prices, Edit Button */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#D9CEB8] shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/src/assets/images/coldstore_hero_1788486806736.jpg'; }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                            {item.currentStock <= item.minThreshold && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">
                                Low Stock
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 italic">{item.localNameTwi}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-600">
                            <span className="font-semibold text-[#C2410C] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/60">{item.coldRoomZone}</span>
                            <span>•</span>
                            <span>Stocker: <strong className="text-slate-800">{item.assignedStocker || 'Kwame'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Prices & Edit trigger */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Selling Price</span>
                          <span className="font-bold text-xs text-slate-900">GH₵ {item.unitSellingPrice}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(item)}
                          className="p-2 bg-[#FAF7EE] hover:bg-[#C2410C] text-slate-700 hover:text-white rounded-xl border border-[#E5DEC9] transition flex items-center gap-1.5 text-xs font-semibold"
                          title="Manually Update Price, Stocker or Picture"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Current count vs Physical audit input & quick adjust */}
                    <div className="pt-2.5 border-t border-[#EAE3D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7EE]/60 p-2 rounded-lg">
                      {/* Current Register */}
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Digital Count:</span>
                          <span className="font-extrabold text-sm text-slate-900">{item.currentStock} {item.unit}</span>
                        </div>

                        {/* Quick +/- buttons */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E5DEC9]">
                          <button
                            type="button"
                            disabled={isSyncing || item.currentStock <= 0}
                            onClick={() => handleQuickAdjust(item, -1)}
                            className="p-1 text-slate-600 hover:text-[#C2410C] hover:bg-orange-50 rounded transition disabled:opacity-30"
                            title="Minus 1 carton"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-slate-400 px-1">±1</span>
                          <button
                            type="button"
                            disabled={isSyncing}
                            onClick={() => handleQuickAdjust(item, 1)}
                            className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition disabled:opacity-30"
                            title="Plus 1 carton"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Physical Floor Count Input + Sync Button */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-600">Floor Count:</span>
                          <input
                            type="number"
                            min="0"
                            value={enteredCount}
                            onChange={e => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setPhysicalCounts({ ...physicalCounts, [item.id]: val });
                            }}
                            className="w-16 px-2 py-1 bg-white border border-[#D9CEB8] rounded-lg text-xs font-bold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                          />
                        </div>

                        {/* Variance badge */}
                        {variance !== 0 ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${variance > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {variance > 0 ? `+${variance}` : variance} diff
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 px-1.5 py-0.5">
                            Balanced
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={isSyncing || variance === 0}
                          onClick={() => handleSyncPhysicalCount(item)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-40 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Sync
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredInventory.length === 0 && (
                <div className="p-8 text-center bg-[#FAF7EE] rounded-xl border border-dashed border-[#D9CEB8]">
                  <p className="text-xs font-semibold text-slate-500">No items match your filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
