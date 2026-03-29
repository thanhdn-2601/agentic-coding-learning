'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface KudosHeroProps {
  onOpenSendDialog: () => void;
}

interface ProfileResult {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function KudosHero({ onOpenSendDialog }: KudosHeroProps) {
  const router = useRouter();
  const t = useTranslations('kudos.hero');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileResult[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Pre-load all profiles on mount for instant suggestions
  useEffect(() => {
    fetch('/api/profiles/search')
      .then((r) => r.json())
      .then((d) => setAllProfiles((d as { profiles?: ProfileResult[] }).profiles ?? []))
      .catch(() => {});
  }, []);

  // Debounced profile search
  useEffect(() => {
    if (!query.trim()) {
      setResults(allProfiles);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) return;
        const data = (await res.json()) as { profiles: ProfileResult[] };
        setResults(data.profiles ?? []);
        setDropdownOpen(true);
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, allProfiles]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectProfile = (id: string) => {
    setDropdownOpen(false);
    setQuery('');
    router.push(`/profile/${id}`);
  };

  return (
    <div className="relative h-96 sm:h-104 md:h-120 xl:h-128 bg-cover bg-no-repeat bg-top-right bg-[url('/assets/kudos/keyvisual.png')]">
      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 w-full h-full z-10">
        <div className="w-full max-w-306 mx-auto px-3 sm:px-6 md:px-8 xl:px-0 flex flex-col justify-between h-full gap-8 pt-20">

          {/* Title + KUDOS logo */}
          <div className="flex flex-col gap-2.5">
            <h1
              className="text-xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl font-normal leading-8 sm:leading-9 md:leading-10 lg:leading-11 xl:leading-11 tracking-[0px] mt-8 lg:mt-24"
              style={{ color: 'var(--Details-Text-Primary-1)' }}
            >
              {t('title')}
            </h1>
            <div className="flex items-center justify-start">
              <Image
                src="/assets/kudos/kudos-logo.png"
                alt="KUDOS"
                width={570}
                height={106}
                className="w-76 sm:w-md md:w-lg lg:w-xl h-auto object-contain"
                priority
              />
            </div>
          </div>

          {/* Action pills — grid: write (2 cols) + search (1 col) on large screens */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 items-center gap-3 sm:gap-4 lg:gap-4 mb-6 sm:mb-8 lg:mb-8">

            {/* A.1 — Write kudos */}
            <button
              onClick={onOpenSendDialog}
              className="col-span-1 lg:col-span-2 w-full flex items-center gap-3 sm:gap-4 lg:gap-4 px-3 sm:px-4 lg:px-4 py-2 sm:py-3 md:py-4 lg:py-6 rounded-[4.25rem] shrink-0 self-stretch transition-all hover:brightness-110 cursor-pointer border"
              style={{
                backgroundColor: 'var(--Details-SecondaryButton-Normal)',
                borderColor: 'var(--Details-Border)',
              }}
            >
              {/* Pen icon — fill white */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="w-5 sm:w-6 lg:w-6 h-5 sm:h-6 lg:h-6 shrink-0"
              >
                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="white" />
              </svg>
              <span className="text-sm sm:text-base lg:text-base font-medium leading-5 sm:leading-6 lg:leading-6 tracking-[0.15px] text-white flex-1 text-left">
                {t('writePlaceholder')}
              </span>
            </button>

            {/* A.2 — Search Sunner */}
            <div ref={searchRef} className="relative w-full col-span-1">
              <label htmlFor="kudos-user-search" className="w-full block">
                <div
                  className="flex items-center gap-2 py-2 sm:py-3 md:py-4 lg:py-6 px-3 sm:px-4 lg:px-4 rounded-[4.25rem] self-stretch border cursor-text"
                  style={{
                    backgroundColor: 'var(--Details-SecondaryButton-Normal)',
                    borderColor: 'var(--Details-Border)',
                  }}
                >
                  {/* Search icon */}
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M9.5 3C11.2239 3 12.8772 3.68482 14.0962 4.90381C15.3152 6.12279 16 7.77609 16 9.5C16 11.11 15.41 12.59 14.44 13.73L14.71 14H15.5L20.5 19L19 20.5L14 15.5V14.71L13.73 14.44C12.59 15.41 11.11 16 9.5 16C7.77609 16 6.12279 15.3152 4.90381 14.0962C3.68482 12.8772 3 11.2239 3 9.5C3 7.77609 3.68482 6.12279 4.90381 4.90381C6.12279 3.68482 7.77609 3 9.5 3ZM9.5 5C7 5 5 7 5 9.5C5 12 7 14 9.5 14C12 14 14 12 14 9.5C14 7 12 5 9.5 5Z" fill="currentColor" />
                  </svg>
                  <div className="flex-1 relative">
                    <input
                      id="kudos-user-search"
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setDropdownOpen(true)}
                      placeholder={t('searchPlaceholder')}
                      className="w-full bg-transparent text-white placeholder-white outline-none"
                      aria-autocomplete="list"
                      aria-controls="kudos-search-results"
                      style={{ fontFamily: 'Montserrat', fontSize: '16px', lineHeight: '24px' }}
                    />
                  </div>
                </div>
              </label>

              {/* Autocomplete dropdown */}
              {dropdownOpen && results.length > 0 && (
                <ul
                  id="kudos-search-results"
                  className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border overflow-hidden z-50"
                  style={{
                    backgroundColor: 'var(--Details-Container)',
                    borderColor: 'var(--Details-Border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  role="listbox"
                >
                  {results.slice(0, 8).map((p) => (
                    <li key={p.id} role="option" aria-selected={false}>
                      <button
                        type="button"
                        onClick={() => handleSelectProfile(p.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[rgba(255,234,158,0.08)]"
                        style={{ color: 'var(--Details-Text-Secondary-1)' }}
                      >
                        {p.avatar_url ? (
                          <Image
                            src={p.avatar_url}
                            alt=""
                            width={24}
                            height={24}
                            className="rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full shrink-0"
                            style={{ backgroundColor: 'var(--Details-Divider)' }}
                          />
                        )}
                        <span className="truncate">{p.full_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
