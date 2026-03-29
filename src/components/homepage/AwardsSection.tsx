import { AWARDS } from '@/lib/awards-data';
import AwardCard from './AwardCard';
import { getTranslations } from 'next-intl/server';

export default async function AwardsSection() {
  const t = await getTranslations('homepage.awardsSection');
  return (
    <section aria-label={t('title')} className="py-16 md:py-24">
      <div className="w-full max-w-306 mx-auto px-3 sm:px-6 md:px-8 xl:px-0 flex flex-col gap-8 md:gap-12 xl:gap-20">
        {/* C1 — Section header */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg md:text-xl xl:text-2xl leading-6 md:leading-7 xl:leading-8 tracking-[0px] text-white font-normal">
            {t('subtitle')}
          </h2>
          <div className="w-full h-px bg-(--Details-Divider)" aria-hidden="true" />
          <h3 className="text-2xl md:text-3xl lg:text-5xl xl:text-[3.563rem] leading-7 md:leading-10 xl:leading-16 tracking-[-0.25px] font-normal text-(--Details-Text-Primary-1)">
            {t('title')}
          </h3>
        </div>

        {/* C2 — Awards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 xl:gap-20">
          {AWARDS.map((award) => (
            <AwardCard key={award.slug} award={award} />
          ))}
        </div>
      </div>
    </section>
  );
}
