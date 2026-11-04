import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase, ambitRepository, OFFICIAL_AMBITS } from '../db/database';
import { getAmbitTheme } from '../utils/ambitThemes';

const AmbitContext = createContext(null);

export function AmbitProvider({ children }) {
  const [currentAmbitId, setCurrentAmbitIdState] = useState('uni');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const storedAmbits = useLiveQuery(
    async () => {
      const rows = await db.entornos.toArray();
      return rows.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    },
    [],
    OFFICIAL_AMBITS
  );

  const allAmbits = useMemo(() => {
    return Array.isArray(storedAmbits) && storedAmbits.length > 0
      ? storedAmbits
      : OFFICIAL_AMBITS;
  }, [storedAmbits]);

  const activeAmbits = useMemo(() => {
    const actives = allAmbits.filter((e) => Boolean(e.activo));
    return actives.length > 0 ? actives : [allAmbits[0] || OFFICIAL_AMBITS[0]];
  }, [allAmbits]);

  // Si el usuario desactiva el ámbito actual, cambia automáticamente al primer ámbito activo disponible
  useEffect(() => {
    const isCurrentActive = activeAmbits.some((a) => a.id === currentAmbitId);
    if (!isCurrentActive && activeAmbits.length > 0) {
      setCurrentAmbitIdState(activeAmbits[0].id);
    }
  }, [activeAmbits, currentAmbitId]);

  const currentAmbit = useMemo(() => {
    return (
      activeAmbits.find((a) => a.id === currentAmbitId) ||
      activeAmbits[0] ||
      OFFICIAL_AMBITS[0]
    );
  }, [activeAmbits, currentAmbitId]);

  const currentTheme = useMemo(() => {
    return getAmbitTheme(currentAmbit?.themeKey || 'rose');
  }, [currentAmbit]);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type, id: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(null);
  }, []);

  const setCurrentAmbitId = useCallback((id) => {
    setCurrentAmbitIdState(id);
  }, []);

  const toggleAmbitActive = useCallback(
    async (id) => {
      const target = allAmbits.find((a) => a.id === id);
      if (!target) return { ok: false };

      if (target.activo && activeAmbits.length <= 1) {
        showToast('Debes mantener al menos 1 ámbito activo.', 'error');
        return { ok: false };
      }

      const nextState = !target.activo;
      await ambitRepository.update(id, { activo: nextState });

      if (!nextState && currentAmbitId === id) {
        const remaining = activeAmbits.filter((a) => a.id !== id);
        if (remaining.length > 0) {
          setCurrentAmbitIdState(remaining[0].id);
        }
      }

      return { ok: true, activo: nextState };
    },
    [allAmbits, activeAmbits, currentAmbitId, showToast]
  );

  const value = useMemo(
    () => ({
      currentAmbit,
      currentAmbitId: currentAmbit.id,
      currentTheme,
      activeAmbits,
      allAmbits,
      setCurrentAmbitId,
      toggleAmbitActive,
      toast,
      showToast,
      hideToast,
    }),
    [
      currentAmbit,
      currentTheme,
      activeAmbits,
      allAmbits,
      setCurrentAmbitId,
      toggleAmbitActive,
      toast,
      showToast,
      hideToast,
    ]
  );

  return <AmbitContext.Provider value={value}>{children}</AmbitContext.Provider>;
}

export function useAmbit() {
  const ctx = useContext(AmbitContext);
  if (!ctx) {
    throw new Error('useAmbit debe utilizarse dentro de un AmbitProvider');
  }
  return ctx;
}

