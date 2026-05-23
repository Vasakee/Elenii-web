'use client';
import React from 'react';

export function CameraStatusChip({ online, label }: { online: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 w-fit">
      <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-white text-xs font-bold">{label}</span>
    </div>
  );
}

export function ESP32Status({ online }: { online: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-zinc-600'}`} />
      <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">ESP32</span>
    </div>
  );
}

export function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-red-600 rounded-full px-2 py-1">
      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      <span className="text-white text-[10px] font-bold">LIVE</span>
    </div>
  );
}
