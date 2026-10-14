import React, { useState } from 'react';
import {
  Snowflake,
  Thermometer,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Plus,
  Minus,
  ArrowRight,
  MoveRight,
  Settings2,
  Box,
  Save,
  Trash2,
  Layers,
  Building2,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { InventoryItem, FreezerBayConfig } from '../types';
import { LanguageMode, TRANSLATIONS } from '../locales/translations';

interface ColdRoomZonesProps {
  items: InventoryItem[];
  lang: LanguageMode;
  bays: FreezerBayConfig[];
  onUpdateBay?: (updatedBay: FreezerBayConfig, previousBayName?: string) => Promise<void>;
  onUpdateItemStock?: (item: InventoryItem, newStock: number) => Promise<void>;
  onReassignItemBay?: (item: InventoryItem, newBayZone: string) => Promise<void>;
  onAddBay?: (newBay: Partial<FreezerBayConfig>) => Promise<void>;
  onDeleteBay?: (bayId: string) => Promise<void>;
  onSetBayCount?: (count: number) => Promise<void>;
}

export const ColdRoomZones: React.FC<ColdRoomZonesProps> = ({
  items,
  lang,
  bays,
  onUpdateBay,
  onUpdateItemStock,
  onReassignItemBay,
  onAddBay,
  onDeleteBay,
  onSetBayCount,
}) => {
  const t = TRANSLATIONS[lang];

  // State for editing a bay's name & details
  const [editingBay, setEditingBay] = useState<FreezerBayConfig | null>(null);
  const [bayNameInput, setBayNameInput] = useState('');
  const [bayNameTwiInput, setBayNameTwiInput] = useState('');
  const [bayTempInput, setBayTempInput] = useState<number>(-20);
  const [bayCapacityInput, setBayCapacityInput] = useState<number>(400);
  const [bayPowerInput, setBayPowerInput] = useState<string>('Main Grid (ECG)');
  const [bayStatusInput, setBayStatusInput] = useState<'Optimal Freezing' | 'Warning' | 'Defrosting'>('Optimal Freezing');
  const [isSavingBay, setIsSavingBay] = useState(false);

  // State for creating a new chamber
  const [isAddBayModalOpen, setIsAddBayModalOpen] = useState(false);
  const [newBayName, setNewBayName] = useState('');
  const [newBayNameTwi, setNewBayNameTwi] = useState('');
  const [newBayTemp, setNewBayTemp] = useState<number>(-20);
  const [newBayCapacity, setNewBayCapacity] = useState<number>(450);
  const [newBayPower, setNewBayPower] = useState<string>('Dual ECG + Standby Genset');
  const [isAddingBay, setIsAddingBay] = useState(false);

  // State for scaling the fleet size (e.g., set count directly)
  const [targetFleetCount, setTargetFleetCount] = useState<number>(bays.length || 4);
  const [isScalingFleet, setIsScalingFleet] = useState(false);
  const [fleetFeedback, setFleetFeedback] = useState<string | null>(null);

  // State for deleting/decommissioning a bay
  const [deletingBay, setDeletingBay] = useState<FreezerBayConfig | null>(null);
  const [isDeletingBay, setIsDeletingBay] = useState(false);

  // State for editing an item's stock within a bay
  const [editingStockItem, setEditingStockItem] = useState<InventoryItem | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [isSavingStock, setIsSavingStock] = useState(false);

  // State for moving an item to another bay
  const [movingItem, setMovingItem] = useState<InventoryItem | null>(null);
  const [targetBayZone, setTargetBayZone] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  // Calculations for big corporation cold store facility
  const totalFleetCapacity = bays.reduce((acc, b) => acc + (b.capacityCartons || 0), 0);
  const totalCartonsStored = items.reduce((acc, i) => acc + (i.currentStock || 0), 0);
  const estimatedTonnes = ((totalFleetCapacity * 20) / 1000).toFixed(1); // 20kg per carton avg
  const storedTonnes = ((totalCartonsStored * 20) / 1000).toFixed(1);
  const overallUtilization = totalFleetCapacity > 0 ? Math.min(100, Math.round((totalCartonsStored / totalFleetCapacity) * 100)) : 0;

  // Open Bay Edit modal
  const handleOpenEditBay = (bay: FreezerBayConfig) => {
    setEditingBay(bay);
    setBayNameInput(bay.name);
    setBayNameTwiInput(bay.nameTwi || '');
    setBayTempInput(bay.tempCelsius);
    setBayCapacityInput(bay.capacityCartons);
    setBayPowerInput(bay.powerSource);
    setBayStatusInput(bay.status);
  };

  // Save Bay Name & Configuration
  const handleSaveBay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBay || !onUpdateBay) return;
    setIsSavingBay(true);
    try {
      const updated: FreezerBayConfig = {
        ...editingBay,
        name: bayNameInput,
        nameTwi: bayNameTwiInput,
        tempCelsius: Number(bayTempInput),
        capacityCartons: Number(bayCapacityInput),
        powerSource: bayPowerInput,
        status: bayStatusInput,
      };
      await onUpdateBay(updated, editingBay.name);
      setEditingBay(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingBay(false);
    }
  };

  // Open Add Bay modal
  const handleOpenAddBay = () => {
    const nextBayNum = bays.length + 1;
    setNewBayName(`Chamber ${nextBayNum} - Cold Store`);
    setNewBayNameTwi(`Bea ${nextBayNum} - Awɔ`);
    setNewBayTemp(-20);
    setNewBayCapacity(450);
    setNewBayPower('Dual ECG + Standby Genset');
    setIsAddBayModalOpen(true);
  };

  // Submit Add Bay
  const handleSaveNewBay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddBay) return;
    setIsAddingBay(true);
    try {
      await onAddBay({
        name: newBayName,
        nameTwi: newBayNameTwi,
        tempCelsius: Number(newBayTemp),
        capacityCartons: Number(newBayCapacity),
        powerSource: newBayPower,
        status: 'Optimal Freezing',
      });
      setIsAddBayModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingBay(false);
    }
  };

  // Quick Fleet Size Scaler
  const handleScaleFleet = async (count: number) => {
    if (!onSetBayCount || count < 1 || count > 30) return;
    setIsScalingFleet(true);
    try {
      await onSetBayCount(count);
      setTargetFleetCount(count);
      setFleetFeedback(`Chamber fleet configured to ${count} active chambers.`);
      setTimeout(() => setFleetFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScalingFleet(false);
    }
  };

  // Decommission / Delete Bay
  const handleConfirmDeleteBay = async () => {
    if (!deletingBay || !onDeleteBay) return;
    setIsDeletingBay(true);
    try {
      await onDeleteBay(deletingBay.id);
      setDeletingBay(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingBay(false);
    }
  };

  // Save stock edit for an item in bay
  const handleSaveItemStock = async () => {
    if (!editingStockItem || !onUpdateItemStock) return;
    setIsSavingStock(true);
    try {
      await onUpdateItemStock(editingStockItem, newStockQty);
      setEditingStockItem(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingStock(false);
    }
  };

  // Save moving item to another bay
  const handleSaveItemMove = async () => {
    if (!movingItem || !targetBayZone || !onReassignItemBay) return;
    setIsMoving(true);
    try {
      await onReassignItemBay(movingItem, targetBayZone);
      setMovingItem(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Corporate Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/90 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs">
              <Snowflake className="w-6 h-6 text-blue-600 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {lang === 'tw' ? 'Paradise Fisheries - Cold Chambers & Bea' : 'Paradise Fisheries • Cold Chambers Fleet'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                  Industrial Scale
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                Configure your cold store infrastructure. Manage, add, or resize chambers for high-volume commercial cold chains, monitor sub-zero temperatures, and adjust live stocked inventory.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Add Chamber & Fleet Info */}
        <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto">
          {onAddBay && (
            <button
              onClick={handleOpenAddBay}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Chamber</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{bays.length} Chambers Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Dual ECG + Genset</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FLEET EXPANSION & CAPACITY SIZING CONTROL PANEL */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-700/80">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400">
                Facility Chamber Fleet Controls • Scale Capacity
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Adjust how many active freezer chambers Paradise Fisheries operates to match corporate expansion.
            </p>
          </div>

          {fleetFeedback && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>{fleetFeedback}</span>
            </div>
          )}
        </div>

        {/* Corporate Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-5">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Active Chambers</span>
            <span className="text-xl sm:text-2xl font-black text-white">{bays.length} Chambers</span>
            <span className="text-[10px] text-cyan-400 block mt-0.5">Fully operational bays</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Facility Capacity</span>
            <span className="text-xl sm:text-2xl font-black text-white">{totalFleetCapacity.toLocaleString()} ctns</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">~{estimatedTonnes} Metric Tonnes</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block">Live Cartons Stored</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{totalCartonsStored.toLocaleString()} ctns</span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">~{storedTonnes} Tonnes ({overallUtilization}% full)</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block">Power & Freezing Grid</span>
            <span className="text-xl sm:text-2xl font-black text-white">Sub-Zero -20°C</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">100% Coil Integrity</span>
          </div>
        </div>

        {/* Quick Fleet Sizing Presets & Stepper */}
        {onSetBayCount && (
          <div className="pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-300">Quick Scale Fleet:</span>
              {[4, 6, 8, 12, 16, 20, 24].map((cnt) => (
                <button
                  key={cnt}
                  disabled={isScalingFleet}
                  onClick={() => handleScaleFleet(cnt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    bays.length === cnt
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black ring-2 ring-cyan-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {cnt} Chambers
                </button>
              ))}
            </div>

            {/* Custom Chamber Counter Input */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1">
                <button
                  type="button"
                  onClick={() => setTargetFleetCount((prev) => Math.max(1, prev - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={targetFleetCount}
                  onChange={(e) => setTargetFleetCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-14 text-center bg-transparent text-sm font-black text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setTargetFleetCount((prev) => Math.min(30, prev + 1))}
                  className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                disabled={isScalingFleet || targetFleetCount === bays.length}
                onClick={() => handleScaleFleet(targetFleetCount)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isScalingFleet ? 'Scaling...' : 'Apply Fleet Count'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Grid of Editable Freezer Bays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bays.map((bay, idx) => {
          // Identify items matching this bay dynamically
          const bayIndexNum = idx + 1;
          const bayItems = items.filter((item) => {
            const zone = (item.coldRoomZone || '').toLowerCase();
            return (
              zone === bay.name.toLowerCase() ||
              zone.includes(bay.name.toLowerCase()) ||
              zone.includes(`bay ${bayIndexNum}`) ||
              zone.includes(`chamber ${bayIndexNum}`) ||
              zone.includes(bay.id.toLowerCase())
            );
          });

          const currentStockInBay = bayItems.reduce((acc, i) => acc + i.currentStock, 0);
          const utilizationPct = bay.capacityCartons > 0 ? Math.min(100, Math.round((currentStockInBay / bay.capacityCartons) * 100)) : 0;

          return (
            <div
              key={bay.id}
              className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Bay Header: Editable Name & Temperature */}
                <div className="flex items-start justify-between pb-3 border-b border-gray-100 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-gray-900 leading-snug break-words">
                        {lang === 'tw' && bay.nameTwi ? bay.nameTwi : bay.name}
                      </h3>
                      <button
                        onClick={() => handleOpenEditBay(bay)}
                        className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Bay Name, Temp & Capacity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] text-gray-500 font-semibold block">
                      Cold Storage Unit #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1} • {bay.powerSource}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 text-blue-900 border border-blue-200 text-xs font-black shrink-0">
                    <Thermometer className="w-4 h-4 text-blue-600" />
                    <span>{bay.tempCelsius}°C</span>
                  </div>
                </div>

                {/* Capacity Utilization Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <span className="text-gray-500">Carton Capacity:</span>
                    <span className="text-gray-900 font-black">
                      {currentStockInBay} / {bay.capacityCartons} cartons ({utilizationPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        utilizationPct > 85 ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                </div>

                {/* Products Stocked in this Bay (Editable Stock & Move Bay) */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                      Stocked Products ({bayItems.length}):
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">
                      Live Stock
                    </span>
                  </div>

                  {bayItems.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-400">
                      No cartons currently assigned to this bay.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {bayItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-gray-50/80 hover:bg-gray-100/80 px-3.5 py-2 rounded-2xl text-xs border border-gray-200 transition-colors"
                        >
                          <div className="min-w-0 flex-1 mr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 truncate">{item.name}</span>
                              <span className="text-[10px] text-gray-400 truncate">({item.localNameTwi})</span>
                            </div>
                            <span className="text-[10px] text-gray-500 block">
                              GH₵ {item.unitSellingPrice}/ctn
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`font-black ${
                                item.currentStock <= item.minThreshold ? 'text-amber-700' : 'text-gray-900'
                              }`}
                            >
                              {item.currentStock} {item.unit}
                            </span>

                            {/* Edit Stock Button */}
                            <button
                              onClick={() => {
                                setEditingStockItem(item);
                                setNewStockQty(item.currentStock);
                              }}
                              className="p-1 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                              title="Edit item stock in this bay"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {/* Move to another bay button */}
                            <button
                              onClick={() => {
                                setMovingItem(item);
                                setTargetBayZone(bay.name);
                              }}
                              className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                              title="Move item to another freezer bay"
                            >
                              <MoveRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bay Footer Status & Actions */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{bay.status}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditBay(bay)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Configure
                  </button>

                  {onDeleteBay && bays.length > 1 && (
                    <button
                      onClick={() => setDeletingBay(bay)}
                      className="text-gray-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Decommission this chamber"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL: Add New Cold Chamber */}
      {isAddBayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewBay}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-slide-down"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Add New Cold Chamber</h3>
                  <p className="text-xs text-gray-500">Commission new refrigeration bay into fleet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBayModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Chamber Name (English):
                </label>
                <input
                  type="text"
                  value={newBayName}
                  onChange={(e) => setNewBayName(e.target.value)}
                  placeholder="e.g. Chamber 5 - Deep Freeze Tuna"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Chamber Name (Twi / Local):
                </label>
                <input
                  type="text"
                  value={newBayNameTwi}
                  onChange={(e) => setNewBayNameTwi(e.target.value)}
                  placeholder="e.g. Bea 5 - Nsuomnam Awɔ"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Freezer Temp (°C):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newBayTemp}
                    onChange={(e) => setNewBayTemp(parseFloat(e.target.value) || -20)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Capacity (Cartons):
                  </label>
                  <input
                    type="number"
                    min="50"
                    value={newBayCapacity}
                    onChange={(e) => setNewBayCapacity(parseInt(e.target.value) || 400)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Power Source:
                </label>
                <select
                  value={newBayPower}
                  onChange={(e) => setNewBayPower(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  <option value="Dual ECG + Standby Genset">Dual ECG + Standby Genset</option>
                  <option value="Main Grid (ECG)">Main Grid (ECG)</option>
                  <option value="Heavy Generator Backup">Heavy Generator Backup</option>
                  <option value="Solar Hybrid Backup">Solar Hybrid Backup</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAddBayModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingBay}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                {isAddingBay ? 'Commissioning...' : 'Commission Chamber'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. MODAL: Decommission Confirmation Safeguard */}
      {deletingBay && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-slide-down">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Decommission Chamber?</h3>
                <p className="text-xs text-gray-500">{deletingBay.name}</p>
              </div>
            </div>

            <p className="py-4 text-xs text-gray-600 leading-relaxed">
              Are you sure you want to remove <strong>{deletingBay.name}</strong> from the active fleet? Any inventory assigned to this chamber will safely default to adjacent active chambers.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setDeletingBay(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingBay}
                onClick={handleConfirmDeleteBay}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                {isDeletingBay ? 'Decommissioning...' : 'Yes, Decommission Chamber'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Edit Bay Name & Details */}
      {editingBay && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBay}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-slide-down"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Edit Freezer Bay Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBay(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Bay Name (English):
                </label>
                <input
                  type="text"
                  value={bayNameInput}
                  onChange={(e) => setBayNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Bay Name (Twi / Local Name):
                </label>
                <input
                  type="text"
                  value={bayNameTwiInput}
                  onChange={(e) => setBayNameTwiInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Freezer Temp (°C):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bayTempInput}
                    onChange={(e) => setBayTempInput(parseFloat(e.target.value) || -20)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Capacity (Cartons):
                  </label>
                  <input
                    type="number"
                    min="50"
                    value={bayCapacityInput}
                    onChange={(e) => setBayCapacityInput(parseInt(e.target.value) || 300)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Power Source:
                </label>
                <select
                  value={bayPowerInput}
                  onChange={(e) => setBayPowerInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  <option value="Dual ECG + Standby Genset">Dual ECG + Standby Genset</option>
                  <option value="Main Grid (ECG)">Main Grid (ECG)</option>
                  <option value="Generator Backup">Generator Backup</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Operating Status:
                </label>
                <select
                  value={bayStatusInput}
                  onChange={(e) => setBayStatusInput(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  <option value="Optimal Freezing">Optimal Freezing</option>
                  <option value="Warning">Warning (Check Defrost / Door)</option>
                  <option value="Defrosting">Defrosting Cycle</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingBay(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingBay}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                {isSavingBay ? 'Saving...' : 'Save Bay Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. MODAL: Direct Edit Stock for Item in Bay */}
      {editingStockItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 animate-slide-down">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Adjust Chamber Stock</h3>
                <p className="text-xs text-gray-500">{editingStockItem.name}</p>
              </div>
              <button
                onClick={() => setEditingStockItem(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                Current Stock ({editingStockItem.unit}):
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewStockQty((q) => Math.max(0, q - 10))}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-700"
                >
                  -10
                </button>
                <button
                  onClick={() => setNewStockQty((q) => Math.max(0, q - 1))}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-700"
                >
                  -1
                </button>
                <input
                  type="number"
                  min="0"
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm font-black text-gray-900"
                />
                <button
                  onClick={() => setNewStockQty((q) => q + 1)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-700"
                >
                  +1
                </button>
                <button
                  onClick={() => setNewStockQty((q) => q + 10)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-700"
                >
                  +10
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Changes are updated immediately in stock ledger and shift audit.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setEditingStockItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                disabled={isSavingStock}
                onClick={handleSaveItemStock}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold shadow-xs"
              >
                {isSavingStock ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Move Item to another Bay */}
      {movingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-slide-down">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Transfer Item to Another Bay</h3>
                <p className="text-xs text-gray-500">{movingItem.name}</p>
              </div>
              <button
                onClick={() => setMovingItem(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                Select Destination Freezer Chamber:
              </label>
              <select
                value={targetBayZone}
                onChange={(e) => setTargetBayZone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
              >
                {bays.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.tempCelsius}°C)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500">
                Transfers {movingItem.currentStock} {movingItem.unit} to the chosen chamber location.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setMovingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                disabled={isMoving}
                onClick={handleSaveItemMove}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                {isMoving ? 'Transferring...' : 'Confirm Bay Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
