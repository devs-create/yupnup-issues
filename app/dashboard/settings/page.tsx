import { createServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/settings/SettingsClient';

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  return <SettingsClient profile={profile} allProfiles={allProfiles || []} />;
}
