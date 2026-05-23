'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Mic } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { VoiceInteractionOverlay } from '@/components/VoiceInteractionOverlay';
import { LiveBadge } from '@/components/StatusIndicator';
import { apiClient } from '@/lib/api';

interface RadioStation {
  stationName: string;
  streamUrl: string;
  tags?: string;
}

export default function RadioPage() {
  const router = useRouter();
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    apiClient('/radio-stations')
      .then(res => {
        const data: RadioStation[] = res.data || res || [];
        setStations(data);
        if (data.length > 0) speak(`Found ${data.length} stations. Swipe to browse.`);
      })
      .catch(() => speak('Stations unavailable.'))
      .finally(() => setIsLoading(false));

    return () => { audioRef.current?.pause(); };
  }, []);

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  const playStation = (station: RadioStation) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const audio = new Audio(station.streamUrl);
    audio.play().then(() => setIsPlaying(true)).catch(() => { speak('Station unavailable.'); setIsPlaying(false); });
    audioRef.current = audio;
  };

  const stopPlayback = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  };

  const navigate = (dir: 'next' | 'prev') => {
    if (!stations.length) return;
    const next = dir === 'next'
      ? (currentIndex + 1) % stations.length
      : (currentIndex - 1 + stations.length) % stations.length;
    setCurrentIndex(next);
    speak(`${stations[next].stationName}`);
    if (isPlaying) playStation(stations[next]);
  };

  const current = stations[currentIndex];
  const freq = current?.stationName.match(/\d+\.\d+/)?.[0] || '99.3';

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="flex-1 px-8 pt-4">
        <div className="flex justify-between items-center mb-6 pt-safe">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center">
            <ArrowLeft size={20} color="white" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 mt-4 uppercase tracking-widest text-xs font-bold">Loading Stations...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Radio card */}
            <div className="w-full rounded-[48px] p-8 relative overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #2C3E50, #1A1A1A)', aspectRatio: '4/5' }}>
              <div className="absolute top-8 right-8"><LiveBadge /></div>
              <div className="flex flex-col items-center mt-6">
                <div className="w-24 h-24 rounded-full border-2 border-[#0E5EAE] flex items-center justify-center bg-[#0E5EAE]/10">
                  <Mic size={32} color="white" />
                </div>
              </div>
              <div className="flex flex-col items-center justify-end mt-auto pt-16">
                <p className="text-white text-[80px] font-black tracking-tight leading-none">{freq}</p>
                <p className="text-zinc-500 text-xl font-bold tracking-[0.25em] uppercase mt-2">FM RADIO</p>
              </div>
            </div>

            {/* Station info */}
            <div className="flex flex-col items-center mt-12">
              <p className="text-white text-3xl font-black mb-1 text-center truncate w-full">{current?.stationName || 'Talk Nigeria'}</p>
              <p className="text-[#0E5EAE] text-base font-bold text-center">{current?.tags || 'Talk - News - Sports'}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-12 px-2">
              <button onClick={() => navigate('prev')} className="w-16 h-16 rounded-full bg-[#262626] flex items-center justify-center">
                <ChevronLeft size={32} color="white" />
              </button>
              <div className="flex-1 h-1 bg-[#262626] mx-8 rounded-full overflow-hidden">
                <div style={{ width: `${((currentIndex + 1) / (stations.length || 1)) * 100}%` }} className="h-full bg-[#0E5EAE]" />
              </div>
              <button onClick={() => navigate('next')} className="w-16 h-16 rounded-full bg-[#262626] flex items-center justify-center">
                <ChevronRight size={32} color="white" />
              </button>
            </div>

            <div className="flex justify-center mt-6 mb-4">
              <button
                onClick={isPlaying ? stopPlayback : () => current && playStation(current)}
                className={`px-8 py-3 rounded-full font-bold ${isPlaying ? 'bg-red-600 text-white' : 'bg-[#0E5EAE] text-white'}`}
              >
                {isPlaying ? 'Stop' : 'Play'}
              </button>
            </div>

            <p className="text-zinc-500 text-sm font-bold text-center mb-6 opacity-80">Say "Next Station"</p>
          </div>
        )}
      </div>

      <BottomNav activeTab="radio" />
      <VoiceInteractionOverlay />
    </div>
  );
}
