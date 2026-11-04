import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useAmbit } from '../context/AmbitContext';
import { getAmbitTheme } from '../utils/ambitThemes';

/**
 * Modal interactivo de resolución de conflictos de horario (Sprint 2).
 * Se abre en la capa superior (`z-50`) con backdrop oscurecido y bloqueo de clic exterior.
 */
export function ConflictModal({ conflict, onModifyTime, onForceSaveException }) {
  const { allAmbits, currentTheme } = useAmbit();

  if (!conflict) return null;

  const conflictAmbit = allAmbits.find((a) => a.id === conflict.id_entorno);
  const ambitName = conflictAmbit ? conflictAmbit.nombre : 'Horario Fijo';
  const ambitTheme = getAmbitTheme(conflictAmbit?.themeKey || 'rose');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h2 id="conflict-modal-title" className="text-lg font-bold text-brand-text">
              Conflicto con tu Horario Fijo
            </h2>
            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
              La hora seleccionada se superpone con un bloque fijo registrado en tu agenda:
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-gray-50 p-4 border border-gray-200/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-brand-text text-base">{conflict.titulo}</span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ambitTheme.badgeBg} ${ambitTheme.badgeText}`}
            >
              {ambitName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>
              {conflict.dia_nombre ? `${conflict.dia_nombre}, ` : ''}
              {conflict.hora_inicio} - {conflict.hora_fin}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onModifyTime}
            className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm transition-all shadow-sm ${currentTheme.bgPrimary} ${currentTheme.bgHover}`}
          >
            Modificar la hora
          </button>

          <button
            type="button"
            onClick={onForceSaveException}
            className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
          >
            Forzar Guardado como Excepción
          </button>
        </div>
      </div>
    </div>
  );
}
