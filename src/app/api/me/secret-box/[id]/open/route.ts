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

  const { id } = await params;

  const { data, error } = await supabase
    .from('secret_boxes')
    .update({ is_opened: true })
    .eq('id', id)
    .eq('user_id', user.id) // RLS-like guard
    .eq('is_opened', false)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found or already opened' }, { status: 404 });

  return NextResponse.json({ secret_box: data });
}
