import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/libs/supabase/server';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

const KUDOS_QUERY = `
  id, danh_hieu, message, created_at, heart_count, hashtags,
  is_anonymous, anonymous_name,
  sender:profiles!kudos_sender_id_fkey(id, full_name, avatar_url, kudos_star_tier)
`;

function formatDate(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${hh}:${mm} - ${dd}/${mo}/${yyyy}`;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) notFound();

  // Fetch the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, kudos_star_tier, department_id, dept:departments(name)')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  type DeptShape = { name: string } | null;
  const dept = (profile as typeof profile & { dept: DeptShape }).dept;

  // Fetch kudos received
  const { data: kudosReceived } = await supabase
    .from('kudos')
    .select(KUDOS_QUERY)
    .eq('receiver_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch stats
  const [{ count: receivedCount }, { count: sentCount }] = await Promise.all([
    supabase.from('kudos').select('*', { count: 'exact', head: true }).eq('receiver_id', id),
    supabase.from('kudos').select('*', { count: 'exact', head: true }).eq('sender_id', id),
  ]);

  const tierBadge =
    profile.kudos_star_tier
      ? `/assets/profile/level-${profile.kudos_star_tier}-hq.png`
      : null;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--Details-Background)' }}
    >
      {/* ── Header / Back ── */}
      <div
        className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-12 pt-8 pb-4"
      >
        <Link
          href="/kudos"
          className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--Details-Text-Secondary-2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Quay lại Sun* Kudos
        </Link>
      </div>

      {/* ── Profile Card ── */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-12 pb-12">
        <div
          className="rounded-2xl border p-8 mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6"
          style={{
            backgroundColor: 'var(--Details-Container-2)',
            borderColor: 'var(--Details-Border)',
          }}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2" style={{ borderColor: 'rgba(255,184,0,0.4)' }}>
              <Image
                src={profile.avatar_url ?? '/assets/profile/anonymous.png'}
                alt={profile.full_name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            {tierBadge && (
              <div className="absolute -bottom-2 -right-2 w-9 h-9">
                <Image src={tierBadge} alt={`Level ${profile.kudos_star_tier}`} width={36} height={36} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1 text-center sm:text-left flex-1">
            <h1
              className="text-2xl sm:text-3xl font-bold leading-tight"
              style={{ color: 'var(--Details-Text-Secondary-1)' }}
            >
              {profile.full_name}
            </h1>
            {dept?.name && (
              <p className="text-sm font-medium" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
                {dept.name}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-2xl font-bold"
                style={{ color: 'var(--Details-Text-Primary-1)' }}
              >
                {receivedCount ?? 0}
              </span>
              <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
                Kudos nhận
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-2xl font-bold"
                style={{ color: 'var(--Details-Text-Primary-1)' }}
              >
                {sentCount ?? 0}
              </span>
              <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
                Kudos đã gửi
              </span>
            </div>
          </div>
        </div>

        {/* ── Kudos Received ── */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <p
              className="text-xs uppercase tracking-[0.2em] font-medium"
              style={{ color: 'var(--Details-Text-Secondary-2)' }}
            >
              Sun* Annual Awards 2025
            </p>
          </div>
          <div className="flex items-center gap-4 mb-8">
            <h2
              className="text-2xl sm:text-3xl font-bold shrink-0"
              style={{ color: 'var(--Details-Text-Secondary-1)' }}
            >
              KUDOS ĐÃ NHẬN
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--Details-Divider)' }} />
          </div>

          {!kudosReceived || kudosReceived.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
              Hiện tại chưa có Kudos nào.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {kudosReceived.map((kudo) => {
                type SenderShape = { id: string; full_name: string; avatar_url: string | null; kudos_star_tier: number | null } | null;
                const raw = kudo as typeof kudo & {
                  is_anonymous: boolean;
                  anonymous_name: string | null;
                  sender: SenderShape;
                  heart_count: number;
                  hashtags: string[];
                };
                const displaySender = raw.is_anonymous
                  ? { full_name: raw.anonymous_name ?? 'Ẩn danh', avatar_url: null, kudos_star_tier: null }
                  : raw.sender ?? { full_name: 'Ẩn danh', avatar_url: null, kudos_star_tier: null };

                return (
                  <Link
                    key={kudo.id}
                    href={`/kudos/${kudo.id}`}
                    className="block rounded-2xl border p-5 transition-all hover:border-[rgba(255,234,158,0.4)]"
                    style={{
                      backgroundColor: 'var(--Details-Container)',
                      borderColor: 'var(--Details-Border)',
                    }}
                  >
                    {/* Sender row */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                        <Image
                          src={displaySender.avatar_url ?? '/assets/profile/anonymous.png'}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--Details-Text-Secondary-1)' }}>
                        {displaySender.full_name}
                      </span>
                      <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
                        {formatDate(kudo.created_at)}
                      </span>
                    </div>

                    {/* Danh hiệu */}
                    <p className="font-bold mb-2" style={{ color: 'var(--Details-Text-Primary-1)' }}>
                      {(kudo as { danh_hieu?: string }).danh_hieu ?? ''}
                    </p>

                    {/* Message */}
                    <div
                      className="text-sm line-clamp-3 mb-3"
                      style={{ color: 'var(--Details-Text-Secondary-2)' }}
                      dangerouslySetInnerHTML={{ __html: kudo.message }}
                    />

                    {/* Hashtags + heart */}
                    <div className="flex items-center gap-2 flex-wrap mt-auto">
                      {raw.hashtags?.slice(0, 5).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full border"
                          style={{
                            color: 'var(--Details-Text-Primary-1)',
                            borderColor: 'rgba(255,234,158,0.3)',
                            backgroundColor: 'rgba(255,234,158,0.08)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                      <span className="ml-auto flex items-center gap-1 text-sm" style={{ color: 'var(--Details-Text-Secondary-2)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                        </svg>
                        {raw.heart_count ?? 0}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
