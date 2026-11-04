import React, { useEffect } from 'react';
import { Settings as SettingsIcon, Archive } from 'lucide-react';
import { useAmbit } from '../context/AmbitContext';
import { useAuth } from '../context/AuthContext';
import { ToastNotification } from '../components/ToastNotification';
import { OnboardingGuide } from '../components/OnboardingGuide';
import { purgeCompletedTasksOlderThan48h } from '../services/garbageCollector';
import logoUrl from '../assets/logo.svg';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/**
 * Componente contenedor principal (Layout) que incluye el encabezado superior sticky,
 * el recolector automático de basura (48h), las notificaciones Toast y la miniguía.
 */
export function MainLayout({
  children,
  showHeader = true,
  onOpenSettings,
  onOpenHistory,
  archivedCount = 0,
}) {
  const { currentTheme, toast, showToast } = useAmbit();
  const { currentUser } = useAuth();

  // Ejecutar recolector de basura (auto-purgado 48h) al montar y cada 15 minutos
  useEffect(() => {
    let mounted = true;

    async function runGarbageCollector() {
      const archivedNow = await purgeCompletedTasksOlderThan48h();
      if (mounted && archivedNow > 0) {
        showToast(
          `${archivedNow} tarea(s) completada(s) hace +48h pasaron al Historial.`,
          'info'
        );
      }
    }

    runGarbageCollector();
    const intervalId = setInterval(runGarbageCollector, FIFTEEN_MINUTES_MS);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [showToast]);

  return (
    <div className="min-h-screen font-sans selection:bg-rose-700 selection:text-white">
      <OnboardingGuide />
      <ToastNotification toast={toast} />

      <div className="min-h-screen flex flex-col pb-24 relative">
        {showHeader && (
          <header className="bg-white shadow-sm sticky top-0 z-40 w-full mb-6">
            <div className="max-w-3xl mx-auto px-6 sm:px-10 py-4 sm:py-5 flex items-center justify-between gap-3">
              <div
                className="flex items-center gap-3 text-brand-text font-bold text-xl sm:text-2xl lg:text-3xl tracking-tight transition-colors"
                id="logo-container"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white color-transition ${currentTheme.bgPrimary}`}
                  id="logo-icon-box"
                >
                  <img src={logoUrl} alt="UTP Flow logo" className="w-8 h-8 object-contain" />
                </div>
                <span>UTP Flow</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {currentUser && (
                  <div
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200/80"
                    title={currentUser.email}
                  >
                    <div
                      className={`w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center ${currentTheme.bgPrimary}`}
                    >
                      {currentUser.avatar || 'UF'}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 max-w-[130px] truncate">
                      {currentUser.nombre}
                    </span>
                  </div>
                )}

                {onOpenHistory && (
                  <button
                    type="button"
                    onClick={onOpenHistory}
                    className="relative w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition-all outline-none"
                    aria-label="Abrir Historial de Tareas (+48h)"
                    title="Historial de Tareas (Archivo +48h)"
                  >
                    <Archive className="w-5 h-5" />
                    {archivedCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gray-800 text-white text-[10px] font-bold flex items-center justify-center">
                        {archivedCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 active:scale-95 transition-all outline-none"
                  aria-label="Ir a Configuración"
                  title="Configuración y Horarios"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>
        )}

        {children}
      </div>
    </div>
  );
}
