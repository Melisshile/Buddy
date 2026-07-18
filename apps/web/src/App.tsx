import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginScreen } from './features/LoginScreen';
import { VoiceSession } from './features/VoiceSession';
import { Dashboard } from './features/Dashboard';
import { DeveloperModePanel, type DevMetrics } from './features/DeveloperModePanel';
import { initAnalytics, initAppCheck, isFirebaseConfigured } from './lib/firebase';

function Boot() {
  const { profile, loading, demoMode, user } = useAuth();
  const [view, setView] = useState<'dashboard' | 'session'>('dashboard');
  const [seedPrompt, setSeedPrompt] = useState<string | undefined>();
  const [devMetrics, setDevMetrics] = useState<DevMetrics | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    initAppCheck();
    void initAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-buddy-mesh flex items-center justify-center">
        <p className="font-display text-2xl text-white animate-pulse">Buddy</p>
      </div>
    );
  }

  if (!profile && !user && !demoMode) {
    return <LoginScreen />;
  }

  if (!profile) {
    return <LoginScreen />;
  }

  return (
    <>
      {view === 'session' ? (
        <VoiceSession
          seedPrompt={seedPrompt}
          onMetrics={setDevMetrics}
          onBack={() => {
            setSeedPrompt(undefined);
            setView('dashboard');
          }}
        />
      ) : (
        <Dashboard
          onOpenSession={(seed) => {
            setSeedPrompt(seed);
            setView('session');
          }}
        />
      )}
      <DeveloperModePanel metrics={devMetrics} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Boot />
    </AuthProvider>
  );
}
