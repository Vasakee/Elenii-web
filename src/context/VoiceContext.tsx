'use client';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useIdentity } from './IdentityContext';

type VoiceState = 'idle' | 'listening' | 'processing' | 'completed' | 'error';

interface VoiceContextType {
  state: VoiceState;
  audioMetering: number;
  errorMessage: string | null;
  transcript: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  speak: (text: string) => Promise<void>;
  resetAuth: () => void;
  isOnboarding: boolean;
  setIsOnboarding: (v: boolean) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { sessionId, saveNameFromAudio } = useIdentity();
  const [state, _setState] = useState<VoiceState>('idle');
  const [audioMetering, setAudioMetering] = useState(-160);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  const stateRef = useRef<VoiceState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isOnboardingRef = useRef(isOnboarding);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => { isOnboardingRef.current = isOnboarding; }, [isOnboarding]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const setState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    _setState(s);
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.0;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      window.speechSynthesis.speak(utt);
    });
  }, []);

  const stopSilenceDetection = useCallback(() => {
    if (silenceTimerRef.current) { clearInterval(silenceTimerRef.current); silenceTimerRef.current = null; }
  }, []);

  const stopListening = useCallback(async () => {
    if (stateRef.current !== 'listening') return;
    stopSilenceDetection();
    setState('processing');

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setState('idle');
      return;
    }

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    chunksRef.current = [];

    try {
      if (isOnboardingRef.current) {
        await saveNameFromAudio(blob);
        setState('completed');
      } else {
        const formData = new FormData();
        formData.append('audioFile', blob, 'recording.webm');
        const sId = sessionIdRef.current;
        const res = await apiClient('/speech-to-text/transcribe', {
          method: 'POST',
          headers: { 'Accept': 'application/json', ...(sId ? { 'X-Session-ID': sId } : {}) },
          body: formData,
        });
        const text = res.data?.text || res.data?.transcript || '';
        setTranscript(text);
        if (text && sId) {
          const aiRes = await apiClient(`/conversational-ai/sessions/${sId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ userMessage: text }),
          });
          const reply = aiRes.data?.response || aiRes.data?.reply || aiRes.data?.text || 'Done.';
          await speak(reply);
        }
        setState('completed');
        setTimeout(() => setState('idle'), 2000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing audio');
      setState('error');
    }
  }, [stopSilenceDetection, setState, saveNameFromAudio, speak]);

  const startListening = useCallback(async () => {
    if (stateRef.current !== 'idle' && stateRef.current !== 'error' && stateRef.current !== 'completed') return;
    setState('listening');
    setErrorMessage(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio metering
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);

      // Silence detection
      const silenceMs = isOnboardingRef.current ? 5000 : 2000;
      let silenceDuration = 0;
      const dataArr = new Uint8Array(analyser.frequencyBinCount);

      silenceTimerRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArr);
        const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
        // Convert to approximate dB (-160 to 0 range)
        const db = avg === 0 ? -160 : 20 * Math.log10(avg / 255);
        setAudioMetering(db);

        if (db < -45) {
          silenceDuration += 100;
        } else {
          silenceDuration = 0;
        }
        if (silenceDuration >= silenceMs) {
          stopListening();
        }
      }, 100);
    } catch (err: any) {
      setErrorMessage('Microphone access denied');
      setState('error');
    }
  }, [setState, stopListening]);

  const resetAuth = useCallback(() => {
    stopSilenceDetection();
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setState('idle');
    setErrorMessage(null);
  }, [setState, stopSilenceDetection]);

  return (
    <VoiceContext.Provider value={{
      state, audioMetering, errorMessage, transcript,
      startListening, stopListening, speak, resetAuth,
      isOnboarding, setIsOnboarding,
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
}
