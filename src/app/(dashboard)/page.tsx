import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 現在のユーザーのプロファイル取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // パートナーシップを確認
  const { data: partnerships } = await supabase
    .from('partnerships')
    .select('*')
    .or(`owner_id.eq.${user.id},viewer_id.eq.${user.id}`)
    .eq('status', 'accepted');

  // 表示するデータの所有者を決定
  let dataOwnerId = user.id;
  let isOwner = true;
  let ownerProfile = profile;

  if (partnerships && partnerships.length > 0) {
    const partnership = partnerships[0];
    if (partnership.viewer_id === user.id) {
      // 自分が閲覧者の場合、所有者のデータを表示
      dataOwnerId = partnership.owner_id;
      isOwner = false;

      const { data: owner } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', dataOwnerId)
        .single();

      if (owner) {
        ownerProfile = owner;
      }
    }
  }

  // 周期データ取得
  const { data: cycles } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', dataOwnerId)
    .order('start_date', { ascending: false });

  return (
    <DashboardClient
      user={user}
      profile={profile}
      ownerProfile={ownerProfile}
      cycles={cycles || []}
      isOwner={isOwner}
    />
  );
}