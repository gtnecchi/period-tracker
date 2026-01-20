'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Partnership } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, AlertCircle, CheckCircle } from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkInvite();
  }, []);

  const checkInvite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('招待を受け入れるにはログインが必要です。');
        setLoading(false);
        return;
      }

      const { data: partnership } = await supabase
        .from('partnerships')
        .select('*')
        .eq('invite_token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (!partnership) {
        setError('招待が見つからないか、既に使用されています。');
        setLoading(false);
        return;
      }

      if (partnership.owner_id === user.id) {
        setError('自分自身を招待することはできません。');
        setLoading(false);
        return;
      }

      const { data: ownerData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', partnership.owner_id)
        .single();

      setOwnerName(ownerData?.display_name || 'パートナー');
      setLoading(false);
    } catch (err: any) {
      setError('エラーが発生しました: ' + err.message);
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('ログインしてください。');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('partnerships')
        .update({
          viewer_id: user.id,
          status: 'accepted' as const,
          accepted_at: new Date().toISOString(),
        })
        .eq('invite_token', token);

      if (updateError) throw updateError;

      setAccepted(true);
      
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError('エラーが発生しました: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="w-16 h-16 text-pink-600" />
          </div>
          <CardTitle className="text-2xl">パートナー招待</CardTitle>
          <CardDescription>
            {loading ? '招待を確認中...' : '招待を受け入れますか？'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">エラー</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !accepted && (
            <div className="space-y-4">
              <div className="p-4 bg-pink-50 rounded-lg text-center">
                <p className="text-lg font-medium text-gray-900">
                  <strong>{ownerName}</strong>さんから招待されました
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  招待を受け入れると、パートナーの生理周期カレンダーを閲覧できるようになります。
                </p>
              </div>

              <Button onClick={acceptInvite} className="w-full" size="lg">
                招待を受け入れる
              </Button>

              <p className="text-xs text-gray-500 text-center">
                ※閲覧のみ可能です。データの編集はできません。
              </p>
            </div>
          )}

          {accepted && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">招待を受け入れました！</p>
                  <p className="text-sm text-green-700 mt-1">
                    ダッシュボードに移動します...
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}