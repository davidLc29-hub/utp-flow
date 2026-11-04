const SCHEDULE_PROMPT =
  "Analiza la imagen de este horario académico o laboral y extrae todos los bloques de clases o turnos fijos. Devuelve ÚNICAMENTE un arreglo JSON válido sin bloques de código Markdown. Cada objeto debe tener exactamente estas claves: 'titulo' (string con el nombre del curso o actividad), 'dia_semana' (número entero del 1 al 7, donde 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo), 'hora_inicio' (string en formato 24h 'HH:MM'), y 'hora_fin' (string en formato 24h 'HH:MM'). Asegúrate de que hora_inicio sea menor a hora_fin.";

const PREFERRED_VISION_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.0-flash',
  'gemini-2.5-flash',
];

function cleanApiKey(rawKey = '') {
  return String(rawKey || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function parseScheduleArrayFromText(rawText) {
  const cleaned = String(rawText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed;
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    parsed = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
  } else {
    parsed = JSON.parse(cleaned);
  }

  const rawList = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.schedules)
    ? parsed.schedules
    : Array.isArray(parsed?.horarios)
    ? parsed.horarios
    : Array.isArray(parsed?.bloques)
    ? parsed.bloques
    : [];

  return rawList
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const dia = Number(item.dia_semana);
      const validDay = Number.isFinite(dia) && dia >= 1 && dia <= 7 ? dia : 1;
      const horaInicio = String(item.hora_inicio || '08:00').slice(0, 5);
      const horaFin = String(item.hora_fin || '10:00').slice(0, 5);
      return {
        titulo: String(item.titulo || 'Curso / Actividad').trim(),
        dia_semana: validDay,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      };
    })
    .filter((item) => item.hora_inicio < item.hora_fin);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const apiKey = cleanApiKey(process.env.GEMINI_API_KEY);
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY no está configurada en el servidor.',
    });
  }

  try {
    const { base64Image, mimeType = 'image/png' } = req.body || {};
    if (!base64Image) {
      return res.status(400).json({ error: 'Se requiere base64Image en el cuerpo de la petición.' });
    }

    let lastError = null;

    for (const modelName of PREFERRED_VISION_MODELS) {
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
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data?.error?.message || `Error HTTP ${response.status} desde Google AI Studio (${modelName}).`
          );
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!rawText) {
          throw new Error(`No se obtuvo texto en la respuesta de ${modelName}.`);
        }

        const schedules = parseScheduleArrayFromText(rawText);
        return res.status(200).json({ schedules });
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('No se pudo procesar el horario con Gemini AI.');
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Error al procesar el horario con Gemini AI.',
    });
  }
}
