import { formatDate } from '../utils/formatDate';
import logoUrl from '../assets/logo.svg';

/**
 * Solicita permiso de notificaciones del navegador si aún no se ha definido.
 */
export function requestNotificationPermissionIfNeeded() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

/**
 * Muestra una notificación nativa del navegador para la tarea indicada.
 */
export function showBrowserNotification(task) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const titleText = task.titulo || task.title || 'Tarea pendiente';
  const dueDate = task.fecha_programada || task.date;

  try {
    const notification = new Notification('UTP Flow', {
      body: `${titleText}${dueDate ? ` · vence ${formatDate(dueDate)}` : ''}`,
      icon: logoUrl,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Silencioso en entornos donde el constructor Notification está restringido
  }
}

/**
 * Reproduce un tono suave mediante Web Audio API al dispararse un recordatorio.
 */
export function playAlarmSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.0001;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    const now = audioContext.currentTime;
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    oscillator.stop(now + 0.85);

    oscillator.onended = () => audioContext.close().catch(() => {});
  } catch {
    // Silencioso: el recordatorio visual sigue funcionando si el audio falla
  }
}
