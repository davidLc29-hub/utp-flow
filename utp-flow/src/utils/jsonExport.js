/**
 * Descarga un archivo JSON con el listado de tareas proporcionado.
 */
export function exportTasksToJson(tasks, filename = 'MisTareas_UTPFlow.json') {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      ok: false,
      error: 'No puedes exportar un archivo porque todavía no tienes ninguna tarea.',
    };
  }

  const dataStr =
    'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

  return { ok: true };
}

/**
 * Lee y valida un archivo JSON de respaldo de tareas.
 */
export function parseImportedTasksFile(file) {
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

        const importedTasks = JSON.parse(rawText);
        if (!Array.isArray(importedTasks)) {
          throw new Error('El formato del archivo no es un array válido de tareas.');
        }

        const isValid = importedTasks.every(
          (t) => t && t.id && t.title && typeof t.completed === 'boolean'
        );
        if (!isValid) {
          throw new Error('El archivo JSON contiene datos corruptos o incompatibles.');
        }

        const normalized = importedTasks.map((task) => ({
          ...task,
          context: task.context === 'work' ? 'work' : 'uni',
          date: task.date || '',
          reminderAt: task.reminderAt || '',
          reminderFiredAt: task.reminderFiredAt || null,
          createdAt: task.createdAt || Date.now(),
        }));

        resolve(normalized);
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

