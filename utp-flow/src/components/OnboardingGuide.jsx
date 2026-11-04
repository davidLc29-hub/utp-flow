import React, { useState, useEffect } from 'react';
import { Lightbulb, X, ArrowLeft, ArrowRight } from 'lucide-react';

const REMINDER_ONBOARDING_KEY = 'utp_flow_reminder_onboarding_seen';
const REMINDER_ONBOARDING_STEP_KEY = 'utp_flow_reminder_onboarding_step';

const ONBOARDING_STEPS = [
  {
    title: '1: Añade una tarea',
    message: '¡Sabemos que hacer!',
    action: 'Siguiente',
  },
  {
    title: '2: Añade una fecha límite',
    message: 'Que no se te escape, colega',
    action: 'Siguiente',
  },
  {
    title: '3: Añade cuándo la harás',
    message: 'Metas fijas, sueños claros',
    action: 'Cerrar',
  },
];

/**
 * Componente de miniguía interactiva paso a paso y su botón flotante de reapertura.
 */
export function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(REMINDER_ONBOARDING_KEY) === '1';
    const storedStep = Number(localStorage.getItem(REMINDER_ONBOARDING_STEP_KEY));
    const initialStep =
      Number.isFinite(storedStep) && storedStep >= 0
        ? Math.min(storedStep, ONBOARDING_STEPS.length - 1)
        : 0;

    setStepIndex(initialStep);
    setIsOpen(!seen);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem(REMINDER_ONBOARDING_KEY, '1');
    localStorage.removeItem(REMINDER_ONBOARDING_STEP_KEY);
    setStepIndex(0);
  };

  const handleOpen = () => {
    const storedStep = Number(localStorage.getItem(REMINDER_ONBOARDING_STEP_KEY));
    const validStep =
      Number.isFinite(storedStep) && storedStep >= 0
        ? Math.min(storedStep, ONBOARDING_STEPS.length - 1)
        : 0;
    setStepIndex(validStep);
    setIsOpen(true);
  };

  const handleBack = () => {
    if (stepIndex <= 0) return;
    const next = stepIndex - 1;
    setStepIndex(next);
    localStorage.setItem(REMINDER_ONBOARDING_STEP_KEY, String(next));
  };

  const handleAdvance = () => {
    if (stepIndex >= ONBOARDING_STEPS.length - 1) {
      handleDismiss();
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    localStorage.setItem(REMINDER_ONBOARDING_STEP_KEY, String(next));
  };

  const currentStep = ONBOARDING_STEPS[stepIndex] || ONBOARDING_STEPS[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  return (
    <>
      {isOpen && (
        <div
          id="onboarding-reminders"
          className="fixed bottom-5 left-1/2 z-40 w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-[#24AD96]/20 bg-white/95 p-4 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.35)] backdrop-blur"
        >
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar recordatorios"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#24AD96] text-white shadow-sm">
              <Lightbulb className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1 text-sm text-gray-700">
              <div id="onboarding-step-content" className="space-y-1">
                <p className="leading-relaxed">
                  <strong className="font-semibold text-brand-text">{currentStep.title}</strong>
                  <br />
                  {currentStep.message}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  id="onboarding-step-back"
                  onClick={handleBack}
                  disabled={isFirst}
                  className={`inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 ${
                    isFirst ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>

                <span id="onboarding-step-indicator" className="text-xs font-medium text-gray-400">
                  {stepIndex + 1} / {ONBOARDING_STEPS.length}
                </span>

                <button
                  type="button"
                  id="onboarding-step-action"
                  onClick={handleAdvance}
                  className="inline-flex items-center gap-2 rounded-full bg-[#24AD96] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f9a87]"
                >
                  {isLast ? 'Cerrar' : 'Siguiente'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          id="onboarding-reminders-launcher"
          type="button"
          onClick={handleOpen}
          className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[#24AD96]/20 bg-[#24AD96] text-white shadow-[0_18px_50px_-18px_rgba(0,0,0,0.35)] transition-transform hover:scale-105 active:scale-95"
          aria-label="Abrir miniguía"
        >
          <Lightbulb className="w-5 h-5" />
        </button>
      )}
    </>
  );
}

