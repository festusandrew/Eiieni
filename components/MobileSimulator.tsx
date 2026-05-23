import React, { useState, useEffect } from 'react';

interface MobileSimulatorProps {
  children: React.ReactNode;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({ children }) => {
  const [time, setTime] = useState('');
  const [batteryLevel] = useState(88); // Static realistic premium charge
  
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative p-0 sm:p-6 md:p-8">
      {/* 
        Responsive Wrapper:
        - On mobile (default): absolute inset-0, no simulator decoration, full width/height
        - On desktop (sm and up): simulated iPhone/premium phone card dimensions (390px x 844px), beautiful hardware frame
      */}
      <div className="relative w-full h-[100dvh] sm:w-[390px] sm:h-[844px] sm:rounded-[50px] sm:border-[10px] sm:border-zinc-800 sm:bg-zinc-950 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] sm:ring-[1px] sm:ring-white/10 flex flex-col overflow-hidden transition-all duration-500">
        
        {/* Dynamic Highlight Sheen (Desktop Only) */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent z-40 hidden sm:block rounded-[40px]"></div>

        {/* SIDE BUTTONS (Desktop Only) */}
        {/* Volume Up */}
        <div className="absolute left-[-13px] top-[140px] w-[3px] h-[50px] bg-zinc-800 rounded-l border-y border-l border-zinc-700 hidden sm:block transition-all hover:bg-zinc-700" title="Volume Up"></div>
        {/* Volume Down */}
        <div className="absolute left-[-13px] top-[200px] w-[3px] h-[50px] bg-zinc-800 rounded-l border-y border-l border-zinc-700 hidden sm:block transition-all hover:bg-zinc-700" title="Volume Down"></div>
        {/* Power Key */}
        <div className="absolute right-[-13px] top-[170px] w-[3px] h-[75px] bg-zinc-800 rounded-r border-y border-r border-zinc-700 hidden sm:block transition-all hover:bg-zinc-700" title="Power Button"></div>

        {/* PREMIUM MOBILE STATUS BAR */}
        <div className="h-10 px-6 pt-1 flex items-center justify-between shrink-0 bg-zinc-950 text-white text-xs select-none z-30 font-medium tracking-wide">
          {/* Real Time */}
          <div className="w-1/3 flex items-center justify-start text-[11px] font-semibold text-zinc-300">
            {time || '12:00 PM'}
          </div>
          
          {/* Simulated Dynamic Island / Notch */}
          <div className="w-1/3 flex justify-center items-center">
            <div className="w-[110px] h-[18px] bg-black rounded-full border border-zinc-900 flex items-center justify-end px-3 gap-1 relative overflow-hidden hidden sm:flex shadow-inner">
              <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-800/80 mr-1 shadow-inner"></div>
              <div className="w-[3px] h-[3px] rounded-full bg-blue-900/40"></div>
            </div>
          </div>

          {/* System Stats Icons */}
          <div className="w-1/3 flex items-center justify-end gap-2 text-zinc-300">
            {/* Cellular Reception */}
            <svg className="w-4 h-4 text-zinc-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 22h20V2z" fillOpacity="0.3" />
              <path d="M17 5L2 20h15z" />
            </svg>
            
            {/* Radio Icon replacing Wi-Fi */}
            <svg className="w-4.5 h-4.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            
            {/* Battery Level */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-400 font-semibold">{batteryLevel}%</span>
              <div className="w-5 h-2.5 rounded-sm border border-zinc-400 p-[1px] flex items-center">
                <div className="h-full bg-emerald-400 rounded-2xs" style={{ width: `${batteryLevel}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* SIMULATOR SCREEN CONTENT (Holds entire app pages) */}
        <div className="flex-1 w-full relative overflow-hidden bg-zinc-950 flex flex-col">
          {children}
        </div>

        {/* BOTTOM HOME INDICATOR (Desktop Only) */}
        <div className="h-5 bg-zinc-950 flex items-center justify-center shrink-0 z-30 select-none hidden sm:flex">
          <div className="w-32 h-[4px] bg-zinc-700/80 rounded-full transition-colors hover:bg-zinc-500"></div>
        </div>
      </div>
    </div>
  );
};
