import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  initializeDatabase,
  userRepository,
  DEFAULT_LOCAL_USER_ID,
  generateUUID,
} from '../db/database';

const USER_SESSION_STORAGE_KEY = 'utp_flow_user_id';

const AuthContext = createContext(null);

function extractInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'UF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const appUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) ||
    process.env.APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      await initializeDatabase();
      const savedUserId = localStorage.getItem(USER_SESSION_STORAGE_KEY);
      if (savedUserId) {
        const existingUser = await userRepository.getById(savedUserId);
        if (mounted && existingUser) {
          setCurrentUser(existingUser);
          setIsLoadingAuth(false);
          return;
        }
      }
      if (mounted) {
        setIsLoadingAuth(false);
      }
    }

    loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  const loginWithGoogle = useCallback(async (emailInput = '', displayNameInput = '') => {
    await initializeDatabase();
    const cleanEmail = String(emailInput || 'estudiante.utp@gmail.com')
      .toLowerCase()
      .trim();

    if (!cleanEmail.includes('@')) {
      throw new Error('Ingresa un correo de Google válido.');
    }

    let user = await userRepository.getByEmail(cleanEmail);
    if (!user) {
      const fallbackName =
        displayNameInput.trim() ||
        cleanEmail
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

      user = await userRepository.save({
        id: generateUUID('google'),
        nombre: fallbackName,
        email: cleanEmail,
        provider: 'google',
        avatar: extractInitials(fallbackName),
        fecha_creacion: new Date().toISOString(),
      });
    }

    localStorage.setItem(USER_SESSION_STORAGE_KEY, user.id);
    setCurrentUser(user);
    return user;
  }, []);

  const loginWithMicrosoftUTP = useCallback(async (utpEmailInput = '', displayNameInput = '') => {
    await initializeDatabase();
    const cleanEmail = String(utpEmailInput || '')
      .toLowerCase()
      .trim();

    const utpRegex = /^[a-z0-9._-]+@utp\.edu\.pe$/i;
    if (!utpRegex.test(cleanEmail)) {
      throw new Error(
        'Ingresa un correo institucional válido con dominio @utp.edu.pe (ej. U20310331@utp.edu.pe).'
      );
    }

    let user = await userRepository.getByEmail(cleanEmail);
    if (!user) {
      const codeUpper = cleanEmail.split('@')[0].toUpperCase();
      const fullName = displayNameInput.trim() || `Estudiante ${codeUpper}`;
      user = await userRepository.save({
        id: generateUUID('ms_utp'),
        nombre: fullName,
        email: cleanEmail,
        provider: 'microsoft',
        avatar: extractInitials(fullName),
        fecha_creacion: new Date().toISOString(),
      });
    }

    localStorage.setItem(USER_SESSION_STORAGE_KEY, user.id);
    setCurrentUser(user);
    return user;
  }, []);

  const continueAsGuest = useCallback(async () => {
    await initializeDatabase();
    let localUser = await userRepository.getById(DEFAULT_LOCAL_USER_ID);
    if (!localUser) {
      localUser = await userRepository.save({
        id: DEFAULT_LOCAL_USER_ID,
        nombre: 'Modo Local (Sin cuenta)',
        email: 'local@utpflow.app',
        provider: 'local',
        avatar: 'ML',
        fecha_creacion: new Date().toISOString(),
      });
    }
    localStorage.setItem(USER_SESSION_STORAGE_KEY, localUser.id);
    setCurrentUser(localUser);
    return localUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_SESSION_STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isLoadingAuth,
      appUrl,
      loginWithGoogle,
      loginWithMicrosoftUTP,
      continueAsGuest,
      logout,
    }),
    [
      currentUser,
      isLoadingAuth,
      appUrl,
      loginWithGoogle,
      loginWithMicrosoftUTP,
      continueAsGuest,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return ctx;
}

