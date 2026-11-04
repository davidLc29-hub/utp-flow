import React from 'react';
import { ArrowLeft, Archive, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAmbit } from '../context/AmbitContext';
import { getAmbitTheme } from '../utils/ambitThemes';
import { formatReminderDateTime } from '../utils/formatDate';

/**
 * Vista de Historial de Tareas (Archivo +48h).
 * Consulta directamente con `useLiveQuery` las tareas donde `archivado === true`.
 */
export function History({ onRestoreTask, onClearHistory, onBack }) {
  const { allAmbits } = useAmbit();

  const archivedTasks = useLiveQuery(
    async () => {
      const rows = await db.tasks.filter((t) => Boolean(t.archivado)).toArray();
      return rows.sort((a, b) => (b.fecha_completado || 0) - (a.fecha_completado || 0));
    },
    [],
    []
  );

  const getAmbitMeta = (idEntorno) => {
    const found = allAmbits.find((a) => a.id === idEntorno);
    const nombre = found ? found.nombre : 'General';
    const theme = getAmbitTheme(found?.themeKey || 'rose');
    return { nombre, theme };
  };

  return (
    <div id="view-history" className="bg-brand-bg min-h-screen z-30">
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-16">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 font-medium active:text-gray-800 transition-colors mb-6 pl-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inicio
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-brand-text">
                  Historial de Tareas (Archivo +48h)
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Las tareas completadas hace más de 48 horas se archivan automáticamente aquí.
                </p>
              </div>
            </div>

            {archivedTasks.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs sm:text-sm transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Vaciar historial definitivamente
              </button>
            )}
          </div>

          {archivedTasks.length === 0 ? (
            <div className="py-14 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="font-bold text-lg text-brand-text mb-1">Sin tareas archivadas</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Cuando completes tus pendientes y pasen 48 horas, se moverán automáticamente a este
                archivo para mantener limpia tu vista diaria.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedTasks.map((task) => {
                const { nombre, theme } = getAmbitMeta(task.id_entorno);
                const completedIso = task.fecha_completado
                  ? new Date(task.fecha_completado).toISOString()
                  : '';

                return (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-2xl border border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 ${theme.borderLeft}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}
                        >
                          {nombre}
                        </span>
                        {completedIso && (
                          <span className="text-xs text-gray-400">
                            Completada: {formatReminderDateTime(completedIso)}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-brand-text text-base break-words">
                        {task.titulo}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRestoreTask(task.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restaurar al entorno
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

