/**
 * Formatea una cadena YYYY-MM-DD a DD/MM/YYYY.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha/hora ISO o datetime-local en formato corto es-ES (DD/MM HH:mm).
 */
export function formatReminderDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Calcula el tiempo relativo hacia o desde una fecha dada.
 */
export function getRelativeTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const t = new Date(dateTimeStr).getTime();
  if (Number.isNaN(t)) return '';
  const now = Date.now();
  const diff = t - now;

  const abs = Math.abs(diff);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (abs < 30 * 1000) return diff >= 0 ? 'en unos segundos' : 'hace unos segundos';
  if (abs < minute) return diff >= 0 ? `en ${Math.ceil(abs / 1000)}s` : `hace ${Math.ceil(abs / 1000)}s`;
  if (abs < hour) return diff >= 0 ? `en ${Math.ceil(abs / minute)} min` : `hace ${Math.ceil(abs / minute)} min`;
  if (abs < day) return diff >= 0 ? `en ${Math.ceil(abs / hour)} h` : `hace ${Math.ceil(abs / hour)} h`;
  return diff >= 0 ? `en ${Math.ceil(abs / day)} d` : `hace ${Math.ceil(abs / day)} d`;
}

/**
 * Formatea la etiqueta compacta del cuadro de alarma (ej. "lun 14:30").
 */
export function formatReminderSquareText(dateTimeStr) {
  if (!dateTimeStr) return '';
  const d = new Date(dateTimeStr);
  if (Number.isNaN(d.getTime())) return '';
  const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d).replace('.', '');
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${weekday} ${time}`;
}

/**
 * Devuelve la cadena YYYY-MM-DDTHH:mm local apta para inputs datetime-local.
 */
export function getLocalDateTimeInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

/**
 * Devuelve la fecha actual en formato YYYY-MM-DD para el atributo min de inputs date.
 */
export function getTodayDateInputValue() {
  return new Date().toISOString().split('T')[0];
}

