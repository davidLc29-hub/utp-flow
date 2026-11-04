import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Info, CloudDownload, CloudUpload } from 'lucide-react';
import { useBimodal } from '../context/BimodalContext';
import { exportTasksToJson, parseImportedTasksFile } from '../utils/jsonExport';

/**
 * Vista de Configuración y Respaldo de Datos (Exportar / Importar JSON).
 */
export function Settings({ allTasks, onReplaceAllTasks, onBack }) {
  const { showToast } = useBimodal();
  const [importError, setImportError] = useState('');
  const errorTimerRef = useRef(null);

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
    }, 4000);
  };

  const handleExport = () => {
    const result = exportTasksToJson(allTasks);
    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }
    showToast('El archivo se descargó correctamente.', 'success');
  };

  const handleImportChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedTasks = await parseImportedTasksFile(file);
      await onReplaceAllTasks(importedTasks);
      event.target.value = '';
      showToast('Las tareas se importaron correctamente.', 'success');
      onBack();
    } catch (error) {
      triggerImportError(error.message || 'No se pudo leer el archivo JSON.');
      event.target.value = '';
    }
  };

  return (
    <div id="view-settings" className="bg-brand-bg min-h-screen z-30">
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 font-medium active:text-gray-800 transition-colors mb-8 pl-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inicio
        </button>

        {importError && (
          <div
            id="import-error"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl relative mb-6 flex items-start gap-3 shadow-sm"
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
          <h1 className="text-2xl font-bold mb-6 text-brand-text">Respaldo de Datos</h1>

          <div className="bg-[#EFF6FF] text-[#1D4ED8] p-5 rounded-xl flex items-start gap-3 mb-8">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-sm leading-relaxed">
              <strong>Privacidad total:</strong> UTP Flow es hiper-sencilla. No requiere cuentas ni
              contraseñas. Tus tareas se guardan directamente en tu navegador actual usando{' '}
              <em>IndexedDB (Dexie.js)</em>. Utiliza estas opciones para llevar tus datos a tu
              celular u otra PC.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExport}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center active:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <CloudDownload className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="font-bold text-brand-text mb-1 text-base">Exportar Tareas</h3>
              <p className="text-[13px] text-gray-500">
                Descarga un archivo JSON con tu progreso.
              </p>
            </button>

            <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center active:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <CloudUpload className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="font-bold text-brand-text mb-1 text-base">Importar Tareas</h3>
              <p className="text-[13px] text-gray-500">
                Sube tu archivo .json para restaurarlas.
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

