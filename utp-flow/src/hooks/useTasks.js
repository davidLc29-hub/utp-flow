import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase, taskRepository } from '../db/database';
import { validateFutureReminder } from '../services/timeValidationService';
import {
  requestNotificationPermissionIfNeeded,
  playAlarmSound,
  showBrowserNotification,
} from '../services/notificationService';

/**
 * Custom Hook que abstrae toda la lógica de tareas, persistencia en Dexie y temporizadores de alarmas.
 * Ningún componente UI accede a Dexie directamente.
 */
export function useTasks({ currentContext, onNotify }) {
  const alarmTimersRef = useRef(new Map());

  // Inicializar base de datos y migrar localStorage legado si existe
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Consulta reactiva en vivo desde IndexedDB (Dexie)
  const allTasks = useLiveQuery(() => db.tasks.toArray(), [], []);

  // Filtrado por contexto bimodal y ordenamiento (Pendientes primero, luego completadas por orden de creación)
  const contextTasks = useMemo(() => {
    const filtered = (allTasks || []).filter((t) => t.context === currentContext);
    return [...filtered].sort((a, b) => {
      if (a.completed === b.completed) {
        return (a.createdAt || 0) - (b.createdAt || 0);
      }
      return a.completed ? 1 : -1;
    });
  }, [allTasks, currentContext]);

  const pendingCount = useMemo(
    () => contextTasks.filter((t) => !t.completed).length,
    [contextTasks]
  );

  // Disparar recordatorio cuando se cumple la hora programada
  const fireTaskReminder = useCallback(
    async (taskId) => {
      const task = await taskRepository.getById(taskId);
      if (!task || task.completed || !task.reminderAt || task.reminderFiredAt) return;

      const firedIso = new Date().toISOString();
      await taskRepository.update(taskId, { reminderFiredAt: firedIso });

      if (onNotify) {
        onNotify(`Recordatorio: ${task.title}`, 'error');
      }
      playAlarmSound();
      showBrowserNotification(task);
    },
    [onNotify]
  );

  // Sincronizar temporizadores de alarmas cada vez que cambian las tareas
  useEffect(() => {
    const timers = alarmTimersRef.current;
    timers.forEach((timeoutId) => clearTimeout(timeoutId));
    timers.clear();

    (allTasks || []).forEach((task) => {
      if (!task || task.completed || !task.reminderAt || task.reminderFiredAt) return;

      const reminderTime = new Date(task.reminderAt).getTime();
      if (Number.isNaN(reminderTime)) return;

      const delay = reminderTime - Date.now();
      if (delay <= 0) {
        fireTaskReminder(task.id);
      } else {
        const timeoutId = setTimeout(() => fireTaskReminder(task.id), delay);
        timers.set(task.id, timeoutId);
      }
    });

    return () => {
      timers.forEach((timeoutId) => clearTimeout(timeoutId));
      timers.clear();
    };
  }, [allTasks, fireTaskReminder]);

  const createTask = useCallback(
    async ({ title, date = '', reminderAt = '' }) => {
      const trimmedTitle = (title || '').trim();
      if (!trimmedTitle) {
        return { ok: false, error: 'El título de la tarea es obligatorio.' };
      }

      const validation = validateFutureReminder(reminderAt);
      if (!validation.valid) {
        if (onNotify) onNotify(validation.error, 'error');
        return { ok: false, error: validation.error };
      }

      requestNotificationPermissionIfNeeded();

      const newTask = {
        id: `task_${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
        title: trimmedTitle,
        date,
        reminderAt,
        reminderFiredAt: null,
        context: currentContext,
        completed: false,
        createdAt: Date.now(),
      };

      await taskRepository.save(newTask);
      return { ok: true, task: newTask };
    },
    [currentContext, onNotify]
  );

  const updateTask = useCallback(
    async (id, { title, date = '', reminderAt = '' }) => {
      const trimmedTitle = (title || '').trim();
      if (!trimmedTitle) {
        return { ok: false, error: 'El título de la tarea es obligatorio.' };
      }

      const existing = await taskRepository.getById(id);
      if (!existing) {
        return { ok: false, error: 'La tarea no existe.' };
      }

      // Validar fecha futura si el usuario definió o cambió el recordatorio
      if (reminderAt && reminderAt !== existing.reminderAt) {
        const validation = validateFutureReminder(reminderAt);
        if (!validation.valid) {
          if (onNotify) onNotify(validation.error, 'error');
          return { ok: false, error: validation.error };
        }
      } else if (reminderAt) {
        const validation = validateFutureReminder(reminderAt);
        if (!validation.valid) {
          if (onNotify) onNotify(validation.error, 'error');
          return { ok: false, error: validation.error };
        }
      }

      requestNotificationPermissionIfNeeded();

      const updatedFields = {
        title: trimmedTitle,
        date,
        reminderAt,
        reminderFiredAt: reminderAt ? existing.reminderFiredAt : null,
        context: currentContext,
      };

      // Si cambió la hora de alarma, reiniciar el flag de disparo
      if (reminderAt !== existing.reminderAt) {
        updatedFields.reminderFiredAt = null;
      }

      await taskRepository.update(id, updatedFields);
      return { ok: true };
    },
    [currentContext, onNotify]
  );

  const toggleTask = useCallback(async (id) => {
    const existing = await taskRepository.getById(id);
    if (!existing) return;
    await taskRepository.update(id, { completed: !existing.completed });
  }, []);

  const deleteTask = useCallback(async (id) => {
    await taskRepository.remove(id);
  }, []);

  const replaceAllTasks = useCallback(async (importedTasks) => {
    await taskRepository.replaceAll(importedTasks);
  }, []);

  return {
    allTasks: allTasks || [],
    contextTasks,
    pendingCount,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    replaceAllTasks,
  };
}

