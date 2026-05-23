'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { VoiceInteractionOverlay } from '@/components/VoiceInteractionOverlay';
import { apiClient } from '@/lib/api';

interface Article {
  title: string;
  description?: string;
  url?: string;
  publishedAt?: string;
}

export default function NewsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient('/blog/news')
      .then(res => setArticles(res.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <div className="flex-1 px-6 pt-4 overflow-y-auto">
        <div className="flex items-center gap-4 mb-6 pt-safe">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center">
            <ArrowLeft size={20} color="white" />
          </button>
          <h1 className="text-white text-2xl font-black">News</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <p className="text-zinc-500 text-center py-20">No articles available.</p>
        ) : (
          <div className="flex flex-col gap-4 pb-4">
            {articles.map((a, i) => (
              <a
                key={i}
                href={a.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1A1A1A] rounded-2xl p-5 border border-zinc-800 block"
              >
                <h2 className="text-white font-bold text-base leading-snug">{a.title}</h2>
                {a.description && <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{a.description}</p>}
                {a.publishedAt && <p className="text-zinc-600 text-xs mt-2">{new Date(a.publishedAt).toLocaleDateString()}</p>}
              </a>
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="news" />
      <VoiceInteractionOverlay />
    </div>
  );
}
