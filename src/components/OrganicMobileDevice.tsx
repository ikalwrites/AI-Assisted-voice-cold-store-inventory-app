import React from 'react';
import { Wifi, Battery } from 'lucide-react';

interface OrganicMobileDeviceProps {
  children: React.ReactNode;
  label?: string;
}

export const OrganicMobileDevice: React.FC<OrganicMobileDeviceProps> = ({
  children,
  label
}) => {
  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-900/60 mb-3 px-3 py-1 rounded-full bg-white/70 border border-emerald-900/10 shadow-xs">
          {label}
        </span>
      )}

      {/* Titanium Phone Chassis (Matches exact aspect and silhouette of inspo image) */}
      <div className="w-[360px] h-[740px] bg-[#121614] rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(18,36,24,0.35),0_0_0_1px_rgba(255,255,255,0.15)] relative flex flex-col justify-between select-none ring-1 ring-black/40">
        {/* Outer Titanium Bezel Highlights */}
        <div className="absolute inset-0 rounded-[48px] pointer-events-none border border-white/10" />

        {/* Inner Screen Container */}
        <div className="w-full h-full bg-[#FCFBF7] rounded-[38px] overflow-hidden flex flex-col relative">
          {/* iOS Status Bar */}
          <div className="w-full px-6 pt-3 pb-1 flex items-center justify-between text-xs font-semibold z-30 relative shrink-0">
            {/* Clock */}
            <span className="text-[12px] font-bold text-gray-800 tracking-tight pl-1">
              9:41
            </span>

            {/* Dynamic Island Notch */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-24 h-6 bg-black rounded-full shadow-inner flex items-center justify-between px-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-950/80 border border-white/10" />
              <div className="w-2 h-2 rounded-full bg-[#0F172A]" />
            </div>

            {/* Cellular, Wifi, Battery */}
            <div className="flex items-center gap-1.5 text-gray-700 pr-1">
              {/* Cellular Signal bars */}
              <div className="flex items-end gap-0.5 h-2.5">
                <div className="w-0.5 h-1 bg-gray-700 rounded-xs" />
                <div className="w-0.5 h-1.5 bg-gray-700 rounded-xs" />
                <div className="w-0.5 h-2 bg-gray-700 rounded-xs" />
                <div className="w-0.5 h-2.5 bg-gray-700 rounded-xs" />
              </div>

              {/* Wifi */}
              <Wifi className="w-3 h-3 text-gray-700 stroke-[2.5]" />

              {/* Battery */}
              <div className="flex items-center">
                <div className="w-5 h-2.5 border border-gray-700 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-gray-800 rounded-xs" />
                </div>
                <div className="w-0.5 h-1 bg-gray-700 rounded-r-xs" />
              </div>
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 w-full h-[calc(100%-2rem)] relative overflow-hidden">
            {children}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="absolute bottom-1 left-0 right-0 h-4 flex items-center justify-center pointer-events-none z-40">
            <div className="w-32 h-1 bg-black/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
