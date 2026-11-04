import React from 'react';
import { Check, Calendar, Pencil, Trash2 } from 'lucide-react';
import { useBimodal } from '../context/BimodalContext';
import { formatDate, formatReminderSquareText } from '../utils/formatDate';

/**
 * Tarjeta presentacional de una tarea individual.
 * Solo recibe datos por props y dispara eventos al componente padre.
 */
export function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const { theme } = useBimodal();

  return (
    <div
      className={`bg-white p-5 sm:p-6 rounded-2xl shadow-sm transition-all flex items-center justify-between group border-l-8 ${
        task.completed ? 'opacity-60 border-transparent' : theme.borderClass
      }`}
    >
      <div className="flex items-center gap-4 sm:gap-5 w-full">
        <label className="relative flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={Boolean(task.completed)}
            onChange={() => onToggle(task.id)}
          />
          <div
            className={`w-7 h-7 border-2 rounded-lg transition-colors flex items-center justify-center bg-gray-50 ${
              task.completed ? 'border-transparent' : 'border-gray-200 peer-active:border-gray-300'
            }`}
            style={task.completed ? { backgroundColor: theme.accentHex } : undefined}
          >
            <Check
              strokeWidth={3}
              className={`w-4 h-4 text-white ${task.completed ? 'block' : 'hidden'}`}
            />
          </div>
        </label>

        <div className="flex-1 min-w-0 pr-2">
          <h3
            className={`text-lg sm:text-xl lg:text-2xl font-semibold leading-tight break-words ${
              task.completed ? 'line-through text-gray-500 decoration-gray-400' : 'text-brand-text'
            }`}
          >
            {task.title}
          </h3>

          {(task.date || task.reminderAt) && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {task.date && (
                <span
                  className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                    task.completed ? 'bg-gray-100 text-gray-400' : theme.badgeClass
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="whitespace-nowrap">Hasta {formatDate(task.date)}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {task.reminderAt && (
        <div className="ml-3 shrink-0 flex items-center">
          <div
            role="img"
            aria-label="Alarma programada"
            className="flex items-center justify-center w-16 sm:w-20 h-10 sm:h-12 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: '#24AD96' }}
          >
            {formatReminderSquareText(task.reminderAt)}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(task.id)}
          className="p-2 sm:p-3 text-gray-300 hover:text-brand-text hover:bg-gray-50 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0 rounded-xl hover:shadow-sm"
          aria-label="Editar Tarea"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="p-2 sm:p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0 rounded-xl hover:shadow-sm"
          aria-label="Eliminar Tarea"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

