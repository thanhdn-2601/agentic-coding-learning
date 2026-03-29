import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export interface RecentKudosEvent {
  id: string;
  receiver_id: string;
  receiver_name: string;
  created_at: string;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('kudos')
    .select('id, receiver_id, created_at, receiver:profiles!kudos_receiver_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) return NextResponse.json({ events: [] });

  const events: RecentKudosEvent[] = (data ?? []).map((k) => {
    const receiver = k.receiver as unknown as { full_name: string } | null;
    return {
      id: k.id,
      receiver_id: k.receiver_id,
      receiver_name: receiver?.full_name ?? 'Unknown',
      created_at: k.created_at,
    };
  });

  return NextResponse.json({ events });
}
