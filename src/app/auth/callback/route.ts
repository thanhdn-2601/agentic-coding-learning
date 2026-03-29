import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/libs/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', origin));
    }

    const supabase = await createClient();

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', origin));
    }

    // Sync NEXT_LOCALE cookie → profiles.locale on first login
    try {
      const cookieStore = await cookies();
      const rawLocale = cookieStore.get('NEXT_LOCALE')?.value;
      if (rawLocale === 'vi' || rawLocale === 'en') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ locale: rawLocale }).eq('id', user.id);
        }
      }
    } catch {
      // Non-fatal: locale sync failure should not block auth
    }

    const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME;
    const isPrelaunch = eventDatetime
      ? Date.now() < new Date(eventDatetime).getTime()
      : false;

    return NextResponse.redirect(new URL(isPrelaunch ? '/prelaunch' : '/', origin));
  } catch {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', new URL(request.url).origin));
  }
}
