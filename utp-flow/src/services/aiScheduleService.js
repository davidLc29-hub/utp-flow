export const SCHEDULE_PROMPT =
  "Analiza la imagen de este horario académico o laboral y extrae todos los bloques de clases o turnos fijos. Devuelve ÚNICAMENTE un arreglo JSON válido sin bloques de código Markdown. Cada objeto debe tener exactamente estas claves: 'titulo' (string con el nombre del curso o actividad), 'dia_semana' (número entero del 1 al 7, donde 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo), 'hora_inicio' (string en formato 24h 'HH:MM'), y 'hora_fin' (string en formato 24h 'HH:MM'). Asegúrate de que hora_inicio sea menor a hora_fin.";

const FALLBACK_VISION_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-2.5-pro',
];

/**
 * Limpia espacios o comillas envolventes de la clave API.
 */
export function normalizeApiKey(rawKey = '') {
  return String(rawKey || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

/**
 * Convierte un objeto File en su representación Base64 pura (sin prefijo data:...).
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        base64Image: base64,
        mimeType: file.type || 'image/png',
      });
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Normaliza y filtra únicamente el arreglo de objetos con `{ titulo, dia_semana, hora_inicio, hora_fin }`.
 */
export function sanitizeDetectedSchedules(rawInput) {
  const rawArray = Array.isArray(rawInput)
    ? rawInput
    : Array.isArray(rawInput?.schedules)
      ? rawInput.schedules
      : Array.isArray(rawInput?.horarios)
        ? rawInput.horarios
        : Array.isArray(rawInput?.bloques)
          ? rawInput.bloques
          : null;

  if (!Array.isArray(rawArray)) {
    throw new Error('El formato devuelto por la IA no es una lista válida de horarios.');
  }

  return rawArray
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const dia = Number(item.dia_semana ?? item.dia ?? 1);
      const validDay = Number.isFinite(dia) && dia >= 1 && dia <= 7 ? dia : 1;
      const horaInicio = String(item.hora_inicio || item.horaInicio || '08:00').slice(0, 5);
      const horaFin = String(item.hora_fin || item.horaFin || '10:00').slice(0, 5);
      return {
        titulo: String(item.titulo || item.curso || item.nombre || 'Curso / Turno').trim(),
        dia_semana: validDay,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      };
    })
    .filter((item) => item.hora_inicio < item.hora_fin);
}

/**
 * Limpia posibles bloques markdown (```json ... ```) y envoltorios de texto antes de aplicar JSON.parse.
 */
export function parseRawGeminiScheduleText(rawText) {
  const cleaned = String(rawText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const parsedArray = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
    return sanitizeDetectedSchedules(parsedArray);
  }

  const parsed = JSON.parse(cleaned);
  return sanitizeDetectedSchedules(parsed);
}

/**
 * Consulta dinámicamente ModelService.ListModels para obtener los modelos activos en la cuenta.
 */
async function fetchAvailableModelsFromApi(apiKey) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const models = (data?.models || [])
      .filter(
        (m) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          !String(m.name || '').includes('tts') &&
          !String(m.name || '').includes('imagen') &&
          !String(m.name || '').includes('embedding')
      )
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter(Boolean);

    // Priorizar modelos flash activos (ej. gemini-2.5-flash, gemini-3.8-flash)
    return models.sort((a, b) => {
      const aFlash = a.includes('flash') && !a.includes('8b') && !a.includes('lite') ? 0 : 1;
      const bFlash = b.includes('flash') && !b.includes('8b') && !b.includes('lite') ? 0 : 1;
      if (aFlash !== bFlash) return aFlash - bFlash;
      return b.localeCompare(a);
    });
  } catch {
    return [];
  }
}

/**
 * Llama al endpoint oficial de Google AI Studio (Gemini API).
 */
async function callGoogleAIStudio(base64Image, mimeType) {
  const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const rawKey =
    metaEnv.VITE_GEMINI_API_KEY ||
    metaEnv.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  const apiKey = normalizeApiKey(rawKey);

  // IMPORTANTE: Solo bloquear si está vacía o tiene el texto placeholder literal "MY_GEMINI_API_KEY"
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'Configura tu clave GEMINI_API_KEY de Google AI Studio en el archivo .env.local'
    );
  }

  const discovered = await fetchAvailableModelsFromApi(apiKey);
  const candidateModels =
    discovered.length > 0
      ? Array.from(new Set([...discovered, ...FALLBACK_VISION_MODELS]))
      : FALLBACK_VISION_MODELS;

  let firstMeaningfulError = null;

  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SCHEDULE_PROMPT },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errMsg =
          data?.error?.message || `Error HTTP ${response.status} al consultar ${modelName}.`;
        const isModelNotFound =
          response.status === 404 ||
          errMsg.includes('not found') ||
          errMsg.includes('no longer available');

        if (!isModelNotFound && !firstMeaningfulError) {
          firstMeaningfulError = new Error(errMsg);
        } else if (!firstMeaningfulError) {
          firstMeaningfulError = new Error(errMsg);
        }
        continue;
      }

      const rawText =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      if (!rawText) {
        throw new Error(`El modelo ${modelName} no devolvió texto.`);
      }

      return parseRawGeminiScheduleText(rawText);
    } catch (err) {
      if (!firstMeaningfulError) {
        firstMeaningfulError = err;
      }
    }
  }

  throw firstMeaningfulError || new Error('No se pudo analizar la imagen con Gemini AI.');
}

/**
 * Analiza una imagen de horario intentando primero la Serverless Function `/api/parse-schedule`
 * y usando como fallback directo el endpoint REST oficial de Google AI Studio en entorno local.
 */
export async function analyzeScheduleImage(file) {
  const { base64Image, mimeType } = await fileToBase64(file);

  try {
    const response = await fetch('/api/parse-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    if (response.status === 404) {
      return await callGoogleAIStudio(base64Image, mimeType);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return await callGoogleAIStudio(base64Image, mimeType);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al analizar el horario en el servidor.');
    }

    return sanitizeDetectedSchedules(data.schedules);
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError')
    ) {
      return await callGoogleAIStudio(base64Image, mimeType);
    }
    throw error;
  }
}
