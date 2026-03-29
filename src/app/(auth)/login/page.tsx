import { createClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Suspense } from 'react';
import { LoginButton } from '@/components/auth/LoginButton';
import { LanguageSelector } from '@/components/auth/LanguageSelector';
import { ErrorToast } from '@/components/auth/ErrorToast';

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/');

  const locale = await getLocale();
  const t = await getTranslations('login');

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#00101a]">
      {/* ── Layer 0: Hero background artwork ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/login/images/key-visual-background.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-right"
          priority
        />
      </div>

      {/* ── Layer 1: Left gradient overlay ── */}
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,#00101A_0%,#00101A_25.41%,rgba(0,16,26,0)_100%)]" />

      {/* ── Layer 2: Bottom gradient overlay ── */}
      <div className="absolute bottom-0 left-0 right-0 z-[1] h-100 bg-[linear-gradient(0deg,#00101A_0%,rgba(0,19,32,0)_70%)]" />

      {/* ── Main layout wrapper ── */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* ── A: Header ── */}
        <header className="absolute top-0 left-0 right-0 z-20 bg-[rgba(11,15,18,0.8)]">
          <div className="w-full max-w-306 mx-auto px-3 sm:px-6 md:px-8 xl:px-0 flex items-center justify-between py-3">
            {/* A.1: Logo */}
            <Image
              src="/assets/saa/logos/saa-logo.png"
              alt="Sun Annual Awards 2025"
              width={52}
              height={48}
              priority
            />

            {/* A.2: Language Selector */}
            <LanguageSelector currentLocale={locale} />
          </div>
        </header>

        {/* ── B: Hero Content ── */}
        <main className="flex-1 flex flex-col justify-center">
          <div className="w-full max-w-306 mx-auto px-3 sm:px-6 md:px-8 xl:px-0 flex flex-col gap-10 2xl:gap-30">
            {/* B.1: ROOT FURTHER key visual */}
            <div className="relative flex items-center">
              <Image
                src="/assets/login/images/root-further.png"
                alt="ROOT FURTHER"
                width={451}
                height={200}
                priority
                className="h-full object-contain object-left max-h-30 sm:max-h-40 lg:max-h-[unset] w-auto lg:w-112.75"
              />
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-6">
                {/* B.2: Hero text */}
                <p className="text-white text-[20px] font-bold leading-10 tracking-[0.5px] sm:max-w-120">
                  {t.rich('hero_line1', {
                    b: (chunks) => <span className="font-bold">{chunks}</span>,
                  })}
                  <br />
                  {t('hero_line2')}
                </p>

                {/* B.3: Login button */}
                <div>
                  <LoginButton />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── D: Footer ── */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 w-full flex items-center justify-center py-6 border-t border-[#2e3940]">
        <p className="text-white text-base font-bold leading-6">
          {t('footer_copyright')}
        </p>
      </footer>

      {/* Error toast — fixed overlay, must be inside Suspense boundary */}
      <Suspense fallback={null}>
        <ErrorToast />
      </Suspense>
    </div>
  );
}
