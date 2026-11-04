import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAmbit } from '../context/AmbitContext';
import logoUrl from '../assets/logo.svg';

/**
 * Pantalla minimalista de Autenticación Progresiva (UTP Microsoft 365, Google OAuth y Modo Local).
 */
export function Login() {
  const { loginWithMicrosoftUTP, loginWithGoogle, continueAsGuest } = useAuth();
  const { showToast } = useAmbit();

  const [activeModal, setActiveModal] = useState(null); // 'microsoft' | 'google' | null
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openProviderModal = (provider) => {
    setErrorMsg('');
    if (provider === 'microsoft') {
      setEmailInput('U20310331@utp.edu.pe');
      setNameInput('Estudiante UTP');
    } else {
      setEmailInput('estudiante.utp@gmail.com');
      setNameInput('Estudiante UTP');
    }
    setActiveModal(provider);
  };

  const handleProviderSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (activeModal === 'microsoft') {
        const user = await loginWithMicrosoftUTP(emailInput, nameInput);
        showToast(`Bienvenido(a), ${user.nombre}`, 'success');
      } else if (activeModal === 'google') {
        const user = await loginWithGoogle(emailInput, nameInput);
        showToast(`Sesión iniciada con Google (${user.email})`, 'success');
      }
      setActiveModal(null);
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo iniciar sesión.');
    }
  };

  const handleGuestAccess = async () => {
    try {
      await continueAsGuest();
      showToast('Has ingresado en modo local sin cuenta.', 'info');
    } catch (err) {
      showToast(err.message || 'Error al iniciar en modo local.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10 text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-rose-700 flex items-center justify-center shadow-md">
          <img src={logoUrl} alt="UTP Flow logo" className="w-11 h-11 object-contain" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-brand-text tracking-tight">
          UTP Flow
        </h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Organiza tu universidad, trabajo y vida personal sin fricción y con respaldo inteligente.
        </p>

        <div className="mt-8 space-y-3.5">
          {/* Botón 1: Correo UTP (Microsoft 365) */}
          <button
            type="button"
            onClick={() => openProviderModal('microsoft')}
            className="w-full py-3.5 px-4 rounded-xl bg-rose-800 hover:bg-rose-900 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-3 shadow-sm transition-all"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            <span>Continuar con Correo UTP (Microsoft 365)</span>
          </button>

          {/* Botón 2: Continuar con Google */}
          <button
            type="button"
            onClick={() => openProviderModal('google')}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-gray-50 active:scale-[0.99] text-gray-700 font-semibold text-sm border border-gray-300 flex items-center justify-center gap-3 transition-all"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        <div className="mt-7 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleGuestAccess}
            className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-800 underline underline-offset-4 transition-colors"
          >
            Continuar en modo local sin cuenta
          </button>
        </div>
      </div>

      {/* Modal de simulación OAuth limpia */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-7 shadow-xl text-left">
            <h2 className="text-lg font-bold text-brand-text">
              {activeModal === 'microsoft'
                ? 'Acceso Institucional UTP (Microsoft 365)'
                : 'Iniciar sesión con Google'}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {activeModal === 'microsoft'
                ? 'Ingresa tu correo institucional @utp.edu.pe para vincular tu perfil local.'
                : 'Ingresa tu correo de Google para sincronizar tu perfil.'}
            </p>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleProviderSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre para mostrar
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ej. Ana Torres"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-rose-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {activeModal === 'microsoft' ? 'Correo institucional UTP' : 'Correo de Google'}
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={
                    activeModal === 'microsoft'
                      ? 'U20310331@utp.edu.pe'
                      : 'usuario@gmail.com'
                  }
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-rose-700"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold text-sm"
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
