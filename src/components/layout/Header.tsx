'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/libs/supabase/client';
import type { UserRole } from '@/types/database';
import { LanguageSelector } from '@/components/auth/LanguageSelector';

interface HeaderProps {
  userRole?: UserRole;
}

export default function Header({ userRole = 'user' }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('header');

  const NAV_LINKS = [
    { label: t('nav.intro'), href: '/' },
    { label: t('nav.awards'), href: '/awards' },
    { label: t('nav.kudos'), href: '/kudos' },
  ];
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setAvatarUrl(session?.user?.user_metadata?.avatar_url ?? null);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-[background-color] duration-300 h-20 bg-[rgba(16,20,23,0.8)]">
      <div className="w-full max-w-306 mx-auto px-3 sm:px-6 md:px-8 xl:px-0 flex items-center justify-between h-20">
        {/* Left: Logo + Desktop Nav */}
        <div className="flex items-center gap-16">
          <Link href="/" aria-label="Go to homepage" className="focus:outline-none flex items-center">
            <div className="inline-block cursor-pointer hover:opacity-90 transition-opacity">
              <Image
                src="/assets/auth/logos/sun-annual-awards-logo.png"
                alt="Sun Annual Awards 2025"
                width={52}
                height={48}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-2 lg:gap-3 xl:gap-6 h-14" aria-label="desktop navigation">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={
                    isActive
                      ? 'inline-flex items-center justify-center px-3 sm:px-4 h-full transition-[background-color,color] duration-200 hover:bg-(--Details-SecondaryButton-Normal,#FFEA9E1A) hover:rounded-tl-sm hover:rounded-tr-sm hover:rounded-br-none hover:rounded-bl-none text-(--Details-Text-Primary-1) border-b border-(--Details-Text-Primary-1)'
                      : 'inline-flex items-center justify-center px-3 sm:px-4 h-full transition-[background-color,color] duration-200 hover:bg-(--Details-SecondaryButton-Normal,#FFEA9E1A) hover:rounded-sm text-(--Details-Text-Secondary-1) border-b border-transparent'
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

        {/* Right: Bell + Language + Avatar + Hamburger */}
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <div className="relative">
            <button
              className="relative p-2 hover:bg-[rgba(255,234,158,0.1)] transition-all rounded-sm group"
              aria-label="Notifications"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="group-hover:drop-shadow-[0_0_6px_#FAE287] text-white group-hover:text-[#FAE287]"
                aria-hidden="true"
              >
                <path
                  d="M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10 4.19 10 4.1 10 4C10 3.46957 10.2107 2.96086 10.5858 2.58579C10.9609 2.21071 11.4696 2 12 2C12.5304 2 13.0391 2.21071 13.4142 2.58579C13.7893 2.96086 14 3.46957 14 4C14 4.1 14 4.19 14 4.29C16.97 5.17 19 7.9 19 11V17L21 19ZM14 21C14 21.5304 13.7893 22.0391 13.4142 22.4142C13.0391 22.7893 12.5304 23 12 23C11.4696 23 10.9609 22.7893 10.5858 22.4142C10.2107 22.0391 10 21.5304 10 21"
                  fill="currentColor"
                />
              </svg>
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>

          {/* Language selector — desktop only */}
          <div className="hidden lg:flex">
            <LanguageSelector currentLocale={locale} />
          </div>

          {/* Avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => setAvatarMenuOpen((v) => !v)}
              aria-label="User profile"
              aria-haspopup="true"
              aria-expanded={avatarMenuOpen}
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[rgba(255,184,0,0.3)] hover:border-[rgba(255,184,0,0.6)] transition-all"
            >
              <Image
                src={avatarUrl ?? '/assets/profile/anonymous.png'}
                alt="User profile"
                fill
                unoptimized
                className="object-cover"
              />
            </button>

            {avatarMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAvatarMenuOpen(false)} aria-hidden="true" />
                <ul
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-45 rounded-lg overflow-hidden border py-1"
                  style={{ backgroundColor: 'var(--Details-Container)', borderColor: 'var(--Details-Border)' }}
                >
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={() => { setAvatarMenuOpen(false); router.push('/profile'); }}
                      className="w-full text-left px-4 py-3 text-sm transition-colors duration-100 hover:bg-[rgba(255,234,158,0.08)]"
                      style={{ color: 'var(--Details-Text-Secondary-1)' }}
                    >
                      Profile
                    </button>
                  </li>
                  {userRole === 'admin' && (
                    <li role="none">
                      <button
                        role="menuitem"
                        onClick={() => { setAvatarMenuOpen(false); router.push('/admin'); }}
                        className="w-full text-left px-4 py-3 text-sm transition-colors duration-100 hover:bg-[rgba(255,234,158,0.08)]"
                        style={{ color: 'var(--Details-Text-Primary-1)' }}
                      >
                        Admin Dashboard
                      </button>
                    </li>
                  )}
                  <li role="none">
                    <div style={{ height: '1px', backgroundColor: 'var(--Details-Divider)' }} />
                  </li>
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm transition-colors duration-100 hover:bg-[rgba(255,234,158,0.08)]"
                      style={{ color: 'var(--Details-Error)' }}
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden relative w-10 h-10 flex items-center justify-center hover:bg-(--Details-SecondaryButton-Normal,#FFEA9E1A) rounded-sm transition-all"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <div className="relative w-6 h-6">
              <div
                className={`absolute w-full h-0.5 bg-white rounded-full top-1/2 left-0 transition-all duration-300 origin-center ${
                  mobileMenuOpen ? 'rotate-45' : '-translate-y-2'
                }`}
              />
              <div
                className={`absolute w-full h-0.5 bg-white rounded-full top-1/2 left-0 transition-all duration-300 ${
                  mobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <div
                className={`absolute w-full h-0.5 bg-white rounded-full top-1/2 left-0 transition-all duration-300 origin-center ${
                  mobileMenuOpen ? '-rotate-45' : 'translate-y-2'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <nav
          className="lg:hidden absolute top-full left-0 right-0 border-b bg-[rgba(16,20,23,0.95)]"
          aria-label="Mobile navigation"
          style={{ borderColor: 'var(--Details-Divider)' }}
        >
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-6 py-4 text-sm font-medium border-b transition-colors duration-150"
                style={{
                  color: isActive ? 'var(--Details-Text-Primary-1)' : 'var(--Details-Text-Secondary-1)',
                  borderColor: 'var(--Details-Divider)',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
