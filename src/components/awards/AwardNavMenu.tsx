'use client';

import { useEffect, useRef, useState } from 'react';
import type { Award } from '@/lib/awards-data';

const SaaIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M12 0C10.42414 0 8.86371 0.310389 7.40781 0.913446C5.95191 1.5165 4.62903 2.40042 3.51472 3.51472C1.26429 5.76515 0 8.80541 0 12C0 15.1946 1.26429 18.2349 3.51472 20.4853C4.62903 21.5996 5.95191 22.4835 7.40781 23.0866C8.86371 23.6896 10.42414 24 12 24C15.1946 24 18.2349 22.7357 20.4853 20.4853C22.7357 18.2349 24 15.1946 24 12C24 10.608 23.748 9.228 23.268 7.932L21.348 9.852C21.516 10.56 21.6 11.28 21.6 12C21.6 14.546 20.5886 16.9879 18.7883 18.7883C16.9879 20.5886 14.546 21.6 12 21.6C9.45392 21.6 7.01213 20.5886 5.21178 18.7883C3.41143 16.9879 2.4 14.546 2.4 12C2.4 9.45392 3.41143 7.01213 5.21178 5.21178C7.01213 3.41143 9.45392 2.4 12 2.4C12.72 2.4 13.44 2.484 14.148 2.652L16.08 0.72C14.772 0.252 13.392 0 12 0ZM20.4 0L15.6 4.8V6.6L12.54 9.66C12.36 9.6 12.18 9.6 12 9.6C11.3635 9.6 10.753 9.85285 10.3029 10.3029C9.85285 10.753 9.6 11.3635 9.6 12C9.6 12.6365 9.85285 13.247 10.3029 13.697C10.753 14.1471 11.3635 14.4 12 14.4C12.6365 14.4 13.247 14.1471 13.697 13.697C14.1471 13.247 14.4 12.6365 14.4 12C14.4 11.82 14.4 11.64 14.34 11.46L17.4 8.4H19.2L24 3.6H20.4V0ZM12 4.8C10.0904 4.8 8.25909 5.55857 6.90883 6.90883C5.55857 8.25909 4.8 10.0904 4.8 12C4.8 13.9096 5.55857 15.7409 6.90883 17.0911C8.25909 18.4414 10.0904 19.2 12 19.2C13.9096 19.2 15.7409 18.4414 17.0911 17.0911C18.4414 15.7409 19.2 13.9096 19.2 12H16.8C16.8 13.2731 16.2943 14.4939 15.3941 15.3941C14.4939 16.2943 13.2731 16.8 12 16.8C10.7269 16.8 9.50606 16.2943 8.60589 15.3941C7.70571 14.4939 7.2 13.2731 7.2 12C7.2 10.7269 7.70571 9.50606 8.60589 8.60589C9.50606 7.70571 10.7269 7.2 12 7.2V4.8Z"
      fill="currentColor"
    />
  </svg>
);

interface AwardNavMenuProps {
  awards: Award[];
}

export default function AwardNavMenu({ awards }: AwardNavMenuProps) {
  const [activeSlug, setActiveSlug] = useState<string>(awards[0]?.slug ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const valid = awards.find((a) => a.slug === hash);
    if (valid) setActiveSlug(valid.slug);
  }, [awards]);

  useEffect(() => {
    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSlug(entry.target.id);
        }
      },
      { rootMargin: '-80px 0px -55% 0px', threshold: 0 },
    );
    awards.forEach(({ slug }) => {
      const el = document.getElementById(slug);
      if (el) observer.observe(el);
    });
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [awards]);

  return (
    <div id="sidebar" className="w-full hidden xl:block md:w-43">
      <nav id="sidebar__inner" className="flex flex-col gap-4 w-full md:w-43" aria-label="Awards navigation">
        <div
          className="flex flex-col"
          style={{ position: 'sticky', top: 'calc(var(--header-height, 80px) + 24px)' }}
        >
          {awards.map(({ slug, navLabel }) => {
            const isActive = activeSlug === slug;
            return (
              <a
                key={slug}
                href={`#${slug}`}
                className={`flex items-center w-full gap-1 px-4 py-4 text-left cursor-pointer group hover:text-[#FAE287] hover:text-shadow-[0_0_6px_#FAE287] transition-all border-b ${
                  isActive
                    ? 'text-[#FAE287] border-[#FAE287] text-shadow-[0_0_6px_#FAE287]'
                    : 'text-(--Details-Text-Secondary-1) border-transparent'
                }`}
              >
                <div className="flex items-center gap-1">
                  <SaaIcon
                    className={`group-hover:drop-shadow-[0_0_6px_#FAE287] transition-all${
                      isActive ? ' drop-shadow-[0_0_6px_#FAE287]' : ''
                    }`}
                  />
                  <p className="whitespace-pre-line text-[14px] font-normal leading-5 tracking-[0.25px] text-inherit">
                    {navLabel}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
