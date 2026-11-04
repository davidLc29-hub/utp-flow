import {
  normalizeTaskRecord,
  normalizeHorarioRecord,
  OFFICIAL_AMBITS,
} from '../db/database';

/**
 * Descarga un archivo JSON con el respaldo completo (tareas, horarios fijos y ámbitos).
 */
export function exportBackupToJson(
  { tasks = [], horarios = [], entornos = [] },
  filename = 'Respaldo_UTPFlow_v2.json'
) {
  if ((!Array.isArray(tasks) || tasks.length === 0) && (!Array.isArray(horarios) || horarios.length === 0)) {
    return {
      ok: false,
      error: 'No puedes exportar un archivo porque todavía no tienes tareas ni horarios registrados.',
    };
  }

  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    tasks,
    horarios,
    entornos: Array.isArray(entornos) && entornos.length > 0 ? entornos : OFFICIAL_AMBITS,
  };

  const dataStr =
    'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

  return { ok: true };
}

/**
 * Lee y valida un archivo JSON de respaldo (compatible con v1 array de tareas y v2 paquete completo).
 */
export function parseImportedBackupFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No se seleccionó ningún archivo.'));
      return;
    }

    const fileName = (file.name || '').toLowerCase();
    const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const hasJsonExtension = fileName.endsWith('.json');

    if (!isMobileDevice && !hasJsonExtension) {
      reject(new Error('Por favor, selecciona un archivo .json válido.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawText = String(e.target?.result || '');
        if (!rawText.trim()) {
          throw new Error('El archivo está vacío o no se pudo leer correctamente.');
        }

        const parsed = JSON.parse(rawText);

        // Soporte retrocompatible con archivos v1 (arreglo directo de tareas)
        if (Array.isArray(parsed)) {
          const isValidV1 = parsed.every(
            (t) =>
              t &&
              t.id &&
              (t.titulo || t.title) &&
              (typeof t.estado_completado === 'boolean' || typeof t.completed === 'boolean')
          );
          if (!isValidV1) {
            throw new Error('El archivo JSON contiene datos corruptos o incompatibles.');
          }
          resolve({
            tasks: parsed.map((t) => normalizeTaskRecord(t)),
            horarios: null,
            entornos: null,
          });
          return;
        }

        // Formato v2 (objeto con tasks, horarios y entornos)
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tasks)) {
          const tasks = parsed.tasks.map((t) => normalizeTaskRecord(t));
          const horarios = Array.isArray(parsed.horarios)
            ? parsed.horarios.map((h) => normalizeHorarioRecord(h))
            : null;
          const entornos = Array.isArray(parsed.entornos) ? parsed.entornos : null;

          resolve({ tasks, horarios, entornos });
          return;
        }

        throw new Error('El formato del archivo no es un respaldo válido de UTP Flow.');
      } catch (err) {
        reject(new Error(err.message || 'No se pudo leer el archivo JSON.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo JSON.'));
    };

    reader.readAsText(file);
  });
}
