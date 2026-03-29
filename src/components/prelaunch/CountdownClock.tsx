'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTimeRemaining, type TimeRemaining } from '@/lib/countdown';

interface CountdownClockProps {
  targetISO: string;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, '0');
  const digits = padded.split('');

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Two separate digit cells */}
      <div className="flex gap-2">
        {digits.map((digit, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 'clamp(48px, 9vw, 88px)',
              height: 'clamp(64px, 12vw, 120px)',
              backgroundColor: 'var(--BG-Update)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              fontSize: 'clamp(36px, 7vw, 80px)',
              fontWeight: 700,
              fontFamily: 'var(--font-montserrat)',
              color: 'var(--Details-Text-Primary-1)',
              lineHeight: 1,
            }}
          >
            {digit}
          </div>
        ))}
      </div>

      {/* Label */}
      <span
        className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em]"
        style={{ color: 'var(--Details-Text-Secondary-1)' }}
      >
        {label}
      </span>
    </div>
  );
}

export default function CountdownClock({ targetISO }: CountdownClockProps) {
  const router = useRouter();
  const [time, setTime] = useState<TimeRemaining>(() => getTimeRemaining(targetISO));

  useEffect(() => {
    if (time.isOver) {
      router.push('/');
      return;
    }

    const id = setInterval(() => {
      const next = getTimeRemaining(targetISO);
      setTime(next);
      if (next.isOver) {
        clearInterval(id);
        router.push('/');
      }
    }, 60_000);

    return () => clearInterval(id);
  }, [targetISO, router, time.isOver]);

  return (
    <div
      className="flex items-start gap-4 md:gap-8"
      role="timer"
      aria-live="polite"
      aria-label="Time remaining until event"
    >
      <CountdownBlock value={time.days} label="DAYS" />

      {/* Separator */}
      <span
        className="text-4xl md:text-6xl font-bold leading-none mt-3 md:mt-6"
        style={{ color: 'var(--Details-Text-Primary-1)' }}
        aria-hidden="true"
      >
        :
      </span>

      <CountdownBlock value={time.hours} label="HOURS" />

      {/* Separator */}
      <span
        className="text-4xl md:text-6xl font-bold leading-none mt-3 md:mt-6"
        style={{ color: 'var(--Details-Text-Primary-1)' }}
        aria-hidden="true"
      >
        :
      </span>

      <CountdownBlock value={time.minutes} label="MINUTES" />
    </div>
  );
}
