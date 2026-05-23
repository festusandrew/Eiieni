import React from 'react';

interface MobileSimulatorProps {
  children: React.ReactNode;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({ children }) => {
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

