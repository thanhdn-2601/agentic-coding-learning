import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: kudosId } = await params;

  const { data, error } = await supabase
    .rpc('toggle_kudos_like', { p_kudos_id: kudosId, p_user_id: user.id });

  if (error) {
    if (error.message?.includes('SELF_LIKE_NOT_ALLOWED')) {
      return NextResponse.json({ error: 'SELF_LIKE_NOT_ALLOWED' }, { status: 403 });
    }
    if (error.message?.includes('KUDOS_NOT_FOUND')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // RPC returns { liked, count } — normalise to { liked, heart_count } for backwards compat
  const result = data as { liked: boolean; count: number };
  return NextResponse.json({ liked: result.liked, heart_count: result.count });
}
