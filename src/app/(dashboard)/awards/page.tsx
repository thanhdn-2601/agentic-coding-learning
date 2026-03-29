import { AWARDS } from '@/lib/awards-data';
import AwardsKeyvisual from '@/components/awards/AwardsKeyvisual';
import AwardNavMenu from '@/components/awards/AwardNavMenu';
import AwardBlock from '@/components/awards/AwardBlock';
import SunKudosSection from '@/components/homepage/SunKudosSection';

export default function AwardsPage() {
  return (
    <div className="flex flex-col gap-30">
      {/* Keyvisual (includes title at bottom) */}
      <AwardsKeyvisual />

      <main className="relative flex flex-col gap-12 xl:gap-16 pb-12 xl:pb-24">
        {/* Nav + Award blocks */}
        <div
          id="main-content"
          className="w-full max-w-306 mx-auto px-3 sm:px-6 md:px-8 xl:px-0 flex flex-col md:flex-row gap-8 md:gap-20"
        >
          <AwardNavMenu awards={AWARDS} />

          <div id="content" className="flex flex-1 flex-col gap-20">
            {AWARDS.map((award, index) => (
              <AwardBlock key={award.slug} award={award} index={index} />
            ))}
          </div>
        </div>

        {/* Sun* Kudos promo */}
        <SunKudosSection />
      </main>
    </div>
  );
}
