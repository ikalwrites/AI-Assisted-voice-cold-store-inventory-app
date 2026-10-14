import React, { useState, useEffect } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { InventoryItem, CategoryType, FreezerBayConfig } from '../types';
import { LanguageMode, TRANSLATIONS } from '../locales/translations';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: InventoryItem) => void;
  lang: LanguageMode;
  bays?: FreezerBayConfig[];
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lang,
  bays = [],
}) => {
  const t = TRANSLATIONS[lang];

  const [name, setName] = useState('');
  const [localNameTwi, setLocalNameTwi] = useState('');
  const [category, setCategory] = useState<CategoryType>('fish');
  const [currentStock, setCurrentStock] = useState<number>(50);
  const [unit, setUnit] = useState('cartons');
  const [minThreshold, setMinThreshold] = useState<number>(15);
  const [unitSellingPrice, setUnitSellingPrice] = useState<number>(450);
  const [unitCostPrice, setUnitCostPrice] = useState<number>(380);
  const [coldRoomZone, setColdRoomZone] = useState(bays[0]?.name || 'Freezer Bay 1 - Sea Catch & Fish');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (bays.length > 0 && (!coldRoomZone || !bays.some(b => b.name === coldRoomZone))) {
      setColdRoomZone(bays[0].name);
    }
  }, [bays]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Pick a relevant image based on category
    let image = '/src/assets/images/frozen_seafood_boxes_1788486821540.jpg';
    if (category === 'poultry' || category === 'meat' || category === 'sausage') {
      image = '/src/assets/images/frozen_meats_sausages_1788486848531.jpg';
    }

    const item: InventoryItem = {
      id: `cs-${Date.now()}`,
      name: name.trim(),
      localNameTwi: localNameTwi.trim() || name.trim(),
      category,
      currentStock: Number(currentStock),
      unit,
      minThreshold: Number(minThreshold),
      unitSellingPrice: Number(unitSellingPrice),
      unitCostPrice: Number(unitCostPrice),
      coldRoomZone,
      image,
      lastUpdated: new Date().toISOString(),
      description: description.trim() || `${name} cold store batch`,
    };

    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FCF9F1] border border-[#E8E2D3] rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D3]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1E3A1E]/10 text-[#1E3A1E] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-[#1E3A1E]">
              {t.addNewProduct}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#5D544F] hover:text-[#2C241F] p-1.5 rounded-xl hover:bg-[#E8E2D3]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1E3A1E] mb-1">
              English Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Atlantic Salmon, Turkey Gizzards, Beef Sausages"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D3] rounded-2xl text-xs sm:text-sm text-[#2C241F] placeholder:text-[#5D544F]/50 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E3A1E] mb-1">
              Local Twi Name (Nkyerɛwee)
            </label>
            <input
              type="text"
              value={localNameTwi}
              onChange={(e) => setLocalNameTwi(e.target.value)}
              placeholder="e.g. Salmon Nam, Akokɔ Bɔto, Nsosoe"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D3] rounded-2xl text-xs sm:text-sm text-[#2C241F] placeholder:text-[#5D544F]/50 focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E3A1E] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D3] rounded-2xl text-xs sm:text-sm text-[#2C241F] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              >
                <option value="fish">Fish & Seafood</option>
                <option value="poultry">Poultry & Chicken</option>
                <option value="meat">Red Meat & Pork</option>
                <option value="sausage">Sausages & Delis</option>
                <option value="other">Other Frozen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E3A1E] mb-1">
                Packaging Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D3] rounded-2xl text-xs sm:text-sm text-[#2C241F] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              >
                <option value="cartons">Cartons (ctn)</option>
                <option value="boxes">Boxes</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="packs">Packs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E3A1E] mb-1">
                Initial Stock Count
              </label>
              <input
                type="number"
                min="0"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D3] rounded-2xl text-xs sm:text-sm text-[#2C241F] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E3A1E] mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                required
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D3] rounded-2xl text-xs sm:text-sm text-[#2C241F] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E3A1E] mb-1">
                Selling Price (GH₵)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={unitSellingPrice}
                onChange={(e) => setUnitSellingPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D3] rounded-2xl text-xs sm:text-sm text-[#2C241F] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E3A1E] mb-1">
                Supplier Cost Price (GH₵)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={unitCostPrice}
                onChange={(e) => setUnitCostPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D3] rounded-2xl text-xs sm:text-sm text-[#2C241F] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E3A1E] mb-1">
              Cold Room Storage Chamber
            </label>
            <select
              value={coldRoomZone}
              onChange={(e) => setColdRoomZone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D3] rounded-2xl text-xs sm:text-sm text-[#2C241F] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
            >
              {bays && bays.length > 0 ? (
                bays.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.tempCelsius}°C)
                  </option>
                ))
              ) : (
                <>
                  <option value="Freezer Bay 1 - Sea Catch & Fish">Freezer Bay 1 - Sea Catch & Fish (-22°C)</option>
                  <option value="Freezer Bay 2 - Poultry Block">Freezer Bay 2 - Poultry Block (-19°C)</option>
                  <option value="Freezer Bay 3 - Deli & Sausages">Freezer Bay 3 - Deli & Sausages (-16°C)</option>
                  <option value="Freezer Bay 4 - Deep Meat Chamber">Freezer Bay 4 - Deep Meat Chamber (-24°C)</option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E2D3]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#5D544F] hover:text-[#2C241F]"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black bg-[#C2410C] hover:bg-[#A3360A] text-white shadow-sm transition-colors"
            >
              {t.saveItem}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
