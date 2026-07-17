import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginScreen } from './features/LoginScreen';
import { VoiceSession } from './features/VoiceSession';
import { initAnalytics, initAppCheck, isFirebaseConfigured } from './lib/firebase';
import { useEffect } from 'react';

function Boot() {
  const { profile, loading, demoMode, user } = useAuth();

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

  return <VoiceSession />;
}

export default function App() {
  return (
    <AuthProvider>
      <Boot />
    </AuthProvider>
  );
}
