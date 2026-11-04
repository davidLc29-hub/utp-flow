import React from 'react';
import { BookOpen, Briefcase } from 'lucide-react';
import { useBimodal } from '../context/BimodalContext';

/**
 * Selector superior bimodal para alternar entre los entornos "Universidad" y "Trabajo".
 */
export function BimodalToggle() {
  const { currentContext, switchContext } = useBimodal();
  const isUni = currentContext === 'uni';

  const activeUniClasses =
    'flex-1 text-center px-4 py-3 rounded-xl font-semibold text-sm transition-all text-white bg-brand-uni flex items-center justify-center gap-2 shadow-sm z-10 active:scale-95';
  const activeWorkClasses =
    'flex-1 text-center px-4 py-3 rounded-xl font-semibold text-sm transition-all text-white bg-brand-work flex items-center justify-center gap-2 shadow-sm z-10 active:scale-95';
  const inactiveClasses =
    'flex-1 text-center px-4 py-3 rounded-xl font-semibold text-sm transition-all text-gray-500 bg-transparent flex items-center justify-center gap-2 opacity-60 active:opacity-100 active:bg-gray-50 z-10 active:scale-95';

  return (
    <div className="flex justify-center mb-10">
      <div className="bg-white p-1.5 rounded-2xl shadow-sm flex items-center border border-gray-100 w-full max-w-[380px]">
        <button
          id="tab-uni"
          type="button"
          onClick={() => switchContext('uni')}
          className={isUni ? activeUniClasses : inactiveClasses}
        >
          <BookOpen className="w-4 h-4" />
          Universidad
        </button>
        <button
          id="tab-work"
          type="button"
          onClick={() => switchContext('work')}
          className={!isUni ? activeWorkClasses : inactiveClasses}
        >
          <Briefcase className="w-4 h-4" />
          Trabajo
        </button>
      </div>
    </div>
  );
}

