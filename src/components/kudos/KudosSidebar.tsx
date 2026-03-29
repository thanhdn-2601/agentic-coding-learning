'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Stats {
  kudos_received: number;
  kudos_sent: number;
  hearts_received: number;
  secret_box_opened: number;
  secret_box_unopened: number;
}

interface RecentGiftItem {
  id: string;
  user_id: string;
  gift_title: string;
  full_name: string;
  avatar_url: string | null;
}

interface KudosSidebarProps {
  onOpenSecretBox?: () => void;
  refreshKey?: number;
}

const LABEL_CLASS =
  'text-sm sm:text-base md:text-lg lg:text-[22px] xl:text-[22px] leading-5 sm:leading-6 md:leading-6 lg:leading-7 xl:leading-7 tracking-[0px] text-white font-normal';

const VALUE_CLASS =
  'text-xl sm:text-2xl md:text-3xl lg:text-[32px] xl:text-[32px] leading-7 sm:leading-8 md:leading-9 lg:leading-10 xl:leading-10 tracking-[0px] font-normal text-(--Details-Text-Primary-1)';

const CARD_CLASS =
  'p-4 sm:p-5 md:p-6 lg:p-6 xl:p-6 rounded-[17px] flex flex-col gap-3 sm:gap-4 md:gap-4 lg:gap-4 xl:gap-4 bg-(--Details-Container-2) border border-(--Details-Border)';

export default function KudosSidebar({ onOpenSecretBox, refreshKey = 0 }: KudosSidebarProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentGifts, setRecentGifts] = useState<RecentGiftItem[]>([]);
  const t = useTranslations('kudos.sidebar');

  useEffect(() => {
    fetch('/api/me/kudos-stats')
      .then((r) => r.json())
      .then((d) => setStats(d as Stats))
      .catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    fetch('/api/kudos/recent-gifts')
      .then((r) => r.json())
      .then((d) => setRecentGifts((d as { data: RecentGiftItem[] }).data ?? []))
      .catch(() => {});
  }, [refreshKey]);

  const canOpen = !!stats && stats.secret_box_unopened > 0;

  return (
    <aside className="w-full lg:w-[320px] xl:w-[422px] shrink-0 flex flex-col gap-4 sm:gap-5 md:gap-6 lg:gap-6 xl:gap-6">

      {/* D.1 — Stats + Secret Box */}
      <div className={CARD_CLASS}>
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-4 lg:gap-4 xl:gap-4">

          {/* Kudos received */}
          <div className="flex items-center justify-between gap-2">
            <span className={LABEL_CLASS}>{t('kudosReceived')}</span>
            <span className={VALUE_CLASS}>{stats?.kudos_received ?? 0}</span>
          </div>

          {/* Kudos sent */}
          <div className="flex items-center justify-between gap-2">
            <span className={LABEL_CLASS}>{t('kudosSent')}</span>
            <span className={VALUE_CLASS}>{stats?.kudos_sent ?? 0}</span>
          </div>

          {/* Hearts received */}
          <div className="flex items-center justify-between gap-2">
            <span className={`flex items-center gap-2 ${LABEL_CLASS}`}>{t('heartsReceived')}</span>
            <span className={VALUE_CLASS}>{stats?.hearts_received ?? 0}</span>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-(--Details-Divider)" />

          {/* Secret boxes opened */}
          <div className="flex items-center justify-between gap-2">
            <span className={LABEL_CLASS}>{t('boxesOpened')}</span>
            <span className={VALUE_CLASS}>{stats?.secret_box_opened ?? 0}</span>
          </div>

          {/* Secret boxes unopened */}
          <div className="flex items-center justify-between gap-2">
            <span className={LABEL_CLASS}>{t('boxesUnopened')}</span>
            <span className={VALUE_CLASS}>{stats?.secret_box_unopened ?? 0}</span>
          </div>

          {/* Open Secret Box button */}
          <button
            onClick={onOpenSecretBox}
            disabled={!canOpen}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-4 rounded-lg transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed bg-(--Details-Text-Primary-1) text-(--Details-Text-Primary-2)"
          >
            <span className="text-sm sm:text-base md:text-lg lg:text-[22px] xl:text-[22px] leading-5 sm:leading-6 md:leading-6 lg:leading-7 xl:leading-7 tracking-[0px] font-normal">
              {t('openBox')}
            </span>
            <Image
              src="https://saa.sun-asterisk.vn/cdn-cgi/image/width=48/assets/gift-box.png"
              alt="Gift box"
              width={24}
              height={24}
              className="w-5 sm:w-6 h-5 sm:h-6"
            />
          </button>
        </div>
      </div>

      {/* D.2 — 10 SUNNER NHẬN QUÀ MỚI NHẤT */}
      <div className={CARD_CLASS}>
        <h4 className="text-base sm:text-lg md:text-lg lg:text-[22px] xl:text-[22px] leading-5 sm:leading-6 md:leading-6 lg:leading-7 xl:leading-7 tracking-[0px] text-center font-normal text-(--Details-Text-Primary-1)">
          {t('recentGiftsTitle')}
        </h4>

        <div className="flex flex-col gap-3 sm:gap-4 md:gap-4 lg:gap-4 xl:gap-4 overflow-y-auto max-h-96 pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,199,0,0.3)_transparent]">
          {recentGifts.length === 0 ? (
            <p
              className="text-xs sm:text-sm text-center py-2"
              style={{ color: 'var(--Details-Text-Secondary-2)' }}
            >
              {t('noData')}
            </p>
          ) : (
            recentGifts.map((item) => (
              <div key={item.id} className="flex items-center gap-2 sm:gap-3">
                {/* Avatar */}
                <div className="relative w-10 sm:w-12 h-10 sm:h-12 shrink-0">
                  <Link href={`/profile/${item.user_id}`}>
                    <Image
                      src={item.avatar_url ?? '/assets/profile/anonymous.png'}
                      alt={item.full_name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-full h-full"
                    />
                  </Link>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base leading-4 sm:leading-5 tracking-[0px] truncate font-semibold text-(--Details-Text-Primary-1)">
                    <Link href={`/profile/${item.user_id}`} className="hover:underline">
                      {item.full_name}
                    </Link>
                  </p>
                  <p className="text-xs sm:text-sm leading-3 sm:leading-4 mt-0.5 sm:mt-1 font-normal text-(--Details-Text-Secondary-2)">
                    {t('receivedGift', { gift: item.gift_title })}
                  </p>
                </div>

                {/* Gift emoji */}
                <div className="text-lg sm:text-2xl shrink-0">🎁</div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
