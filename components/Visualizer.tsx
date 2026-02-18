import React from 'react';

interface VisualizerProps {
  isActive: boolean;
  mode: 'listening' | 'speaking' | 'processing' | 'idle';
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, mode }) => {
  const bars = [1, 2, 3, 4, 5];

  const getColor = () => {
    switch (mode) {
      case 'listening': return 'bg-red-500';
      case 'speaking': return 'bg-[#2D6A94]';
      case 'processing': return 'bg-[#2D6A94]';
      default: return 'bg-zinc-700';
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 h-16">
      {bars.map((i) => (
        <div
          key={i}
          className={`w-3 rounded-full transition-all duration-300 ${getColor()}`}
          style={{
            height: isActive ? `${Math.random() * 100 + 20}%` : '20%',
            animation: isActive ? `pulse 1s infinite ${i * 0.1}s` : 'none'
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { height: 20%; opacity: 0.5; }
          50% { height: 80%; opacity: 1; }
        }
      `}</style>
    </div>
  );
};