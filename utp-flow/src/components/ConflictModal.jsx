import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { formatReminderDateTime } from '../utils/formatDate';

/**
 * Modal de advertencia cuando una tarea programada se cruza con un bloque fijo
 * o con otra tarea activa detectada por timeValidationService.
 */
export function ConflictModal({ conflict, onConfirmAnyway, onCancel }) {
  if (!conflict) return null;

  const isFixedSchedule = conflict.type === 'fixed_schedule';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Cerrar alerta de conflicto"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 id="conflict-modal-title" className="text-lg font-bold text-brand-text">
              Cruce de horario detectado
            </h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              {isFixedSchedule ? (
                <>
                  La hora elegida coincide con tu bloque fijo{' '}
                  <strong className="text-brand-text">&ldquo;{conflict.label}&rdquo;</strong> (
                  {conflict.startTime} - {conflict.endTime}).
                </>
              ) : (
                <>
                  Ya tienes otra tarea programada muy cerca de esa hora:{' '}
                  <strong className="text-brand-text">&ldquo;{conflict.label}&rdquo;</strong> (
                  {formatReminderDateTime(conflict.reminderAt)}).
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cambiar hora
          </Button>
          <Button variant="primary" onClick={onConfirmAnyway} className="flex-1">
            Guardar igual
          </Button>
        </div>
      </div>
    </div>
  );
}

