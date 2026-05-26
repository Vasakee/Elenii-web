'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mic, X, Square } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { apiClient } from '@/lib/api';

export default function NavigationPage() {
  const router = useRouter();
  const { state, startListening, stopListening, speak } = useVoice();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [address, setAddress] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const isListening = state === 'listening';

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  }, []);

  useEffect(() => {
    speak('Navigation mode active. I will scan for obstacles every three seconds.');

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsNavigating(true);

        loopRef.current = setInterval(async () => {
          const base64 = captureFrame();
          if (!base64) return;
          try {
            const res = await apiClient('/vision/navigate/base64', {
              method: 'POST',
              body: JSON.stringify({ imageBase64: base64 }),
            });
            const desc = res.data?.description || res.data?.text;
            if (desc) speak(desc);
          } catch {}
        }, 3000);
      })
      .catch(() => setCameraError(true));

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setIsNavigating(false);
    };
  }, [speak, captureFrame]);

  return (
    <div className="flex flex-col min-h-screen bg-black px-6">
      {/* Hidden camera */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="py-4 flex items-center justify-between pt-safe">
        <button
          onClick={() => router.back()}
          className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center"
        >
          <ArrowLeft size={24} color="white" />
        </button>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isNavigating ? 'bg-white/10 border-white/20' : 'bg-zinc-900 border-zinc-700'}`}>
          <div className={`w-2 h-2 rounded-full ${isNavigating ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-white text-xs font-bold">{isNavigating ? 'LIVE SCAN ON' : 'SCAN OFF'}</span>
        </div>
      </div>

      <div className="flex-1 mt-4">
        <h1 className="text-white text-3xl sm:text-4xl font-bold mb-8">Navigation</h1>

        {cameraError && (
          <p className="text-zinc-400 text-sm mb-4">Camera unavailable — vision scanning disabled.</p>
        )}

        <div className={`flex items-center bg-black rounded-2xl px-6 py-4 sm:py-6 border-2 ${address.length > 0 || isListening ? 'border-white' : 'border-zinc-800'}`}>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Say destination..."
            className="flex-1 bg-transparent text-white text-lg sm:text-xl font-bold outline-none placeholder-[#444]"
          />
          {address.length > 0 && (
            <button onClick={() => setAddress('')}><X size={24} color="white" /></button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center flex-1 mt-8 sm:mt-16">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 flex items-center justify-center ${isListening ? 'bg-red-600 border-white' : 'bg-black border-white'}`}
          >
            {isListening ? (
              <Square className="w-10 h-10 sm:w-12 sm:h-12" color="white" fill="white" />
            ) : (
              <Mic className="w-12 h-12 sm:w-16 sm:h-16" color="white" strokeWidth={3} />
            )}
          </button>
          <p className="text-white text-xs sm:text-sm font-black mt-8 sm:mt-10 uppercase tracking-[0.3em]">
            {isListening ? 'Listening...' : 'Tap for Voice Input'}
          </p>
        </div>
      </div>

      <div className="pb-10">
        <button
          disabled={address.length === 0}
          onClick={() => speak(`Calculating route to ${address}`)}
          className={`w-full py-6 rounded-2xl flex items-center justify-center border-2 ${address.length > 0 ? 'bg-white border-white' : 'bg-black border-zinc-800'}`}
        >
          <span className={`font-black text-xl ${address.length > 0 ? 'text-black' : 'text-zinc-700'}`}>START ROUTE</span>
        </button>
      </div>
    </div>
  );
}
