import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Star, 
  MessageSquare, 
  Phone, 
  ShoppingBag, 
  Rotate3d, 
  Sun, 
  Droplets, 
  Thermometer, 
  Wind,
  Check,
  Sparkles,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { BotanicalItem } from '../data/plantData';

interface BotanicalDetailViewProps {
  plant: BotanicalItem;
  onBack?: () => void;
  onAddToCart: (plant: BotanicalItem, quantity: number, potColor: string) => void;
  onOpenChatWithSeller: (seller: BotanicalItem['seller']) => void;
}

export const BotanicalDetailView: React.FC<BotanicalDetailViewProps> = ({
  plant,
  onBack,
  onAddToCart,
  onOpenChatWithSeller
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedThumbIndex, setSelectedThumbIndex] = useState(0);
  const [selectedPotColor, setSelectedPotColor] = useState(plant.potOptions[0]?.name || 'Matte Porcelain');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [isCallingSeller, setIsCallingSeller] = useState(false);

  const dragStartRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartRef.current !== null) {
      const delta = e.clientX - dragStartRef.current;
      setRotationAngle(prev => (prev + delta * 0.8) % 360);
      dragStartRef.current = e.clientX;
    }
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
  };

  const handleToggleAutoRotate = () => {
    setIsAutoRotating(!isAutoRotating);
  };

  const handleAddToCartClick = () => {
    onAddToCart(plant, quantity, selectedPotColor);
    setIsAddedSuccess(true);
    setTimeout(() => setIsAddedSuccess(false), 2200);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: plant.name,
          text: `Check out this botanical specimen: ${plant.name}`,
          url: window.location.href,
        });
      } catch (_e) {
        // User canceled share
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleCallSeller = () => {
    setIsCallingSeller(true);
    setTimeout(() => {
      setIsCallingSeller(false);
      alert(`Connecting call to ${plant.seller.name} (${plant.seller.phone})...`);
    }, 1200);
  };

  const totalPrice = plant.price * quantity;

  return (
    <div className="w-full h-full bg-white flex flex-col justify-between relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] select-none">
      {/* Scrollable container */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-28">
        {/* 1. Header: Back button, Title, Wishlist & Share (Inspo right screen top) */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
          <button
            id="detail-back-button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h2 className="text-sm font-bold text-[#1E3527] tracking-tight">
            Plant Details
          </h2>

          <div className="flex items-center gap-2">
            <button
              id="detail-wishlist-button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
              title="Add to Wishlist"
            >
              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'text-[#EF4444] fill-[#EF4444]' : ''}`} />
            </button>

            <button
              id="detail-share-button"
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Hero Interactive 360° Showcase with Turntable Orbit Ring (Inspo right screen) */}
        <div className="px-5 pt-2 pb-4 flex flex-col items-center relative">
          {/* 360 Turntable Stage Container */}
          <div 
            className="relative w-full aspect-square max-w-[280px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* The Signature Turntable Orbit Ellipse Ring with green indicator pill */}
            <div className="absolute bottom-5 w-52 h-14 border-2 border-emerald-600/30 rounded-full flex items-center justify-center pointer-events-none transition-all">
              {/* Active Green Control Capsule at the front center */}
              <div 
                className="absolute w-7 h-3 rounded-full bg-[#3B6F55] shadow-xs flex items-center justify-center text-white"
                style={{
                  transform: `translateX(${Math.sin((rotationAngle * Math.PI) / 180) * 85}px) scale(${
                    0.85 + Math.cos((rotationAngle * Math.PI) / 180) * 0.2
                  })`
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-100" />
              </div>
            </div>

            {/* Soft Contact Shadow beneath ceramic pot */}
            <div className="absolute bottom-6 w-36 h-4 bg-emerald-950/20 rounded-full blur-[4px] pointer-events-none" />

            {/* Floating 3D Plant Model Image */}
            <img
              src={plant.thumbnails[selectedThumbIndex]?.image || plant.image}
              alt={plant.name}
              style={{
                transform: `rotateY(${rotationAngle}deg)`,
                transition: dragStartRef.current === null ? 'transform 0.25s ease-out' : 'none'
              }}
              className="w-full h-full object-contain drop-shadow-[0_16px_24px_rgba(25,50,35,0.22)] pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Interactive 360 drag hint pill */}
            <div className="absolute top-2 right-2">
              <button
                id="toggle-360-turntable-button"
                onClick={handleToggleAutoRotate}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/60 shadow-xs hover:bg-emerald-100 transition-colors"
              >
                <Rotate3d className={`w-3 h-3 ${isAutoRotating ? 'animate-spin' : ''}`} />
                <span>360° View</span>
              </button>
            </div>
          </div>

          {/* 3. Horizontal Thumbnail Strip (Inspo right screen) */}
          <div className="flex items-center justify-center gap-2 mt-2 w-full overflow-x-auto hide-scrollbar py-1">
            {plant.thumbnails.map((thumb, idx) => (
              <button
                key={thumb.id}
                id={`detail-thumbnail-${idx}`}
                onClick={() => setSelectedThumbIndex(idx)}
                className={`w-11 h-11 rounded-xl p-1 border transition-all cursor-pointer bg-[#F8FAF6] overflow-hidden flex items-center justify-center shrink-0 ${
                  selectedThumbIndex === idx
                    ? 'border-[#386F55] ring-2 ring-[#386F55]/20 shadow-xs scale-105'
                    : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={thumb.image}
                  alt={thumb.label}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 4. Plant Metadata & Description Section (Inspo right screen bottom card) */}
        <div className="px-5 mt-2">
          {/* Subtitle & Star Rating */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 tracking-wide">
              {plant.category} Plant
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
              <span className="text-xs font-extrabold text-[#1E3527]">{plant.rating}</span>
              <span className="text-[10px] text-gray-400">({plant.reviewsCount})</span>
            </div>
          </div>

          {/* Main Plant Title */}
          <h1 className="text-lg font-black text-[#1E3527] mt-1 tracking-tight">
            {plant.name}
          </h1>
          <p className="text-[11px] font-medium text-emerald-800/70 italic">
            {plant.scientificName}
          </p>

          {/* Seller / Curator Card (Inspo right screen) */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Seller
            </span>

            <div className="flex items-center justify-between bg-[#F8FAF6] rounded-2xl p-2.5 border border-emerald-900/5">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src={plant.seller.avatar}
                    alt={plant.seller.name}
                    className="w-10 h-10 rounded-full object-cover border border-white shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E3527] leading-none">
                    {plant.seller.name}
                  </h4>
                  <span className="text-[10px] font-medium text-gray-400 mt-0.5 block">
                    {plant.seller.role}
                  </span>
                </div>
              </div>

              {/* Quick Communication Actions (Inspo chat & phone buttons) */}
              <div className="flex items-center gap-1.5">
                <button
                  id="seller-chat-action"
                  onClick={() => onOpenChatWithSeller(plant.seller)}
                  className="w-8 h-8 rounded-full bg-[#3B6F55] hover:bg-[#2C5742] text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  title="Message Jacob Doe"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>

                <button
                  id="seller-phone-action"
                  onClick={handleCallSeller}
                  className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-[#2C5742] flex items-center justify-center transition-colors cursor-pointer"
                  title="Call Store Manager"
                >
                  <Phone className={`w-3.5 h-3.5 ${isCallingSeller ? 'animate-bounce text-[#C2410C]' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Plant Details & Expandable Description */}
          <div className="mt-4">
            <h3 className="text-xs font-bold text-[#1E3527] mb-1.5">
              Plant Details
            </h3>
            <p className="text-xs leading-relaxed text-gray-500">
              {isDescriptionExpanded 
                ? plant.description 
                : `${plant.description.slice(0, 115)}... `}
              <button
                id="toggle-read-more-button"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-[#386F55] font-bold text-xs underline cursor-pointer hover:text-emerald-900"
              >
                {isDescriptionExpanded ? 'Read less' : 'Read more'}
              </button>
            </p>
          </div>

          {/* Architectural Care Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-[#F8FAF6] rounded-xl p-2 flex flex-col items-center text-center border border-gray-100">
              <Sun className="w-4 h-4 text-[#F59E0B] mb-1" />
              <span className="text-[9px] text-gray-400 font-semibold">Sunlight</span>
              <span className="text-[10px] font-bold text-[#1E3527] truncate w-full">{plant.careDetails.sunlight}</span>
            </div>

            <div className="bg-[#F8FAF6] rounded-xl p-2 flex flex-col items-center text-center border border-gray-100">
              <Droplets className="w-4 h-4 text-blue-500 mb-1" />
              <span className="text-[9px] text-gray-400 font-semibold">Water</span>
              <span className="text-[10px] font-bold text-[#1E3527] truncate w-full">{plant.careDetails.water}</span>
            </div>

            <div className="bg-[#F8FAF6] rounded-xl p-2 flex flex-col items-center text-center border border-gray-100">
              <Thermometer className="w-4 h-4 text-[#C2410C] mb-1" />
              <span className="text-[9px] text-gray-400 font-semibold">Temp</span>
              <span className="text-[10px] font-bold text-[#1E3527] truncate w-full">{plant.careDetails.temperature}</span>
            </div>

            <div className="bg-[#F8FAF6] rounded-xl p-2 flex flex-col items-center text-center border border-gray-100">
              <Wind className="w-4 h-4 text-teal-600 mb-1" />
              <span className="text-[9px] text-gray-400 font-semibold">Humidity</span>
              <span className="text-[10px] font-bold text-[#1E3527] truncate w-full">{plant.careDetails.humidity}</span>
            </div>
          </div>

          {/* Pot Ceramic Color Finishes */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1E3527]">Architectural Pot Finish</span>
              <span className="text-[11px] font-semibold text-emerald-800">{selectedPotColor}</span>
            </div>
            <div className="flex items-center gap-2">
              {plant.potOptions.map(opt => (
                <button
                  key={opt.id}
                  id={`pot-option-${opt.id}`}
                  onClick={() => setSelectedPotColor(opt.name)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedPotColor === opt.name
                      ? 'border-[#386F55] bg-emerald-50 text-[#1E3527] ring-1 ring-[#386F55]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300 shadow-xs"
                    style={{ backgroundColor: opt.hex }}
                  />
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Sticky Bottom Action Bar (Inspo right screen bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex items-center justify-between z-20">
        <div>
          <span className="text-[11px] font-semibold text-gray-400 block leading-none">
            Total Price
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-[#1E3527]">
              ${totalPrice.toFixed(2)}
            </span>
            {quantity > 1 && (
              <span className="text-[10px] text-gray-400 font-bold">
                (${plant.price.toFixed(2)} each)
              </span>
            )}
          </div>
        </div>

        {/* Quantity control & Add to Cart Pill Button */}
        <div className="flex items-center gap-2.5">
          {/* Quantity stepper */}
          <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200/70">
            <button
              id="detail-quantity-minus"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 text-xs font-bold text-[#1E3527]">{quantity}</span>
            <button
              id="detail-quantity-plus"
              onClick={() => setQuantity(quantity + 1)}
              className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Inspo Green Pill Button with Shopping Bag */}
          <button
            id="add-to-cart-cta-button"
            onClick={handleAddToCartClick}
            className={`px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/20 transition-all cursor-pointer active:scale-95 ${
              isAddedSuccess
                ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                : 'bg-[#386F55] hover:bg-[#2C5843] text-white'
            }`}
          >
            {isAddedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-emerald-100" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
