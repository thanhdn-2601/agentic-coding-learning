import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Award } from '@/lib/awards-data';

interface AwardCardProps {
  award: Award;
}

export default async function AwardCard({ award }: AwardCardProps) {
  const t = await getTranslations('homepage.kudosSection');
  return (
    <Link
      href={`/awards#${award.slug}`}
      className="group flex flex-col gap-6 w-84 transition-all hover:transform hover:-translate-y-1 mx-auto"
    >
      {/* Image container — mix-blend-screen makes black areas transparent */}
      <div className="relative w-84 h-84 flex items-center justify-center rounded-3xl border-[0.955px] overflow-hidden shadow-[0_0_6px_0_#FAE287] group-hover:shadow-[0_0_12px_0_#FAE287] border-(--Details-Text-Primary-1) mix-blend-screen shrink-0">
        {/* Shared award frame background */}
        <Image
          src="/assets/award-background.png"
          alt=""
          fill
          className="object-cover"
          aria-hidden="true"
        />
        {/* Award name image — centered overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10 p-13.25">
          <Image
            src={`/assets/award-name-${award.nameImage}.png`}
            alt={award.name}
            width={230}
            height={53}
            className="drop-shadow-[0_0_6px_rgba(250,226,135,0.5)]"
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl leading-8 font-normal text-(--Details-Text-Primary-1) tracking-[0px]">
          {award.name}
        </h2>
        <p className="text-base leading-6 font-normal text-white tracking-[0.5px] line-clamp-4">
          {award.descriptions[0]}
        </p>
        <div className="flex items-center gap-1 py-4">
          <p className="text-base leading-6 font-medium text-white tracking-[0.15px]">{t('cta')}</p>
          <Image
            src="/assets/homepage/arrow-3.png"
            alt="arrow"
            width={24}
            height={24}
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>
    </Link>
  );
}
