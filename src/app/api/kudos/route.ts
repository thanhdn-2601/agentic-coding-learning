import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50);
  const hashtag = searchParams.get('hashtag');
  const department = searchParams.get('department');

  const sort = searchParams.get('sort');

  let query = supabase
    .from('kudos')
    .select(
      `id, message, hashtags, heart_count, department_id, created_at,
       danh_hieu, is_anonymous, anonymous_name, image_urls,
       sender:profiles!kudos_sender_id_fkey(id, full_name, avatar_url, kudos_star_tier, dept:departments(name)),
       receiver:profiles!kudos_receiver_id_fkey(id, full_name, avatar_url, kudos_star_tier, dept:departments(name)),
       kudos_likes(user_id)`,
    )
    .limit(limit);

  if (sort === 'heart_count') {
    query = query.order('heart_count', { ascending: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  if (hashtag) {
    query = query.contains('hashtags', [hashtag]);
  }
  if (department) {
    query = query.eq('department_id', department);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Annotate liked_by_me + flatten nested dept
  type RawProfile = { id: string; full_name: string; avatar_url: string | null; kudos_star_tier: number | null; dept: { name: string } | null };
  const kudos = (data ?? []).map((k) => {
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
    };
  });

  return NextResponse.json({ kudos });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { receiver_id, message, hashtags, danh_hieu, is_anonymous, anonymous_name, image_urls } =
    body as {
      receiver_id: string;
      message: string;
      hashtags: string[];
      danh_hieu?: string;
      is_anonymous?: boolean;
      anonymous_name?: string;
      image_urls?: string[];
    };

  if (!receiver_id || !message?.trim() || !danh_hieu?.trim()) {
    return NextResponse.json(
      { error: 'receiver_id, message và danh_hieu đều bắt buộc' },
      { status: 400 },
    );
  }
  if (receiver_id === user.id) {
    return NextResponse.json({ error: 'Cannot send kudos to yourself' }, { status: 400 });
  }
  if (danh_hieu.length > 200) {
    return NextResponse.json({ error: 'Danh hiệu không quá 200 ký tự' }, { status: 400 });
  }
  if (image_urls && image_urls.length > 5) {
    return NextResponse.json({ error: 'Tối đa 5 ảnh' }, { status: 400 });
  }
  // Whitelist: only accept Supabase Storage URLs for kudo-images bucket
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const validStoragePrefix = `${supabaseUrl}/storage/v1/object/public/kudo-images/`;
  if (image_urls?.some((url: string) => !url.startsWith(validStoragePrefix))) {
    return NextResponse.json({ error: 'URL ảnh không hợp lệ' }, { status: 400 });
  }

  // Use create_kudos RPC for atomic insert (handles department denormalization)
  const { data, error } = await supabase.rpc('create_kudos', {
    p_receiver_id:    receiver_id,
    p_danh_hieu:      danh_hieu.trim(),
    p_message:        message,
    p_hashtags:       Array.isArray(hashtags) ? hashtags : [],
    p_image_urls:     Array.isArray(image_urls) ? image_urls : [],
    p_is_anonymous:   is_anonymous ?? false,
    p_anonymous_name: is_anonymous ? (anonymous_name?.trim() || null) : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: (data as { id: string }).id }, { status: 201 });
}
