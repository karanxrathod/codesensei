
import React from 'react';

export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
}> = ({ children, onClick, className = '', variant = 'primary', disabled }) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100",
    outline: "border border-zinc-700 hover:bg-zinc-800 text-zinc-300",
    ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const SectionCard: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ title, children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-800/50 rounded-xl p-5 ${onClick ? 'cursor-pointer hover:border-zinc-700 transition-colors' : ''} ${className}`}
    >
      {title && <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "bg-zinc-800" }) => (
  <span className={`${color} text-zinc-300 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-tight`}>
    {children}
  </span>
);

export const LoadingDots: React.FC = () => (
  <div className="flex space-x-1 justify-center items-center h-4">
    <div className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
  </div>
);
