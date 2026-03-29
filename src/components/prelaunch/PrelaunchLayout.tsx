import Image from 'next/image';
import CountdownClock from './CountdownClock';

interface PrelaunchLayoutProps {
  eventDatetime: string;
}

export default function PrelaunchLayout({ eventDatetime }: PrelaunchLayoutProps) {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'var(--Details-Background)' }}
    >
      {/* Background image */}
      <Image
        src="/assets/prelaunch/images/keyvisual-bg.png"
        alt=""
        fill
        priority
        className="object-cover object-center"
        aria-hidden="true"
      />

      {/* Left gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to right, var(--Details-Background) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Bottom gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to top, var(--Details-Background) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center">
        {/* Hero text */}
        <div className="flex flex-col items-center gap-3">
          <p
            className="text-xs md:text-sm uppercase tracking-[0.2em] font-semibold"
            style={{ color: 'var(--Details-Text-Primary-1)' }}
          >
            Sun* Annual Award 2025
          </p>
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase leading-none"
            style={{
              fontFamily: 'var(--font-montserrat-alt)',
              color: 'var(--Details-Text-Secondary-1)',
            }}
          >
            ROOT FURTHER
          </h1>
        </div>

        {/* Countdown */}
        <CountdownClock targetISO={eventDatetime} />
      </div>
    </div>
  );
}
