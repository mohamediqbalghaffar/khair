import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Pure Pristine White Base */}
      <div className="absolute inset-0 bg-[#ffffff]" />

      {/* Gentle Luminous Liquid Pastel Light Blobs */}
      <div 
        className="absolute -top-[10%] right-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-cyan-200/40 via-blue-100/35 to-transparent blur-[110px] animate-liquid-pulse" 
        style={{ animationDuration: '14s' }}
      />
      <div 
        className="absolute top-[30%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-100/40 via-purple-100/30 to-transparent blur-[120px] animate-liquid-pulse"
        style={{ animationDuration: '18s', animationDelay: '-5s' }}
      />
      <div 
        className="absolute -bottom-[10%] right-[20%] w-[620px] h-[620px] rounded-full bg-gradient-to-tl from-emerald-100/35 via-teal-100/25 to-transparent blur-[130px] animate-liquid-pulse"
        style={{ animationDuration: '22s', animationDelay: '-8s' }}
      />
      <div 
        className="absolute top-[65%] left-[20%] w-[480px] h-[480px] rounded-full bg-gradient-to-r from-pink-100/25 via-sky-100/30 to-transparent blur-[100px] animate-liquid-pulse"
        style={{ animationDuration: '16s', animationDelay: '-12s' }}
      />

      {/* Subtle Specular Mesh Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(15, 23, 42, 0.25) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );
};
