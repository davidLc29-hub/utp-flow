import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useBimodal } from '../context/BimodalContext';
import { ToastNotification } from '../components/ToastNotification';
import { OnboardingGuide } from '../components/OnboardingGuide';
import logoUrl from '../assets/logo.svg';

/**
 * Componente contenedor principal (Layout) que incluye el encabezado superior sticky,
 * el área central de contenido, las notificaciones Toast y la miniguía de onboarding.
 */
export function MainLayout({ children, showHeader = true, onOpenSettings }) {
  const { theme, toast } = useBimodal();

  return (
    <div className="min-h-screen font-sans selection:bg-brand-uni selection:text-white">
      <OnboardingGuide />
      <ToastNotification toast={toast} />

      <div className="min-h-screen flex flex-col pb-24 relative">
        {showHeader && (
          <header className="bg-white shadow-sm sticky top-0 z-40 w-full mb-6">
            <div className="max-w-3xl mx-auto px-6 sm:px-10 py-5 sm:py-6 flex items-center justify-between">
              <div
                className="flex items-center gap-3 text-brand-text font-bold text-2xl lg:text-3xl tracking-tight transition-colors"
                id="logo-container"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white color-transition ${theme.bgClass}`}
                  id="logo-icon-box"
                >
                  <img src={logoUrl} alt="UTP Flow logo" className="w-8 h-8 object-contain" />
                </div>
                <span>UTP Flow</span>
              </div>

              <button
                type="button"
                onClick={onOpenSettings}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all outline-none"
                aria-label="Ir a Configuración"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
          </header>
        )}

        {children}
      </div>
    </div>
  );
}

