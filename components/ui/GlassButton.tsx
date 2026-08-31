import React from "react";

// Reusable glassmorphism button used across the UI
export const GlassButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`bg-white/5 hover:bg-red-600/20 active:scale-95 backdrop-blur-xl border border-white/10 hover:border-red-500/40 rounded-xl px-4 py-2 text-white font-medium transition-all duration-200 shadow-md ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
