import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function SunKudosSection() {
  const t = await getTranslations('homepage.kudosSection');
  return (
    <section id="kudos" className="flex items-center justify-center pb-24 md:pb-16 xl:pb-38">
      <div className="w-full mx-auto px-3 sm:px-6 md:px-8 xl:px-0 flex flex-col items-center justify-center max-w-6xl gap-2.5">
        <div className="relative w-full overflow-hidden rounded-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 py-8 md:px-12 lg:py-11.5 lg:pl-29 lg:pr-16 bg-center bg-no-repeat bg-cover bg-[url(/assets/homepage/kudos-banner.png)] gap-8">
            {/* Left — text + CTA */}
            <div className="flex flex-col w-full md:flex-1 lg:max-w-114.25 min-w-0 gap-8">
              <div className="flex flex-col gap-4 z-3">
                <p className="font-normal text-[18px] md:text-[20px] leading-7 md:leading-8 text-white">
                  {t('tagline')}
                </p>
                <h2 className="text-3xl md:text-[48px] xl:text-[57px] leading-9 md:leading-14 xl:leading-16 tracking-[-0.25px] text-(--Details-Text-Primary-1)">
                  {t('title')}
                </h2>
                <p className="font-normal text-justify whitespace-pre-wrap text-base leading-6 md:leading-7 text-white">
                  {t('description')}
                </p>
              </div>
              <div>
                <Link href="/kudos" className="inline-block">
                  <div className="flex items-center gap-2 rounded px-4 py-3 bg-(--Details-Text-Primary-1) hover:brightness-110 transition-all">
                    <span className="text-base font-medium text-[#00101A]">{t('cta')}</span>
                    <Image
                      src="/assets/awards/icons/Arrow_Right.svg"
                      alt="Arrow Right"
                      width={24}
                      height={24}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </Link>
              </div>
            </div>

            {/* Right — Kudos logo */}
            <div className="hidden md:block shrink-0 ml-auto w-50 lg:w-75 xl:w-91">
              <div className="relative w-full" style={{ aspectRatio: '364 / 72' }}>
                <Image
                  src="/assets/kudos/kudos-logo.png"
                  alt="KUDOS"
                  fill
                  className="object-contain object-right"
                  sizes="(max-width: 1024px) 300px, 364px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
