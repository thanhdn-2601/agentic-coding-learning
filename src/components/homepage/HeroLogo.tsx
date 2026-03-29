'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function HeroLogo() {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <h1
        className="text-5xl md:text-7xl font-bold uppercase leading-none"
        style={{
          fontFamily: 'var(--font-montserrat-alt)',
          color: 'var(--Details-Text-Secondary-1)',
        }}
      >
        ROOT FURTHER
      </h1>
    );
  }

  return (
    <Image
      src="/assets/homepage/images/root-further.png"
      alt="ROOT FURTHER"
      width={480}
      height={80}
      priority
      className="max-w-full"
      style={{ height: 'auto' }}
      onError={() => setImgFailed(true)}
    />
  );
}
