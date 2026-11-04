import React, { useState } from 'react';
import {
  BookOpen,
  Briefcase,
  User,
  HeartPulse,
  FolderKanban,
  Plus,
} from 'lucide-react';
import { useAmbit } from '../context/AmbitContext';
import { getAmbitTheme } from '../utils/ambitThemes';
import { AmbitManagerModal } from './AmbitManagerModal';

const AMBIT_ICONS = {
  'book-open': BookOpen,
  briefcase: Briefcase,
  user: User,
  'heart-pulse': HeartPulse,
  'folder-kanban': FolderKanban,
};

/**
 * Navegación horizontal por pestañas deslizables (Pills) para los ámbitos activos.
 * Regla UI/UX anti-fatiga visual: únicamente la píldora activa aplica `theme.bgPrimary text-white shadow-sm`,
 * mientras las inactivas permanecen en tono neutro (`bg-transparent text-gray-500 hover:text-gray-800`).
 */
export function AmbitTabs() {
  const { currentAmbit, activeAmbits, setCurrentAmbitId } = useAmbit();
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  return (
    <>
      <div className="flex justify-center mb-10">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm flex items-center gap-1 border border-gray-100 max-w-full overflow-x-auto no-scrollbar">
          {activeAmbits.map((ambit) => {
            const isSelected = currentAmbit?.id === ambit.id;
            const theme = getAmbitTheme(ambit.themeKey);
            const IconComponent = AMBIT_ICONS[ambit.icono] || BookOpen;

            const activeClasses = `${theme.bgPrimary} text-white shadow-sm`;
            const inactiveClasses = 'bg-transparent text-gray-500 hover:text-gray-800';

            return (
              <button
                key={ambit.id}
                id={`tab-${ambit.id}`}
                type="button"
                onClick={() => setCurrentAmbitId(ambit.id)}
                className={`shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${
                  isSelected ? activeClasses : inactiveClasses
                }`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{ambit.nombre}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsManagerOpen(true)}
            className="shrink-0 ml-1 w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Configurar ámbitos activos"
            title="Activar o desactivar ámbitos"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AmbitManagerModal isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} />
    </>
  );
}

