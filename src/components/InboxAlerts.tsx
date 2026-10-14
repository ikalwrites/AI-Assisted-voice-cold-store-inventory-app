import React, { useState } from 'react';
import {
  Inbox,
  AlertTriangle,
  PackageX,
  Trash2,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Snowflake,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Mic,
  DollarSign,
  Clock,
  ShieldAlert,
  Building2,
  Calendar
} from 'lucide-react';
import { InventoryItem, TransactionRecord } from '../types';

interface InboxAlertsProps {
  inventory: InventoryItem[];
  transactions: TransactionRecord[];
  onQuickRestock: (item: InventoryItem, additionalCartons: number) => Promise<void>;
  onLogSpoilage: (itemId: string, cartons: number, reason: string) => Promise<void>;
  onSwitchToVoice: () => void;
  adminName?: string;
}

export const InboxAlerts: React.FC<InboxAlertsProps> = ({
  inventory,
  transactions,
  onQuickRestock,
  onLogSpoilage,
  onSwitchToVoice,
  adminName = 'Boss Isaac'
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'out-of-stock' | 'spoiled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestockItem, setSelectedRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [isRestocking, setIsRestocking] = useState(false);

  // New Spoilage Form modal/drawer state
  const [showSpoilageModal, setShowSpoilageModal] = useState(false);
  const [spoilageItemId, setSpoilageItemId] = useState<string>(inventory[0]?.id || '');
  const [spoilageQty, setSpoilageQty] = useState<number>(2);
  const [spoilageReason, setSpoilageReason] = useState<string>('Broken seal / packaging burst in chamber');
  const [isSubmittingSpoilage, setIsSubmittingSpoilage] = useState(false);

  // 1. Compute Out of Stock & Low Stock items
  const outOfStockItems = inventory.filter((item) => item.currentStock <= item.minThreshold);
  const zeroStockItems = inventory.filter((item) => item.currentStock <= 0);

  // 2. Compute Spoiled Transactions
  const spoilageTransactions = transactions.filter((t) => t.type === 'spoilage');
  const totalSpoilageCartons = spoilageTransactions.reduce((acc, t) => acc + Math.abs(t.quantity), 0);
  const totalSpoilageLossGHS = spoilageTransactions.reduce((acc, t) => acc + t.totalValueGHS, 0);

  // Filtered lists based on search
  const filteredOutOfStock = outOfStockItems.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.localNameTwi && i.localNameTwi.toLowerCase().includes(searchQuery.toLowerCase())) ||
    i.coldRoomZone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSpoilage = spoilageTransactions.filter((t) =>
    t.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.voiceTranscript && t.voiceTranscript.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.customerOrSupplier && t.customerOrSupplier.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRestockSubmit = async (item: InventoryItem, qty: number) => {
    setIsRestocking(true);
    try {
      await onQuickRestock(item, qty);
      setSelectedRestockItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRestocking(false);
    }
  };

  const handleCreateSpoilage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spoilageItemId || spoilageQty <= 0) return;
    setIsSubmittingSpoilage(true);
    try {
      await onLogSpoilage(spoilageItemId, spoilageQty, spoilageReason);
      setShowSpoilageModal(false);
      setSpoilageQty(2);
      setSpoilageReason('Broken seal / packaging burst in chamber');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSpoilage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs">
              <Inbox className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">
                  Admin Inbox & Critical Alerts
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {outOfStockItems.length + spoilageTransactions.length} items flagged
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time monitor tracking completely out-of-stock items, critical buffers, and cold store spoilage.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSpoilageModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>+ Report Spoiled Cartons</span>
          </button>

          <button
            onClick={onSwitchToVoice}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
          >
            <Mic className="w-4 h-4 text-blue-400" />
            <span>Restock by Voice</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Out of Stock Card */}
        <div
          onClick={() => setActiveFilter('out-of-stock')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'out-of-stock'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Out of Stock / Buffer Low
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <PackageX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">
              {outOfStockItems.length}
            </span>
            <span className="text-xs font-semibold text-amber-700">
              ({zeroStockItems.length} at zero)
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Products needing immediate supplier delivery.
          </p>
        </div>

        {/* Spoilt / Damaged Stock Card */}
        <div
          onClick={() => setActiveFilter('spoiled')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'spoiled'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20 shadow-xs'
              : 'bg-white border-gray-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Damaged & Spoilt Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">
              {totalSpoilageCartons} ctns
            </span>
            <span className="text-xs font-semibold text-gray-500">
              (GH₵ {totalSpoilageLossGHS.toLocaleString()})
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Cartons written off due to defrost or damage.
          </p>
        </div>

        {/* Total Cold Chambers Status */}
        <div
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20 shadow-xs'
              : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Active Alerts
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">
              {outOfStockItems.length + spoilageTransactions.length}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              Chambers: -21°C OK
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Click to view all unified inbox notifications.
          </p>
        </div>
      </div>

      {/* 3. Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Inbox Items ({outOfStockItems.length + spoilageTransactions.length})
          </button>
          <button
            onClick={() => setActiveFilter('out-of-stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === 'out-of-stock'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🚨 Out of Stock ({outOfStockItems.length})
          </button>
          <button
            onClick={() => setActiveFilter('spoiled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === 'spoiled'
                ? 'bg-rose-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⚠️ Spoilt & Damaged ({spoilageTransactions.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items or chambers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 4. SECTION: Out of Stock & Low Stock Items */}
      {(activeFilter === 'all' || activeFilter === 'out-of-stock') && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="p-4 bg-amber-50/60 border-b border-amber-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                Out of Stock & Low Stock Items ({filteredOutOfStock.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-800">
              Action Required: Quick Restock
            </span>
          </div>

          {filteredOutOfStock.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="font-bold text-gray-700">No products out of stock!</p>
              <p className="text-[11px] text-gray-400 mt-0.5">All inventory items are above safety re-order levels.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredOutOfStock.map((item) => {
                const isZero = item.currentStock <= 0;
                return (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                          {isZero ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                              OUT OF STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                              LOW STOCK
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="text-[#C2410C] font-semibold">{item.localNameTwi}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <span>{item.coldRoomZone}</span>
                          </span>
                          <span>•</span>
                          <span>Selling: GH₵ {item.unitSellingPrice.toLocaleString()}/ctn</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-black text-gray-900">
                          {item.currentStock} / <span className="text-gray-400 text-xs font-normal">Min {item.minThreshold}</span> {item.unit}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          Shortfall: {Math.max(0, item.minThreshold - item.currentStock)} cartons
                        </span>
                      </div>

                      {/* Quick restock button */}
                      <button
                        onClick={() => {
                          setSelectedRestockItem(item);
                          setRestockQty(25);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. SECTION: Spoilt & Damaged Stock Records */}
      {(activeFilter === 'all' || activeFilter === 'spoiled') && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="p-4 bg-rose-50/60 border-b border-rose-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-700" />
              <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider">
                Cold Store Spoilage & Damaged Cartons ({filteredSpoilage.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-rose-800">
              Total Loss: GH₵ {totalSpoilageLossGHS.toLocaleString()}
            </span>
          </div>

          {filteredSpoilage.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="font-bold text-gray-700">No spoilage recorded today!</p>
              <p className="text-[11px] text-gray-400 mt-0.5">All cartons in chambers are intact and verified chilled.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredSpoilage.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{tx.itemName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800">
                        -{Math.abs(tx.quantity)} {tx.unit}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <span>•</span>
                      <span className="text-gray-600">
                        {tx.voiceTranscript || tx.customerOrSupplier || 'Condemned carton'}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="font-black text-rose-600 text-sm">
                      Loss: GH₵ {tx.totalValueGHS.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Condemned & Written Off
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Restock Modal */}
      {selectedRestockItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-slide-down">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Restock Product</h3>
                <p className="text-xs text-gray-500">{selectedRestockItem.name}</p>
              </div>
              <button
                onClick={() => setSelectedRestockItem(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  How many cartons received?
                </label>
                <div className="flex items-center gap-2">
                  {[10, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setRestockQty(qty)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        restockQty === qty
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Or enter exact custom quantity:
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-950">
                <p>
                  <strong>Resulting stock:</strong> {selectedRestockItem.currentStock} + {restockQty} ={' '}
                  <span className="font-bold text-blue-700">{selectedRestockItem.currentStock + restockQty} {selectedRestockItem.unit}</span>
                </p>
                <p className="text-[11px] text-blue-800 mt-1">
                  Will be recorded in the Daily Log Book with exact date & time.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedRestockItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestocking}
                onClick={() => handleRestockSubmit(selectedRestockItem, restockQty)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black disabled:opacity-50"
              >
                {isRestocking ? 'Updating...' : 'Confirm Restock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Spoilage Modal */}
      {showSpoilageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSpoilage}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-slide-down"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-rose-700">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">Report Spoiled / Condemned Stock</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSpoilageModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Spoiled Item:</label>
                <select
                  value={spoilageItemId}
                  onChange={(e) => setSpoilageItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (In stock: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Number of Cartons Spoiled:</label>
                <input
                  type="number"
                  min="1"
                  value={spoilageQty}
                  onChange={(e) => setSpoilageQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Cause of Spoilage / Reason:</label>
                <input
                  type="text"
                  value={spoilageReason}
                  onChange={(e) => setSpoilageReason(e.target.value)}
                  placeholder="e.g., Broken seal, melted defrost, transit puncture"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowSpoilageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSpoilage}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmittingSpoilage ? 'Logging...' : 'Write Off & Condemn'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
