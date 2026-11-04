import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Plus, ArrowLeft } from 'lucide-react';
import { useBimodal } from '../context/BimodalContext';
import { BimodalToggle } from '../components/BimodalToggle';
import { TaskCard } from '../components/TaskCard';
import { Button } from '../components/Button';
import { ConflictModal } from '../components/ConflictModal';
import { getLocalDateTimeInputValue, getTodayDateInputValue } from '../utils/formatDate';
import { validateFutureReminder } from '../services/timeValidationService';

/**
 * Vista principal del Dashboard y formulario de creación/edición de pendientes.
 * Toda la lógica de datos y validación proviene de hooks y servicios inyectados.
 */
export function Dashboard({
  allTasks,
  contextTasks,
  pendingCount,
  onCreateTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  checkConflict,
}) {
  const { theme, showToast } = useBimodal();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [pendingConflict, setPendingConflict] = useState(null);

  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isFormOpen && titleInputRef.current) {
      const timer = setTimeout(() => titleInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isFormOpen]);

  const handleOpenCreate = () => {
    setEditingTaskId(null);
    setTitle('');
    setDate('');
    setReminderAt('');
    setPendingConflict(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (taskId) => {
    const task = contextTasks.find((t) => t.id === taskId);
    if (!task) return;
    setEditingTaskId(task.id);
    setTitle(task.title || '');
    setDate(task.date || '');
    setReminderAt(task.reminderAt || '');
    setPendingConflict(null);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setEditingTaskId(null);
    setTitle('');
    setDate('');
    setReminderAt('');
    setPendingConflict(null);
    setIsFormOpen(false);
  };

  const executeSave = async () => {
    const payload = { title, date, reminderAt };
    const result = editingTaskId
      ? await onUpdateTask(editingTaskId, payload)
      : await onCreateTask(payload);

    if (result?.ok) {
      handleCancelForm();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (reminderAt) {
      const validation = validateFutureReminder(reminderAt);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
      }

      if (checkConflict) {
        const { hasConflict, conflict } = checkConflict(reminderAt, allTasks, editingTaskId);
        if (hasConflict && conflict) {
          setPendingConflict(conflict);
          return;
        }
      }
    }

    await executeSave();
  };

  const handleConfirmConflictAnyway = async () => {
    setPendingConflict(null);
    await executeSave();
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
          onConfirmAnyway={handleConfirmConflictAnyway}
          onCancel={() => setPendingConflict(null)}
        />

        <div className="max-w-3xl mx-auto px-4 pt-12 pb-6">
          <button
            type="button"
            onClick={handleCancelForm}
            className="flex items-center gap-2 text-gray-500 font-medium active:text-gray-800 transition-colors mb-8 pl-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h1 id="create-title" className="text-2xl font-bold mb-2 text-brand-text">
              {editingTaskId ? 'Editar pendiente' : 'Nuevo pendiente'}
            </h1>
            <p id="create-description" className="text-[14px] text-gray-500 mb-8">
              Se guardará automáticamente en tu entorno de{' '}
              <span
                id="create-context-label"
                className={`font-bold color-transition ${theme.textClass}`}
              >
                {theme.label}
              </span>
              .
            </p>

            <form id="create-form" onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="task-title"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  ¿Qué necesitas hacer?
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  id="task-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Entregar avance de proyecto"
                  className={`w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none color-transition text-brand-text bg-white ${theme.focusBorderClass}`}
                  autoComplete="off"
                />
              </div>

              <div className="mb-10">
                <label htmlFor="task-date" className="block text-sm font-bold text-gray-700 mb-2">
                  ¿Hasta cuándo se puede hacer?{' '}
                  <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="date"
                  id="task-date"
                  min={getTodayDateInputValue()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none color-transition text-brand-text bg-white file:hidden ${theme.focusBorderClass}`}
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
                  type="datetime-local"
                  id="task-reminder"
                  min={getLocalDateTimeInputValue(new Date())}
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                  className={`w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none color-transition text-brand-text bg-white file:hidden ${theme.focusBorderClass}`}
                />
                <p className="text-[12px] text-gray-400 mt-2">
                  Recibirás una alerta en el navegador y un sonido breve cuando llegue la hora.
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
        <BimodalToggle />

        <div className="flex flex-col h-full min-h-[350px]">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-text leading-tight">
              Pendientes de <br className="sm:hidden" />
              <span id="list-title-context" className={`transition-colors ${theme.textClass}`}>
                {theme.label}
              </span>
            </h2>
            <p
              className="text-brand-text opacity-50 font-medium mb-1 shrink-0 lg:text-lg"
              id="task-count"
            >
              {pendingCount} tarea(s) restante(s)
            </p>
          </div>

          {contextTasks.length === 0 ? (
            <div id="empty-state" className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="font-bold text-xl lg:text-2xl mb-2 text-brand-text">Todo al día</h3>
              <p className="text-gray-500 max-w-[280px] lg:text-base">
                No tienes tareas pendientes en este entorno. Relájate o agrega una nueva tarea para
                organizarte.
              </p>
            </div>
          ) : (
            <div id="task-list" className="space-y-4 flex-1">
              {contextTasks.map((task) => (
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

