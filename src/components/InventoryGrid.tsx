import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, AlertTriangle, Snowflake, Sparkles } from 'lucide-react';
import { InventoryItem, CategoryType } from '../types';
import { ItemCard } from './ItemCard';
import { LanguageMode, TRANSLATIONS } from '../locales/translations';

interface InventoryGridProps {
  items: InventoryItem[];
  lang: LanguageMode;
  onUpdateStock: (item: InventoryItem, delta: number) => void;
  onOpenAddModal: () => void;
  onEditItem?: (item: InventoryItem) => void;
  externalSearchQuery?: string;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  lang,
  onUpdateStock,
  onOpenAddModal,
  onEditItem,
  externalSearchQuery,
}) => {
  const t = TRANSLATIONS[lang];
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = setInternalSearchQuery;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const categories: { id: string; label: string; count: number }[] = [
    { id: 'all', label: t.filterAll, count: items.length },
    { id: 'fish', label: t.filterFish, count: items.filter(i => i.category === 'fish').length },
    { id: 'poultry', label: t.filterPoultry, count: items.filter(i => i.category === 'poultry').length },
    { id: 'meat', label: t.filterMeat, count: items.filter(i => i.category === 'meat').length },
    { id: 'sausage', label: t.filterSausage, count: items.filter(i => i.category === 'sausage').length },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.localNameTwi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.coldRoomZone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchesLowStock = !showLowStockOnly || item.currentStock <= item.minThreshold;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [items, searchQuery, selectedCategory, showLowStockOnly]);

  const lowStockCount = items.filter(i => i.currentStock <= i.minThreshold).length;

  return (
    <div className="space-y-6">
      {/* Header Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8E2D3] shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A1E] flex items-center gap-2">
            <span>{t.inventoryCatalog}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#F8F5EE] text-[#1E3A1E] border border-[#E8E2D3] font-black">
              {filteredItems.length} {t.cartonsUnit}
            </span>
          </h2>
          <p className="text-xs text-[#5D544F] mt-0.5">
            {lang === 'tw'
              ? 'Cold store mu nneɛma nyinaa a ɛwɔ hɔ, ne boɔ ne carton dodoɔ'
              : 'Real-time cold room catalog, pricing in GH₵, freezer bays, and threshold alerts'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Low stock toggle */}
          {lowStockCount > 0 && (
            <button
              id="inventory-toggle-lowstock"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                showLowStockOnly
                  ? 'bg-[#C2410C] text-white border-[#C2410C] shadow-md'
                  : 'bg-[#C2410C]/10 text-[#C2410C] border-[#C2410C]/30 hover:bg-[#C2410C]/20'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lowStockCount} {lang === 'tw' ? 'Aka Kakra' : 'Low Stock'}</span>
            </button>
          )}

          {/* Add Product Button */}
          <button
            id="inventory-add-product-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1E3A1E] text-white hover:bg-[#152a15] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#FFD700]" />
            <span>{t.addNewProduct}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5D544F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="inventory-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2D3] rounded-xl text-xs sm:text-sm text-[#2C241F] placeholder-[#5D544F]/60 focus:outline-none focus:ring-2 focus:ring-[#1E3A1E] focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-filter-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#1E3A1E] text-white shadow-sm'
                  : 'bg-white text-[#5D544F] border border-[#E8E2D3] hover:border-[#1E3A1E]/30 hover:text-[#1E3A1E]'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.id ? 'bg-[#FFD700] text-[#1E3A1E] font-black' : 'bg-[#F8F5EE] text-[#5D544F]'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              lang={lang}
              onUpdateStock={onUpdateStock}
              onEdit={onEditItem}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-[#E8E2D3] text-center shadow-sm">
          <Snowflake className="w-12 h-12 text-[#5D544F]/40 mx-auto mb-3 animate-spin" />
          <h3 className="text-base font-bold text-[#1E3A1E]">
            {lang === 'tw' ? 'Nneɛma biara nni ha' : 'No items matched your search'}
          </h3>
          <p className="text-xs text-[#5D544F] max-w-sm mx-auto mt-1">
            {lang === 'tw'
              ? 'Sesa nea wohwehwɛ no anaa mia "Nneɛma Nyinaa" so'
              : 'Try searching for mackerel, tilapia, sausage, or change the category filter.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setShowLowStockOnly(false);
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#F8F5EE] text-[#1E3A1E] hover:bg-[#E8E2D3] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
