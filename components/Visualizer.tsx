import React from 'react';

interface VisualizerProps {
  isActive: boolean;
  mode: 'listening' | 'speaking' | 'processing' | 'idle';
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, mode }) => {
  // Return the main status text with glowing status indicator
  const getStatusMessage = () => {
    switch (mode) {
      case 'listening':
        return 'Listening closely...';
      case 'speaking':
        return 'Elenii is speaking';
      case 'processing':
        return 'Formulating response...';
      default:
        return 'Elenii is ready';
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-3">
      {/* Waveforms Container */}
      <div className="relative w-full h-10 flex items-center justify-center overflow-hidden">
        {isActive ? (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-6">
            {/* Wave 1 - Electric Cyan */}
            <div className={`h-8 w-1 bg-gradient-to-t from-cyan-400 to-indigo-500 rounded-full animate-wave shadow-[0_0_15px_rgba(34,211,238,0.7)]`} style={{ animationDelay: '0.1s' }} />
            {/* Wave 2 - Neon Violet */}
            <div className={`h-12 w-1.5 bg-gradient-to-t from-violet-500 to-purple-600 rounded-full animate-wave shadow-[0_0_15px_rgba(168,85,247,0.7)]`} style={{ animationDelay: '0.3s' }} />
            {/* Wave 3 - Bright Blue */}
            <div className={`h-16 w-2 bg-gradient-to-t from-blue-400 to-cyan-500 rounded-full animate-wave shadow-[0_0_20px_rgba(59,130,246,0.8)]`} style={{ animationDelay: '0.5s' }} />
            {/* Wave 4 - Neon Violet */}
            <div className={`h-12 w-1.5 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-wave shadow-[0_0_15px_rgba(219,39,119,0.7)]`} style={{ animationDelay: '0.2s' }} />
            {/* Wave 5 - Electric Cyan */}
            <div className={`h-8 w-1 bg-gradient-to-t from-cyan-400 to-emerald-400 rounded-full animate-wave shadow-[0_0_15px_rgba(52,211,153,0.7)]`} style={{ animationDelay: '0.4s' }} />
          </div>
        ) : mode === 'processing' ? (
          // Concentric pulsing nodes
          <div className="flex gap-2 items-center justify-center">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping-delay shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping-delay shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ animationDelay: '0.2s' }} />
            <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping-delay shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : (
          // Idle ambient state: single elegant thin glowing line or subtle dot
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
          </div>
        )}
      </div>

      {/* Helper Text with subtle gradient styling matching the mode */}
      <span className={`text-[13px] font-semibold tracking-wider uppercase transition-colors duration-300 ${
        mode === 'listening' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] animate-pulse' :
        mode === 'speaking' ? 'text-indigo-400' :
        mode === 'processing' ? 'text-purple-400 animate-pulse' :
        'text-zinc-500'
      }`}>
        {getStatusMessage()}
      </span>

      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.2);
            filter: brightness(0.8);
          }
          50% {
            transform: scaleY(1);
            filter: brightness(1.2);
          }
        }
        .animate-wave {
          animation: wave 1.2s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes ping-delay {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
        }
        .animate-ping-delay {
          animation: ping-delay 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};