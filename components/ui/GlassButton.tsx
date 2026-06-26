import React from 'react';

// A reusable glass‑morphism button used across the admin UI
export const GlassButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-2 text-white hover:bg-white/20 transition ${className}`}
      style={{ background: 'rgba(255,255,255,0.1)' }}
      {...props}
    >
      {children}
    </button>
  );
};
