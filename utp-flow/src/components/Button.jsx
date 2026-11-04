import React from 'react';
import { useAmbit } from '../context/AmbitContext';

/**
 * Componente Button reutilizable conectado al diccionario estático de temas (AMBIT_THEMES).
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
  const { currentTheme } = useAmbit();

  if (variant === 'fab') {
    return (
      <button
        id={id}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`fixed bottom-6 right-6 sm:bottom-10 sm:right-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full text-white flex items-center justify-center active:scale-90 transition-all color-transition z-20 hover:scale-105 ${currentTheme.shadowFab} ${currentTheme.bgPrimary} ${currentTheme.bgHover} ${className}`}
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
        className={`py-3.5 px-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors ${className}`}
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
      className={`py-3.5 px-4 text-white font-bold rounded-xl transition-all color-transition active:opacity-80 ${currentTheme.bgPrimary} ${currentTheme.bgHover} ${className}`}
    >
      {children}
    </button>
  );
}
