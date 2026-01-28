
import React from 'react';
import { UI, COLORS } from '../constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const variants = {
    primary: `bg-[#FF5100] text-white shadow-lg shadow-orange-200 hover:bg-[#e64a00]`,
    secondary: `bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800`,
    outline: `border-4 border-[#FF5100] text-[#FF5100] hover:bg-orange-50`,
    ghost: `text-slate-500 hover:bg-slate-100`,
  };

  return (
    <button 
      className={`${UI.button} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`${UI.card} ${className}`}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input className={UI.input} {...props} />
);
