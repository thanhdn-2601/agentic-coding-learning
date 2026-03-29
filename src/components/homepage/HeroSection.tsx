import Image from 'next/image';
import HeroLogo from './HeroLogo';
import CountdownSection from './CountdownSection';

interface HeroSectionProps {
  eventDatetime?: string;
}

export default function HeroSection({ eventDatetime }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/assets/homepage/images/hero-bg.png"
        alt=""
        fill
        priority
        className="object-cover object-right"
        aria-hidden="true"
      />

      {/* Left gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: 'linear-gradient(to right, var(--Details-Background) 40%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Bottom gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: 'linear-gradient(to top, var(--Details-Background) 0%, transparent 40%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className="relative z-10 w-full px-6 md:px-10 lg:px-[var(--page-padding-x)] flex flex-col gap-8 py-20"
      >
        {/* ROOT FURTHER logo / title */}
        <div className="flex flex-col gap-3">
          <HeroLogo />
        </div>

        {/* Countdown + CTA */}
        <CountdownSection eventDatetime={eventDatetime} />
      </div>
    </section>
  );
}
