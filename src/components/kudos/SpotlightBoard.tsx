'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface SpotlightNode {
  profile_id: string;
  name: string;
  count: number;
  latest_kudos_id: string;
}

interface RecentEvent {
  id: string;
  receiver_id: string;
  receiver_name: string;
  created_at: string;
}

// Deterministic pseudo-random float in [min, max] seeded by n
function seededRand(n: number, salt: number, min: number, max: number): number {
  const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return min + (x - Math.floor(x)) * (max - min);
}

// Format created_at as "02:25PM"
function formatEventTime(isoStr: string): string {
  const d = new Date(isoStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}${ampm}`;
}

export default function SpotlightBoard() {
  const router = useRouter();
  const t = useTranslations('kudos.spotlight');
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<SpotlightNode[]>([]);
  const [totalKudos, setTotalKudos] = useState(0);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [search, setSearch] = useState('');
  const [containerSize, setContainerSize] = useState({ w: 340, h: 280 });

  const fetchSpotlight = useCallback(async () => {
    try {
      const res = await fetch('/api/kudos/spotlight');
      if (!res.ok) return;
      const data = (await res.json()) as { nodes: SpotlightNode[]; total: number };
      setNodes(data.nodes ?? []);
      setTotalKudos(data.total ?? 0);
    } catch {
      // silently fail
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/kudos/recent');
      if (!res.ok) return;
      const data = (await res.json()) as { events: RecentEvent[] };
      setRecentEvents(data.events ?? []);
    } catch {
      // silently fail
    }
  }, []);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchSpotlight();
    fetchRecent();
    const id = setInterval(() => { fetchSpotlight(); fetchRecent(); }, 30_000);
    return () => clearInterval(id);
  }, [fetchSpotlight, fetchRecent]);

  // Track container size for positioning
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: Math.max(200, width), h: Math.max(150, height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const lowerSearch = search.toLowerCase().trim();

  return (
    <div className="flex flex-col gap-4">
      {/* B.6 — Section header: divider + large title */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="w-full h-px" style={{ backgroundColor: 'var(--Details-Divider)' }} />
        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.563rem] font-normal leading-8 sm:leading-9 md:leading-12 lg:leading-16 tracking-[-0.25px]"
          style={{ color: 'var(--Details-Text-Primary-1)' }}
        >
          SPOTLIGHT BOARD
        </h2>
      </div>

      {/* Board card */}
      <div
        className="flex flex-col gap-4 rounded-xl p-6 border"
        style={{ backgroundColor: 'var(--Details-Container)', borderColor: 'var(--Details-Divider)' }}
      >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-bold" style={{ color: 'var(--Details-Text-Secondary-1)' }}>
            {t('title')}
          </h3>
          <p className="text-xs" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
            {t('total')}{' '}
            <span style={{ color: 'var(--Details-Text-Primary-1)', fontWeight: 700 }}>
              {totalKudos}
            </span>
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value.slice(0, 100))}
          placeholder={t('search')}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none"
          style={{
            borderColor: 'var(--Details-Border)',
            backgroundColor: 'var(--Details-Container-2)',
            color: 'var(--Details-Text-Secondary-1)',
            width: '160px',
          }}
        />
      </div>

      {/* Floating names area */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg"
        style={{
          height: '280px',
          backgroundColor: 'var(--Details-Container-2)',
          border: '1px solid var(--Details-Divider)',
        }}
      >
        {nodes.length > 0 ? (
          <div className="absolute inset-0 z-10">
            {nodes.map((node, i) => {
              const isMatch = lowerSearch !== '' && node.name.toLowerCase().includes(lowerSearch);
              const isDimmed = lowerSearch !== '' && !isMatch;

              const padX = 10;
              const padY = 10;
              const left = seededRand(i, 1, padX, containerSize.w - padX - 80);
              const top = seededRand(i, 2, padY, containerSize.h - padY - 18);

              const animDelay = seededRand(i, 3, 0, 4);
              const animDuration = seededRand(i, 4, 12, 24);

              return (
                <div key={node.profile_id} className="relative inline-block">
                  <span
                    tabIndex={0}
                    role="link"
                    title={t('viewProfile', { name: node.name })}
                    className="animate-float absolute whitespace-nowrap select-none pointer-events-auto transition-colors duration-200 cursor-pointer focus:outline-none"
                    style={{
                      left,
                      top,
                      fontSize: '9px',
                      opacity: isDimmed ? 0.2 : 1,
                      animationDelay: `${animDelay}s`,
                      animationDuration: `${animDuration}s`,
                      color: isMatch
                        ? 'var(--Details-Text-Primary-1)'
                        : 'rgba(255,255,255,0.75)',
                      fontWeight: isMatch ? 700 : 400,
                      fontFamily: 'Montserrat, sans-serif',
                      letterSpacing: '0.02em',
                    }}
                    onClick={() => router.push(`/profile/${node.profile_id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/profile/${node.profile_id}`);
                      }
                    }}
                  >
                    {node.name}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p
            className="text-sm text-center py-10"
            style={{ color: 'var(--Details-Text-Secondary-2)' }}
          >
            {t('noData')}
          </p>
        )}
      </div>

      {/* Live activity ticker */}
      {recentEvents.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <div
            className="flex flex-col gap-1 overflow-y-auto"
            style={{ maxHeight: '140px' }}
          >
            {recentEvents.map((ev) => (
              <p
                key={ev.id}
                className="font-(family-name:--font-montserrat) text-sm font-bold leading-5 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push(`/profile/${ev.receiver_id}`)}
              >
                <span className="text-gold">{formatEventTime(ev.created_at)}</span>{' '}
                <span className="text-white">{ev.receiver_name}</span>{' '}
                <span className="text-white/60">{t('received')}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
