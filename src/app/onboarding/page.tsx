'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Settings, LogIn } from 'lucide-react';
import { useIdentity } from '@/context/IdentityContext';
import { useVoice } from '@/context/VoiceContext';
import { ESP32Status } from '@/components/StatusIndicator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function OnboardingPage() {
  const router = useRouter();
  const { isHydrated, onboardingComplete, hydrate, userProfile, isProcessing } = useIdentity();
  const { state, errorMessage, startListening, stopListening, speak, resetAuth, setIsOnboarding } = useVoice();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (onboardingComplete) router.replace('/home');
  }, [onboardingComplete, router]);

  useEffect(() => {
    setIsOnboarding(true);
    speak('Welcome. Tap anywhere to sign in with Google.');
    return () => setIsOnboarding(false);
  }, [speak, setIsOnboarding]);

  const handleGoogleLogin = () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const redirectUrl = encodeURIComponent(window.location.origin + '/onboarding');
    window.location.href = `${API_URL}/auth/google?state=${redirectUrl}`;
  };

  const getStatusText = () => {
    if (isProcessing) return 'Finalizing Profile...';
    switch (state) {
      case 'idle': return 'Welcome';
      case 'listening': return "I'm Listening";
      case 'processing': return 'Thinking...';
      case 'completed': return 'Profile Created';
      case 'error': return 'Try Again';
      default: return 'Elenii Shepherd';
    }
  };

  const dots = [
    state === 'listening' || state === 'processing' || isProcessing || state === 'completed',
    isProcessing || state === 'completed',
    state === 'completed',
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] px-6" onClick={handleGoogleLogin}>
      {/* Header */}
      <div className="flex justify-between items-center py-4 mt-2">
        <div className="flex items-center gap-3">
          <RotateCcw size={20} color="#E4E4E7" strokeWidth={1.5} />
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-tight">Elenii</p>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-tight">Shepherd</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <ESP32Status online={true} />
          <Settings size={22} color="#FFFFFF" strokeWidth={1.5} />
        </div>
      </div>

      {/* Login button */}
      <div className="w-full z-10" onClick={e => e.stopPropagation()}>
        {(state === 'idle' || state === 'error') && !isProcessing && (
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white p-4 rounded-2xl mb-4 flex justify-center items-center gap-3"
          >
            <LogIn size={20} color="#000" />
            <span className="text-black font-bold text-base">Login with Google</span>
          </button>
        )}
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-white text-[32px] font-bold tracking-tight text-center">{getStatusText()}</h1>
        <div className="flex gap-2 mt-6">
          {dots.map((active, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full ${active ? 'bg-[#0E5EAE]' : 'bg-zinc-800'}`} />
          ))}
        </div>
        {isProcessing && (
          <div className="mt-8 flex items-center gap-3 bg-[#0E5EAE]/10 px-6 py-3 rounded-full border border-[#0E5EAE]/20">
            <div className="w-4 h-4 border-2 border-[#0E5EAE] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#0E5EAE] font-bold">Processing voice profile...</span>
          </div>
        )}
        {state === 'error' && !isProcessing && (
          <p className="text-zinc-400 text-sm mt-6 text-center max-w-[240px]">
            {errorMessage || 'Tap the microphone to try again.'}
          </p>
        )}
      </div>

      {/* Bottom mic area */}
      <div className="pb-20 flex flex-col items-center justify-center h-56" onClick={e => e.stopPropagation()}>
        {userProfile && (
          <button
            onClick={state === 'listening' ? stopListening : startListening}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-colors ${
              state === 'listening' ? 'bg-red-600 border-white' : 'bg-[#0E5EAE] border-[#0E5EAE]'
            } ${isProcessing ? 'opacity-50' : ''}`}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}
        {!userProfile && (
          <p className="text-zinc-500 text-sm text-center">Sign in with Google to continue</p>
        )}
      </div>
    </div>
  );
}
