/**
 * Servicio puro de validación de tiempos y detección de conflictos de horario (Sprint 2).
 * Sin dependencias de React ni del DOM.
 */

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
];

export function getDayName(dayNumber) {
  const found = DAYS_OF_WEEK.find((d) => d.value === Number(dayNumber));
  return found ? found.label : 'Día';
}

/**
 * Convierte una fecha JS al día de la semana ISO (1 = Lunes ... 7 = Domingo).
 */
export function getIsoDayOfWeek(dateObj) {
  const jsDay = dateObj.getDay(); // 0 (Dom) a 6 (Sáb)
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Extrae la hora en formato 24h "HH:MM" de un objeto Date.
 */
export function extractTimeHHMM(dateObj) {
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Valida que la fecha/hora de un recordatorio esté en el futuro.
 */
export function validateFutureReminder(horaProgramada, nowMs = Date.now()) {
  if (!horaProgramada) {
    return { valid: true };
  }

  const reminderTime = new Date(horaProgramada).getTime();
  if (Number.isNaN(reminderTime) || reminderTime <= nowMs) {
    return {
      valid: false,
      error: 'La alarma debe estar programada para un momento futuro.',
    };
  }

  return { valid: true };
}

/**
 * Detecta si la fecha y hora programada de una tarea (`horaProgramada`) se cruza
 * con algún bloque registrado en la tabla `horarios` de Dexie para ese mismo día de la semana:
 * `hora_tarea >= bloque.hora_inicio && hora_tarea < bloque.hora_fin`
 *
 * @param {string} horaProgramada Cadena ISO / datetime-local (YYYY-MM-DDTHH:mm)
 * @param {Array} fixedSchedules Registros de la tabla `horarios`
 * @returns {{ hasConflict: boolean, conflict: object | null }}
 */
export function detectScheduleConflict(horaProgramada, fixedSchedules = []) {
  if (!horaProgramada) {
    return { hasConflict: false, conflict: null };
  }

  const targetDate = new Date(horaProgramada);
  if (Number.isNaN(targetDate.getTime())) {
    return { hasConflict: false, conflict: null };
  }

  const diaSemana = getIsoDayOfWeek(targetDate); // 1 (Lunes) a 7 (Domingo)
  const horaTarea = extractTimeHHMM(targetDate); // "HH:MM"

  for (const bloque of fixedSchedules) {
    if (!bloque) continue;
    const bloqueDia = Number(bloque.dia_semana);
    if (bloqueDia !== diaSemana) continue;

    const horaInicio = String(bloque.hora_inicio || '').slice(0, 5);
    const horaFin = String(bloque.hora_fin || '').slice(0, 5);
    if (!horaInicio || !horaFin) continue;

    if (horaTarea >= horaInicio && horaTarea < horaFin) {
      return {
        hasConflict: true,
        conflict: {
          id: bloque.id,
          titulo: bloque.titulo || 'Bloque de horario fijo',
          id_entorno: bloque.id_entorno || 'uni',
          dia_semana: bloqueDia,
          dia_nombre: getDayName(bloqueDia),
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          hora_intentada: horaTarea,
        },
      };
    }
  }

  return { hasConflict: false, conflict: null };
}
