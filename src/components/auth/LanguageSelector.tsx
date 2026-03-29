'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface LanguageSelectorProps {
  currentLocale: string;
}

const LOCALES = [
  { code: 'vi', label: 'VN', flag: '/assets/auth/icons/flag-vn.svg' },
  { code: 'en', label: 'EN', flag: '/assets/auth/icons/flag-en.svg' },
];

export function LanguageSelector({ currentLocale }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations('languageSelector');

  const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  const selectLocale = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    setIsOpen(false);
    triggerRef.current?.focus();
    router.refresh();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('selectLanguage')}
        className={`flex items-center gap-1 px-4 py-4 rounded-sm transition-all ${isOpen ? 'bg-[rgba(255,234,158,0.1)]' : 'hover:bg-[rgba(255,234,158,0.1)]'}`}
        style={{ color: 'var(--Details-Text-Secondary-1)' }}
        onFocus={(e) => {
          (e.currentTarget as HTMLButtonElement).style.outline = 'var(--focus-ring)';
          (e.currentTarget as HTMLButtonElement).style.outlineOffset = 'var(--focus-ring-offset)';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLButtonElement).style.outline = 'none';
        }}
      >
        <div className="w-6 h-6 flex items-center justify-center">
          <Image src={current.flag} alt={current.label} width={20} height={15} unoptimized />
        </div>
        <span className="text-base font-medium leading-6 text-white tracking-[0.15px]">{current.label}</span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform${isOpen ? ' rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M7 10L12 15L17 10H7Z" fill="white" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={t('options')}
          className="absolute right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border"
          style={{
            width: '110px',
            backgroundColor: 'var(--Details-Container)',
            borderColor: 'var(--Details-Border)',
          }}
        >
          {LOCALES.map((locale, index) => {
            const isSelected = locale.code === currentLocale;
            return (
              <li key={locale.code}>
                {index > 0 && (
                  <div style={{ height: '1px', backgroundColor: 'var(--Details-Divider)' }} />
                )}
                <button
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectLocale(locale.code)}
                  className="flex items-center gap-2 w-full px-3 transition-colors duration-100"
                  style={{
                    height: '56px',
                    backgroundColor: isSelected
                      ? 'var(--Details-Dropdown-List-Selected)'
                      : 'transparent',
                    color: isSelected
                      ? 'var(--Details-Text-Primary-1)'
                      : 'var(--Details-Text-Secondary-1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'var(--Details-Dropdown-List-Hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Image src={locale.flag} alt={t(locale.code as 'vi' | 'en')} width={20} height={15} unoptimized />
                  <span className="text-base font-medium leading-6 tracking-[0.15px]">{locale.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
