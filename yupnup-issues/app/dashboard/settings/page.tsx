import { createServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/settings/SettingsClient';
import ChangePassword from '@/components/settings/ChangePassword';

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  const { data: allProfiles } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: true });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your account and team</p>
      </div>
      <SettingsClient profile={profile} allProfiles={allProfiles || []} />
      <ChangePassword />
    </div>
  );
}
