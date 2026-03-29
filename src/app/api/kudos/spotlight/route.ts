import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Total kudos count
  const { count: total } = await supabase
    .from('kudos')
    .select('*', { count: 'exact', head: true });

  // Receivers with kudos count + latest kudos id
  const { data: kudosData } = await supabase
    .from('kudos')
    .select('receiver_id, id, created_at, receiver:profiles!kudos_receiver_id_fkey(full_name)')
    .order('created_at', { ascending: false });

  if (!kudosData) return NextResponse.json({ nodes: [], total: total ?? 0 });

  // Aggregate by receiver
  const receiverMap = new Map<string, { profile_id: string; name: string; count: number; latest_kudos_id: string }>();
  for (const k of kudosData) {
    const receiver = k.receiver as unknown as { full_name: string } | null;
    const name = receiver?.full_name ?? 'Unknown';
    if (!receiverMap.has(k.receiver_id)) {
      receiverMap.set(k.receiver_id, { profile_id: k.receiver_id, name, count: 1, latest_kudos_id: k.id });
    } else {
      const existing = receiverMap.get(k.receiver_id)!;
      existing.count++;
      // latest_kudos_id is already the most recent (sorted desc)
    }
  }

  const nodes = Array.from(receiverMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 50); // max 50 nodes for performance

  return NextResponse.json({ nodes, total: total ?? 0 });
}
