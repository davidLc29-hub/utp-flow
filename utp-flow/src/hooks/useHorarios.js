import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, horarioRepository } from '../db/database';
import { detectScheduleConflict } from '../services/timeValidationService';

/**
 * Custom Hook para gestionar bloques de horario fijo (Universidad / Trabajo)
 * y validar traslapes antes de agendar tareas.
 */
export function useHorarios() {
  const horarios = useLiveQuery(() => db.horarios.toArray(), [], []);

  const addHorario = useCallback(async ({ dayOfWeek, startTime, endTime, context, label }) => {
    return horarioRepository.add({
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      context,
      label: (label || '').trim(),
    });
  }, []);

  const removeHorario = useCallback(async (id) => {
    await horarioRepository.remove(id);
  }, []);

  const checkConflict = useCallback(
    (reminderAt, existingTasks = [], ignoreTaskId = null) => {
      return detectScheduleConflict(reminderAt, horarios || [], existingTasks, ignoreTaskId);
    },
    [horarios]
  );

  return {
    horarios: horarios || [],
    addHorario,
    removeHorario,
    checkConflict,
  };
}

