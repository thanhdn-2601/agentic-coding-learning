import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/libs/supabase/server';

function timeAgo(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export default async function KudosDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: kudos } = await supabase
    .from('kudos')
    .select(
      `id, message, hashtags, heart_count, created_at,
       sender:profiles!kudos_sender_id_fkey(id, full_name, avatar_url),
       receiver:profiles!kudos_receiver_id_fkey(id, full_name, avatar_url)`,
    )
    .eq('id', id)
    .single();

  if (!kudos) notFound();

  const sender = kudos.sender as unknown as { id: string; full_name: string; avatar_url: string | null } | null;
  const receiver = kudos.receiver as unknown as { id: string; full_name: string; avatar_url: string | null } | null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Back */}
      <Link
        href="/kudos"
        className="flex items-center gap-2 text-sm mb-8 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--Details-Text-Secondary-2)' }}
      >
        ← Quay lại Kudos Board
      </Link>

      {/* Card */}
      <div
        className="rounded-2xl p-8 flex flex-col gap-6 border"
        style={{
          backgroundColor: 'var(--Details-Container)',
          borderColor: 'var(--Details-Border)',
        }}
      >
        {/* Sender → Receiver */}
        <div className="flex items-center gap-4 flex-wrap">
          <Link href={`/profile/${sender?.id}`} className="flex items-center gap-2 hover:opacity-80 group">
            <Image
              src={sender?.avatar_url ?? '/assets/profile/anonymous.png'}
              alt={sender?.full_name ?? ''}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
            <span className="font-medium" style={{ color: 'var(--Details-Text-Secondary-1)' }}>
              {sender?.full_name}
            </span>
          </Link>

          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0">
            <path d="M5 12H19M19 12L15 8M19 12L15 16" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          <Link href={`/profile/${receiver?.id}`} className="flex items-center gap-2 hover:opacity-80 group">
            <Image
              src={receiver?.avatar_url ?? '/assets/profile/anonymous.png'}
              alt={receiver?.full_name ?? ''}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
            <span className="font-bold text-lg" style={{ color: 'var(--Details-Text-Primary-1)' }}>
              {receiver?.full_name}
            </span>
          </Link>
        </div>

        {/* Message */}
        <p className="text-base leading-relaxed" style={{ color: 'var(--Details-Text-Secondary-1)' }}>
          {kudos.message}
        </p>

        {/* Hashtags */}
        {kudos.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {kudos.hashtags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--Details-Dropdown-List-Selected)',
                  color: 'var(--Details-Text-Primary-1)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div
          className="flex items-center justify-between pt-4 border-t text-sm"
          style={{ borderColor: 'var(--Details-Divider)', color: 'var(--Details-Text-Secondary-2)' }}
        >
          <span>❤️ {kudos.heart_count} lượt tim</span>
          <span>{timeAgo(kudos.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
