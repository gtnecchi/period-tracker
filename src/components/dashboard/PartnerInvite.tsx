'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Partnership, Profile } from '@/types/database';
import { Copy, UserPlus, Users, X } from 'lucide-react';

interface PartnerInviteProps {
  userId: string;
  isOwner: boolean;
}

export default function PartnerInvite({ userId, isOwner }: PartnerInviteProps) {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [partners, setPartners] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchPartnerships();
  }, []);

  const fetchPartnerships = async () => {
    try {
      const { data, error } = await supabase
        .from('partnerships')
        .select('*')
        .or(`owner_id.eq.${userId},viewer_id.eq.${userId}`);

      if (error) throw error;
      setPartnerships(data || []);

      // パートナー情報を取得
      if (data && data.length > 0) {
        const partnerIds = data
          .map((p) => (p.owner_id === userId ? p.viewer_id : p.owner_id))
          .filter((id): id is string => id !== null);

        if (partnerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', partnerIds);

          setPartners(profilesData || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching partnerships:', error);
    }
  };

  const generateInviteLink = async () => {
    if (!isOwner) return;

    setLoading(true);
    try {
      // トークン生成
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);

      const { error } = await supabase.from('partnerships').insert({
        owner_id: userId,
        invite_token: token,
        status: 'pending',
      });

      if (error) throw error;

      const url = `${window.location.origin}/invite/${token}`;
      setInviteUrl(url);
      await fetchPartnerships();
    } catch (error: any) {
      alert('エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert('リンクをコピーしました！');
  };

  const revokeInvite = async (partnershipId: string) => {
    if (!confirm('本当にこの招待を取り消しますか？')) return;

    try {
      const { error } = await supabase
        .from('partnerships')
        .delete()
        .eq('id', partnershipId);

      if (error) throw error;
      await fetchPartnerships();
      setInviteUrl('');
    } catch (error: any) {
      alert('エラー: ' + error.message);
    }
  };

  const acceptedPartners = partnerships.filter((p) => p.status === 'accepted');
  const pendingInvites = partnerships.filter((p) => p.status === 'pending' && p.owner_id === userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-600" />
          パートナー共有
        </CardTitle>
        <CardDescription>
          {isOwner
            ? 'パートナーを招待してデータを共有できます'
            : '閲覧権限のみ持っています'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 受諾済みパートナー */}
        {acceptedPartners.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">共有中のパートナー</h4>
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{partner.display_name || 'ユーザー'}</p>
                  <p className="text-sm text-gray-600">{partner.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 招待リンク生成（所有者のみ） */}
        {isOwner && (
          <div>
            {pendingInvites.length === 0 && !inviteUrl ? (
              <Button
                onClick={generateInviteLink}
                disabled={loading}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? '生成中...' : '招待リンクを生成'}
              </Button>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">招待リンク</h4>
                {pendingInvites.map((invite) => {
                  const url = `${window.location.origin}/invite/${invite.invite_token}`;
                  return (
                    <div key={invite.id} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={url}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm border rounded-lg bg-gray-50"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(url);
                            alert('リンクをコピーしました！');
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => revokeInvite(invite.id)}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        招待を取り消す
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isOwner && acceptedPartners.length === 0 && (
          <p className="text-sm text-gray-600">
            現在、パートナーとの共有はありません。
          </p>
        )}
      </CardContent>
    </Card>
  );
}