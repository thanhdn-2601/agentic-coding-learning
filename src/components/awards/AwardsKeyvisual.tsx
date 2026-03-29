import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export default async function AwardsKeyvisual() {
  const t = await getTranslations('awards');
  return (
    <section className="relative overflow-hidden h-90 md:h-120 xl:h-136.75">
      {/* Background image */}
      <Image
        src="/assets/login/images/key-visual-background.png"
        alt="Keyvisual Sun* Annual Award 2025"
        fill
        priority
        sizes="100vw"
        className="object-cover object-right"
      />

      {/* Left gradient overlay */}
      <div
        className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,#00101A_0%,#00101A_25.41%,rgba(0,16,26,0)_100%)]"
        aria-hidden="true"
      />

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[1] h-40 bg-[linear-gradient(0deg,#00101A_0%,rgba(0,19,32,0)_70%)]"
        aria-hidden="true"
      />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 w-full h-full z-10">
        <div className="w-full max-w-306 mx-auto px-3 sm:px-6 md:px-8 xl:px-0 flex flex-col justify-between h-full">
          {/* ROOT FURTHER logo — vertically centered in remaining space */}
          <div className="w-full flex flex-1 items-center justify-start">
            <Image
              src="/assets/homepage/images/root-further.png"
              alt="Root Further - SAA 2025"
              width={451}
              height={200}
              priority
              className="w-auto max-h-30 md:max-h-37.5 lg:max-h-[unset] lg:w-84.5 object-contain"
            />
          </div>

          {/* Title block at bottom */}
          <div className="flex w-full flex-col gap-4 pb-10">
            <p className="font-normal text-center text-lg md:text-2xl leading-7 md:leading-8 text-(--Details-Text-Secondary-1)">
              Sun* Annual Awards 2025
            </p>
            <div className="h-px w-full bg-(--Details-Divider)" aria-hidden="true" />
            <h1 className="font-normal text-center text-3xl md:text-5xl xl:text-[3.563rem] leading-9 md:leading-14 xl:leading-16 tracking-[-0.25px] text-(--Details-Text-Primary-1)">
              {t('keyvisual.title')}
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
