'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photos?: { value: string }[];
}

interface IdentityContextType {
  userName: string | null;
  userId: string | null;
  userProfile: UserProfile | null;
  sessionId: string | null;
  onboardingComplete: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  saveNameFromAudio: (blob: Blob) => Promise<void>;
  resetOnboarding: () => void;
  setIsProcessing: (v: boolean) => void;
  setUserProfile: (p: UserProfile) => void;
  setOnboardingComplete: (v: boolean) => void;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const hydratedRef = useRef(false);

  const createSession = useCallback(async (uid: string) => {
    try {
      const res = await apiClient('/conversational-ai/sessions', { method: 'POST', body: JSON.stringify({ userId: uid }) });
      setSessionId(res.data?.sessionId || null);
      return res.data?.sessionId as string | null;
    } catch { return null; }
  }, []);

  const hydrate = useCallback(async () => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    setIsLoading(true);
    try {
      const res = await apiClient('/auth/profile');
      const profile: UserProfile = res.data;
      if (profile?.id) {
        setUserProfile(profile);
        setUserName(profile.displayName?.split(' ')[0] || null);
        setUserId(profile.id);
        const hasOnboarded = localStorage.getItem('has_onboarded') === 'true';
        setOnboardingComplete(hasOnboarded);
        await createSession(profile.id);
      }
    } catch (e: any) {
      if (!e?.unauthorized) console.error('[Identity] hydrate error', e);
      // Try local cache
      try {
        const cached = localStorage.getItem('user_profile');
        if (cached) {
          const p = JSON.parse(cached) as UserProfile;
          setUserProfile(p);
          setUserName(p.displayName?.split(' ')[0] || null);
          setUserId(p.id);
          setOnboardingComplete(localStorage.getItem('has_onboarded') === 'true');
        }
      } catch {}
    } finally {
      setIsLoading(false);
      setIsHydrated(true);
    }
  }, [createSession]);

  // Handle OAuth callback: ?user=<encoded JSON> in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam)) as UserProfile;
        setUserProfile(userData);
        setUserName(userData.displayName?.split(' ')[0] || null);
        setUserId(userData.id);
        localStorage.setItem('user_profile', JSON.stringify(userData));
        // Auto-complete onboarding — no need to collect name via voice
        localStorage.setItem('has_onboarded', 'true');
        setOnboardingComplete(true);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        setIsHydrated(true);
        setIsLoading(false);
        hydratedRef.current = true;
      } catch {}
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    localStorage.setItem('has_onboarded', 'true');
    setOnboardingComplete(true);
    await apiClient('/audio-processing/always-listen', { method: 'POST', body: JSON.stringify({ enabled: true, sessionId }) }).catch(() => {});
  }, [sessionId]);

  const saveNameFromAudio = useCallback(async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'voice.webm');
      const res = await apiClient(`/onboard/name?nameType=firstName`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', ...(userId ? { 'x-user-id': userId } : {}) },
        body: formData,
      });
      if (res?.success && res?.data?.firstName) {
        const updated = { ...userProfile, ...res.data } as UserProfile;
        setUserProfile(updated);
        setUserName(res.data.firstName);
        localStorage.setItem('user_profile', JSON.stringify(updated));
        await completeOnboarding();
      } else {
        throw new Error('NAME_EMPTY');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [userId, userProfile, completeOnboarding]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('has_onboarded');
    localStorage.removeItem('user_profile');
    setOnboardingComplete(false);
    setUserProfile(null);
    setUserName(null);
    setUserId(null);
    setSessionId(null);
    hydratedRef.current = false;
  }, []);

  return (
    <IdentityContext.Provider value={{
      userName, userId, userProfile, sessionId, onboardingComplete,
      isHydrated, isLoading, isProcessing,
      hydrate, completeOnboarding, saveNameFromAudio, resetOnboarding,
      setIsProcessing, setUserProfile, setOnboardingComplete,
    }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider');
  return ctx;
}
