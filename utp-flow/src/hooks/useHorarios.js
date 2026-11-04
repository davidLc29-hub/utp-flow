import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, horarioRepository, DEFAULT_LOCAL_USER_ID } from '../db/database';
import { detectScheduleConflict } from '../services/timeValidationService';

/**
 * Custom Hook para gestionar bloques de horario fijo (`horarios` en Dexie)
 * y validar traslapes temporales antes de agendar tareas.
 */
export function useHorarios(currentUserId = DEFAULT_LOCAL_USER_ID) {
  const horarios = useLiveQuery(
    async () => {
      const list = await db.horarios.toArray();
      return list.sort((a, b) => {
        if (a.dia_semana !== b.dia_semana) {
          return a.dia_semana - b.dia_semana;
        }
        return String(a.hora_inicio || '').localeCompare(String(b.hora_inicio || ''));
      });
    },
    [],
    []
  );

  const addHorario = useCallback(
    async ({ id_entorno = 'uni', titulo, dia_semana, hora_inicio, hora_fin }) => {
      return horarioRepository.add({
        id_usuario: currentUserId || DEFAULT_LOCAL_USER_ID,
        id_entorno,
        titulo: String(titulo || '').trim(),
        dia_semana: Number(dia_semana),
        hora_inicio,
        hora_fin,
      });
    },
    [currentUserId]
  );

  const bulkAddHorarios = useCallback(
    async (blocks, id_entorno = 'uni') => {
      const prepared = (blocks || []).map((b) => ({
        ...b,
        id_usuario: currentUserId || DEFAULT_LOCAL_USER_ID,
        id_entorno: b.id_entorno || id_entorno,
      }));
      return horarioRepository.bulkAdd(prepared);
    },
    [currentUserId]
  );

  const removeHorario = useCallback(async (id) => {
    await horarioRepository.remove(id);
  }, []);

  const replaceAllHorarios = useCallback(async (list) => {
    await horarioRepository.replaceAll(list);
  }, []);

  const checkConflict = useCallback(
    (horaProgramada) => {
      return detectScheduleConflict(horaProgramada, horarios || []);
    },
    [horarios]
  );

  return {
    horarios: horarios || [],
    addHorario,
    bulkAddHorarios,
    removeHorario,
    replaceAllHorarios,
    checkConflict,
  };
}
