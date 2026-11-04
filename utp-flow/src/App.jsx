import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AmbitProvider, useAmbit } from './context/AmbitContext';
import { useTasks } from './hooks/useTasks';
import { useHorarios } from './hooks/useHorarios';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { ToastNotification } from './components/ToastNotification';

function AppContent() {
  const { currentUser, isLoadingAuth } = useAuth();
  const { currentAmbitId, toast, showToast } = useAmbit();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'settings' | 'history'

  const {
    allTasks,
    ambitTasks,
    archivedTasks,
    pendingCount,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    restoreArchivedTask,
    clearArchivedHistory,
    replaceAllTasks,
  } = useTasks({
    currentAmbitId,
    currentUserId: currentUser?.id,
    onNotify: showToast,
  });

  const {
    horarios,
    addHorario,
    bulkAddHorarios,
    removeHorario,
    replaceAllHorarios,
    checkConflict,
  } = useHorarios(currentUser?.id);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-rose-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <ToastNotification toast={toast} />
        <Login />
      </>
    );
  }

  return (
    <MainLayout
      showHeader={currentView === 'dashboard'}
      onOpenSettings={() => setCurrentView('settings')}
      onOpenHistory={() => setCurrentView('history')}
      archivedCount={archivedTasks.length}
    >
      {currentView === 'dashboard' && (
        <Dashboard
          ambitTasks={ambitTasks}
          pendingCount={pendingCount}
          onCreateTask={createTask}
          onUpdateTask={updateTask}
          onToggleTask={toggleTaskCompletion}
          onDeleteTask={deleteTask}
          checkConflict={checkConflict}
        />
      )}

      {currentView === 'history' && (
        <History
          onRestoreTask={restoreArchivedTask}
          onClearHistory={clearArchivedHistory}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'settings' && (
        <Settings
          allTasks={allTasks}
          horarios={horarios}
          onAddHorario={addHorario}
          onBulkAddHorarios={bulkAddHorarios}
          onRemoveHorario={removeHorario}
          onReplaceAllTasks={replaceAllTasks}
          onReplaceAllHorarios={replaceAllHorarios}
          onOpenHistory={() => setCurrentView('history')}
          onBack={() => setCurrentView('dashboard')}
        />
      )}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AmbitProvider>
        <AppContent />
      </AmbitProvider>
    </AuthProvider>
  );
}
