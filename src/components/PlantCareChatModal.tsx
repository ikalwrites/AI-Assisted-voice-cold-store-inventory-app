import React, { useState } from 'react';
import { X, Send, Phone, CheckCheck, Sparkles } from 'lucide-react';
import { BotanicalItem } from '../data/plantData';

interface PlantCareChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: BotanicalItem['seller'];
  plantName: string;
}

interface Message {
  id: string;
  sender: 'user' | 'seller';
  text: string;
  time: string;
}

export const PlantCareChatModal: React.FC<PlantCareChatModalProps> = ({
  isOpen,
  onClose,
  seller,
  plantName
}) => {
  if (!isOpen) return null;

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'seller',
      text: `Hello! Jacob here. I oversee our botanical nursery. How can I assist you with your ${plantName}?`,
      time: 'Just now'
    }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: 'Just now'
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');

    // Jacob's intelligent botanical reply
    setTimeout(() => {
      let reply = `Great question! For the ${plantName}, ensure the potting mix dries slightly between waterings, and keep it in bright, indirect morning light. Let me know if you need organic nutrient recommendations!`;
      if (userText.toLowerCase().includes('water') || userText.toLowerCase().includes('drink')) {
        reply = `For watering: check the top 2 inches of soil with your finger. If dry, water thoroughly until it drains out the base. Never allow roots to sit in standing water!`;
      } else if (userText.toLowerCase().includes('light') || userText.toLowerCase().includes('sun')) {
        reply = `Light requirements: It adores gentle morning sun or dappled indirect daylight. Avoid harsh direct midday scorching rays which can brown the leaf tips.`;
      } else if (userText.toLowerCase().includes('cat') || userText.toLowerCase().includes('dog') || userText.toLowerCase().includes('pet')) {
        reply = `Pet safety: Monstera leaves contain calcium oxalate crystals, so keep it elevated if you have curious cats or dogs. Our Calathea Medallion is 100% pet-safe!`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          sender: 'seller',
          text: reply,
          time: 'Just now'
        }
      ]);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
      <div 
        id="plant-chat-dialog"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] border border-emerald-950/10"
      >
        {/* Header */}
        <div className="p-3.5 px-5 bg-gradient-to-r from-[#3B6F55] to-[#2E5843] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={seller.avatar}
                alt={seller.name}
                className="w-9 h-9 rounded-full object-cover border border-white"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold leading-tight">{seller.name}</h4>
              <span className="text-[10px] text-emerald-100/80 font-medium">
                {seller.role} • Active Now
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FCFBF7]">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#3B6F55] text-white rounded-tr-xs'
                    : 'bg-white text-gray-800 border border-emerald-950/5 rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-gray-400 mt-1 px-1 flex items-center gap-1">
                {msg.time}
                {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-emerald-600" />}
              </span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            id="chat-input-field"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask Jacob about care, light, or soil...`}
            className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B6F55]"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-full bg-[#3B6F55] hover:bg-[#2E5843] text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
