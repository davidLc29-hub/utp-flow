/**
 * Servicio puro de validación de tiempos y detección de conflictos de horario.
 * No tiene dependencias de React ni del DOM.
 */

/**
 * Convierte una hora en formato "HH:mm" a minutos desde las 00:00.
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
}

/**
 * Valida que la fecha/hora de un recordatorio esté en el futuro.
 */
export function validateFutureReminder(reminderAt, nowMs = Date.now()) {
  if (!reminderAt) {
    return { valid: true };
  }

  const reminderTime = new Date(reminderAt).getTime();
  if (Number.isNaN(reminderTime) || reminderTime <= nowMs) {
    return {
      valid: false,
      error: 'La alarma debe estar programada para un momento futuro.',
    };
  }

  return { valid: true };
}

/**
 * Detecta si una fecha/hora programada (`reminderAt`) se cruza con algún bloque fijo
 * de horario (clases o trabajo) o con otra tarea activa.
 *
 * @param {string} reminderAt Fecha/hora ISO o datetime-local de la tarea.
 * @param {Array} fixedSchedules Lista de bloques fijos `{ id, dayOfWeek, startTime, endTime, context, label }`.
 * @param {Array} existingTasks Lista de tareas existentes para detectar colisión directa de hora.
 * @param {string|null} ignoreTaskId ID de la tarea en edición para excluirla de la comparación.
 * @returns {{ hasConflict: boolean, conflict: object | null }}
 */
export function detectScheduleConflict(
  reminderAt,
  fixedSchedules = [],
  existingTasks = [],
  ignoreTaskId = null
) {
  if (!reminderAt) {
    return { hasConflict: false, conflict: null };
  }

  const targetDate = new Date(reminderAt);
  if (Number.isNaN(targetDate.getTime())) {
    return { hasConflict: false, conflict: null };
  }

  const dayOfWeek = targetDate.getDay(); // 0 (Dom) - 6 (Sáb)
  const targetMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();

  // 1. Cruce contra bloques de horario fijo (Universidad / Trabajo)
  for (const block of fixedSchedules) {
    if (Number(block.dayOfWeek) !== dayOfWeek) continue;

    const startMin = timeStringToMinutes(block.startTime);
    const endMin = timeStringToMinutes(block.endTime);
    if (Number.isNaN(startMin) || Number.isNaN(endMin)) continue;

    if (targetMinutes >= startMin && targetMinutes < endMin) {
      return {
        hasConflict: true,
        conflict: {
          type: 'fixed_schedule',
          label: block.label || (block.context === 'uni' ? 'Clase universitaria' : 'Jornada laboral'),
          context: block.context,
          startTime: block.startTime,
          endTime: block.endTime,
        },
      };
    }
  }

  // 2. Cruce contra otra tarea pendiente programada en una ventana menor a 30 minutos
  for (const task of existingTasks) {
    if (!task || task.completed || !task.reminderAt || task.id === ignoreTaskId) continue;

    const otherDate = new Date(task.reminderAt);
    if (Number.isNaN(otherDate.getTime())) continue;

    const diffMinutes = Math.abs(targetDate.getTime() - otherDate.getTime()) / (60 * 1000);
    if (diffMinutes < 30) {
      return {
        hasConflict: true,
        conflict: {
          type: 'task_overlap',
          label: task.title,
          context: task.context,
          reminderAt: task.reminderAt,
        },
      };
    }
  }

  return { hasConflict: false, conflict: null };
}

