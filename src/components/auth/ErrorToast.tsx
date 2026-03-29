'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function ErrorToast() {
  const t = useTranslations('login');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const error = searchParams.get('error');

  const dismiss = useCallback(() => {
    setVisible(false);
    // Remove ?error from URL without page reload
    router.replace(pathname);
  }, [router, pathname]);

  useEffect(() => {
    if (error === 'oauth_failed') {
      setVisible(true);

      const timer = setTimeout(() => {
        dismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, dismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 z-200 flex items-center gap-3 rounded-lg px-4 py-3"
      style={{
        transform: 'translateX(-50%)',
        minWidth: '320px',
        backgroundColor: 'var(--Details-Error)',
        color: '#ffffff',
        fontFamily: 'var(--font-montserrat)',
        fontWeight: 700,
      }}
    >
      <span className="flex-1 text-sm">{t('error_oauth_failed')}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss error"
        className="text-white text-lg leading-none hover:opacity-80 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}
