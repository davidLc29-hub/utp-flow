import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Plus, ArrowLeft, Star, Sparkles } from 'lucide-react';
import { useAmbit } from '../context/AmbitContext';
import { AmbitTabs } from '../components/AmbitTabs';
import { TaskCard } from '../components/TaskCard';
import { Button } from '../components/Button';
import { ConflictModal } from '../components/ConflictModal';
import { TaskAiUploader } from '../components/TaskAiUploader';
import { getLocalDateTimeInputValue, getTodayDateInputValue } from '../utils/formatDate';
import { validateFutureReminder } from '../services/timeValidationService';

/**
 * Vista principal del Dashboard con barra de ámbitos deslizables, escáner de tareas por IA
 * (`TaskAiUploader`), prioridad de 1 clic (`urgente`) y resolución de conflictos (Sprint 2).
 */
export function Dashboard({
  ambitTasks,
  pendingCount,
  horarios = [],
  onCreateTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  checkConflict,
}) {
  const { currentAmbit, currentTheme, showToast } = useAmbit();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [horaProgramada, setHoraProgramada] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [pendingConflict, setPendingConflict] = useState(null);

  const titleInputRef = useRef(null);
  const reminderInputRef = useRef(null);

  useEffect(() => {
    if (isFormOpen && titleInputRef.current) {
      const timer = setTimeout(() => titleInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isFormOpen]);

  const handleOpenCreate = () => {
    setEditingTaskId(null);
    setTitulo('');
    setFechaProgramada('');
    setHoraProgramada('');
    setUrgente(false);
    setPendingConflict(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (taskId) => {
    const task = ambitTasks.find((t) => t.id === taskId);
    if (!task) return;
    setEditingTaskId(task.id);
    setTitulo(task.titulo || '');
    setFechaProgramada(task.fecha_programada || '');
    setHoraProgramada(task.hora_programada || '');
    setUrgente(Boolean(task.urgente));
    setPendingConflict(null);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setEditingTaskId(null);
    setTitulo('');
    setFechaProgramada('');
    setHoraProgramada('');
    setUrgente(false);
    setPendingConflict(null);
    setIsFormOpen(false);
  };

  const executeSave = async (forzadoConCruce = false) => {
    const payload = {
      titulo,
      fecha_programada: fechaProgramada || null,
      hora_programada: horaProgramada || null,
      urgente,
      forzado_con_cruce: forzadoConCruce,
    };

    const result = editingTaskId
      ? await onUpdateTask(editingTaskId, payload)
      : await onCreateTask(payload);

    if (result?.ok) {
      handleCancelForm();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = titulo.trim();
    if (!trimmedTitle) return;

    if (horaProgramada) {
      const validation = validateFutureReminder(horaProgramada);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
      }

      if (checkConflict) {
        const { hasConflict, conflict } = checkConflict(horaProgramada);
        if (hasConflict && conflict) {
          setPendingConflict(conflict);
          return;
        }
      }
    }

    await executeSave(false);
  };

  const handleModifyTimeFromModal = () => {
    setPendingConflict(null);
    setTimeout(() => {
      if (reminderInputRef.current) {
        reminderInputRef.current.focus();
      }
    }, 50);
  };

  const handleForceSaveException = async () => {
    setPendingConflict(null);
    await executeSave(true);
    showToast('Tarea guardada como excepción sobre tu horario fijo.', 'info');
  };

  const handleDelete = async (taskId) => {
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
    }
    await onDeleteTask(taskId);
  };

  if (isFormOpen) {
    return (
      <div id="view-create" className="bg-brand-bg min-h-screen z-30">
        <ConflictModal
          conflict={pendingConflict}
          onModifyTime={handleModifyTimeFromModal}
          onForceSaveException={handleForceSaveException}
        />

        <div className="max-w-3xl mx-auto px-4 pt-8 pb-6">
          <button
            type="button"
            onClick={handleCancelForm}
            className="flex items-center gap-2 text-gray-500 font-medium active:text-gray-800 transition-colors mb-6 pl-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h1 id="create-title" className="text-2xl font-bold mb-2 text-brand-text">
              {editingTaskId ? 'Editar pendiente' : 'Nuevo pendiente'}
            </h1>
            <p id="create-description" className="text-[14px] text-gray-500 mb-6">
              Se guardará automáticamente en tu entorno de{' '}
              <span
                id="create-context-label"
                className={`font-bold color-transition ${currentTheme.textPrimary}`}
              >
                {currentAmbit.nombre}
              </span>
              .
            </p>

            <form id="create-form" onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label htmlFor="task-title" className="block text-sm font-bold text-gray-700">
                    ¿Qué necesitas hacer?
                  </label>

                  {/* Interruptor de Urgencia (Prioridad de 1 Clic) */}
                  <button
                    type="button"
                    onClick={() => setUrgente((prev) => !prev)}
                    aria-pressed={urgente}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 border ${
                      urgente
                        ? 'bg-amber-100 text-amber-800 border-amber-400 shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        urgente ? 'fill-amber-500 text-amber-600' : 'text-gray-400'
                      }`}
                    />
                    <span>⭐ Marcar como urgente</span>
                  </button>
                </div>

                <input
                  ref={titleInputRef}
                  type="text"
                  id="task-title"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Entregar avance de proyecto"
                  className={`w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none color-transition text-brand-text bg-white ${currentTheme.borderFocus}`}
                  autoComplete="off"
                />
              </div>

              <div className="mb-8">
                <label htmlFor="task-date" className="block text-sm font-bold text-gray-700 mb-2">
                  ¿Hasta cuándo se puede hacer?{' '}
                  <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="date"
                  id="task-date"
                  min={getTodayDateInputValue()}
                  value={fechaProgramada}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                  className={`w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none color-transition text-brand-text bg-white file:hidden ${currentTheme.borderFocus}`}
                />
              </div>

              <div className="mb-10">
                <label
                  htmlFor="task-reminder"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  ¿Cuándo piensas hacerlo?{' '}
                  <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  ref={reminderInputRef}
                  type="datetime-local"
                  id="task-reminder"
                  min={getLocalDateTimeInputValue(new Date())}
                  value={horaProgramada}
                  onChange={(e) => setHoraProgramada(e.target.value)}
                  className={`w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none color-transition text-brand-text bg-white file:hidden ${currentTheme.borderFocus}`}
                />
                <p className="text-[12px] text-gray-400 mt-2">
                  Validaremos automáticamente que no se cruce con tus bloques de horario fijo.
                </p>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <Button variant="secondary" onClick={handleCancelForm} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  id="create-submit-btn"
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  {editingTaskId ? 'Guardar Cambios' : 'Guardar Tarea'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 sm:px-10 pb-20">
        <AmbitTabs />

        <div className="flex flex-col h-full min-h-[350px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-text leading-tight">
                Pendientes de <br className="sm:hidden" />
                <span
                  id="list-title-context"
                  className={`transition-colors ${currentTheme.textPrimary}`}
                >
                  {currentAmbit.nombre}
                </span>
              </h2>
              <p
                className="text-brand-text opacity-50 font-medium mt-1 shrink-0 text-sm sm:text-base"
                id="task-count"
              >
                {pendingCount} tarea(s) restante(s)
              </p>
            </div>

            {/* Acciones Superiores: Botón secundario "Escanear Tareas" junto a "Nueva Tarea" */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsScannerOpen((prev) => !prev)}
                aria-expanded={isScannerOpen}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all active:scale-95 ${
                  isScannerOpen
                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                    : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Escanear Tareas</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all active:scale-95 shadow-xs ${currentTheme.bgPrimary} ${currentTheme.bgHover}`}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Nueva Tarea</span>
              </button>
            </div>
          </div>

          {/* Contenedor desplegable de Subida Inteligente de Tareas con IA */}
          {isScannerOpen && (
            <TaskAiUploader
              horarios={horarios}
              onCloseUploader={() => setIsScannerOpen(false)}
            />
          )}

          {ambitTasks.length === 0 ? (
            <div
              id="empty-state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="font-bold text-xl lg:text-2xl mb-2 text-brand-text">Todo al día</h3>
              <p className="text-gray-500 max-w-[280px] lg:text-base">
                No tienes tareas pendientes en este entorno. Relájate, agrega una nueva tarea o
                escanea una captura con IA.
              </p>
            </div>
          ) : (
            <div id="task-list" className="space-y-4 flex-1">
              {ambitTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Button
        id="fab-button"
        variant="fab"
        onClick={handleOpenCreate}
        ariaLabel="Agregar Nueva Tarea"
      >
        <Plus strokeWidth={3} className="w-8 h-8" />
      </Button>
    </>
  );
}
