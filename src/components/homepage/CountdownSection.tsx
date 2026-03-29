'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTimeRemaining, type TimeRemaining } from '@/lib/countdown';

interface CountdownSectionProps {
  eventDatetime?: string;
}

function CountdownTile({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, '0');
  const digits = padded.split('');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1.5">
        {digits.map((digit, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-md"
            style={{
              width: 'clamp(36px, 5vw, 56px)',
              height: 'clamp(48px, 7vw, 72px)',
              backgroundColor: 'var(--BG-Update)',
              fontSize: 'clamp(24px, 4vw, 44px)',
              fontWeight: 700,
              color: 'var(--Details-Text-Primary-1)',
              lineHeight: 1,
            }}
          >
            {digit}
          </div>
        ))}
      </div>
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: 'var(--Details-Text-Secondary-2)' }}
      >
        {label}
      </span>
    </div>
  );
}

export default function CountdownSection({ eventDatetime }: CountdownSectionProps) {
  const [time, setTime] = useState<TimeRemaining>(() =>
    getTimeRemaining(eventDatetime),
  );
  const t = useTranslations('homepage.countdown');

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getTimeRemaining(eventDatetime));
    }, 60_000);
    return () => clearInterval(id);
  }, [eventDatetime]);

  // Not configured — show placeholder dashes
  if (!time.isConfigured) {
    return (
      <div className="flex items-start gap-3 md:gap-4" role="timer" aria-label="Countdown not configured">
        {(['DAYS', 'HOURS', 'MINUTES'] as const).map((label, i) => (
          <>
            {i > 0 && (
              <span className="text-2xl font-bold mt-2" style={{ color: 'var(--Details-Text-Primary-1)' }} aria-hidden="true">:</span>
            )}
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="flex gap-1.5">
                {['—', '—'].map((dash, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-center rounded-md"
                    style={{
                      width: 'clamp(36px, 5vw, 56px)',
                      height: 'clamp(48px, 7vw, 72px)',
                      backgroundColor: 'var(--BG-Update)',
                      fontSize: 'clamp(24px, 4vw, 44px)',
                      fontWeight: 700,
                      color: 'var(--Details-Text-Primary-1)',
                      lineHeight: 1,
                    }}
                  >
                    {dash}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
                {label}
              </span>
            </div>
          </>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-6">
      {/* "Comming soon" label — hidden when isOver */}
      {!time.isOver && (
        <p
          className="text-sm font-medium uppercase tracking-[0.2em]"
          style={{ color: 'var(--Details-Text-Secondary-2)' }}
        >
          {t('comingSoon')}
        </p>
      )}

      {/* Clock */}
      <div
        className="flex items-start gap-3 md:gap-4"
        role="timer"
        aria-live="polite"
        aria-label="Time remaining"
      >
        <CountdownTile value={time.days} label="DAYS" />
        <span
          className="text-2xl font-bold mt-2"
          style={{ color: 'var(--Details-Text-Primary-1)' }}
          aria-hidden="true"
        >
          :
        </span>
        <CountdownTile value={time.hours} label="HOURS" />
        <span
          className="text-2xl font-bold mt-2"
          style={{ color: 'var(--Details-Text-Primary-1)' }}
          aria-hidden="true"
        >
          :
        </span>
        <CountdownTile value={time.minutes} label="MINUTES" />
      </div>

      {/* Event info */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm" style={{ color: 'var(--Details-Text-Secondary-1)' }}>
          <span style={{ color: 'var(--Details-Text-Secondary-2)' }}>{t('time')}</span>{' '}
          18h30
        </p>
        <p className="text-sm" style={{ color: 'var(--Details-Text-Secondary-1)' }}>
          <span style={{ color: 'var(--Details-Text-Secondary-2)' }}>{t('location')}</span>{' '}
          {t('locationValue')}
        </p>
        <p className="text-sm" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
          {t('broadcast')}
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-4 mt-2">
        <Link
          href="/awards"
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-150"
          style={{
            backgroundColor: 'var(--Details-Text-Primary-1)',
            color: 'var(--Details-Text-Primary-2)',
          }}
          onMouseEnter={() => {}}
        >
          ABOUT AWARDS
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <Link
          href="/kudos"
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border transition-all duration-150 hover:bg-[rgba(255,234,158,0.1)]"
          style={{
            borderColor: 'var(--Details-Text-Primary-1)',
            color: 'var(--Details-Text-Primary-1)',
          }}
        >
          ABOUT KUDOS
        </Link>
      </div>
    </div>
  );
}
