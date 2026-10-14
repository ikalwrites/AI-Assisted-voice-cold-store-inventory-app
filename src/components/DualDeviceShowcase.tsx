import React, { useState } from 'react';
import { OrganicMobileDevice } from './OrganicMobileDevice';
import { BotanicalStorefront } from './BotanicalStorefront';
import { BotanicalDetailView } from './BotanicalDetailView';
import { BotanicalCartModal, CartItemEntry } from './BotanicalCartModal';
import { PlantCareChatModal } from './PlantCareChatModal';
import { BotanicalItem, BOTANICAL_PLANTS } from '../data/plantData';
import { Sparkles, Layers, RefreshCw, ShoppingBag, Eye, Smartphone, Monitor } from 'lucide-react';

interface DualDeviceShowcaseProps {
  onOpenVoiceAssistant: () => void;
  onSwitchToEnterprise?: () => void;
}

export const DualDeviceShowcase: React.FC<DualDeviceShowcaseProps> = ({
  onOpenVoiceAssistant,
  onSwitchToEnterprise
}) => {
  const [selectedPlant, setSelectedPlant] = useState<BotanicalItem>(BOTANICAL_PLANTS[0]);
  const [cartItems, setCartItems] = useState<CartItemEntry[]>([
    { plant: BOTANICAL_PLANTS[0], quantity: 1, potColor: 'Matte Porcelain' }
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSeller, setChatSeller] = useState<BotanicalItem['seller']>(BOTANICAL_PLANTS[0].seller);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectPlant = (plant: BotanicalItem) => {
    setSelectedPlant(plant);
  };

  const handleAddToCart = (plant: BotanicalItem, quantity: number, potColor: string) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.plant.id === plant.id && item.potColor === potColor);
      if (existing) {
        return prev.map(item =>
          item.plant.id === plant.id && item.potColor === potColor
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { plant, quantity, potColor }];
    });
  };

  const handleUpdateQuantity = (plantId: string, potColor: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.plant.id === plantId && item.potColor === potColor) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItemEntry[]
    );
  };

  const handleRemoveItem = (plantId: string, potColor: string) => {
    setCartItems(prev => prev.filter(item => !(item.plant.id === plantId && item.potColor === potColor)));
  };

  const handleCheckout = () => {
    alert(`Thank you! Order placed for ${cartCount} plants. Jacob Doe and our nursery team will prepare your specimens with climate-controlled packaging.`);
    setCartItems([]);
    setIsCartOpen(false);
  };

  const handleOpenChatWithSeller = (seller: BotanicalItem['seller']) => {
    setChatSeller(seller);
    setIsChatOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#EDF2EE] via-[#F4F7F4] to-[#E5ECE7] py-8 px-4 flex flex-col items-center justify-center relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Subtle Architectural Grid Texture Background (Matching inspo canvas) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(46, 88, 67, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(46, 88, 67, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Atmospheric Ambient Lighting Radial Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-[#3B6F55]/15 blur-3xl pointer-events-none" />

      {/* Top Architectural System Navigation Bar */}
      <div className="w-full max-w-6xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3B6F55] to-[#264A38] shadow-md flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-[#1B3527] tracking-tight">
                PARADISE FISHERIES ARCHITECTURE
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#254F3A] text-[10px] font-black border border-emerald-300/40">
                ORGANIC SYSTEM 2.0
              </span>
            </div>
            <p className="text-xs text-emerald-800/70 font-medium">
              Inspired by Modern Glassmorphism, Atmospheric Lighting & 360° Turntable Showcase
            </p>
          </div>
        </div>

        {/* Global Toolbar Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            id="global-cart-pill"
            onClick={() => setIsCartOpen(true)}
            className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-[#1B3527] text-xs font-bold shadow-xs border border-emerald-900/10 flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#3B6F55]" />
            <span>Bag</span>
            <span className="bg-[#3B6F55] text-white px-2 py-0.5 rounded-full text-[10px]">
              {cartCount}
            </span>
          </button>

          <button
            id="launch-voice-assistant-button"
            onClick={onOpenVoiceAssistant}
            className="px-4 py-2 rounded-full bg-[#3B6F55] hover:bg-[#2B5440] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-[#FCD34D]" />
            <span>AI Voice Stockkeeper</span>
          </button>

          {onSwitchToEnterprise && (
            <button
              onClick={onSwitchToEnterprise}
              className="px-4 py-2 rounded-full bg-white/80 hover:bg-white text-emerald-800 text-xs font-semibold border border-emerald-900/10 transition-colors"
            >
              Cold Store Mode
            </button>
          )}
        </div>
      </div>

      {/* Dual Smartphone Showcase (Replicating the exact side-by-side presentation in the user's inspiration image!) */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 relative z-10">
        {/* Left Smartphone: Storefront & Discovery */}
        <div className="transform transition-transform hover:scale-[1.01] duration-300">
          <OrganicMobileDevice label="Storefront & Discovery Hub">
            <BotanicalStorefront
              onSelectPlant={handleSelectPlant}
              selectedPlantId={selectedPlant.id}
              cartCount={cartCount}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenVoiceAssistant={onOpenVoiceAssistant}
            />
          </OrganicMobileDevice>
        </div>

        {/* Right Smartphone: 360° Interactive Turntable & Specification Sheet */}
        <div className="transform transition-transform hover:scale-[1.01] duration-300">
          <OrganicMobileDevice label="360° Turntable & Specifications">
            <BotanicalDetailView
              plant={selectedPlant}
              onBack={() => {}}
              onAddToCart={handleAddToCart}
              onOpenChatWithSeller={handleOpenChatWithSeller}
            />
          </OrganicMobileDevice>
        </div>
      </div>

      {/* Live System Synced Hint Banner */}
      <div className="mt-8 z-20 text-center">
        <p className="text-xs text-emerald-900/70 font-semibold bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-900/10 inline-flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Interactive State Synced: Select any specimen on the left screen to rotate and inspect on the right 360° turntable.</span>
        </p>
      </div>

      {/* Cart Drawer */}
      <BotanicalCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {/* Seller Chat Modal */}
      <PlantCareChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        seller={chatSeller}
        plantName={selectedPlant.name}
      />
    </div>
  );
};
