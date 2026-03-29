import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import type { KudosFeedItem } from '@/types/database';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hashtag      = searchParams.get('hashtag');
  const departmentId = searchParams.get('department');

  let query = supabase
    .from('kudos')
    .select(
      `id, message, hashtags, heart_count, department_id, created_at,
       danh_hieu, is_anonymous, anonymous_name, image_urls,
       sender:profiles!kudos_sender_id_fkey(id, full_name, avatar_url, kudos_star_tier, dept:departments(name)),
       receiver:profiles!kudos_receiver_id_fkey(id, full_name, avatar_url, kudos_star_tier, dept:departments(name)),
       kudos_likes(user_id)`,
    )
    .order('heart_count', { ascending: false })
    .order('created_at',  { ascending: false })
    .limit(5);

  if (hashtag)      query = query.contains('hashtags', [hashtag]);
  if (departmentId) query = query.eq('department_id', departmentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type RawProfile = { id: string; full_name: string; avatar_url: string | null; kudos_star_tier: number | null; dept: { name: string } | null };
  const mapped = (data ?? []).map((k) => {
    const { kudos_likes, is_anonymous, anonymous_name, sender, receiver, ...rest } = k as typeof k & {
      kudos_likes: { user_id: string }[];
      is_anonymous: boolean;
      anonymous_name: string | null;
      sender: RawProfile;
      receiver: RawProfile;
    };
    return {
      ...rest,
      is_anonymous,
      sender: is_anonymous
        ? { id: null, full_name: anonymous_name ?? 'Ẩn danh', avatar_url: null }
        : { id: sender.id, full_name: sender.full_name, avatar_url: sender.avatar_url, kudos_star_tier: sender.kudos_star_tier, department_name: sender.dept?.name ?? null },
      receiver: { id: receiver.id, full_name: receiver.full_name, avatar_url: receiver.avatar_url, kudos_star_tier: receiver.kudos_star_tier, department_name: receiver.dept?.name ?? null },
      liked_by_me: kudos_likes?.some((l) => l.user_id === user.id) ?? false,
    } as unknown as KudosFeedItem;
  });

  return NextResponse.json({ kudos: mapped });
}
