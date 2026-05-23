'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, User, ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useIdentity } from '@/context/IdentityContext';

export default function SettingsPage() {
  const router = useRouter();
  const { userName } = useIdentity();

  const sections = [
    { title: 'Language', value: 'En-US' },
    { title: 'Sensor Connection', value: 'Connected' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <div className="flex-1 px-4 mt-4">
        <div className="flex items-center gap-4 mb-6 pt-safe px-2">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center">
            <ArrowLeft size={20} color="white" />
          </button>
          <h1 className="text-white text-2xl font-black">Settings</h1>
        </div>

        {/* Account card */}
        <div className="w-full bg-[#0E5EAE] rounded-[24px] p-6 flex items-center mb-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mr-4">
            <User size={28} color="white" />
          </div>
          <div className="flex-1">
            <p className="text-white text-xl font-bold">Hello, {userName || 'User'}</p>
            <p className="text-white/70 text-sm font-medium">Account Settings</p>
          </div>
          <ChevronRight size={24} color="white" />
        </div>

        {sections.map((item, i) => (
          <div key={i} className="w-full bg-[#333] rounded-[20px] p-5 flex items-center mb-3">
            <div className="flex-1">
              <p className="text-white text-lg font-bold">{item.title}</p>
              <p className="text-zinc-400 text-sm font-medium">{item.value}</p>
            </div>
            <ChevronRight size={24} color="#A1A1AA" />
          </div>
        ))}
      </div>

      <BottomNav activeTab="home" />
    </div>
  );
}
