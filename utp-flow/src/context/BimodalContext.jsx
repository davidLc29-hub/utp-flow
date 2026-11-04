import React, { createContext, useContext, useState, useMemo, useCallback, useRef } from 'react';

const BimodalContext = createContext(null);

/**
 * Proveedor global de contexto bimodal ("uni" | "work") y sistema de notificaciones Toast.
 * Centraliza la paleta de colores dinámica para que los componentes UI no calculen estilos de negocio.
 */
export function BimodalProvider({ children }) {
  const [currentContext, setCurrentContext] = useState('uni');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const switchContext = useCallback((context) => {
    if (context === 'uni' || context === 'work') {
      setCurrentContext(context);
    }
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type, id: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(null);
  }, []);

  const theme = useMemo(() => {
    const isUni = currentContext === 'uni';
    return {
      isUni,
      label: isUni ? 'Universidad' : 'Trabajo',
      accentHex: isUni ? '#B24444' : '#4A5568',
      bgClass: isUni ? 'bg-brand-uni' : 'bg-brand-work',
      textClass: isUni ? 'text-brand-uni' : 'text-brand-work',
      borderClass: isUni ? 'border-brand-uni' : 'border-brand-work',
      focusBorderClass: isUni ? 'focus:border-brand-uni' : 'focus:border-brand-work',
      badgeClass: isUni
        ? 'bg-brand-uni/10 text-brand-uni'
        : 'bg-brand-work/10 text-brand-work',
      fabShadowClass: isUni
        ? 'shadow-[0_15px_40px_-10px_rgba(178,68,68,0.5)]'
        : 'shadow-[0_15px_40px_-10px_rgba(74,85,104,0.5)]',
    };
  }, [currentContext]);

  const value = useMemo(
    () => ({
      currentContext,
      switchContext,
      theme,
      toast,
      showToast,
      hideToast,
    }),
    [currentContext, switchContext, theme, toast, showToast, hideToast]
  );

  return <BimodalContext.Provider value={value}>{children}</BimodalContext.Provider>;
}

export function useBimodal() {
  const ctx = useContext(BimodalContext);
  if (!ctx) {
    throw new Error('useBimodal debe utilizarse dentro de un BimodalProvider');
  }
  return ctx;
}

