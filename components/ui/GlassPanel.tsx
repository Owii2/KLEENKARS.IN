import React from "react";

// Premium glassmorphism container used across the UI
export const GlassPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-zinc-900/60 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 shadow-2xl shadow-black/50 ${className}`}
    >
      {children}
    </div>
  );
};
