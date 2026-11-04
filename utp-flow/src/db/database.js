import Dexie from 'dexie';

const LEGACY_STORAGE_KEY = 'utp_flow_tasks';
const MIGRATION_V2_FLAG_KEY = 'utp_flow_dexie_v2_migrated';

export const DEFAULT_LOCAL_USER_ID = 'user_local_default';

export const OFFICIAL_AMBITS = [
  {
    id: 'uni',
    slug: 'uni',
    nombre: 'Universidad',
    themeKey: 'rose',
    icono: 'book-open',
    activo: true,
    orden: 1,
  },
  {
    id: 'work',
    slug: 'work',
    nombre: 'Trabajo',
    themeKey: 'slate',
    icono: 'briefcase',
    activo: true,
    orden: 2,
  },
  {
    id: 'personal',
    slug: 'personal',
    nombre: 'Personal',
    themeKey: 'amber',
    icono: 'user',
    activo: false,
    orden: 3,
  },
  {
    id: 'health',
    slug: 'health',
    nombre: 'Salud',
    themeKey: 'emerald',
    icono: 'heart-pulse',
    activo: false,
    orden: 4,
  },
  {
    id: 'projects',
    slug: 'projects',
    nombre: 'Proyectos',
    themeKey: 'violet',
    icono: 'folder-kanban',
    activo: false,
    orden: 5,
  },
];

export function generateUUID(prefix = '') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    const uuid = crypto.randomUUID();
    return prefix ? `${prefix}_${uuid}` : uuid;
  }
  const fallback = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  return prefix ? `${prefix}_${fallback}` : fallback;
}

/**
 * Normaliza cualquier objeto de tarea (v1 o v2) al esquema oficial v2.
 */
export function normalizeTaskRecord(raw, fallbackUserId = DEFAULT_LOCAL_USER_ID) {
  const rawAmbit =
    raw.id_entorno || raw.context || raw.env || raw.contexto_bimodal || 'uni';
  const validAmbit = ['uni', 'work', 'personal', 'health', 'projects'].includes(rawAmbit)
    ? rawAmbit
    : rawAmbit === 'work'
    ? 'work'
    : 'uni';

  const isCompleted = Boolean(
    raw.estado_completado !== undefined ? raw.estado_completado : raw.completed
  );

  const rawFechaCompletado =
    raw.fecha_completado !== undefined
      ? raw.fecha_completado
      : isCompleted
      ? raw.createdAt || Date.now()
      : null;

  return {
    id: String(raw.id || generateUUID('task')),
    id_usuario: raw.id_usuario || fallbackUserId,
    id_entorno: validAmbit,
    titulo: String(raw.titulo !== undefined ? raw.titulo : raw.title || '').trim(),
    fecha_programada:
      raw.fecha_programada !== undefined ? raw.fecha_programada : raw.date || null,
    hora_programada:
      raw.hora_programada !== undefined ? raw.hora_programada : raw.reminderAt || null,
    urgente: Boolean(raw.urgente),
    estado_completado: isCompleted,
    fecha_completado: isCompleted ? rawFechaCompletado || Date.now() : null,
    archivado: Boolean(raw.archivado),
    alarma_disparada: Boolean(
      raw.alarma_disparada !== undefined ? raw.alarma_disparada : raw.reminderFiredAt
    ),
    forzado_con_cruce: Boolean(raw.forzado_con_cruce),
    fecha_registro: Number(raw.fecha_registro || raw.createdAt || Date.now()),
  };
}

/**
 * Normaliza un registro de horario fijo (v1 o v2) al esquema oficial v2.
 */
export function normalizeHorarioRecord(raw, fallbackUserId = DEFAULT_LOCAL_USER_ID) {
  let dia = Number(raw.dia_semana !== undefined ? raw.dia_semana : raw.dayOfWeek);
  // En v1 0 era Domingo; en v2 1=Lunes ... 7=Domingo
  if (dia === 0) dia = 7;
  if (!Number.isFinite(dia) || dia < 1 || dia > 7) dia = 1;

  return {
    id: String(raw.id || generateUUID('sched')),
    id_usuario: raw.id_usuario || fallbackUserId,
    id_entorno: raw.id_entorno || raw.context || 'uni',
    titulo: String(raw.titulo || raw.label || 'Bloque fijo').trim(),
    dia_semana: dia,
    hora_inicio: String(raw.hora_inicio || raw.startTime || '08:00'),
    hora_fin: String(raw.hora_fin || raw.endTime || '10:00'),
  };
}

/**
 * Base de datos IndexedDB administrada con Dexie.js (Versión 2.0).
 * Nota: Si el navegador tenía una base v1 con clave primaria `++id` en `horarios`,
 * IndexedDB prohíbe cambiar directamente `++id` a `id`. Por ello:
 * - version(2) elimina la tabla `horarios` antigua (`horarios: null`)
 * - version(3) recrea `horarios` con clave primaria UUID (`id, id_usuario, id_entorno, dia_semana`)
 * Además, `initializeDatabase()` incluye recuperación automática ante `UpgradeError`.
 */
export class UTPFlowDatabase extends Dexie {
  constructor() {
    super('UTPFlowDB');

    this.version(1).stores({
      tasks: 'id, context, completed, createdAt, date, reminderAt',
      horarios: '++id, dayOfWeek, startTime, endTime, context, label',
    });

    this.version(2).stores({
      usuarios: 'id, email, provider',
      entornos: 'id, slug, activo, orden',
      tasks:
        'id, id_usuario, id_entorno, estado_completado, urgente, archivado, fecha_completado',
      horarios: null,
    });

    this.version(3)
      .stores({
        usuarios: 'id, email, provider',
        entornos: 'id, slug, activo, orden',
        tasks:
          'id, id_usuario, id_entorno, estado_completado, urgente, archivado, fecha_completado',
        horarios: 'id, id_usuario, id_entorno, dia_semana',
      })
      .upgrade(async (tx) => {
        const existingAmbits = await tx.table('entornos').toArray();
        if (existingAmbits.length === 0) {
          await tx.table('entornos').bulkPut(OFFICIAL_AMBITS);
        }

        const oldTasks = await tx.table('tasks').toArray();
        if (oldTasks.length > 0) {
          const upgradedTasks = oldTasks.map((t) => normalizeTaskRecord(t));
          await tx.table('tasks').bulkPut(upgradedTasks);
        }
      });

    this.on('populate', async (tx) => {
      await tx.table('entornos').bulkPut(OFFICIAL_AMBITS);
      await tx.table('usuarios').put({
        id: DEFAULT_LOCAL_USER_ID,
        nombre: 'Estudiante UTP',
        email: 'local@utpflow.app',
        provider: 'local',
        avatar: 'EU',
        fecha_creacion: new Date().toISOString(),
      });
    });
  }
}

export const db = new UTPFlowDatabase();

let initPromise = null;

/**
 * Inicializa la base de datos asegurando que los 5 entornos oficiales existan
 * y recuperándose automáticamente si el navegador tenía un esquema previo incompatible.
 */
export async function initializeDatabase() {
  if (typeof window === 'undefined') return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await db.open();
    } catch (openError) {
      console.warn(
        'Recreando base de datos local por cambio de clave primaria en IndexedDB:',
        openError
      );
      try {
        db.close();
        await Dexie.delete('UTPFlowDB');
        await db.open();
      } catch (recreateErr) {
        console.error('Error al recrear UTPFlowDB:', recreateErr);
      }
    }

    try {
      // 1. Verificar que existan los 5 entornos oficiales
      const existingAmbits = await db.entornos.toArray();
      const existingIds = new Set(existingAmbits.map((a) => a.id));
      const missingAmbits = OFFICIAL_AMBITS.filter((a) => !existingIds.has(a.id));
      if (missingAmbits.length > 0) {
        await db.entornos.bulkPut(missingAmbits);
      }

      // 2. Asegurar usuario local por defecto
      const defaultUser = await db.usuarios.get(DEFAULT_LOCAL_USER_ID);
      if (!defaultUser) {
        await db.usuarios.put({
          id: DEFAULT_LOCAL_USER_ID,
          nombre: 'Estudiante UTP',
          email: 'local@utpflow.app',
          provider: 'local',
          avatar: 'EU',
          fecha_creacion: new Date().toISOString(),
        });
      }

      // 3. Migrar tareas de localStorage o con campos v1 si aún no se migraron a v2
      const alreadyMigratedV2 = localStorage.getItem(MIGRATION_V2_FLAG_KEY) === '1';
      if (!alreadyMigratedV2) {
        const rawSaved = localStorage.getItem(LEGACY_STORAGE_KEY);
        const currentTasks = await db.tasks.toArray();

        if (currentTasks.length === 0 && rawSaved) {
          try {
            const legacyTasks = JSON.parse(rawSaved);
            if (Array.isArray(legacyTasks) && legacyTasks.length > 0) {
              const normalized = legacyTasks.map((t) => normalizeTaskRecord(t));
              await db.tasks.bulkPut(normalized);
            }
          } catch {
            // Ignorar JSON inválido en localStorage
          }
        } else if (currentTasks.length > 0) {
          const needsNormalization = currentTasks.some(
            (t) => t.id_entorno === undefined || t.titulo === undefined
          );
          if (needsNormalization) {
            const normalized = currentTasks.map((t) => normalizeTaskRecord(t));
            await db.tasks.bulkPut(normalized);
          }
        }

        localStorage.setItem(MIGRATION_V2_FLAG_KEY, '1');
      }
    } catch (error) {
      console.error('Error al inicializar semillas en UTPFlowDatabase v2:', error);
    }
  })();

  return initPromise;
}

/**
 * Repositorio de Usuarios (Autenticación local / progresiva).
 */
export const userRepository = {
  async getAll() {
    await initializeDatabase();
    return db.usuarios.toArray();
  },

  async getById(id) {
    await initializeDatabase();
    return db.usuarios.get(id);
  },

  async getByEmail(email) {
    if (!email) return null;
    await initializeDatabase();
    return db.usuarios.where('email').equals(email.toLowerCase().trim()).first();
  },

  async save(user) {
    await initializeDatabase();
    const record = {
      id: user.id || generateUUID('user'),
      nombre: user.nombre || 'Usuario UTP Flow',
      email: (user.email || '').toLowerCase().trim(),
      provider: user.provider || 'local',
      avatar: user.avatar || 'UF',
      fecha_creacion: user.fecha_creacion || new Date().toISOString(),
    };
    await db.usuarios.put(record);
    return record;
  },
};

/**
 * Repositorio de Ámbitos / Entornos (`uni`, `work`, `personal`, `health`, `projects`).
 */
export const ambitRepository = {
  async getAll() {
    await initializeDatabase();
    const list = await db.entornos.toArray();
    return list.sort((a, b) => (a.orden || 0) - (b.orden || 0));
  },

  async getById(id) {
    await initializeDatabase();
    return db.entornos.get(id);
  },

  async update(id, changes) {
    await initializeDatabase();
    await db.entornos.update(id, changes);
    return db.entornos.get(id);
  },

  async replaceAll(ambits) {
    if (!Array.isArray(ambits) || ambits.length === 0) return;
    await initializeDatabase();
    await db.entornos.bulkPut(ambits);
  },
};

/**
 * Repositorio de Tareas.
 */
export const taskRepository = {
  async getAll() {
    await initializeDatabase();
    return db.tasks.toArray();
  },

  async getById(id) {
    await initializeDatabase();
    return db.tasks.get(id);
  },

  async save(task) {
    await initializeDatabase();
    const normalized = normalizeTaskRecord(task, task.id_usuario);
    await db.tasks.put(normalized);
    return normalized;
  },

  async update(id, changes) {
    await initializeDatabase();
    await db.tasks.update(id, changes);
    return db.tasks.get(id);
  },

  async remove(id) {
    await initializeDatabase();
    await db.tasks.delete(id);
  },

  async bulkUpdate(records) {
    await initializeDatabase();
    await db.tasks.bulkPut(records);
  },

  async clearArchived() {
    await initializeDatabase();
    const archived = await db.tasks.filter((t) => Boolean(t.archivado)).toArray();
    const ids = archived.map((t) => t.id);
    if (ids.length > 0) {
      await db.tasks.bulkDelete(ids);
    }
    return ids.length;
  },

  async replaceAll(tasks) {
    await initializeDatabase();
    const normalized = (tasks || []).map((t) => normalizeTaskRecord(t));
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.clear();
      await db.tasks.bulkPut(normalized);
    });
  },
};

/**
 * Repositorio de Bloques de Horario Fijo.
 */
export const horarioRepository = {
  async getAll() {
    await initializeDatabase();
    return db.horarios.toArray();
  },

  async add(horario) {
    await initializeDatabase();
    const record = normalizeHorarioRecord({
      ...horario,
      id: horario.id || generateUUID('sched'),
    });
    await db.horarios.put(record);
    return record;
  },

  async bulkAdd(horariosList) {
    await initializeDatabase();
    const records = (horariosList || []).map((h) =>
      normalizeHorarioRecord({
        ...h,
        id: h.id || generateUUID('sched'),
      })
    );
    await db.horarios.bulkPut(records);
    return records;
  },

  async remove(id) {
    await initializeDatabase();
    await db.horarios.delete(id);
  },

  async replaceAll(horariosList) {
    await initializeDatabase();
    const normalized = (horariosList || []).map((h) => normalizeHorarioRecord(h));
    await db.transaction('rw', db.horarios, async () => {
      await db.horarios.clear();
      await db.horarios.bulkPut(normalized);
    });
  },
};
