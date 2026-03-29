'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { useTranslations } from 'next-intl';
import type { KudosFeedItem } from '@/types/database';

interface KudoCardProps {
  kudos: KudosFeedItem;
  currentUserId?: string;
  onFilterChange?: (filter: { hashtag?: string; department?: string }) => void;
}

const ANON_AVATAR = '/assets/profile/anonymous.png';

const LEVEL_IMAGES: Record<number, string> = {
  1: '/assets/profile/level-1-hq.png',
  2: '/assets/profile/level-2-hq.png',
  3: '/assets/profile/level-3-hq.png',
};

const LEVEL_ALT: Record<number, string> = {
  1: 'New Hero',
  2: 'Rising Hero',
  3: 'Super Hero',
};

const STAR_TIER_TOOLTIPS: Record<number, string> = {
  1: 'Sunner đã nhận được 10 Kudos và bắt đầu lan tỏa năng lượng ấm áp đến mọi người xung quanh.',
  2: 'Sunner đã nhận được 20 Kudos và chứng minh sức ảnh hưởng của mình qua những hành động lan tỏa tích cực mỗi ngày.',
  3: 'Sunner đã nhận được 50 Kudos và trở thành hình mẫu của sự công nhận, sẻ chia và lan tỏa tinh thần Sun*.',
};

function formatKudosDate(dateIso: string): string {
  const d = new Date(dateIso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const YYYY = d.getFullYear();
  return `${hh}:${mm} - ${DD}/${MM}/${YYYY}`;
}

interface AvatarColProps {
  id: string | null;
  full_name: string;
  avatar_url: string | null;
  department_name?: string | null;
  kudos_star_tier?: number | null;
  isAnonymous?: boolean;
  clickable?: boolean;
}

function AvatarCol({
  id,
  full_name,
  avatar_url,
  department_name,
  kudos_star_tier,
  isAnonymous,
  clickable = true,
}: AvatarColProps) {
  const t = useTranslations('kudos.card');
  const href = id ? `/profile/${id}` : '#';
  const imgSrc = avatar_url ?? ANON_AVATAR;
  const canLink = clickable && !!id;

  const avatarEl = (
    <div
      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden"
      style={{ border: '0.117rem solid var(--Details-Text-Secondary-1)' }}
    >
      <Image
        src={imgSrc}
        alt={full_name}
        width={64}
        height={64}
        className="object-cover w-full h-full"
      />
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-0">
      <div className="flex flex-col items-center gap-1">
        {canLink ? (
          <Link href={href} onClick={(e) => e.stopPropagation()}>
            {avatarEl}
          </Link>
        ) : (
          avatarEl
        )}
        <div className="w-40 sm:w-44 md:w-48 lg:w-50 flex justify-center">
          {canLink ? (
            <Link
              href={href}
              onClick={(e) => e.stopPropagation()}
              className="text-sm sm:text-base font-medium text-center leading-5 sm:leading-6 tracking-[0.009375rem] hover:underline"
              style={{ color: 'var(--Details-Text-Primary-2)' }}
            >
              {full_name}
            </Link>
          ) : (
            <span
              className="text-sm sm:text-base font-medium text-center leading-5 sm:leading-6 tracking-[0.009375rem]"
              style={{ color: 'var(--Details-Text-Primary-2)', cursor: 'default' }}
            >
              {full_name}
            </span>
          )}
        </div>
      </div>

      {/* Department + level badge */}
      <div className="w-40 sm:w-44 md:w-48 lg:w-50">
        <div className="flex items-center gap-1.5 justify-center" style={{ minHeight: '24px' }}>
          {isAnonymous ? (
            <p
              className="text-xs font-medium leading-4 tracking-[0.00625rem] text-center"
              style={{ color: 'var(--Details-Text-Secondary-2)' }}
            >
              {t('anonymous')}
            </p>
          ) : (
            <>
              {department_name && (
                <p
                  className="text-xs font-medium leading-4 tracking-[0.00625rem] truncate"
                  style={{ color: 'var(--Details-Text-Secondary-2)' }}
                >
                  {department_name}
                </p>
              )}
              {department_name && kudos_star_tier && LEVEL_IMAGES[kudos_star_tier] && (
                <span className="text-xs font-medium shrink-0" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
                  •
                </span>
              )}
              {kudos_star_tier && LEVEL_IMAGES[kudos_star_tier] && (
                <div
                  className="relative shrink-0"
                  style={{ width: '109px', height: '19px', marginLeft: '-6px' }}
                  title={STAR_TIER_TOOLTIPS[kudos_star_tier]}
                >
                  <Image
                    src={LEVEL_IMAGES[kudos_star_tier]}
                    alt={LEVEL_ALT[kudos_star_tier] ?? ''}
                    fill
                    sizes="109px"
                    className="object-contain"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KudoCard({ kudos, currentUserId, onFilterChange }: KudoCardProps) {
  const [liked, setLiked] = useState(kudos.liked_by_me);
  const [count, setCount] = useState(kudos.heart_count);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const t = useTranslations('kudos.card');

  const isSender = Boolean(currentUserId && kudos.sender.id && kudos.sender.id === currentUserId);

  const senderDept = 'department_name' in kudos.sender ? kudos.sender.department_name : null;
  const senderTier = 'kudos_star_tier' in kudos.sender ? kudos.sender.kudos_star_tier : null;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSender) return;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    try {
      const res = await fetch(`/api/kudos/${kudos.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { liked: boolean; heart_count: number };
      setLiked(data.liked);
      setCount(data.heart_count);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(`${window.location.origin}/kudos/${kudos.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/kudos/${kudos.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/kudos/${kudos.id}`)}
      className="kudos-card flex flex-col rounded-2xl w-full overflow-hidden relative p-4 sm:p-5 gap-4 sm:gap-5 cursor-pointer"
      style={{ backgroundColor: 'var(--Details-PrimaryButton-Hover)', border: '0px solid transparent' }}
    >
      {/* Sender → Receiver */}
      <div className="flex items-start justify-center gap-2 sm:gap-2.5 md:gap-3">
        <AvatarCol
          id={kudos.sender.id}
          full_name={kudos.sender.full_name}
          avatar_url={kudos.sender.avatar_url}
          department_name={senderDept}
          kudos_star_tier={senderTier}
          isAnonymous={kudos.sender.id === null}
          clickable={false}
        />

        {/* Paper-plane send icon */}
        <div className="flex items-center justify-center py-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 md:w-8 md:h-8"
            style={{ color: 'var(--Details-Background)' }}
            aria-hidden="true"
          >
            <path
              d="M2.90625 20.4805V4.48047L21.9062 12.4805M4.90625 17.4805L16.7563 12.4805L4.90625 7.48047V10.9805L10.9062 12.4805L4.90625 13.9805M4.90625 17.4805V7.48047V13.9805V17.4805Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <AvatarCol
          id={kudos.receiver.id}
          full_name={kudos.receiver.full_name}
          avatar_url={kudos.receiver.avatar_url}
          department_name={kudos.receiver.department_name}
          kudos_star_tier={kudos.receiver.kudos_star_tier}
          isAnonymous={false}
          clickable={true}
        />
      </div>

      {/* Gold divider */}
      <div className="w-full h-px" style={{ backgroundColor: 'var(--Details-Text-Primary-1)' }} />

      {/* Content */}
      <div className="flex flex-col gap-4">
        {/* Timestamp */}
        <span
          className="text-xs font-normal leading-4 tracking-[0.03125rem]"
          style={{ color: 'var(--Details-Text-Secondary-2)' }}
        >
          {formatKudosDate(kudos.created_at)}
        </span>

        {/* Danh hiệu */}
        {kudos.danh_hieu && (
          <h3
            className="text-center text-sm sm:text-base font-bold uppercase tracking-[0.03125rem] pointer-events-none"
            style={{ color: 'var(--Details-Background)' }}
          >
            {kudos.danh_hieu}
          </h3>
        )}

        {/* Message box */}
        <div
          className="px-4 sm:px-5 py-3 sm:py-4 rounded-xl border text-sm sm:text-base leading-[1.6] whitespace-pre-wrap font-normal cursor-pointer transition-opacity hover:opacity-80 overflow-hidden"
          style={{
            backgroundColor: 'var(--Details-ButtonSecondary-Hover)',
            borderColor: 'var(--Details-Text-Primary-1)',
            color: 'var(--Details-Text-Primary-2)',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 5,
          }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(kudos.message) }}
        />

        {/* Images */}
        {kudos.image_urls && kudos.image_urls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {kudos.image_urls.slice(0, 5).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="w-14 h-14 object-cover rounded-lg"
                style={{ border: '1px solid var(--Details-Text-Primary-1)' }}
                onClick={(e) => e.stopPropagation()}
              />
            ))}
          </div>
        )}

        {/* Hashtags */}
        {kudos.hashtags.length > 0 && (
          <div
            className="flex flex-wrap gap-1 text-xs font-normal leading-4 tracking-[0.03125rem] overflow-hidden"
            style={{
              color: 'rgb(212,39,29)',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 1,
            }}
          >
            {kudos.hashtags.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-label={`Filter by ${tag}`}
                className="hover:underline cursor-pointer mr-2"
                onClick={(e) => { e.stopPropagation(); onFilterChange?.({ hashtag: tag }); }}
              >
                {tag}&nbsp;
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gold divider */}
      <div className="w-full h-px" style={{ backgroundColor: 'var(--Details-Text-Primary-1)' }} />

      {/* Actions */}
      <div className="flex items-center justify-between">
        {/* Heart count + button */}
        <div className="flex items-center gap-1">
          <span
            className="text-2xl leading-8 font-normal"
            style={{ color: 'var(--Details-Text-Primary-2)' }}
          >
            {count}
          </span>
          <button
            type="button"
            onClick={handleLike}
            disabled={isSender}
            aria-label={liked ? t('unlikeAria') : t('likeAria')}
            aria-pressed={liked}
            className="w-8 h-8 flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              className="w-full h-full"
              fill={liked ? 'rgb(212,39,29)' : 'rgba(153,153,153,1)'}
              aria-hidden="true"
            >
              <path d="M16 28L14.15 26.325C7.6 20.4 3 16.225 3 11.15C3 7.225 6.05 4 9.75 4C12.05 4 14.25 5.075 16 6.775C17.75 5.075 19.95 4 22.25 4C25.95 4 29 7.225 29 11.15C29 16.225 24.4 20.4 17.85 26.325L16 28Z" />
            </svg>
          </button>
        </div>

        {/* Copy link */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 sm:px-4 py-3 rounded transition-all"
        >
          <span
            className="text-xs sm:text-sm font-medium leading-4 sm:leading-5 tracking-[0.009375rem]"
            style={{ color: 'var(--Details-Text-Primary-2)' }}
          >
            {copied ? t('copied') : t('copyLink')}
          </span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M13.0601 10.9399C15.3101 13.1899 15.3101 16.8299 13.0601 19.0699C10.8101 21.3099 7.17006 21.3199 4.93006 19.0699C2.69006 16.8199 2.68006 13.1799 4.93006 10.9399"
              stroke="var(--Details-Text-Primary-2)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.59 13.4099C8.24996 11.0699 8.24996 7.26988 10.59 4.91988C12.93 2.56988 16.73 2.57988 19.08 4.91988C21.43 7.25988 21.42 11.0599 19.08 13.4099"
              stroke="var(--Details-Text-Primary-2)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}

