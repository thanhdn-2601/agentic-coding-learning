import { redirect } from 'next/navigation';
import { createClient } from '@/libs/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WidgetButton from '@/components/layout/WidgetButton';
import type { UserRole } from '@/types/database';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, locale')
    .eq('id', user.id)
    .single();

  const userRole: UserRole = (profile?.role as UserRole) ?? 'user';

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingTop: 'var(--header-height)' }}>
      <Header userRole={userRole} />
      <main className="flex-1">{children}</main>
      <Footer />
      <WidgetButton />
    </div>
  );
}
