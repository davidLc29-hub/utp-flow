import React from 'react';
import {
  X,
  BookOpen,
  Briefcase,
  User,
  HeartPulse,
  FolderKanban,
  Layers,
} from 'lucide-react';
import { useAmbit } from '../context/AmbitContext';
import { getAmbitTheme } from '../utils/ambitThemes';

const AMBIT_ICONS = {
  'book-open': BookOpen,
  briefcase: Briefcase,
  user: User,
  'heart-pulse': HeartPulse,
  'folder-kanban': FolderKanban,
};

/**
 * Modal / Bottom Sheet para encender o apagar cualquiera de los 5 ámbitos oficiales en tiempo real.
 */
export function AmbitManagerModal({ isOpen, onClose }) {
  const { allAmbits, toggleAmbitActive } = useAmbit();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ambit-manager-title"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-6 shadow-xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Cerrar gestor de ámbitos"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 id="ambit-manager-title" className="text-lg font-bold text-brand-text">
              Tus Ámbitos de Vida
            </h2>
            <p className="text-xs text-gray-500">
              Activa solo los entornos que necesites ver en tu barra principal.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {allAmbits.map((ambit) => {
            const theme = getAmbitTheme(ambit.themeKey);
            const IconComponent = AMBIT_ICONS[ambit.icono] || BookOpen;
            const isActive = Boolean(ambit.activo);

            return (
              <div
                key={ambit.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${theme.bgPrimary}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-brand-text">{ambit.nombre}</p>
                    <span
                      className={`inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {isActive ? 'Visible en pestañas' : 'Oculto'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => toggleAmbitActive(ambit.id)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? theme.bgPrimary : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

