import HeroSection from '@/components/homepage/HeroSection';
import RootFurtherSection from '@/components/homepage/RootFurtherSection';
import AwardsSection from '@/components/homepage/AwardsSection';
import SunKudosSection from '@/components/homepage/SunKudosSection';

export default async function HomePage() {
  const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME;

  return (
    <>
      <HeroSection eventDatetime={eventDatetime} />
      <RootFurtherSection />
      <AwardsSection />
      <SunKudosSection />
    </>
  );
}
