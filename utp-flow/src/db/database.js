import Dexie from 'dexie';

const LEGACY_STORAGE_KEY = 'utp_flow_tasks';
const MIGRATION_FLAG_KEY = 'utp_flow_dexie_migrated';

/**
 * Instancia de IndexedDB gestionada por Dexie.js para UTP Flow (Offline-First).
 * Preparada para escalar a sincronización con Supabase mediante un patrón de repositorio.
 */
export class UTPFlowDatabase extends Dexie {
  constructor() {
    super('UTPFlowDB');

    this.version(1).stores({
      tasks: 'id, context, completed, createdAt, date, reminderAt',
      horarios: '++id, dayOfWeek, startTime, endTime, context, label',
    });
  }
}

export const db = new UTPFlowDatabase();

/**
 * Migra automáticamente las tareas preexistentes desde localStorage a IndexedDB
 * la primera vez que se ejecuta la nueva arquitectura.
 */
export async function initializeDatabase() {
  if (typeof window === 'undefined') return;

  const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG_KEY) === '1';
  if (alreadyMigrated) return;

  try {
    const rawSaved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawSaved) {
      const legacyTasks = JSON.parse(rawSaved);
      if (Array.isArray(legacyTasks) && legacyTasks.length > 0) {
        const count = await db.tasks.count();
        if (count === 0) {
          const normalized = legacyTasks.map((t) => ({
            id: t.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            title: t.title || '',
            date: t.date || '',
            reminderAt: t.reminderAt || '',
            reminderFiredAt: t.reminderFiredAt || null,
            context: t.context || 'uni',
            completed: Boolean(t.completed),
            createdAt: t.createdAt || Date.now(),
          }));
          await db.tasks.bulkPut(normalized);
        }
      }
    }
    localStorage.setItem(MIGRATION_FLAG_KEY, '1');
  } catch (error) {
    console.error('Error al migrar tareas hacia IndexedDB:', error);
  }
}

/**
 * Repositorio desacoplado de tareas (preparado para futuro adaptador Supabase).
 */
export const taskRepository = {
  async getAll() {
    return db.tasks.toArray();
  },

  async getByContext(context) {
    return db.tasks.where('context').equals(context).toArray();
  },

  async getById(id) {
    return db.tasks.get(id);
  },

  async save(task) {
    await db.tasks.put(task);
    return task;
  },

  async update(id, changes) {
    await db.tasks.update(id, changes);
    return db.tasks.get(id);
  },

  async remove(id) {
    await db.tasks.delete(id);
  },

  async replaceAll(tasks) {
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.clear();
      await db.tasks.bulkPut(tasks);
    });
  },
};

/**
 * Repositorio desacoplado de bloques horarios fijos (Universidad / Trabajo).
 */
export const horarioRepository = {
  async getAll() {
    return db.horarios.toArray();
  },

  async add(horario) {
    const id = await db.horarios.add(horario);
    return { ...horario, id };
  },

  async remove(id) {
    await db.horarios.delete(id);
  },
};

