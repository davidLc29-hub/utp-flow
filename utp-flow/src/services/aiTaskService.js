import {
  compressImageToBase64,
  callGeminiVisionWithPrompt,
} from './aiScheduleService';

const WEEKDAYS_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/**
 * Construye el prompt de extracción de tareas inyectando la fecha y día actual del navegador
 * para que Gemini calcule con precisión fechas relativas ("mañana", "próximo lunes", etc.).
 */
export function buildTaskExtractionPrompt(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const dayName = WEEKDAYS_ES[now.getDay()];
  const currentIsoLocal = `${year}-${month}-${day} ${hours}:${minutes}`;

  return `Actúa como un asistente experto en productividad académica y laboral.
Fecha y hora actual del usuario: ${dayName}, ${currentIsoLocal}.

Analiza la imagen proporcionada (captura de plataforma universitaria, sílabo, lista de pendientes, pizarra, correo o chat) y extrae todas las tareas, entregas, evaluaciones o actividades pendientes.

Reglas estrictas de extracción:
1. Devuelve ÚNICAMENTE un arreglo JSON válido sin bloques Markdown.
2. Cada objeto del arreglo debe tener exactamente esta estructura:
   [
     {
       "titulo": "string conciso y claro de la tarea o evaluación",
       "fecha_limite": "YYYY-MM-DDTHH:mm:ss",
       "urgencia": "Alta" | "Normal",
       "descripcion": "string breve con curso, indicaciones o contexto adicional"
     }
   ]
3. Cálculo de fechas relativas: utiliza la fecha actual (${dayName} ${year}-${month}-${day}) para resolver expresiones como "hoy", "mañana", "este viernes", "próximo lunes", etc.
4. Si la imagen menciona una fecha pero NO especifica una hora exacta, asigna por defecto las "23:59:00" de ese día (ejemplo: "${year}-${month}-${day}T23:59:00"). Si no menciona ninguna fecha en absoluto, usa ` +
    `null en "fecha_limite".
5. Asigna "urgencia": "Alta" si detectas exámenes, prácticas calificadas, entregas finales, palabras de alta prioridad ("urgente", "examen", "parcial", "final") o si la fecha límite ocurre dentro de las próximas 48 horas respecto a ${currentIsoLocal}. En caso contrario asigna "Normal".`;
}

/**
 * Normaliza la fecha límite devuelta por la IA a formatos compatibles con UTP Flow:
 * - `fecha_limite` completa (YYYY-MM-DDTHH:mm) para inputs `datetime-local`
 * - asumiendo `23:59:00` cuando solo viene la fecha `YYYY-MM-DD`.
 */
function normalizeDeadlineString(rawDateStr, now = new Date()) {
  if (!rawDateStr || rawDateStr === 'null') return '';
  const clean = String(rawDateStr).trim();

  // Si solo viene YYYY-MM-DD, agregar T23:59:00 como pide la especificación
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return `${clean}T23:59`;
  }

  // Si viene YYYY-MM-DDTHH:mm:ss o YYYY-MM-DD HH:mm:ss
  const isoCandidate = clean.replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(isoCandidate)) {
    return isoCandidate.slice(0, 16);
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    const hh = String(parsed.getHours()).padStart(2, '0');
    const mm = String(parsed.getMinutes()).padStart(2, '0');
    const timePart = hh === '00' && mm === '00' ? '23:59' : `${hh}:${mm}`;
    return `${y}-${m}-${d}T${timePart}`;
  }

  // Fallback si no pudo parsearse
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T23:59`;
}

/**
 * Valida y limpia el arreglo JSON devuelto por Gemini para las tareas detectadas.
 */
export function sanitizeExtractedTasks(rawInput, now = new Date()) {
  const rawArray = Array.isArray(rawInput)
    ? rawInput
    : Array.isArray(rawInput?.tareas)
      ? rawInput.tareas
      : Array.isArray(rawInput?.tasks)
        ? rawInput.tasks
        : Array.isArray(rawInput?.items)
          ? rawInput.items
          : null;

  if (!Array.isArray(rawArray)) {
    throw new Error('La IA no devolvió una lista válida de tareas.');
  }

  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  return rawArray
    .filter((item) => item && typeof item === 'object' && (item.titulo || item.title))
    .map((item, idx) => {
      const titulo = String(item.titulo || item.title || '').trim();
      const descripcion = String(item.descripcion || item.description || '').trim();
      const normalizedDeadline = normalizeDeadlineString(
        item.fecha_limite || item.fechaLimite || item.date || '',
        now
      );

      // Determinar urgencia ("Alta" | "Normal") evaluando también regla de < 48h o examen
      const rawUrgencia = String(item.urgencia || '').toLowerCase();
      const titleLower = `${titulo} ${descripcion}`.toLowerCase();
      const isExamOrCriticalKeyword =
        /examen|parcial|final|práctica calificada|practica calificada|urgente|entrega final/i.test(
          titleLower
        );

      let isWithin48h = false;
      if (normalizedDeadline) {
        const deadlineMs = new Date(normalizedDeadline).getTime();
        if (!Number.isNaN(deadlineMs)) {
          const diff = deadlineMs - now.getTime();
          if (diff > -24 * 60 * 60 * 1000 && diff <= fortyEightHoursMs) {
            isWithin48h = true;
          }
        }
      }

      const isHighUrgency =
        rawUrgencia === 'alta' ||
        rawUrgencia === 'high' ||
        Boolean(item.urgente) ||
        isExamOrCriticalKeyword ||
        isWithin48h;

      return {
        tempId: `ai_task_${Date.now()}_${idx}`,
        selected: true,
        titulo,
        fecha_limite: normalizedDeadline,
        urgencia: isHighUrgency ? 'Alta' : 'Normal',
        descripcion,
      };
    });
}

/**
 * Extrae la lista de tareas desde el texto crudo de respuesta de Gemini.
 */
export function parseRawGeminiTasksText(rawText, now = new Date()) {
  const cleaned = String(rawText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const parsedArray = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
    return sanitizeExtractedTasks(parsedArray, now);
  }

  const parsed = JSON.parse(cleaned);
  return sanitizeExtractedTasks(parsed, now);
}

/**
 * Analiza una imagen o captura del portapapeles para extraer tareas estructuradas:
 * 1. Comprime la imagen en un <canvas> en memoria a máximo 1280px con calidad JPEG 0.8.
 * 2. Inyecta la fecha actual del navegador en el prompt.
 * 3. Llama a la conexión activa de Gemini AI y retorna `[ { titulo, fecha_limite, urgencia, descripcion } ]`.
 */
export async function analyzeTasksFromImage(file) {
  const { base64Image, mimeType } = await compressImageToBase64(file, 1280, 0.8);
  const now = new Date();
  const prompt = buildTaskExtractionPrompt(now);
  const rawText = await callGeminiVisionWithPrompt(prompt, base64Image, mimeType);
  return parseRawGeminiTasksText(rawText, now);
}

