import { db } from '../db/database';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000; // 172,800,000 ms

/**
 * Recolector de basura automático (48 horas).
 * Busca todas las tareas completadas y no archivadas cuya `fecha_completado`
 * tenga una antigüedad mayor o igual a 48 horas, y las marca con `archivado: true`.
 *
 * @returns {Promise<number>} Cantidad de tareas archivadas en esta ejecución.
 */
export async function purgeCompletedTasksOlderThan48h() {
  const threshold = Date.now() - FORTY_EIGHT_HOURS_MS;

  try {
    const candidates = await db.tasks
      .filter(
        (task) =>
          task.estado_completado === true &&
          task.archivado === false &&
          task.fecha_completado !== null &&
          typeof task.fecha_completado === 'number' &&
          task.fecha_completado <= threshold
      )
      .toArray();

    if (candidates.length === 0) {
      return 0;
    }

    const updated = candidates.map((task) => ({
      ...task,
      archivado: true,
    }));

    await db.tasks.bulkPut(updated);
    return updated.length;
  } catch (error) {
    console.error('Error en purgeCompletedTasksOlderThan48h:', error);
    return 0;
  }
}

