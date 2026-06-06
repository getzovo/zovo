import { createServerSupabaseClient } from '@/lib/supabase-server';
import DashboardSidebar from '@/components/dashboard-sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let tier = 'free';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();
    if (profile?.tier) tier = profile.tier;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0A0A' }}>
      <DashboardSidebar tier={tier} />
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
