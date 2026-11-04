import React from 'react';
import { Check, Calendar, Pencil, Trash2, Star, AlertTriangle } from 'lucide-react';
import { useAmbit } from '../context/AmbitContext';
import { formatDate, formatReminderSquareText } from '../utils/formatDate';

/**
 * Tarjeta presentacional de una tarea individual.
 * Soporta insignia de urgencia (`task.urgente`), indicador de excepción de cruce y tema dinámico.
 */
export function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const { currentTheme } = useAmbit();

  const isCompleted = Boolean(task.estado_completado);
  const isUrgent = Boolean(task.urgente);
  const dueDate = task.fecha_programada;
  const scheduledTime = task.hora_programada;

  const borderLeftClass = isCompleted
    ? 'opacity-60 border-l-transparent'
    : isUrgent
    ? 'border-l-amber-500 ring-1 ring-amber-200/80'
    : currentTheme.borderLeft;

  return (
    <div
      className={`bg-white p-5 sm:p-6 rounded-2xl shadow-sm transition-all flex items-center justify-between group border-l-8 ${borderLeftClass}`}
    >
      <div className="flex items-center gap-4 sm:gap-5 w-full min-w-0">
        <label className="relative flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isCompleted}
            onChange={() => onToggle(task.id)}
          />
          <div
            className={`w-7 h-7 border-2 rounded-lg transition-colors flex items-center justify-center ${
              isCompleted
                ? `border-transparent ${currentTheme.bgPrimary}`
                : 'bg-gray-50 border-gray-200 peer-active:border-gray-300'
            }`}
          >
            <Check
              strokeWidth={3}
              className={`w-4 h-4 text-white ${isCompleted ? 'block' : 'hidden'}`}
            />
          </div>
        </label>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-lg sm:text-xl font-semibold leading-tight break-words ${
                isCompleted ? 'line-through text-gray-500 decoration-gray-400' : 'text-brand-text'
              }`}
            >
              {task.titulo}
            </h3>

            {isUrgent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                Urgente
              </span>
            )}

            {task.forzado_con_cruce && !isCompleted && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
                title="Guardada como excepción sobre un horario fijo"
              >
                <AlertTriangle className="w-3 h-3" />
                Excepción
              </span>
            )}
          </div>

          {(dueDate || scheduledTime) && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {dueDate && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    isCompleted
                      ? 'bg-gray-100 text-gray-400'
                      : `${currentTheme.badgeBg} ${currentTheme.badgeText}`
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Hasta {formatDate(dueDate)}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {scheduledTime && (
        <div className="ml-3 shrink-0 flex items-center">
          <div
            role="img"
            aria-label="Alarma programada"
            className="flex items-center justify-center w-16 sm:w-20 h-10 sm:h-12 rounded-lg text-white text-xs sm:text-sm font-semibold px-1 text-center"
            style={{ backgroundColor: '#24AD96' }}
          >
            {formatReminderSquareText(scheduledTime)}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2">
        <button
          type="button"
          onClick={() => onEdit(task.id)}
          className="p-2 sm:p-2.5 text-gray-400 hover:text-brand-text hover:bg-gray-100 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0 rounded-xl"
          aria-label="Editar Tarea"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0 rounded-xl"
          aria-label="Eliminar Tarea"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
