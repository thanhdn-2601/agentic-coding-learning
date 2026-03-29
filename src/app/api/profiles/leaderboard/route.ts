import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

interface LeaderboardProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  kudos_star_tier: number | null;
  kudos_star_tier_updated_at: string | null;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, kudos_star_tier, kudos_star_tier_updated_at')
    .not('kudos_star_tier', 'is', null)
    .not('kudos_star_tier_updated_at', 'is', null)
    .order('kudos_star_tier_updated_at', { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: (data ?? []) as LeaderboardProfile[] });
}
