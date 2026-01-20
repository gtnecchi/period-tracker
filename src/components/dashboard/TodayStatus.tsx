'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cycle } from '@/types/database';
import { getTodaySummary } from '@/lib/utils/calculateCycle';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar, AlertCircle, Heart } from 'lucide-react';

interface TodayStatusProps {
  cycles: Cycle[];
  ownerName?: string;
  isOwner: boolean;
}

export default function TodayStatus({ cycles, ownerName, isOwner }: TodayStatusProps) {
  const { dayInfo, cycleData, daysUntilNextPeriod } = getTodaySummary(cycles);

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-600" />
          今日の状態
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 今日のフェーズ */}
        <div className={`p-4 rounded-lg ${dayInfo.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {format(new Date(), 'yyyy年M月d日 (E)', { locale: ja })}
              </p>
              <p className={`text-2xl font-bold ${dayInfo.color} mt-1`}>
                {dayInfo.label}
              </p>
              <p className="text-sm text-gray-600 mt-1">{dayInfo.description}</p>
            </div>
            {dayInfo.phase === 'menstruation' && (
              <Heart className="w-12 h-12 text-red-500" />
            )}
          </div>
        </div>

        {/* 次回生理予定日 */}
        {cycleData.nextPeriodDate && daysUntilNextPeriod !== null && (
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-pink-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">次回生理予定日</p>
              <p className="text-sm text-gray-600">
                {format(cycleData.nextPeriodDate, 'M月d日 (E)', { locale: ja })}
                {daysUntilNextPeriod > 0 && (
                  <span className="ml-2 text-pink-600 font-medium">
                    あと{daysUntilNextPeriod}日
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* データ不足の警告 */}
        {cycles.length < 2 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>データが不足しています。</strong>
              {isOwner
                ? ' 正確な予測には、最低2回分の生理記録が必要です。'
                : ' データの入力は所有者のみが可能です。'}
            </p>
          </div>
        )}

        {/* 免責事項 */}
        <div className="text-xs text-gray-500 border-t pt-3">
          ⚠️ この予測はあくまで目安です。避妊や妊活の確実性を保証するものではありません。
        </div>
      </CardContent>
    </Card>
  );
}