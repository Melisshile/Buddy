import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginScreen } from './features/LoginScreen';
import { VoiceSession } from './features/VoiceSession';
import { Dashboard } from './features/Dashboard';
import { initAnalytics, initAppCheck, isFirebaseConfigured } from './lib/firebase';

function Boot() {
  const { profile, loading, demoMode, user } = useAuth();
  const [view, setView] = useState<'dashboard' | 'session'>('dashboard');
  const [seedPrompt, setSeedPrompt] = useState<string | undefined>();

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

  if (view === 'session') {
    return (
      <VoiceSession
        seedPrompt={seedPrompt}
        onBack={() => {
          setSeedPrompt(undefined);
          setView('dashboard');
        }}
      />
    );
  }

  return (
    <Dashboard
      onOpenSession={(seed) => {
        setSeedPrompt(seed);
        setView('session');
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Boot />
    </AuthProvider>
  );
}
