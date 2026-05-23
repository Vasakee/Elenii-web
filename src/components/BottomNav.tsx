'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Radio, Newspaper } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';

type Tab = 'radio' | 'home' | 'news';

export function BottomNav({ activeTab }: { activeTab: Tab }) {
  const router = useRouter();
  const { state, startListening, stopListening } = useVoice();
  const isListening = state === 'listening';

  return (
    <div className="bg-[#1A1A1A] pt-4 pb-8 border-t border-zinc-800">
      <div className="flex items-center justify-center gap-8">
        <button
          onClick={() => router.push('/radio')}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${activeTab === 'radio' ? 'bg-[#0E5EAE]' : 'bg-[#262626]'}`}
        >
          <Radio size={activeTab === 'radio' ? 28 : 24} color={activeTab === 'radio' ? 'white' : '#A1A1AA'} />
        </button>

        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-colors ${isListening ? 'bg-red-600 border-white' : 'bg-[#0E5EAE] border-[#0E5EAE]'}`}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        <button
          onClick={() => router.push('/news')}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${activeTab === 'news' ? 'bg-[#0E5EAE]' : 'bg-[#262626]'}`}
        >
          <Newspaper size={activeTab === 'news' ? 28 : 24} color={activeTab === 'news' ? 'white' : '#A1A1AA'} />
        </button>
      </div>
      <p className="text-zinc-500 text-[10px] font-bold text-center mt-4 tracking-widest uppercase">
        {isListening ? 'LISTENING...' : 'TAP MIC TO SPEAK'}
      </p>
    </div>
  );
}
