'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import TodayStatus from '@/components/dashboard/TodayStatus';
import CycleCalendar from '@/components/dashboard/CycleCalendar';
import PartnerInvite from '@/components/dashboard/PartnerInvite';
import { Cycle, Profile } from '@/types/database';
import { User } from '@supabase/supabase-js';
import { LogOut, Settings } from 'lucide-react';

interface DashboardClientProps {
  user: User;
  profile: Profile;
  ownerProfile: Profile;
  cycles: Cycle[];
  isOwner: boolean;
}

export default function DashboardClient({
  user,
  profile,
  ownerProfile,
  cycles: initialCycles,
  isOwner,
}: DashboardClientProps) {
  const [cycles, setCycles] = useState(initialCycles);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const refreshCycles = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-pink-600">
                カップル生理日共有
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isOwner
                  ? `${profile.display_name || 'あなた'}のカレンダー`
                  : `${ownerProfile.display_name || 'パートナー'}のカレンダー（閲覧モード）`}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: 今日の状態 */}
          <div className="lg:col-span-1 space-y-6">
            <TodayStatus
              cycles={cycles}
              ownerName={ownerProfile.display_name || undefined}
              isOwner={isOwner}
            />
            <PartnerInvite userId={user.id} isOwner={isOwner} />
          </div>

          {/* 右カラム: カレンダー */}
          <div className="lg:col-span-2">
            <CycleCalendar
              cycles={cycles}
              userId={ownerProfile.id}
              isOwner={isOwner}
              onCycleAdded={refreshCycles}
            />
          </div>
        </div>

        {/* フッター */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© 2026 カップル生理日共有アプリ</p>
          <p className="mt-1">
            このアプリの予測はあくまで目安です。医学的な診断や避妊方法としての使用は推奨されません。
          </p>
        </footer>
      </main>
    </div>
  );
}