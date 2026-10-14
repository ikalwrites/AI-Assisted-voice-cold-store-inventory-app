import React, { useState } from 'react';
import { 
  MapPin, 
  ChevronDown, 
  ShoppingBag, 
  Bell, 
  Search, 
  ScanLine, 
  SlidersHorizontal, 
  Heart, 
  Star, 
  Home, 
  Compass, 
  Bookmark, 
  MessageSquare, 
  User,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';
import { BotanicalItem, BOTANICAL_PLANTS } from '../data/plantData';

interface BotanicalStorefrontProps {
  onSelectPlant: (plant: BotanicalItem) => void;
  selectedPlantId: string;
  cartCount: number;
  onOpenCart: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const BotanicalStorefront: React.FC<BotanicalStorefrontProps> = ({
  onSelectPlant,
  selectedPlantId,
  cartCount,
  onOpenCart,
  onOpenVoiceAssistant
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Indoor');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBottomNav, setActiveBottomNav] = useState<'home' | 'explore' | 'wishlist' | 'chat' | 'profile'>('home');
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({
    'plant-monstera': true,
  });
  const [selectedLocation, setSelectedLocation] = useState<string>('New York, USA');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [claimedOffer, setClaimedOffer] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const categories = ['All', 'Indoor', 'Outdoor', 'Garden', 'Office'];

  const locations = [
    'New York, USA',
    'Los Angeles, CA',
    'London, UK',
    'Accra, Ghana',
    'Berlin, Germany'
  ];

  const filteredPlants = BOTANICAL_PLANTS.filter(plant => {
    const matchesCategory = selectedCategory === 'All' || plant.category === selectedCategory;
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClaimOffer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClaimedOffer(true);
    setTimeout(() => setClaimedOffer(false), 3000);
  };

  return (
    <div className="w-full h-full bg-[#FCFBF7] flex flex-col justify-between relative overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Scrollable Main Body */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
        {/* 1. Curved Organic Forest Green Header (Exactly like inspo left screen) */}
        <div className="bg-gradient-to-b from-[#3B6F55] to-[#2E5843] text-white px-5 pt-4 pb-6 rounded-b-[2.75rem] shadow-md relative z-10 transition-all">
          {/* Top Bar: Location & Actions */}
          <div className="flex items-center justify-between mb-4">
            {/* Location Selector */}
            <div className="relative">
              <span className="text-[11px] font-medium text-emerald-100/70 tracking-wide block">Location</span>
              <button 
                id="header-location-selector"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-emerald-100 transition-colors cursor-pointer mt-0.5"
              >
                <MapPin className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]/30" />
                <span>{selectedLocation}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Location dropdown */}
              {isLocationDropdownOpen && (
                <div className="absolute top-12 left-0 w-44 bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-xl border border-emerald-900/10 text-[#1E3A1E] z-30 animate-in fade-in zoom-in-95 duration-150">
                  {locations.map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        selectedLocation === loc ? 'bg-[#3B6F55] text-white' : 'hover:bg-emerald-50 text-[#2C3B32]'
                      }`}
                    >
                      <span>{loc}</span>
                      {selectedLocation === loc && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top Right Action Pills: Cart & Notifications */}
            <div className="flex items-center gap-2">
              <button 
                id="header-cart-button"
                onClick={onOpenCart}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-md flex items-center justify-center transition-all relative cursor-pointer active:scale-95"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F59E0B] text-[#1B3527] font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#3B6F55] animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>

              <button 
                id="header-notifications-button"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-md flex items-center justify-center transition-all relative cursor-pointer active:scale-95"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-white" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full border border-[#3B6F55]" />
              </button>
            </div>
          </div>

          {/* Integrated Floating White Search Pill */}
          <div className="relative mt-2">
            <div className="bg-white rounded-full p-1.5 pl-4 flex items-center justify-between shadow-lg shadow-emerald-950/20 border border-white/80 transition-all focus-within:ring-2 focus-within:ring-[#F59E0B]/50">
              <div className="flex items-center gap-2.5 flex-1 mr-2">
                <Search className="w-4 h-4 text-emerald-800/50 shrink-0" />
                <input
                  id="plant-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search botanical plants..."
                  className="w-full text-xs text-[#2A4435] placeholder:text-gray-400 bg-transparent outline-none font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  id="search-scan-button"
                  title="Scan Plant"
                  className="p-1.5 rounded-full text-emerald-800/60 hover:text-emerald-900 hover:bg-emerald-50 transition-colors"
                >
                  <ScanLine className="w-4 h-4" />
                </button>
                <button 
                  id="search-filter-button"
                  title="Filter options"
                  className="w-7 h-7 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-[#2E5843] transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. #SpecialForYou Interactive Banner Carousel (Inspo left screen) */}
        <div className="px-5 mt-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-black text-[#264433] tracking-tight">#SpecialForYou</span>
            <button 
              id="special-see-all-button"
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              See All
            </button>
          </div>

          {/* Hero Promo Card */}
          <div className="relative h-40 rounded-3xl overflow-hidden shadow-sm border border-emerald-900/10 group cursor-pointer bg-[#1A2E23]">
            {/* Background Lifestyle Image */}
            <img 
              src="/src/assets/images/plant_banner_offer_1788596684743.jpg" 
              alt="Special botanical promo" 
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            
            {/* Gradient atmospheric overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#172B20]/95 via-[#1E3A2B]/70 to-transparent" />

            {/* Banner Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
              <div className="inline-block">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold text-white uppercase tracking-wider">
                  Limited time!
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white leading-tight drop-shadow-sm">
                  Get Special Offer<br />
                  <span className="text-base font-extrabold text-white">Up to </span>
                  <span className="text-2xl font-black text-[#FCD34D]">40%</span>
                </h3>
                <p className="text-[10px] text-emerald-100/80 mt-0.5">All Indoor Plants Available | T&C Applied</p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  id="claim-special-offer-button"
                  onClick={handleClaimOffer}
                  className="px-4 py-1.5 rounded-full bg-[#F59E0B] hover:bg-[#D97706] text-[#1E3A1E] font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  {claimedOffer ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1E3A1E]" />
                      <span>Claimed!</span>
                    </>
                  ) : (
                    <span>Claim</span>
                  )}
                </button>

                {onOpenVoiceAssistant && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVoiceAssistant();
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/30 hover:bg-white/30 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-[#FCD34D]" />
                    <span>Ask AI Botanist</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex justify-center gap-1.5 mt-2.5">
            {[0, 1, 2].map(idx => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  carouselIndex === idx ? 'w-5 bg-[#3B6F55]' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 3. Recommended For You & Category Filter Section */}
        <div className="px-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-[#264433] tracking-tight">Recommended For You</span>
            <button 
              id="recommended-see-all-button"
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              See All
            </button>
          </div>

          {/* Horizontal Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`category-pill-${cat.toLowerCase()}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#386F55] text-white shadow-sm shadow-emerald-900/20 scale-102'
                      : 'bg-white text-[#5F7166] hover:bg-emerald-50/70 border border-emerald-900/5'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 4. Product Card Grid (Clean porcelain cards with floating 3D cutouts) */}
          <div className="grid grid-cols-2 gap-3.5 mt-3.5">
            {filteredPlants.map(plant => {
              const isSelected = selectedPlantId === plant.id;
              const isFav = wishlist[plant.id];

              return (
                <div
                  key={plant.id}
                  id={`plant-card-${plant.id}`}
                  onClick={() => onSelectPlant(plant)}
                  className={`bg-[#F2F4EF] rounded-[1.75rem] p-3 flex flex-col justify-between relative cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                    isSelected ? 'ring-2 ring-[#386F55] bg-emerald-50/50' : 'border border-emerald-900/5'
                  }`}
                >
                  {/* Floating Wishlist Heart */}
                  <button
                    id={`wishlist-toggle-${plant.id}`}
                    onClick={(e) => toggleWishlist(plant.id, e)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm shadow-xs flex items-center justify-center text-gray-400 hover:text-[#EF4444] transition-all z-10"
                  >
                    <Heart className={`w-3.5 h-3.5 transition-colors ${isFav ? 'text-[#EF4444] fill-[#EF4444]' : ''}`} />
                  </button>

                  {/* Floating Studio Cutout Plant Image with Contact Shadow */}
                  <div className="relative aspect-square w-full flex items-center justify-center p-2 mb-1">
                    <img
                      src={plant.image}
                      alt={plant.name}
                      className="w-full h-full object-contain drop-shadow-[0_12px_14px_rgba(30,58,40,0.18)] group-hover:scale-108 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {/* Elliptical floor contact shadow */}
                    <div className="absolute bottom-1 w-2/3 h-2 bg-emerald-950/15 rounded-full blur-[3px]" />
                  </div>

                  {/* Info Meta */}
                  <div className="mt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1E3527] truncate pr-1" title={plant.name}>
                        {plant.name}
                      </h4>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                        <span className="text-[10px] font-extrabold text-[#2F4436]">{plant.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-emerald-900/5">
                      <span className="text-xs font-extrabold text-[#2F654B]">${plant.price.toFixed(2)}</span>
                      <span className="text-[9px] font-semibold text-gray-400 line-through">
                        ${plant.originalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Floating Frosted Glass Bottom Navigation Bar (Inspo bottom dock) */}
      <div className="absolute bottom-3 left-4 right-4 z-20">
        <div className="bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_10px_25px_-5px_rgba(30,60,45,0.18)] rounded-full px-5 py-2.5 flex items-center justify-between">
          <button
            id="bottom-nav-home"
            onClick={() => setActiveBottomNav('home')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
              activeBottomNav === 'home' ? 'text-[#386F55] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1 rounded-full ${activeBottomNav === 'home' ? 'bg-[#386F55]/15' : ''}`}>
              <Home className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold">Home</span>
          </button>

          <button
            id="bottom-nav-explore"
            onClick={() => setActiveBottomNav('explore')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
              activeBottomNav === 'explore' ? 'text-[#386F55] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1 rounded-full ${activeBottomNav === 'explore' ? 'bg-[#386F55]/15' : ''}`}>
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold">Explore</span>
          </button>

          <button
            id="bottom-nav-wishlist"
            onClick={() => setActiveBottomNav('wishlist')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
              activeBottomNav === 'wishlist' ? 'text-[#386F55] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1 rounded-full ${activeBottomNav === 'wishlist' ? 'bg-[#386F55]/15' : ''}`}>
              <Bookmark className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold">Wishlist</span>
          </button>

          <button
            id="bottom-nav-chat"
            onClick={() => setActiveBottomNav('chat')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
              activeBottomNav === 'chat' ? 'text-[#386F55] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1 rounded-full ${activeBottomNav === 'chat' ? 'bg-[#386F55]/15' : ''}`}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold">Chat</span>
          </button>

          <button
            id="bottom-nav-profile"
            onClick={() => setActiveBottomNav('profile')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
              activeBottomNav === 'profile' ? 'text-[#386F55] scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1 rounded-full ${activeBottomNav === 'profile' ? 'bg-[#386F55]/15' : ''}`}>
              <User className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
