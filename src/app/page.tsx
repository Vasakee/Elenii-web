'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIdentity } from '@/context/IdentityContext';

export default function RootPage() {
  const { isHydrated, onboardingComplete, hydrate } = useIdentity();
  const router = useRouter();

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    router.replace(onboardingComplete ? '/home' : '/onboarding');
  }, [isHydrated, onboardingComplete, router]);

  return (
    <div className="flex-1 bg-[#09090B] flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
