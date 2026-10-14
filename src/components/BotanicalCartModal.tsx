import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
import { BotanicalItem } from '../data/plantData';

export interface CartItemEntry {
  plant: BotanicalItem;
  quantity: number;
  potColor: string;
}

interface BotanicalCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemEntry[];
  onUpdateQuantity: (plantId: string, potColor: string, delta: number) => void;
  onRemoveItem: (plantId: string, potColor: string) => void;
  onCheckout: () => void;
}

export const BotanicalCartModal: React.FC<BotanicalCartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.plant.price * item.quantity), 0);
  const shipping = subtotal > 50 || cartItems.length === 0 ? 0 : 7.50;
  const total = subtotal + shipping;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="botanical-cart-drawer"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-emerald-950/10 font-['Plus_Jakarta_Sans',sans-serif]"
      >
        {/* Header */}
        <div className="p-4 px-6 bg-gradient-to-r from-[#3B6F55] to-[#2E5843] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-200" />
            <h3 className="font-extrabold text-base">Your Botanical Bag</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {cartItems.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>
          <button
            id="cart-close-button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-gray-100">
          {cartItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-[#3B6F55] mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-gray-800">Your bag is empty</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Select from our curated indoor and architectural specimens to start growing your sanctuary.
              </p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div key={`${item.plant.id}-${item.potColor}-${index}`} className="py-3.5 flex items-center gap-3">
                <div className="w-14 h-14 bg-[#F2F4EF] rounded-2xl p-1 shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={item.plant.image}
                    alt={item.plant.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-800 truncate">
                    {item.plant.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    Finish: <span className="text-emerald-800">{item.potColor}</span>
                  </p>
                  <span className="text-xs font-extrabold text-[#3B6F55]">
                    ${item.plant.price.toFixed(2)}
                  </span>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-1.5 bg-gray-100 rounded-full p-1 border border-gray-200">
                  <button
                    onClick={() => onUpdateQuantity(item.plant.id, item.potColor, -1)}
                    className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.plant.id, item.potColor, 1)}
                    className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.plant.id, item.potColor)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-gray-50 border-t border-gray-100">
            <div className="space-y-1.5 text-xs text-gray-600 mb-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-gray-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Climate-Safe Courier Shipping</span>
                <span className="font-bold text-gray-800">
                  {shipping === 0 ? <span className="text-emerald-600">FREE</span> : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-[#3B6F55]">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>30-Day Healthy Botanical Guarantee + Expert Care Advice</span>
            </div>

            <button
              id="checkout-confirm-button"
              onClick={onCheckout}
              className="w-full py-3 rounded-full bg-[#3B6F55] hover:bg-[#2C5843] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer transition-all active:scale-98"
            >
              <span>Proceed to Dispatch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
