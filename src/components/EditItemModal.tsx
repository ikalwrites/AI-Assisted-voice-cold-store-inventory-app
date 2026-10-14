import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Image as ImageIcon,
  DollarSign,
  User,
  Package,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Snowflake
} from 'lucide-react';
import { InventoryItem, CategoryType, FreezerBayConfig } from '../types';

interface EditItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
  bays?: FreezerBayConfig[];
}

// Curated preset photos for Ghanaian cold store products
const PRESET_COLD_STORE_IMAGES = [
  {
    name: 'Seafood & Titus Mackerel',
    url: '/src/assets/images/frozen_seafood_boxes_1788486821540.jpg',
    category: 'fish'
  },
  {
    name: 'Poultry, Cuts & Sausages',
    url: '/src/assets/images/frozen_meats_sausages_1788486848531.jpg',
    category: 'poultry'
  },
  {
    name: 'Commercial Cold Room Stacks',
    url: '/src/assets/images/coldstore_hero_1788486806736.jpg',
    category: 'meat'
  }
];

const PRESET_STOCKERS = [
  'Kwame (Lead Stockkeeper)',
  'Isaac (Cold Fleet Dispatcher)',
  'Mama Gloria (Executive Director)',
  'Boss Isaac (Proprietor)',
  'Kweku Mensah (Bay 1 Sea Catch)',
  'Esi Appiah (Bay 2 Poultry Floor)'
];

const COLD_ROOM_ZONES = [
  'Freezer Bay 1 - Sea Catch',
  'Freezer Bay 2 - Poultry Block',
  'Freezer Bay 3 - Deli & Sausages',
  'Freezer Bay 4 - Deep Meat Chamber'
];

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
  bays = []
}) => {
  if (!isOpen || !item) return null;

  const [formData, setFormData] = useState<InventoryItem>({
    ...item,
    assignedStocker: item.assignedStocker || 'Kwame (Lead Stockkeeper)'
  });

  const [customStocker, setCustomStocker] = useState('');
  const [useCustomStocker, setUseCustomStocker] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url' | 'presets'>('presets');
  const [imageError, setImageError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profit calculation
  const sellingPrice = Number(formData.unitSellingPrice) || 0;
  const costPrice = Number(formData.unitCostPrice) || 0;
  const profitPerUnit = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? Math.round((profitPerUnit / sellingPrice) * 100) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size should be less than 5MB.');
      return;
    }

    setImageError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setIsSaving(true);
    const finalStocker = useCustomStocker && customStocker.trim()
      ? customStocker.trim()
      : formData.assignedStocker;

    const updated: InventoryItem = {
      ...formData,
      assignedStocker: finalStocker,
      currentStock: Number(formData.currentStock) || 0,
      minThreshold: Number(formData.minThreshold) || 0,
      unitSellingPrice: Number(formData.unitSellingPrice) || 0,
      unitCostPrice: Number(formData.unitCostPrice) || 0,
      lastUpdated: new Date().toISOString()
    };

    onSave(updated);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 250);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#EBE3D5] overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-[#1F2937] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C2410C]/20 border border-[#C2410C]/40 flex items-center justify-center text-[#F97316]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Manual Edit & Price Control</h3>
                <p className="text-xs text-slate-300">Paradise Fisheries • Cold Store Stock Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name (English)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FCF9F1] border border-[#E5DEC9] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Local Name / Twi Reference
                </label>
                <input
                  type="text"
                  value={formData.localNameTwi}
                  onChange={e => setFormData({ ...formData, localNameTwi: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FCF9F1] border border-[#E5DEC9] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  placeholder="e.g. Titus Nam / Akokɔ Nan"
                />
              </div>
            </div>

            {/* Category and Cold Room Bay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as CategoryType })}
                  className="w-full px-3 py-2 bg-[#FCF9F1] border border-[#E5DEC9] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                >
                  <option value="fish">Frozen Fish & Seafood</option>
                  <option value="poultry">Poultry & Chicken</option>
                  <option value="meat">Meat & Pork Cuts</option>
                  <option value="sausage">Sausages & Processed</option>
                  <option value="other">Other Cold Foods</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Storage Zone / Freezer Bay
                </label>
                <select
                  value={formData.coldRoomZone}
                  onChange={e => setFormData({ ...formData, coldRoomZone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FCF9F1] border border-[#E5DEC9] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                >
                  {COLD_ROOM_ZONES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* PRICE CONTROLS (SELLING PRICE & COST PRICE) */}
            <div className="bg-[#FFFDF9] border-2 border-[#EADFC7] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-2">
                <span className="text-xs font-bold text-[#8C2E0B] uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#C2410C]" />
                  Price & Margin Management (GH₵)
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${profitPerUnit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  Margin: {marginPercent}% (GH₵ {profitPerUnit.toLocaleString()} / {formData.unit})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (GH₵ per {formData.unit})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">GH₵</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={formData.unitSellingPrice}
                      onChange={e => setFormData({ ...formData, unitSellingPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-12 pr-3 py-2 bg-white border border-[#E5DEC9] rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price from Van/Supplier (GH₵ per {formData.unit})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">GH₵</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={formData.unitCostPrice}
                      onChange={e => setFormData({ ...formData, unitCostPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-12 pr-3 py-2 bg-white border border-[#E5DEC9] rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STOCK LEVEL & STOCKER ASSIGNMENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stock count */}
              <div className="bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl p-3.5 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  Stock Count ({formData.unit})
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500 block mb-0.5">Current Physical Stock</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.currentStock}
                      onChange={e => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-[#E5DEC9] rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    />
                  </div>
                  <div className="w-28">
                    <span className="text-[10px] text-slate-500 block mb-0.5">Low Alert Min</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.minThreshold}
                      onChange={e => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-[#E5DEC9] rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    />
                  </div>
                </div>
              </div>

              {/* Stocker Assignment */}
              <div className="bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Assigned Stocker
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomStocker(!useCustomStocker)}
                    className="text-[11px] font-semibold text-[#C2410C] hover:underline"
                  >
                    {useCustomStocker ? 'Select Preset' : '+ Custom Name'}
                  </button>
                </div>

                {useCustomStocker ? (
                  <input
                    type="text"
                    value={customStocker}
                    onChange={e => setCustomStocker(e.target.value)}
                    placeholder="Enter staff or stocker name"
                    className="w-full px-3 py-2 bg-white border border-[#E5DEC9] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  />
                ) : (
                  <select
                    value={formData.assignedStocker || 'Kwame (Lead Stockkeeper)'}
                    onChange={e => setFormData({ ...formData, assignedStocker: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5DEC9] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  >
                    {PRESET_STOCKERS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* COLD ROOM STORAGE CHAMBER / BAY */}
            <div className="bg-[#FAF7EE] border border-[#E5DEC9] rounded-xl p-3.5 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-blue-600" />
                Cold Room Storage Chamber / Bay
              </label>
              <select
                value={formData.coldRoomZone}
                onChange={e => setFormData({ ...formData, coldRoomZone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DEC9] rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              >
                {bays && bays.length > 0 ? (
                  bays.map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.tempCelsius}°C)
                    </option>
                  ))
                ) : (
                  COLD_ROOM_ZONES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))
                )}
              </select>
              <p className="text-[10px] text-slate-500">
                Determines which freezer chamber displays this item in the inventory and logs.
              </p>
            </div>

            {/* MANUAL PICTURE UPDATE */}
            <div className="border border-[#E5DEC9] rounded-xl p-4 bg-[#FCF9F1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#C2410C]" />
                  Product Picture Update
                </span>
                <div className="flex gap-1 bg-[#EBE3D5] p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setImageMode('presets')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${imageMode === 'presets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  >
                    Preset Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${imageMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${imageMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  >
                    Web URL
                  </button>
                </div>
              </div>

              {/* Preview and selector */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-24 h-24 rounded-xl border-2 border-[#D9CEB8] bg-white overflow-hidden shrink-0 shadow-sm relative group">
                  <img
                    src={formData.image}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/src/assets/images/coldstore_hero_1788486806736.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                    Active Preview
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  {imageMode === 'presets' && (
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_COLD_STORE_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, image: preset.url })}
                          className={`group p-1 rounded-xl border text-left transition relative overflow-hidden ${formData.image === preset.url ? 'border-[#C2410C] ring-2 ring-[#C2410C]/20 bg-orange-50/50' : 'border-[#E5DEC9] bg-white hover:border-[#C2410C]'}`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-12 object-cover rounded-lg mb-1"
                          />
                          <p className="text-[10px] font-semibold text-slate-700 truncate">{preset.name}</p>
                          {formData.image === preset.url && (
                            <div className="absolute top-1 right-1 bg-[#C2410C] text-white p-0.5 rounded-full">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {imageMode === 'upload' && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 px-3 border-2 border-dashed border-[#C5BBAA] hover:border-[#C2410C] rounded-xl flex flex-col items-center justify-center gap-1 bg-white transition hover:bg-orange-50/30"
                      >
                        <Upload className="w-5 h-5 text-[#C2410C]" />
                        <span className="text-xs font-semibold text-slate-800">
                          Click to Browse or Replace Image
                        </span>
                        <span className="text-[10px] text-slate-500">Supports JPG, PNG, WebP up to 5MB</span>
                      </button>
                    </div>
                  )}

                  {imageMode === 'url' && (
                    <div>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://example.com/item.jpg or local path"
                        className="w-full px-3 py-2 bg-white border border-[#E5DEC9] rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                      />
                    </div>
                  )}

                  {imageError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {imageError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description / Notes
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#FCF9F1] border border-[#E5DEC9] rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-[#FAF7EE] border-t border-[#E5DEC9] px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl text-xs font-bold shadow-md shadow-orange-900/10 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving Changes...' : 'Save Manual Updates'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
