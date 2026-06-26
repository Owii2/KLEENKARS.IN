import React from 'react';

// A simple glass‑morphism container used across the admin UI
export const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 shadow-lg ${className}`}
      style={{ background: 'rgba(255,255,255,0.1)' }}
    >
      {children}
    </div>
  );
};
