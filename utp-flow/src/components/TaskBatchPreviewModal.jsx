import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Check,
  Star,
  AlertTriangle,
  Calendar,
  FileText,
} from 'lucide-react';
import { db, generateUUID, DEFAULT_LOCAL_USER_ID } from '../db/database';
import { useAmbit } from '../context/AmbitContext';
import { useAuth } from '../context/AuthContext';
import { getAmbitTheme } from '../utils/ambitThemes';
import { detectScheduleConflict } from '../services/timeValidationService';

/**
 * Modal de Pre-visualización y Edición por Lote de Tareas extraídas con Gemini AI.
 * Permite editar títulos, fechas límite, descripciones y niveles de urgencia,
 * desmarcar tareas con checkboxes, validar cruces de horario en tiempo real
 * y persistir el lote seleccionado mediante `db.tasks.bulkAdd(...)`.
 */
export function TaskBatchPreviewModal({
  isOpen,
  detectedTasks = [],
  targetAmbitId,
  onChangeTargetAmbit,
  horarios = [],
  onClose,
  onSavedSuccess,
}) {
  const { allAmbits, showToast } = useAmbit();
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && Array.isArray(detectedTasks)) {
      setItems(
        detectedTasks.map((t, idx) => ({
          tempId: t.tempId || `preview_${Date.now()}_${idx}`,
          selected: t.selected !== false,
          titulo: t.titulo || '',
          fecha_limite: t.fecha_limite || '',
          urgencia: t.urgencia === 'Alta' ? 'Alta' : 'Normal',
          descripcion: t.descripcion || '',
        }))
      );
    }
  }, [isOpen, detectedTasks]);

  const targetAmbitObj = useMemo(() => {
    return allAmbits.find((a) => a.id === targetAmbitId) || allAmbits[0];
  }, [allAmbits, targetAmbitId]);

  const targetTheme = useMemo(() => {
    return getAmbitTheme(targetAmbitObj?.themeKey || 'rose');
  }, [targetAmbitObj]);

  if (!isOpen) return null;

  const selectedCount = items.filter((i) => i.selected && i.titulo.trim()).length;

  const handleToggleSelect = (tempId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleFieldChange = (tempId, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item))
    );
  };

  const handleToggleUrgencia = (tempId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId
          ? { ...item, urgencia: item.urgencia === 'Alta' ? 'Normal' : 'Alta' }
          : item
      )
    );
  };

  const handleSaveSelected = async () => {
    const validSelected = items.filter((i) => i.selected && i.titulo.trim());
    if (validSelected.length === 0) {
      showToast('Selecciona al menos una tarea válida para guardar.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const nowMs = Date.now();
      const recordsToInsert = validSelected.map((item, idx) => {
        const cleanDeadline = (item.fecha_limite || '').trim();
        const datePart = cleanDeadline ? cleanDeadline.slice(0, 10) : null;
        const datetimePart = cleanDeadline ? cleanDeadline.slice(0, 16) : null;

        const { hasConflict } = detectScheduleConflict(datetimePart, horarios);

        return {
          id: generateUUID('task'),
          id_usuario: currentUser?.id || DEFAULT_LOCAL_USER_ID,
          id_entorno: targetAmbitId || 'uni',
          titulo: item.titulo.trim(),
          descripcion: item.descripcion ? item.descripcion.trim() : '',
          fecha_programada: datePart,
          hora_programada: datetimePart,
          urgente: item.urgencia === 'Alta',
          estado_completado: false,
          fecha_completado: null,
          archivado: false,
          alarma_disparada: false,
          forzado_con_cruce: Boolean(hasConflict),
          fecha_registro: nowMs + idx,
        };
      });

      await db.tasks.bulkAdd(recordsToInsert);

      showToast(
        `Se guardaron ${recordsToInsert.length} tarea(s) en ${targetAmbitObj?.nombre || 'tu entorno'}.`,
        'success'
      );

      if (onSavedSuccess) {
        onSavedSuccess(recordsToInsert.length);
      }
      onClose();
    } catch (error) {
      showToast(error.message || 'Error al guardar el lote de tareas.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-batch-preview-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-violet-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="task-batch-preview-title"
                className="text-lg font-bold text-brand-text leading-tight"
              >
                Tareas Detectadas con IA ({items.length})
              </h2>
              <p className="text-xs text-gray-500">
                Revisa, edita o desmarca las tareas antes de registrarlas en tu agenda.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="modal-target-ambit"
                className="text-xs font-semibold text-gray-600 whitespace-nowrap"
              >
                Ámbito destino:
              </label>
              <select
                id="modal-target-ambit"
                value={targetAmbitId}
                onChange={(e) => onChangeTargetAmbit && onChangeTargetAmbit(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-brand-text focus:outline-none"
              >
                {allAmbits.map((ambit) => (
                  <option key={ambit.id} value={ambit.id}>
                    {ambit.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 transition-colors"
              aria-label="Cerrar previsualización"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Tarjetas Editables */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {items.map((item) => {
            const isHigh = item.urgencia === 'Alta';
            const conflictInfo = item.fecha_limite
              ? detectScheduleConflict(item.fecha_limite, horarios)
              : { hasConflict: false, conflict: null };

            return (
              <div
                key={item.tempId}
                className={`rounded-2xl border p-4 transition-all ${
                  !item.selected
                    ? 'opacity-50 bg-gray-50 border-gray-200'
                    : isHigh
                      ? 'bg-amber-50/30 border-amber-300 shadow-xs'
                      : 'bg-white border-gray-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox de selección */}
                  <label className="relative flex items-center cursor-pointer mt-2 shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.selected}
                      onChange={() => handleToggleSelect(item.tempId)}
                    />
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        item.selected
                          ? `${targetTheme.bgPrimary} border-transparent text-white`
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {item.selected && <Check strokeWidth={3} className="w-3.5 h-3.5" />}
                    </div>
                  </label>

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Fila 1: Título editable + Botón de Urgencia */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <input
                        type="text"
                        value={item.titulo}
                        onChange={(e) =>
                          handleFieldChange(item.tempId, 'titulo', e.target.value)
                        }
                        placeholder="Título de la tarea..."
                        className="flex-1 font-semibold text-sm sm:text-base text-brand-text bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleToggleUrgencia(item.tempId)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                          isHigh
                            ? 'bg-amber-100 text-amber-800 border-amber-400'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                        title="Alternar nivel de urgencia"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isHigh ? 'fill-amber-500 text-amber-600' : 'text-gray-400'
                          }`}
                        />
                        <span>Urgencia: {item.urgencia}</span>
                      </button>
                    </div>

                    {/* Fila 2: Fecha límite y Descripción */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="relative flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                        <input
                          type="datetime-local"
                          value={item.fecha_limite ? item.fecha_limite.slice(0, 16) : ''}
                          onChange={(e) =>
                            handleFieldChange(item.tempId, 'fecha_limite', e.target.value)
                          }
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-brand-text focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="relative flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          value={item.descripcion}
                          onChange={(e) =>
                            handleFieldChange(item.tempId, 'descripcion', e.target.value)
                          }
                          placeholder="Descripción o curso (opcional)"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* Alerta de cruce de horario fijo en tiempo real */}
                    {conflictInfo.hasConflict && conflictInfo.conflict && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Cruce detectado:</strong> Coincide con tu bloque fijo{' '}
                          <span className="font-semibold">
                            &ldquo;{conflictInfo.conflict.titulo}&rdquo;
                          </span>{' '}
                          ({conflictInfo.conflict.dia_nombre},{' '}
                          {conflictInfo.conflict.hora_inicio} -{' '}
                          {conflictInfo.conflict.hora_fin}). Puedes ajustar la hora arriba o se
                          guardará como excepción.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-medium text-gray-500">
            {selectedCount} de {items.length} tarea(s) seleccionada(s) para guardar en{' '}
            <strong className={targetTheme.textPrimary}>{targetAmbitObj?.nombre}</strong>
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs sm:text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveSelected}
              disabled={isSaving || selectedCount === 0}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSaving ? 'Guardando...' : 'Guardar tareas seleccionadas'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

