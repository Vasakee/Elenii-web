'use client';
import React from 'react';
import { useVoice } from '@/context/VoiceContext';

export function VoiceInteractionOverlay() {
  const { state, audioMetering } = useVoice();
  if (state !== 'listening' && state !== 'processing') return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-50">
      <div className="bg-[#18181B] rounded-full px-6 py-3 flex items-center gap-1">
        {state === 'listening' ? (
          [3, 5, 8, 12, 10, 14, 12, 15, 12, 14, 10, 12, 8, 5, 3].map((h, i) => (
            <div
              key={i}
              style={{ height: Math.max(4, h * (1 + (audioMetering + 160) / 100)) }}
              className="w-1 bg-red-500 rounded-full"
            />
          ))
        ) : (
          <span className="text-white text-xs font-bold">Processing...</span>
        )}
      </div>
    </div>
  );
}
