import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export default async function RootFurtherSection() {
  const t = await getTranslations('homepage.rootFurther');
  return (
    <div className="flex min-h-[calc(100vh-12.5rem)] py-10 md:py-0 items-center">
      <div className="w-full max-w-306 mx-auto px-3 sm:px-6 md:px-8 xl:px-0 z-10 flex flex-col gap-8">
        {/* Root Further logo centered */}
        <div className="w-full flex justify-center">
          <Image
            src="/assets/homepage/root-further-center.png"
            alt="Root Further - SAA 2025"
            width={290}
            height={134}
          />
        </div>

        {/* First text block */}
        <p className="text-justify text-base md:text-lg leading-6 md:leading-7 tracking-[0.5px] text-white font-normal max-w-full mx-auto">
          {t('p1_1')}
          <br />
          <br />
          {t('p1_2_before')}{' '}
          <span className="font-bold text-(--Details-Text-Primary-1)">&ldquo;Root Further&rdquo;</span>{' '}
          {t('p1_2_after')}
          <br />
          <br />
          {t('p1_3_before')}{' '}
          <span className="font-bold text-(--Details-Text-Primary-1)">&ldquo;Root Further&rdquo;</span>{' '}
          {t('p1_3_after')}
        </p>

        {/* Quote */}
        <div className="flex flex-col items-center gap-2 py-1 md:py-2">
          <p className="text-center text-xl md:text-2xl font-bold text-white">
            {t('quote')}
          </p>
          <p className="text-center text-sm md:text-base text-foreground italic">
            {t('quoteNote')}
          </p>
        </div>

        {/* Second text block */}
        <p className="text-justify text-base md:text-lg leading-6 md:leading-7 tracking-[0.5px] text-white font-normal max-w-full mx-auto">
          {t('p2_1_before')}{' '}
          <span className="font-bold text-(--Details-Text-Primary-1)">&ldquo;Root Further&rdquo;</span>{' '}
          {t('p2_1_after')}
          <br />
          <br />
          {t('p2_2_before')}{' '}
          <span className="font-bold text-(--Details-Text-Primary-1)">&ldquo;Root Further&rdquo;</span>{' '}
          {t('p2_2_after')}
        </p>
      </div>
    </div>
  );
}
