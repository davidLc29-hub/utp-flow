import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  Info,
  CloudDownload,
  CloudUpload,
  Sparkles,
  CalendarClock,
  Trash2,
  Plus,
  Loader2,
  Check,
  LogOut,
  Archive,
} from 'lucide-react';
import { useAmbit } from '../context/AmbitContext';
import { useAuth } from '../context/AuthContext';
import { ambitRepository } from '../db/database';
import { getAmbitTheme } from '../utils/ambitThemes';
import { exportBackupToJson, parseImportedBackupFile } from '../utils/jsonExport';
import { analyzeScheduleImage } from '../services/aiScheduleService';
import { DAYS_OF_WEEK, getDayName } from '../services/timeValidationService';

/**
 * Vista de Configuración:
 * 1. Perfil de usuario y cierre de sesión + acceso rápido a Historial (+48h).
 * 2. Mis Bloques de Horario Fijo (Subida Inteligente con Gemini AI + Formulario Manual).
 * 3. Respaldo de Datos JSON (exporta e importa tasks, horarios y entornos).
 */
export function Settings({
  allTasks,
  horarios,
  onAddHorario,
  onBulkAddHorarios,
  onRemoveHorario,
  onReplaceAllTasks,
  onReplaceAllHorarios,
  onOpenHistory,
  onBack,
}) {
  const { allAmbits, currentTheme, showToast } = useAmbit();
  const { currentUser, logout } = useAuth();

  const [importError, setImportError] = useState('');
  const errorTimerRef = useRef(null);

  // Estado para Lector IA de Horarios
  const [aiTargetAmbit, setAiTargetAmbit] = useState('uni');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [detectedBlocks, setDetectedBlocks] = useState([]);
  const [aiError, setAiError] = useState('');

  // Estado para Formulario Manual Rápido de Horario Fijo
  const [manualTitle, setManualTitle] = useState('');
  const [manualAmbit, setManualAmbit] = useState('uni');
  const [manualDay, setManualDay] = useState(1);
  const [manualStart, setManualStart] = useState('08:00');
  const [manualEnd, setManualEnd] = useState('10:00');

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  const triggerImportError = (msg) => {
    setImportError(msg);
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    errorTimerRef.current = setTimeout(() => {
      setImportError('');
    }, 4500);
  };

  // --- Subida Inteligente con Gemini AI ---
  const handleScheduleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAiError('');
    setDetectedBlocks([]);
    setIsAnalyzingAI(true);

    try {
      const blocks = await analyzeScheduleImage(file);
      if (blocks.length === 0) {
        setAiError('No se detectaron bloques de horario en la imagen seleccionada.');
      } else {
        setDetectedBlocks(blocks);
        showToast(`Gemini AI detectó ${blocks.length} bloque(s) de horario.`, 'success');
      }
    } catch (err) {
      setAiError(err.message || 'Error al analizar la captura con Gemini AI.');
    } finally {
      setIsAnalyzingAI(false);
      event.target.value = '';
    }
  };

  const handleConfirmDetectedBlocks = async () => {
    if (detectedBlocks.length === 0) return;
    await onBulkAddHorarios(detectedBlocks, aiTargetAmbit);
    const count = detectedBlocks.length;
    setDetectedBlocks([]);
    showToast(`Se guardaron ${count} bloque(s) fijos en tu horario.`, 'success');
  };

  // --- Formulario Manual Rápido ---
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const trimmed = manualTitle.trim();
    if (!trimmed) return;

    if (manualStart >= manualEnd) {
      showToast('La hora de inicio debe ser menor a la hora de fin.', 'error');
      return;
    }

    await onAddHorario({
      id_entorno: manualAmbit,
      titulo: trimmed,
      dia_semana: Number(manualDay),
      hora_inicio: manualStart,
      hora_fin: manualEnd,
    });

    setManualTitle('');
    showToast('Bloque de horario fijo agregado.', 'success');
  };

  // --- Exportar / Importar Respaldo Completo ---
  const handleExport = () => {
    const result = exportBackupToJson({
      tasks: allTasks,
      horarios,
      entornos: allAmbits,
    });
    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }
    showToast('El respaldo completo se descargó correctamente.', 'success');
  };

  const handleImportChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { tasks, horarios: importedHorarios, entornos } = await parseImportedBackupFile(file);
      if (Array.isArray(tasks)) {
        await onReplaceAllTasks(tasks);
      }
      if (Array.isArray(importedHorarios) && onReplaceAllHorarios) {
        await onReplaceAllHorarios(importedHorarios);
      }
      if (Array.isArray(entornos) && entornos.length > 0) {
        await ambitRepository.replaceAll(entornos);
      }
      event.target.value = '';
      showToast('El respaldo se importó correctamente.', 'success');
      onBack();
    } catch (error) {
      triggerImportError(error.message || 'No se pudo leer el archivo JSON.');
      event.target.value = '';
    }
  };

  return (
    <div id="view-settings" className="bg-brand-bg min-h-screen z-30">
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 font-medium active:text-gray-800 transition-colors pl-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio
          </button>

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 transition-colors"
            >
              <Archive className="w-4 h-4" />
              Historial (+48h)
            </button>
          )}
        </div>

        {/* Tarjeta de Sesión de Usuario */}
        {currentUser && (
          <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center ${currentTheme.bgPrimary}`}
              >
                {currentUser.avatar || 'UF'}
              </div>
              <div>
                <h2 className="font-bold text-brand-text text-base">{currentUser.nombre}</h2>
                <p className="text-xs text-gray-500">
                  {currentUser.email} · Proveedor:{' '}
                  <span className="uppercase font-semibold">{currentUser.provider}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-700 font-semibold text-xs sm:text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        )}

        {/* SECCIÓN 1: MIS BLOQUES DE HORARIO FIJO */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${currentTheme.bgPrimary}`}
            >
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-brand-text">
                Mis Bloques de Horario Fijo
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Registra tus clases o turnos laborales para recibir alertas si intentas agendar una
                tarea encima.
              </p>
            </div>
          </div>

          {/* 1.1 Subida Inteligente con Gemini AI */}
          <div className="mt-6 p-5 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-violet-800 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Subida Inteligente con IA (Captura de UTP+ Class o Turno)</span>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="ai-ambit-select" className="text-xs font-semibold text-gray-600">
                  Ámbito destino:
                </label>
                <select
                  id="ai-ambit-select"
                  value={aiTargetAmbit}
                  onChange={(e) => setAiTargetAmbit(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-text focus:outline-none"
                >
                  {allAmbits.map((ambit) => (
                    <option key={ambit.id} value={ambit.id}>
                      {ambit.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isAnalyzingAI ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin mb-3" />
                <p className="text-sm font-semibold text-violet-900">
                  Analizando captura de horario con Gemini AI...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Extrayendo cursos, días de la semana y rangos de horas en formato 24h.
                </p>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-white/80 hover:bg-white border border-violet-100 transition-colors text-center">
                <Sparkles className="w-7 h-7 text-violet-600 mb-2" />
                <span className="text-sm font-bold text-brand-text">
                  Seleccionar o soltar captura de horario (PNG, JPG, WEBP)
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Gemini Vision detectará automáticamente tus bloques fijos
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleScheduleImageSelect}
                />
              </label>
            )}

            {aiError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{aiError}</span>
              </div>
            )}

            {detectedBlocks.length > 0 && (
              <div className="mt-4 bg-white rounded-xl p-4 border border-violet-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-800">
                    Vista previa detectada ({detectedBlocks.length} bloques)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setDetectedBlocks([])}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Descartar
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {detectedBlocks.map((b, idx) => (
                    <div
                      key={`${b.titulo}-${idx}`}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <span className="font-semibold text-brand-text">{b.titulo}</span>
                      <span className="text-gray-600 font-medium">
                        {getDayName(b.dia_semana)} · {b.hora_inicio} - {b.hora_fin}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleConfirmDetectedBlocks}
                  className="mt-4 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Confirmar y Guardar Lote en mi Horario
                </button>
              </div>
            )}
          </div>

          {/* 1.2 Formulario Manual Rápido */}
          <form onSubmit={handleManualSubmit} className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-brand-text mb-3">
              Agregar bloque fijo manualmente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                required
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Curso o actividad (ej. Cálculo II / Turno Caja)"
                className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={manualAmbit}
                  onChange={(e) => setManualAmbit(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none"
                >
                  {allAmbits.map((ambit) => (
                    <option key={ambit.id} value={ambit.id}>
                      {ambit.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={manualDay}
                  onChange={(e) => setManualDay(Number(e.target.value))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Hora Inicio (24h)
                </label>
                <input
                  type="time"
                  required
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Hora Fin (24h)
                </label>
                <input
                  type="time"
                  required
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-colors ${currentTheme.bgPrimary} ${currentTheme.bgHover}`}
                >
                  <Plus className="w-4 h-4" />
                  Agregar Bloque
                </button>
              </div>
            </div>
          </form>

          {/* Lista de Bloques Registrados */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-brand-text mb-3">
              Bloques registrados ({horarios.length})
            </h3>

            {horarios.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">
                Aún no tienes bloques de horario fijo registrados.
              </p>
            ) : (
              <div className="space-y-2.5">
                {horarios.map((h) => {
                  const ambitObj = allAmbits.find((a) => a.id === h.id_entorno);
                  const ambitTheme = getAmbitTheme(ambitObj?.themeKey || 'rose');

                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-brand-text">{h.titulo}</span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ambitTheme.badgeBg} ${ambitTheme.badgeText}`}
                          >
                            {ambitObj ? ambitObj.nombre : h.id_entorno}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {getDayName(h.dia_semana)} · {h.hora_inicio} - {h.hora_fin}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveHorario(h.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        aria-label="Eliminar bloque de horario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: RESPALDO DE DATOS JSON */}
        {importError && (
          <div
            id="import-error"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl relative flex items-start gap-3 shadow-sm"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>
              <strong className="font-bold block text-sm">Error al importar</strong>
              <span className="block text-sm mt-1" id="import-error-msg">
                {importError}
              </span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-brand-text">Respaldo de Datos</h2>

          <div className="bg-[#EFF6FF] text-[#1D4ED8] p-4 sm:p-5 rounded-xl flex items-start gap-3 mb-6">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-xs sm:text-sm leading-relaxed">
              <strong>Privacidad Offline-First:</strong> Tus tareas, ámbitos y horarios se guardan
              localmente en tu navegador mediante <em>IndexedDB (Dexie.js v2)</em>. Exporta o
              importa tu archivo JSON para llevar toda tu configuración a otro dispositivo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExport}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <CloudDownload className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="font-bold text-brand-text mb-1 text-base">Exportar Respaldo</h3>
              <p className="text-[13px] text-gray-500">
                Descarga un JSON con tus tareas, horarios y ámbitos.
              </p>
            </button>

            <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <CloudUpload className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="font-bold text-brand-text mb-1 text-base">Importar Respaldo</h3>
              <p className="text-[13px] text-gray-500">
                Sube tu archivo .json para restaurar tus datos.
              </p>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportChange}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
