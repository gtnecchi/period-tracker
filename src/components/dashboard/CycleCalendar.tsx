'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cycle } from '@/types/database';
import { calculateCycleData, getDayInfo } from '@/lib/utils/calculateCycle';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  format,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CycleCalendarProps {
  cycles: Cycle[];
  userId: string;
  isOwner: boolean;
  onCycleAdded: () => void;
}

export default function CycleCalendar({ cycles, userId, isOwner, onCycleAdded }: CycleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const cycleData = calculateCycleData(cycles);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { locale: ja });
  const calendarEnd = endOfWeek(monthEnd, { locale: ja });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const handleAddCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('cycles').insert({
        user_id: userId,
        start_date: startDate,
        end_date: endDate || null,
      });

      if (error) throw error;

      setStartDate('');
      setEndDate('');
      setShowAddForm(false);
      onCycleAdded();
    } catch (error: any) {
      alert('エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>カレンダー</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {format(currentMonth, 'yyyy年M月', { locale: ja })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 生理記録追加フォーム（所有者のみ） */}
        {isOwner && (
          <div>
            {!showAddForm ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                生理日を記録
              </Button>
            ) : (
              <form onSubmit={handleAddCycle} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">開始日</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">終了日（任意）</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* カレンダーグリッド */}
        <div>
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 mb-2">
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const dayInfo = getDayInfo(day, cycles, cycleData);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={idx}
                  className={`
                    aspect-square p-1 rounded-lg border transition-all
                    ${isCurrentMonth ? 'border-gray-200' : 'border-transparent'}
                    ${isToday ? 'ring-2 ring-pink-600' : ''}
                    ${dayInfo.bgColor}
                  `}
                >
                  <div className="h-full flex flex-col items-center justify-center">
                    <span
                      className={`text-sm font-medium ${
                        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {isCurrentMonth && dayInfo.phase !== 'safe' && dayInfo.phase !== 'unknown' && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        dayInfo.phase === 'menstruation' ? 'bg-red-600' :
                        dayInfo.phase === 'pms' ? 'bg-yellow-600' :
                        dayInfo.phase === 'ovulation' ? 'bg-purple-600' :
                        'bg-pink-600'
                      }`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 凡例 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
            <span>生理中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
            <span>PMS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border border-purple-200"></div>
            <span>排卵日</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pink-100 border border-pink-200"></div>
            <span>危険期</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}