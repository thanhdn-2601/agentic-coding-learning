import { redirect } from 'next/navigation';
import { createClient } from '@/libs/supabase/server';
import PrelaunchLayout from '@/components/prelaunch/PrelaunchLayout';

export default async function PrelaunchPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME ?? '';
  const isEventStarted = eventDatetime
    ? Date.now() >= new Date(eventDatetime).getTime()
    : true;

  if (isEventStarted) redirect('/');

  return <PrelaunchLayout eventDatetime={eventDatetime} />;
}
