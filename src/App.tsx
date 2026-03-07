import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { NavigationProvider } from './context/NavigationContext';
import { TicketProvider } from './context/TicketContext';
import LoginForm from './components/auth/LoginForm';
import ModuleSelection from './components/auth/ModuleSelection';
import LandingPage from './components/landing/LandingPage';
import DashboardPage from './components/dashboard/DashboardPage';
import DemoEnvironmentBanner from './components/common/DemoEnvironmentBanner';

const AppContent: React.FC = () => {
  const { isAuthenticated, isModuleSelected } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (!isModuleSelected) {
    return (
      <>
        <DemoEnvironmentBanner />
        <ModuleSelection />
      </>
    );
  }

  return (
    <>
      <DemoEnvironmentBanner />
      <DashboardPage />
    </>
  );
};

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    if (import.meta.env.DEV) {
      import('./lib/diagnostics').then(({ runDiagnostics, checkDatabaseConnection }) => {
        runDiagnostics();
        checkDatabaseConnection().then(result => {
          console.log('Database connection check:', result);
        });
      });
    }
  }, []);

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationProvider>
          <TicketProvider>
            <AppContent />
          </TicketProvider>
        </NavigationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
