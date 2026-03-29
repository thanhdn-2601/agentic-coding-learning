'use client';

import { useEffect, useState } from 'react';
import type { KudosFeedItem } from '@/types/database';
import HighlightCarousel from './HighlightCarousel';
import { useTranslations } from 'next-intl';

interface Department { id: string; name: string; }
interface HashtagItem { id: string; name: string; }

interface HighlightSectionProps {
  initialHighlights: KudosFeedItem[];
  hashtag: string;
  department: string;
  onHashtagChange: (value: string) => void;
  onDeptChange: (value: string) => void;
  currentUserId?: string;
}

export default function HighlightSection({ initialHighlights, hashtag, department, onHashtagChange, onDeptChange, currentUserId }: HighlightSectionProps) {
  const [hashtags, setHashtags] = useState<HashtagItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [highlights, setHighlights] = useState<KudosFeedItem[]>(initialHighlights);
  const [hashOpen, setHashOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const t = useTranslations('kudos.highlight');

  // Load filter data
  useEffect(() => {
    Promise.all([
      fetch('/api/hashtags').then((r) => r.json()).catch(() => ({ hashtags: [] })),
      fetch('/api/departments').then((r) => r.json()).catch(() => ({ departments: [] })),
    ]).then(([h, d]) => {
      const hd = h as { hashtags: HashtagItem[] };
      const dd = d as { departments: Department[] };
      setHashtags(hd.hashtags ?? []);
      setDepartments(dd.departments ?? []);
    });
  }, []);



  // Re-fetch highlights when filter props change
  useEffect(() => {
    const params = new URLSearchParams();
    if (hashtag) params.set('hashtag', hashtag);
    if (department) params.set('department', department);

    fetch(`/api/kudos/highlight?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const data = d as { kudos: KudosFeedItem[] };
        setHighlights(data.kudos ?? []);
      })
      .catch(() => {});
  }, [hashtag, department]);

  return (
    <section className="flex flex-col gap-6">
      {/* B.1 — Section header row: title + filters */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2 lg:gap-2 relative w-full">
        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.563rem] font-normal leading-8 sm:leading-9 md:leading-12 lg:leading-16 xl:leading-16 tracking-[-0.25px] shrink-0"
          style={{ color: 'var(--Details-Text-Primary-1)' }}
        >
          {t('title')}
        </h2>

        {/* Filter buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 relative w-full sm:w-auto">
          {/* Hashtag filter */}
          <div className="relative">
            <button
              onClick={() => { setHashOpen((v) => !v); setDeptOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-sm border text-sm transition-all"
              style={hashtag ? {
                borderColor: '#FFEA9E',
                backgroundColor: 'rgba(255,234,158,0.15)',
                color: '#FFEA9E',
                boxShadow: '0 0 12px rgba(255,234,158,0.4)',
              } : {
                borderColor: '#FFEA9E',
                backgroundColor: 'transparent',
                color: '#CCCCCC',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {hashtag || t('hashtag')}
            </button>

            {hashOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setHashOpen(false)} />
                <ul
                  className="absolute left-0 z-20 mt-1 rounded-lg border overflow-y-auto max-h-48 min-w-40"
                  style={{ backgroundColor: 'var(--Details-Container)', borderColor: 'var(--Details-Border)' }}
                >
                  <li>
                    <button
                      onClick={() => { onHashtagChange(''); setHashOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[rgba(255,234,158,0.08)]"
                      style={{ color: 'var(--Details-Text-Secondary-1)' }}
                    >
                      {t('all')}
                    </button>
                  </li>
                  {hashtags.map((h) => (
                    <li key={h.id}>
                      <button
                        onClick={() => { onHashtagChange(h.name); setHashOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[rgba(255,234,158,0.08)]"
                        style={{ color: hashtag === h.name ? '#FFEA9E' : 'var(--Details-Text-Secondary-1)' }}
                      >
                        {h.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Department filter */}
          <div className="relative">
            <button
              onClick={() => { setDeptOpen((v) => !v); setHashOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-sm border text-sm transition-all"
              style={department ? {
                borderColor: '#FFEA9E',
                backgroundColor: 'rgba(255,234,158,0.15)',
                color: '#FFEA9E',
                boxShadow: '0 0 12px rgba(255,234,158,0.4)',
              } : {
                borderColor: '#FFEA9E',
                backgroundColor: 'transparent',
                color: '#CCCCCC',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {departments.find((d) => d.id === department)?.name || t('department')}
            </button>

            {deptOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDeptOpen(false)} />
                <ul
                  className="absolute left-0 z-20 mt-1 rounded-lg border overflow-y-auto max-h-48 min-w-40"
                  style={{ backgroundColor: 'var(--Details-Container)', borderColor: 'var(--Details-Border)' }}
                >
                  <li>
                    <button
                      onClick={() => { onDeptChange(''); setDeptOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[rgba(255,234,158,0.08)]"
                      style={{ color: 'var(--Details-Text-Secondary-1)' }}
                    >
                      {t('all')}
                    </button>
                  </li>
                  {departments.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => { onDeptChange(d.id); setDeptOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[rgba(255,234,158,0.08)]"
                        style={{ color: department === d.id ? '#FFEA9E' : 'var(--Details-Text-Secondary-1)' }}
                      >
                        {d.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Clear filters */}
          {(hashtag || department) && (
            <button
              onClick={() => { onHashtagChange(''); onDeptChange(''); }}
              className="text-xs px-3 py-2 rounded-sm border transition-all"
              style={{
                borderColor: '#FFEA9E',
                color: '#FFEA9E',
                backgroundColor: 'rgba(255,234,158,0.12)',
              }}
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Carousel */}
      <HighlightCarousel
        highlights={highlights}
        currentUserId={currentUserId}
        onFilterChange={(f) => {
          if (f.hashtag !== undefined) onHashtagChange(f.hashtag);
        }}
      />
    </section>
  );
}
