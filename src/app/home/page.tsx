'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Settings, Search, Brain, Trash2 } from 'lucide-react';
import { useIdentity } from '@/context/IdentityContext';
import { useVoice } from '@/context/VoiceContext';
import { BottomNav } from '@/components/BottomNav';
import { CameraStatusChip } from '@/components/StatusIndicator';
import { VoiceInteractionOverlay } from '@/components/VoiceInteractionOverlay';

export default function HomePage() {
  const router = useRouter();
  const { isHydrated, onboardingComplete, hydrate, resetOnboarding } = useIdentity();
  const { state, audioMetering, resetAuth } = useVoice();
  const isListening = state === 'listening';

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && !onboardingComplete) router.replace('/onboarding'); }, [isHydrated, onboardingComplete, router]);
  useEffect(() => { resetAuth(); }, [resetAuth]);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Central dashboard */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#050505] flex flex-col items-center justify-center p-4">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-zinc-800 flex items-center justify-center mb-6">
            <Brain className="w-12 h-12 sm:w-16 sm:h-16" color="#0E5EAE" strokeWidth={1} />
          </div>
          <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-center">AI ANALYSES READY</h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-2">Connected to Elenii Cloud</p>
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 pt-safe pointer-events-auto">
            <div className="flex items-center gap-2">
              <RotateCcw size={20} color="white" />
              <div className="hidden xs:block">
                <p className="text-white text-[11px] font-bold tracking-widest uppercase leading-none">Elenii</p>
                <p className="text-white text-[11px] font-bold tracking-widest uppercase leading-none">Shepherd</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={resetOnboarding}>
                <Trash2 size={20} color="#EF4444" strokeWidth={1.5} />
              </button>
              <button onClick={() => router.push('/settings')}>
                <Settings size={22} color="white" />
              </button>
            </div>
          </div>

          <div className="flex-1 px-6 flex flex-col pointer-events-none">
            <div className="pointer-events-auto mt-2">
              <CameraStatusChip online={true} label="Phone Camera" />
            </div>
            <div className="flex-1" />
            <div className="flex items-end justify-between mb-8 pointer-events-auto">
              <div className="pb-4">
                <p className="text-white text-base sm:text-lg font-bold tracking-wide">Say "Scan ahead"</p>
                <p className="text-zinc-500 text-xs sm:text-sm mt-1">Ready for real-time guidance</p>
              </div>
              <button
                onClick={() => router.push('/navigation')}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white flex items-center justify-center bg-black transition-transform active:scale-95"
              >
                <Search className="w-8 h-8 sm:w-10 sm:h-10" color="white" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Waveform */}
      {isListening && (
        <div className="bg-[#18181B] flex items-center justify-center py-2">
          <div className="flex items-center gap-[3px]">
            {[3, 5, 8, 12, 10, 14, 12, 15, 12, 14, 10, 12, 8, 5, 3].map((h, i) => (
              <div
                key={i}
                style={{ height: Math.max(4, h * (1 + (audioMetering + 160) / 100)) }}
                className="w-1 bg-red-500 rounded-full"
              />
            ))}
          </div>
        </div>
      )}

      <BottomNav activeTab="home" />
      <VoiceInteractionOverlay />
    </div>
  );
}
