import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const VARIANTS = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    Icon: CheckCircle2,
    iconClass: 'w-5 h-5 text-emerald-600',
  },
  error: {
    wrapper: 'border-rose-200 bg-rose-50 text-rose-900',
    Icon: AlertCircle,
    iconClass: 'w-5 h-5 text-rose-600',
  },
  info: {
    wrapper: 'border-slate-200 bg-white text-slate-900',
    Icon: Info,
    iconClass: 'w-5 h-5 text-slate-600',
  },
};

/**
 * Componente presentacional de notificación flotante superior (Toast).
 */
export function ToastNotification({ toast }) {
  if (!toast) return null;

  const variant = VARIANTS[toast.type] || VARIANTS.info;
  const IconComponent = variant.Icon;

  return (
    <div
      id="app-toast"
      className={`fixed top-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl px-4 py-3 shadow-lg border transition-all duration-300 opacity-100 translate-y-0 ${variant.wrapper}`}
    >
      <div className="flex items-start gap-3">
        <div id="app-toast-icon" className="mt-0.5 shrink-0">
          <IconComponent className={variant.iconClass} />
        </div>
        <p id="app-toast-message" className="text-sm font-medium leading-relaxed">
          {toast.message}
        </p>
      </div>
    </div>
  );
}

