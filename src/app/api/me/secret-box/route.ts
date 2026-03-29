import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('secret_boxes')
    .select('id, gift_title, gift_value, gift_image_url')
    .eq('user_id', user.id)
    .eq('is_opened', false)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ secret_box: data });
}
