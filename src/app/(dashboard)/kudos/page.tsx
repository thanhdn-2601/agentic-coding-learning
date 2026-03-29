import { createClient } from '@/libs/supabase/server';
import KudosClient from '@/components/kudos/KudosClient';
import type { KudosFeedItem } from '@/types/database';

const KUDOS_QUERY = `id, message, hashtags, heart_count, department_id, created_at,
  danh_hieu, is_anonymous, anonymous_name, image_urls,
  sender:profiles!kudos_sender_id_fkey(id, full_name, avatar_url),
  receiver:profiles!kudos_receiver_id_fkey(id, full_name, avatar_url),
  kudos_likes(user_id)`;

function mapToFeedItems(
  raw: Array<Record<string, unknown>>,
  userId: string,
): KudosFeedItem[] {
  return raw.map((k) => {
    const { kudos_likes, ...rest } = k as typeof k & { kudos_likes: { user_id: string }[] };
    return {
      ...rest,
      liked_by_me: kudos_likes?.some((l) => l.user_id === userId) ?? false,
    } as unknown as KudosFeedItem;
  });
}

export default async function KudosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? '';

  const [kudosRes, highlightsRes] = await Promise.all([
    supabase
      .from('kudos')
      .select(KUDOS_QUERY)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('kudos')
      .select(KUDOS_QUERY)
      .order('heart_count', { ascending: false })
      .limit(5),
  ]);

  const initialKudos = mapToFeedItems(
    (kudosRes.data ?? []) as Array<Record<string, unknown>>,
    userId,
  );
  const initialHighlights = mapToFeedItems(
    (highlightsRes.data ?? []) as Array<Record<string, unknown>>,
    userId,
  );

  return (
    <KudosClient
      initialKudos={initialKudos}
      initialHighlights={initialHighlights}
      currentUserId={userId}
    />
  );
}
