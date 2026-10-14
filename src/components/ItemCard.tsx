import React, { useState } from 'react';
import { Minus, Plus, AlertTriangle, Snowflake, Tag, Edit3, User } from 'lucide-react';
import { InventoryItem } from '../types';
import { LanguageMode, TRANSLATIONS } from '../locales/translations';

interface ItemCardProps {
  item: InventoryItem;
  lang: LanguageMode;
  onUpdateStock: (item: InventoryItem, delta: number) => void;
  onEdit?: (item: InventoryItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, lang, onUpdateStock, onEdit }) => {
  const t = TRANSLATIONS[lang];
  const [isUpdating, setIsUpdating] = useState(false);

  const isLowStock = item.currentStock <= item.minThreshold;
  const isCriticalStock = item.currentStock <= 5;

  const handleAdjust = async (delta: number) => {
    setIsUpdating(true);
    await onUpdateStock(item, delta);
    setIsUpdating(false);
  };

  return (
    <div
      id={`item-card-${item.id}`}
      className={`rounded-3xl bg-white border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-md ${
        isCriticalStock
          ? 'border-[#C2410C] shadow-sm ring-1 ring-[#C2410C]/30'
          : isLowStock
          ? 'border-[#FFD700] ring-1 ring-[#FFD700]/50'
          : 'border-[#E8E2D3] hover:border-[#1E3A1E]/40'
      }`}
    >
      <div>
        {/* Image & Zone Header */}
        <div className="relative h-44 w-full bg-[#F8F5EE] overflow-hidden group">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Cold Room Zone Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-white/95 backdrop-blur-md text-[#1E3A1E] border border-[#E8E2D3] shadow-sm">
            <Snowflake className="w-3 h-3 text-[#1E3A1E]" />
            <span>{item.coldRoomZone}</span>
          </div>

          {/* Edit Button overlay */}
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              title="Edit Price, Stocker & Photo"
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/95 hover:bg-[#FFD700] text-[#1E3A1E] border border-[#E8E2D3] shadow-sm transition-all flex items-center gap-1 text-[10px] font-black"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#C2410C]" />
              <span className="hidden group-hover:inline pr-1">Edit</span>
            </button>
          )}

          {/* Low Stock Warning Pill */}
          {isLowStock && !onEdit && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#C2410C] text-white shadow-sm animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>{t.restockNeeded}</span>
            </div>
          )}

          {/* Category Tag */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#FFD700] text-[#1E3A1E] shadow-sm">
              {item.category}
            </span>
            {isLowStock && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#C2410C] text-white shadow-sm">
                Low Stock
              </span>
            )}
          </div>
        </div>

        {/* Item Info */}
        <div className="p-4 space-y-2.5">
          <div>
            <div className="flex items-start justify-between gap-1">
              <h4 className="text-base font-black text-[#1E3A1E] leading-tight">
                {item.name}
              </h4>
              {onEdit && (
                <button
                  onClick={() => onEdit(item)}
                  className="text-[11px] font-bold text-[#C2410C] hover:underline flex items-center gap-0.5 shrink-0"
                  title="Manual Update"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
            <p className="text-xs text-[#C2410C] font-bold mt-0.5">
              {item.localNameTwi}
            </p>
          </div>

          <p className="text-xs text-[#5D544F] line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Assigned Stocker tag */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E3A1E] bg-[#FCF9F1] px-2.5 py-1 rounded-xl border border-[#E8E2D3]">
            <User className="w-3 h-3 text-[#C2410C]" />
            <span className="text-[#5D544F] font-medium">Stocker:</span>
            <span className="truncate">{item.assignedStocker || 'Kwame (Lead Stockkeeper)'}</span>
          </div>

          {/* Price and Stock Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8E2D3]">
            <div className="bg-[#F8F5EE] p-2.5 rounded-2xl border border-[#E8E2D3]">
              <span className="text-[10px] uppercase font-black text-[#5D544F] block">
                {t.unitPrice}
              </span>
              <span className="text-sm font-black text-[#1E3A1E]">
                GH₵ {item.unitSellingPrice.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#5D544F] block">per {item.unit}</span>
            </div>

            <div className={`p-2.5 rounded-2xl border ${
              isLowStock
                ? 'bg-[#C2410C]/10 border-[#C2410C]/30'
                : 'bg-[#F8F5EE] border-[#E8E2D3]'
            }`}>
              <span className="text-[10px] uppercase font-black text-[#5D544F] block">
                {t.inStock}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-base font-black ${isLowStock ? 'text-[#C2410C]' : 'text-[#1E3A1E]'}`}>
                  {item.currentStock}
                </span>
                <span className="text-[11px] text-[#5D544F] font-semibold">{item.unit}</span>
              </div>
              <span className="text-[10px] text-[#5D544F] block">Min: {item.minThreshold}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Adjust Buttons */}
      <div className="p-4 pt-0">
        <div className="flex items-center justify-between gap-1.5 bg-[#F8F5EE] p-1.5 rounded-2xl border border-[#E8E2D3]">
          <button
            id={`item-deduct-10-${item.id}`}
            onClick={() => handleAdjust(-10)}
            disabled={isUpdating || item.currentStock < 10}
            className="flex-1 py-1 px-2 rounded-xl text-xs font-black text-[#C2410C] bg-[#C2410C]/10 hover:bg-[#C2410C]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Deduct 10 cartons (Sold)"
          >
            -10
          </button>
          
          <button
            id={`item-deduct-1-${item.id}`}
            onClick={() => handleAdjust(-1)}
            disabled={isUpdating || item.currentStock < 1}
            className="p-1 rounded-xl text-[#C2410C] hover:bg-[#C2410C]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Deduct 1 carton"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="text-[10px] font-black text-[#5D544F] uppercase px-1">
            Adjust
          </span>

          <button
            id={`item-add-1-${item.id}`}
            onClick={() => handleAdjust(1)}
            disabled={isUpdating}
            className="p-1 rounded-xl text-[#1E3A1E] hover:bg-[#1E3A1E]/20 disabled:opacity-30 transition-colors"
            title="Add 1 carton"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            id={`item-add-10-${item.id}`}
            onClick={() => handleAdjust(10)}
            disabled={isUpdating}
            className="flex-1 py-1 px-2 rounded-xl text-xs font-black text-[#1E3A1E] bg-[#1E3A1E]/10 hover:bg-[#1E3A1E]/20 disabled:opacity-30 transition-colors"
            title="Add 10 cartons (Restock)"
          >
            +10
          </button>
        </div>
      </div>
    </div>
  );
};
