import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import { useAmbit } from '../context/AmbitContext';
import { analyzeTasksFromImage } from '../services/aiTaskService';
import { TaskBatchPreviewModal } from './TaskBatchPreviewModal';

/**
 * Componente de Subida Inteligente de Tareas con IA:
 * - Replica la línea gráfica de "Mis Bloques de Horario Fijo" (borde punteado morado suave, fondo claro).
 * - Sincroniza automáticamente el selector "Ámbito destino" con la pestaña activa del Dashboard.
 * - Escucha eventos de portapapeles (`Ctrl+V` / `paste`), arrastrar y soltar (`drop`) y selección de archivo.
 * - Al recibir el JSON de Gemini, abre `TaskBatchPreviewModal` para confirmar y editar antes de guardar.
 */
export function TaskAiUploader({ horarios = [], onCloseUploader }) {
  const { currentAmbit, allAmbits, showToast } = useAmbit();

  const [targetAmbitId, setTargetAmbitId] = useState(currentAmbit?.id || 'uni');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [detectedTasks, setDetectedTasks] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Sincronizar automáticamente con la pestaña de ámbito activa en el Dashboard
  useEffect(() => {
    if (currentAmbit?.id) {
      setTargetAmbitId(currentAmbit.id);
    }
  }, [currentAmbit?.id]);

  const processImageFile = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setAiError('Por favor, selecciona o pega un archivo de imagen válido (PNG, JPG, WEBP).');
        return;
      }

      setAiError('');
      setIsAnalyzing(true);

      try {
        const tasks = await analyzeTasksFromImage(file);
        if (!tasks || tasks.length === 0) {
          setAiError('No se detectaron tareas pendientes en la captura proporcionada.');
        } else {
          setDetectedTasks(tasks);
          setIsPreviewModalOpen(true);
          showToast(
            `Gemini AI detectó ${tasks.length} tarea(s). Revisa y confirma el lote.`,
            'info'
          );
        }
      } catch (err) {
        setAiError(err.message || 'Error al analizar la captura de tareas con Gemini AI.');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [showToast]
  );

  // Soporte de Portapapeles (Ctrl+V) a nivel de ventana mientras el uploader está visible
  useEffect(() => {
    const handleWindowPaste = (event) => {
      if (isAnalyzing || isPreviewModalOpen) return;

      // No interceptar si el usuario está escribiendo texto en un input/textarea
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        const items = event.clipboardData?.items;
        const hasImage =
          items && Array.from(items).some((item) => item.type.startsWith('image/'));
        if (!hasImage) return;
      }

      const clipboardItems = event.clipboardData?.items;
      if (!clipboardItems) return;

      for (const item of clipboardItems) {
        if (item.type.startsWith('image/')) {
          const blobFile = item.getAsFile();
          if (blobFile) {
            event.preventDefault();
            processImageFile(blobFile);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => {
      window.removeEventListener('paste', handleWindowPaste);
    };
  }, [isAnalyzing, isPreviewModalOpen, processImageFile]);

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-8 p-5 rounded-2xl border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-violet-500 bg-violet-100/50'
            : 'border-violet-200 bg-violet-50/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-violet-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
            <span>Subida Inteligente de Tareas con IA (Foto o Captura)</span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="task-ai-ambit-select" className="text-xs font-semibold text-gray-600">
                Ámbito destino:
              </label>
              <select
                id="task-ai-ambit-select"
                value={targetAmbitId}
                onChange={(e) => setTargetAmbitId(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-text focus:outline-none"
              >
                {allAmbits.map((ambit) => (
                  <option key={ambit.id} value={ambit.id}>
                    {ambit.nombre}
                  </option>
                ))}
              </select>
            </div>

            {onCloseUploader && (
              <button
                type="button"
                onClick={onCloseUploader}
                className="p-1.5 rounded-full text-gray-400 hover:bg-violet-100 hover:text-gray-600 transition-colors"
                aria-label="Ocultar escáner de tareas"
                title="Cerrar escáner"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isAnalyzing ? (
          <div className="py-8 flex flex-col items-center justify-center text-center bg-white/70 rounded-xl border border-violet-100">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-violet-900">
              Analizando captura de tareas con Gemini AI...
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Calculando fechas límite, nivel de urgencia y descripciones.
            </p>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-white/80 hover:bg-white border border-violet-100 transition-colors text-center">
            <Sparkles className="w-7 h-7 text-violet-600 mb-2" />
            <span className="text-sm font-bold text-brand-text">
              Seleccionar, soltar o presiona Ctrl+V para pegar captura
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Gemini Vision extraerá tus entregas, exámenes o pendientes para que los confirmes
            </span>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </label>
        )}

        {aiError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{aiError}</span>
          </div>
        )}
      </div>

      <TaskBatchPreviewModal
        isOpen={isPreviewModalOpen}
        detectedTasks={detectedTasks}
        targetAmbitId={targetAmbitId}
        onChangeTargetAmbit={setTargetAmbitId}
        horarios={horarios}
        onClose={() => setIsPreviewModalOpen(false)}
        onSavedSuccess={() => {
          setDetectedTasks([]);
          if (onCloseUploader) onCloseUploader();
        }}
      />
    </>
  );
}

