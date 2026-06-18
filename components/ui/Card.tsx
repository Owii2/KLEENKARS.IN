import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`glass-panel border-white/10 rounded-3xl p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}
