'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { createClient } from '@/libs/supabase/client';

export function LoginButton() {
  const t = useTranslations('login');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // If redirect fails, reset loading state
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      aria-label="Login with Google"
      aria-busy={isLoading}
      className="flex items-center justify-center gap-2 min-w-74.25 h-15 px-6 py-4 rounded-lg font-sans font-normal transition-all duration-150"
      style={{
        backgroundColor: isLoading ? 'rgba(255, 234, 158, 0.5)' : 'var(--Details-Text-Primary-1)',
        color: 'var(--Details-Text-Primary-2)',
        fontSize: '22px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--Details-PrimaryButton-Hover)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--Details-Text-Primary-1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
        }
      }}
      onMouseDown={(e) => {
        if (!isLoading) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 234, 158, 0.8)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!isLoading) {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLButtonElement).style.outline = 'var(--focus-ring)';
        (e.currentTarget as HTMLButtonElement).style.outlineOffset = 'var(--focus-ring-offset)';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLButtonElement).style.outline = 'none';
      }}
    >
      {isLoading ? (
        <>
          <span>{t('loading')}</span>
          <svg
            className="animate-spin"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </>
      ) : (
        <>
          <span>{t('button')}</span>
          <Image
            src="/assets/auth/icons/google-icon.svg"
            alt=""
            width={24}
            height={24}
            aria-hidden="true"
          />
        </>
      )}
    </button>
  );
}
