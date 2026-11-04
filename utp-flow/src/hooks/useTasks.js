import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  initializeDatabase,
  taskRepository,
  DEFAULT_LOCAL_USER_ID,
  generateUUID,
} from '../db/database';
import { validateFutureReminder } from '../services/timeValidationService';
import {
  requestNotificationPermissionIfNeeded,
  playAlarmSound,
  showBrowserNotification,
} from '../services/notificationService';

function getTaskSortTimestamp(task) {
  if (task.hora_programada) {
    const t = new Date(task.hora_programada).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (task.fecha_programada) {
    const t = new Date(`${task.fecha_programada}T23:59:59`).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return Number.MAX_SAFE_INTEGER;
}

/**
 * Custom Hook que abstrae el CRUD reactivo de tareas en Dexie, el ordenamiento por urgencia
 * de 1 clic, las alarmas y la gestión del archivo (+48h).
 */
export function useTasks({ currentAmbitId, currentUserId = DEFAULT_LOCAL_USER_ID, onNotify }) {
  const alarmTimersRef = useRef(new Map());

  useEffect(() => {
    initializeDatabase();
  }, []);

  const allTasks = useLiveQuery(() => db.tasks.toArray(), [], []);

  // Filtrado por `id_entorno === currentAmbit.id` y `archivado === false`
  // Jerarquía de ordenamiento:
  // 1. Pendientes y urgentes primero.
  // 2. Pendientes normales después (ordenadas por fecha/hora más próxima).
  // 3. Completadas al final.
  const ambitTasks = useMemo(() => {
    const filtered = (allTasks || []).filter(
      (t) => t.id_entorno === currentAmbitId && !t.archivado
    );

    return [...filtered].sort((a, b) => {
      const aDone = Boolean(a.estado_completado);
      const bDone = Boolean(b.estado_completado);
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }

      if (!aDone && !bDone) {
        const aUrgent = Boolean(a.urgente);
        const bUrgent = Boolean(b.urgente);
        if (aUrgent !== bUrgent) {
          return aUrgent ? -1 : 1;
        }

        const aNext = getTaskSortTimestamp(a);
        const bNext = getTaskSortTimestamp(b);
        if (aNext !== bNext) {
          return aNext - bNext;
        }
      }

      return (a.fecha_registro || 0) - (b.fecha_registro || 0);
    });
  }, [allTasks, currentAmbitId]);

  const archivedTasks = useMemo(() => {
    return (allTasks || [])
      .filter((t) => Boolean(t.archivado))
      .sort((a, b) => (b.fecha_completado || 0) - (a.fecha_completado || 0));
  }, [allTasks]);

  const pendingCount = useMemo(
    () => ambitTasks.filter((t) => !t.estado_completado).length,
    [ambitTasks]
  );

  // Disparar recordatorio cuando se cumple la hora programada
  const fireTaskReminder = useCallback(
    async (taskId) => {
      const task = await taskRepository.getById(taskId);
      if (
        !task ||
        task.estado_completado ||
        task.archivado ||
        !task.hora_programada ||
        task.alarma_disparada
      ) {
        return;
      }

      await taskRepository.update(taskId, { alarma_disparada: true });

      if (onNotify) {
        onNotify(`Recordatorio: ${task.titulo}`, 'error');
      }
      playAlarmSound();
      showBrowserNotification(task);
    },
    [onNotify]
  );

  // Sincronizar temporizadores de alarmas activas
  useEffect(() => {
    const timers = alarmTimersRef.current;
    timers.forEach((timeoutId) => clearTimeout(timeoutId));
    timers.clear();

    (allTasks || []).forEach((task) => {
      if (
        !task ||
        task.estado_completado ||
        task.archivado ||
        !task.hora_programada ||
        task.alarma_disparada
      ) {
        return;
      }

      const reminderTime = new Date(task.hora_programada).getTime();
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
    async ({
      titulo,
      fecha_programada = null,
      hora_programada = null,
      urgente = false,
      forzado_con_cruce = false,
    }) => {
      const trimmedTitle = String(titulo || '').trim();
      if (!trimmedTitle) {
        return { ok: false, error: 'El título de la tarea es obligatorio.' };
      }

      const validation = validateFutureReminder(hora_programada);
      if (!validation.valid) {
        if (onNotify) onNotify(validation.error, 'error');
        return { ok: false, error: validation.error };
      }

      requestNotificationPermissionIfNeeded();

      const newTask = {
        id: generateUUID('task'),
        id_usuario: currentUserId || DEFAULT_LOCAL_USER_ID,
        id_entorno: currentAmbitId,
        titulo: trimmedTitle,
        fecha_programada: fecha_programada || null,
        hora_programada: hora_programada || null,
        urgente: Boolean(urgente),
        estado_completado: false,
        fecha_completado: null,
        archivado: false,
        alarma_disparada: false,
        forzado_con_cruce: Boolean(forzado_con_cruce),
        fecha_registro: Date.now(),
      };

      await taskRepository.save(newTask);
      return { ok: true, task: newTask };
    },
    [currentAmbitId, currentUserId, onNotify]
  );

  const updateTask = useCallback(
    async (
      id,
      {
        titulo,
        fecha_programada = null,
        hora_programada = null,
        urgente = false,
        forzado_con_cruce = false,
      }
    ) => {
      const trimmedTitle = String(titulo || '').trim();
      if (!trimmedTitle) {
        return { ok: false, error: 'El título de la tarea es obligatorio.' };
      }

      const existing = await taskRepository.getById(id);
      if (!existing) {
        return { ok: false, error: 'La tarea no existe.' };
      }

      if (hora_programada) {
        const validation = validateFutureReminder(hora_programada);
        if (!validation.valid) {
          if (onNotify) onNotify(validation.error, 'error');
          return { ok: false, error: validation.error };
        }
      }

      requestNotificationPermissionIfNeeded();

      const updatedFields = {
        titulo: trimmedTitle,
        fecha_programada: fecha_programada || null,
        hora_programada: hora_programada || null,
        urgente: Boolean(urgente),
        forzado_con_cruce: Boolean(forzado_con_cruce),
        id_entorno: currentAmbitId,
        alarma_disparada:
          hora_programada && hora_programada === existing.hora_programada
            ? Boolean(existing.alarma_disparada)
            : false,
      };

      await taskRepository.update(id, updatedFields);
      return { ok: true };
    },
    [currentAmbitId, onNotify]
  );

  const toggleTaskCompletion = useCallback(
    async (id) => {
      const existing = await taskRepository.getById(id);
      if (!existing) return;

      const nextCompleted = !existing.estado_completado;
      await taskRepository.update(id, {
        estado_completado: nextCompleted,
        fecha_completado: nextCompleted ? Date.now() : null,
      });

      if (onNotify) {
        if (nextCompleted) {
          onNotify('Tarea completada. Se archivará en 48h.', 'success');
        } else {
          onNotify('Tarea restaurada como pendiente.', 'info');
        }
      }
    },
    [onNotify]
  );

  const deleteTask = useCallback(async (id) => {
    await taskRepository.remove(id);
  }, []);

  const restoreArchivedTask = useCallback(
    async (id) => {
      await taskRepository.update(id, {
        archivado: false,
        estado_completado: false,
        fecha_completado: null,
      });
      if (onNotify) {
        onNotify('Tarea restaurada a su entorno original.', 'success');
      }
    },
    [onNotify]
  );

  const clearArchivedHistory = useCallback(async () => {
    const deletedCount = await taskRepository.clearArchived();
    if (onNotify) {
      onNotify(
        deletedCount > 0
          ? `Se eliminaron ${deletedCount} tarea(s) del historial.`
          : 'El historial ya está vacío.',
        'info'
      );
    }
  }, [onNotify]);

  const replaceAllTasks = useCallback(async (importedTasks) => {
    await taskRepository.replaceAll(importedTasks);
  }, []);

  return {
    allTasks: allTasks || [],
    ambitTasks,
    archivedTasks,
    pendingCount,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    restoreArchivedTask,
    clearArchivedHistory,
    replaceAllTasks,
  };
}
