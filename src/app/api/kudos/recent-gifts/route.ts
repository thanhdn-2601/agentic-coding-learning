import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export interface RecentGiftItem {
  id: string;
  user_id: string;
  gift_title: string;
  created_at: string;
  full_name: string;
  avatar_url: string | null;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch 10 most recently opened secret boxes
  const { data: boxes, error } = await supabase
    .from('secret_boxes')
    .select('id, user_id, gift_title, created_at')
    .eq('is_opened', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!boxes || boxes.length === 0) return NextResponse.json({ data: [] });

  // Fetch profiles for those user_ids
  const userIds = [...new Set(boxes.map((b) => b.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const data: RecentGiftItem[] = boxes.map((box) => {
    const profile = profileMap.get(box.user_id);
    return {
      id: box.id,
      user_id: box.user_id,
      gift_title: box.gift_title ?? '',
      created_at: box.created_at,
      full_name: profile?.full_name ?? 'Unknown',
      avatar_url: profile?.avatar_url ?? null,
    };
  });

  return NextResponse.json({ data });
}
