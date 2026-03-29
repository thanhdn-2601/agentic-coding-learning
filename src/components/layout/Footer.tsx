'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations('header');
  const tFooter = useTranslations('footer');

  const NAV_LINKS = [
    { label: t('nav.intro'), href: '/' },
    { label: t('nav.awards'), href: '/awards' },
    { label: t('nav.kudos'), href: '/kudos' },
    { label: t('nav.communityStandards'), href: '/community-standards' },
  ];

  return (
    <footer className="border-t border-[#2E3940] py-6 xl:py-10">
      <div className="w-full mx-auto px-3 sm:px-6 md:px-8 xl:px-6 flex justify-between items-center max-w-7xl">
        <div className="flex items-center justify-between lg:gap-12 xl:gap-20">
          <Link href="/" aria-label="Go to homepage" className="focus:outline-none flex items-center">
            <div className="inline-block cursor-pointer hover:opacity-90 transition-opacity">
              <Image
                src="/assets/auth/logos/sun-annual-awards-logo.png"
                alt="Sun Annual Awards 2025"
                width={69}
                height={64}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </Link>

          <nav className="items-center gap-2 lg:gap-8 shrink-0 hidden xl:flex" aria-label="footer navigation">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={
                    isActive
                      ? 'inline-flex items-center justify-center px-3 sm:px-4 h-full transition-[background-color,color] duration-200 hover:bg-(--Details-SecondaryButton-Normal,#FFEA9E1A) hover:rounded-tl-sm hover:rounded-tr-sm hover:rounded-br-none hover:rounded-bl-none text-(--Details-Text-Primary-1) border-b border-(--Details-Text-Primary-1) py-4'
                      : 'inline-flex items-center justify-center px-3 sm:px-4 h-full transition-[background-color,color] duration-200 hover:bg-(--Details-SecondaryButton-Normal,#FFEA9E1A) hover:rounded-sm text-(--Details-Text-Secondary-1) border-b border-transparent py-4'
                  }
                >
                  {isActive ? (
                    <p
                      className="font-medium text-inherit tracking-[0.15px] text-sm"
                      style={{ textShadow: 'rgb(250, 226, 135) 0px 0px 6px' }}
                    >
                      {label}
                    </p>
                  ) : (
                    <p className="text-base leading-6 font-medium text-inherit tracking-[0.15px]">
                      {label}
                    </p>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <p className="font-medium text-white text-sm sm:text-base">{tFooter('copyright')}</p>
      </div>
    </footer>
  );
}
