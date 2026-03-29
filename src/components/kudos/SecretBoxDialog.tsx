'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface SecretBox {
  id: string;
  gift_title: string | null;
  gift_value: string | null;
  gift_image_url: string | null;
}

interface SecretBoxDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpened: () => void;
}

export default function SecretBoxDialog({ isOpen, onClose, onOpened }: SecretBoxDialogProps) {
  const [box, setBox] = useState<SecretBox | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('kudos.secretBox');

  useEffect(() => {
    if (!isOpen) {
      setBox(null);
      setRevealing(false);
      setRevealed(false);
      setError('');
      return;
    }

    setLoading(true);
    fetch('/api/me/secret-box')
      .then((r) => r.json())
      .then((data) => {
        const d = data as { secret_box: SecretBox | null; error?: string };
        if (d.error || !d.secret_box) {
          setError(t('noBoxError'));
        } else {
          setBox(d.secret_box);
        }
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  }, [isOpen, t]);

  const handleReveal = async () => {
    if (!box) return;
    setRevealing(true);
    try {
      const res = await fetch(`/api/me/secret-box/${box.id}/open`, { method: 'POST' });
      if (!res.ok) throw new Error('open failed');
      // Brief pause for the animation effect
      setTimeout(() => {
        setRevealing(false);
        setRevealed(true);
        onOpened();
      }, 700);
    } catch {
      setRevealing(false);
      setError(t('openFailed'));
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-6"
        style={{
          backgroundColor: 'var(--Details-Container)',
          border: '1px solid var(--Details-Border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors hover:bg-[rgba(255,255,255,0.08)]"
          style={{ color: 'var(--Details-Text-Secondary-2)' }}
          onClick={onClose}
          aria-label={t('close')}
        >
          ✕
        </button>

        <h2
          className="text-xl font-bold tracking-wide"
          style={{ color: 'var(--Details-Text-Primary-1)' }}
        >
          🎁 Secret Box
        </h2>

        {/* Loading state */}
        {loading && (
          <div className="py-8 text-sm" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
            {t('loading')}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-sm text-red-400 text-center py-4">{error}</div>
        )}

        {/* Pre-reveal state */}
        {box && !revealed && !loading && !error && (
          <>
            <div
              className={`text-7xl select-none transition-all duration-500 ${
                revealing ? 'scale-125 rotate-12' : 'hover:scale-105 cursor-pointer'
              }`}
              onClick={!revealing ? handleReveal : undefined}
            >
              🎁
            </div>

            <p className="text-sm text-center" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
              {t('waitingText')}
              <br />
              {t('openPrompt')}
            </p>

            <button
              onClick={handleReveal}
              disabled={revealing}
              className="px-8 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--Details-Text-Primary-1)',
                color: 'var(--Details-Text-Primary-2)',
              }}
            >
              {revealing ? t('revealing') : t('openBtn')}
            </button>
          </>
        )}

        {/* Revealed state */}
        {revealed && box && (
          <>
            <div className="text-6xl" style={{ animation: 'bounce 1s ease infinite' }}>
              🎉
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <p
                className="font-bold text-lg"
                style={{ color: 'var(--Details-Text-Primary-1)' }}
              >
                {box.gift_title ?? t('mysteryGift')}
              </p>

              {box.gift_value && (
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--Details-Text-Primary-1)' }}
                >
                  {box.gift_value}
                </p>
              )}

              <p
                className="text-sm mt-1"
                style={{ color: 'var(--Details-Text-Secondary-2)' }}
              >
                {t('congrats')}
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: 'var(--Details-Text-Primary-1)',
                color: 'var(--Details-Text-Primary-2)',
              }}
            >
              {t('close')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
