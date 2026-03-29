'use client';

import { useState } from 'react';
import type { KudosFeedItem } from '@/types/database';
import KudoHighlightCard from './KudoHighlightCard';

interface HighlightCarouselProps {
  highlights: KudosFeedItem[];
  currentUserId?: string;
  onFilterChange?: (filter: { hashtag?: string; department?: string }) => void;
}

export default function HighlightCarousel({ highlights, currentUserId, onFilterChange }: HighlightCarouselProps) {
  const [current, setCurrent] = useState(0);
  const total = highlights.length;

  if (total === 0) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
        Hiện tại chưa có Kudos nào.
      </p>
    );
  }

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(total - 1, c + 1));

  return (
    <div className="flex flex-col gap-4">
      {/* Cards */}
      <div className="flex items-center gap-4">
        {/* Prev button */}
        <button
          onClick={prev}
          disabled={current === 0}
          aria-label="Previous"
          className="relative z-10 p-2 rounded-full border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,234,158,0.1)] shrink-0"
          style={{ borderColor: 'var(--Details-Border)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Carousel track */}
        <div className="flex gap-4 overflow-hidden flex-1 justify-center">
          {highlights.map((kudos, idx) => {
            const distance = Math.abs(idx - current);
            if (distance > 1) return null;
            return (
              <KudoHighlightCard
                key={kudos.id}
                kudos={kudos}
                isActive={idx === current}
                currentUserId={currentUserId}
                onFilterChange={onFilterChange}
              />
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={next}
          disabled={current === total - 1}
          aria-label="Next"
          className="relative z-10 p-2 rounded-full border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,234,158,0.1)] shrink-0"
          style={{ borderColor: 'var(--Details-Border)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 5L13 10L8 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Pagination counter */}
      <p className="text-xs text-center" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
        {current + 1}/{total}
      </p>
    </div>
  );
}
