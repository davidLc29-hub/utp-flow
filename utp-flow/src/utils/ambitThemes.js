/**
 * Diccionario estático de temas por ámbito (AMBIT_THEMES).
 * Cumple la regla técnica crítica de Tailwind CSS JIT: todas las clases están completas y estáticas
 * para evitar el purgado en compilación de producción.
 */
export const AMBIT_THEMES = {
  rose: {
    key: 'rose',
    bgPrimary: 'bg-rose-700',
    bgHover: 'hover:bg-rose-800',
    textPrimary: 'text-rose-700',
    borderLeft: 'border-l-rose-700',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    ringFocus: 'focus:ring-rose-500',
    borderFocus: 'focus:border-rose-700',
    borderSoft: 'border-rose-200',
    shadowFab: 'shadow-[0_15px_40px_-10px_rgba(190,18,60,0.5)]',
    accentHex: '#be123c',
  },
  slate: {
    key: 'slate',
    bgPrimary: 'bg-slate-700',
    bgHover: 'hover:bg-slate-800',
    textPrimary: 'text-slate-700',
    borderLeft: 'border-l-slate-700',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    ringFocus: 'focus:ring-slate-500',
    borderFocus: 'focus:border-slate-700',
    borderSoft: 'border-slate-200',
    shadowFab: 'shadow-[0_15px_40px_-10px_rgba(51,65,85,0.5)]',
    accentHex: '#334155',
  },
  amber: {
    key: 'amber',
    bgPrimary: 'bg-amber-500',
    bgHover: 'hover:bg-amber-600',
    textPrimary: 'text-amber-600',
    borderLeft: 'border-l-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    ringFocus: 'focus:ring-amber-500',
    borderFocus: 'focus:border-amber-500',
    borderSoft: 'border-amber-200',
    shadowFab: 'shadow-[0_15px_40px_-10px_rgba(245,158,11,0.5)]',
    accentHex: '#f59e0b',
  },
  emerald: {
    key: 'emerald',
    bgPrimary: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-700',
    textPrimary: 'text-emerald-600',
    borderLeft: 'border-l-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    ringFocus: 'focus:ring-emerald-500',
    borderFocus: 'focus:border-emerald-600',
    borderSoft: 'border-emerald-200',
    shadowFab: 'shadow-[0_15px_40px_-10px_rgba(5,150,105,0.5)]',
    accentHex: '#059669',
  },
  violet: {
    key: 'violet',
    bgPrimary: 'bg-violet-600',
    bgHover: 'hover:bg-violet-700',
    textPrimary: 'text-violet-600',
    borderLeft: 'border-l-violet-600',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    ringFocus: 'focus:ring-violet-500',
    borderFocus: 'focus:border-violet-600',
    borderSoft: 'border-violet-200',
    shadowFab: 'shadow-[0_15px_40px_-10px_rgba(124,58,237,0.5)]',
    accentHex: '#7c3aed',
  },
};

export function getAmbitTheme(themeKey) {
  return AMBIT_THEMES[themeKey] || AMBIT_THEMES.rose;
}

