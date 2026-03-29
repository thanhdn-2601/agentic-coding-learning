'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KudosFeedItem } from '@/types/database';
import KudoCard from './KudoCard';

interface AllKudosSectionProps {
  initialKudos: KudosFeedItem[];
  hashtag?: string;
  department?: string;
  currentUserId?: string;
  feedResetToken?: number;
  onFilterChange?: (filter: { hashtag?: string; department?: string }) => void;
}

export default function AllKudosSection({
  initialKudos,
  hashtag,
  department,
  currentUserId,
  feedResetToken = 0,
  onFilterChange,
}: AllKudosSectionProps) {
  const [kudos, setKudos] = useState<KudosFeedItem[]>(initialKudos);
  const [cursor, setCursor] = useState<string | null>(initialKudos.at(-1)?.created_at ?? null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialKudos.length === 20);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchMore = useCallback(async (reset = false) => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (!reset && cursor) params.set('cursor', cursor);
      if (hashtag)    params.set('hashtag', hashtag);
      if (department) params.set('department', department);

      const res = await fetch(`/api/kudos?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as { kudos: KudosFeedItem[] };
      const next = data.kudos;

      if (reset) {
        setKudos(next);
      } else {
        setKudos((prev) => [...prev, ...next]);
      }
      setCursor(next.at(-1)?.created_at ?? null);
      setHasMore(next.length === 20);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [cursor, hashtag, department]);

  // Attach IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loading && hasMore) fetchMore(); },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchMore, loading, hasMore]);

  // Re-fetch from scratch when filters change or send-success fires
  useEffect(() => {
    setCursor(null);
    setKudos([]);
    setHasMore(true);

    const params = new URLSearchParams({ limit: '20' });
    if (hashtag)    params.set('hashtag', hashtag);
    if (department) params.set('department', department);

    setLoading(true);
    setError(false);
    fetch(`/api/kudos?${params}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const next = (data as { kudos: KudosFeedItem[] }).kudos ?? [];
        setKudos(next);
        setCursor(next.at(-1)?.created_at ?? null);
        setHasMore(next.length === 20);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  // feedResetToken change (post-send) or filter change both trigger a full reset
  }, [hashtag, department, feedResetToken]);

  if (kudos.length === 0 && !loading) {
    return (
      <p className="text-sm text-center py-12" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
        Hiện tại chưa có Kudos nào.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {kudos.map((k) => (
        <KudoCard key={k.id} kudos={k} currentUserId={currentUserId} onFilterChange={onFilterChange} />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} />

      {loading && (
        <div className="flex justify-center py-4">
          <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <button
            onClick={() => fetchMore()}
            className="text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-[rgba(255,234,158,0.1)]"
            style={{ borderColor: 'var(--Details-Border)', color: 'var(--Details-Text-Secondary-1)' }}
          >
            Thử lại
          </button>
        </div>
      )}

      {!hasMore && kudos.length > 0 && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
          Đã xem tất cả Kudos.
        </p>
      )}
    </div>
  );
}
