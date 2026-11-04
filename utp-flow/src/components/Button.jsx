import React from 'react';
import { useBimodal } from '../context/BimodalContext';

/**
 * Componente Button reutilizable y aislado con soporte para variantes bimodales,
 * secundarias y botón de acción flotante (FAB).
 */
export function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  ariaLabel,
  id,
}) {
  const { theme } = useBimodal();

  if (variant === 'fab') {
    return (
      <button
        id={id}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`fixed bottom-6 right-6 sm:bottom-10 sm:right-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full text-white flex items-center justify-center active:scale-90 transition-all color-transition z-20 hover:scale-105 ${theme.fabShadowClass} ${theme.bgClass} ${className}`}
      >
        {children}
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        id={id}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`py-3.5 bg-gray-100 active:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`py-3.5 text-white font-bold rounded-xl transition-all color-transition active:opacity-80 ${theme.bgClass} ${className}`}
    >
      {children}
    </button>
  );
}

