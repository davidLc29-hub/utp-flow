import React, { useState } from 'react';
import { BimodalProvider, useBimodal } from './context/BimodalContext';
import { useTasks } from './hooks/useTasks';
import { useHorarios } from './hooks/useHorarios';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

function AppContent() {
  const { currentContext, showToast } = useBimodal();
  const [currentView, setCurrentView] = useState('dashboard');

  const {
    allTasks,
    contextTasks,
    pendingCount,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    replaceAllTasks,
  } = useTasks({
    currentContext,
    onNotify: showToast,
  });

  const { checkConflict } = useHorarios();

  return (
    <MainLayout
      showHeader={currentView === 'dashboard'}
      onOpenSettings={() => setCurrentView('settings')}
    >
      {currentView === 'dashboard' ? (
        <Dashboard
          allTasks={allTasks}
          contextTasks={contextTasks}
          pendingCount={pendingCount}
          onCreateTask={createTask}
          onUpdateTask={updateTask}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          checkConflict={checkConflict}
        />
      ) : (
        <Settings
          allTasks={allTasks}
          onReplaceAllTasks={replaceAllTasks}
          onBack={() => setCurrentView('dashboard')}
        />
      )}
    </MainLayout>
  );
}

export default function App() {
  return (
    <BimodalProvider>
      <AppContent />
    </BimodalProvider>
  );
}

