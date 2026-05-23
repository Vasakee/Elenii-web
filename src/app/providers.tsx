'use client';
import { IdentityProvider } from '@/context/IdentityContext';
import { VoiceProvider } from '@/context/VoiceContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <IdentityProvider>
      <VoiceProvider>{children}</VoiceProvider>
    </IdentityProvider>
  );
}
