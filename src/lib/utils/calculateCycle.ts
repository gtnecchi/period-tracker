import { Cycle } from '@/types/database';
import { addDays, differenceInDays, format, isSameDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export type PeriodPhase = 
  | 'menstruation'      // 生理中
  | 'pms'               // PMS期間
  | 'ovulation'         // 排卵日
  | 'fertile'           // 妊娠しやすい期間（危険期）
  | 'safe'              // 安全目安
  | 'unknown';          // データ不足

export interface CycleData {
  nextPeriodDate: Date | null;
  averageCycleLength: number | null;
  ovulationDate: Date | null;
  pmsStartDate: Date | null;
  pmsEndDate: Date | null;
  fertileWindowStart: Date | null;
  fertileWindowEnd: Date | null;
}

export interface DayInfo {
  date: Date;
  phase: PeriodPhase;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

/**
 * 直近3回の周期から平均周期を計算
 */
export function calculateAverageCycle(cycles: Cycle[]): number | null {
  if (cycles.length < 2) return null;

  // 開始日でソート（新しい順）
  const sortedCycles = [...cycles].sort((a, b) => 
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  // 直近3回の周期を計算
  const recentCycles = sortedCycles.slice(0, 3);
  const cycleLengths: number[] = [];

  for (let i = 0; i < recentCycles.length - 1; i++) {
    const current = parseISO(recentCycles[i].start_date);
    const previous = parseISO(recentCycles[i + 1].start_date);
    const length = differenceInDays(current, previous);
    
    if (length > 0 && length < 60) { // 異常値を除外
      cycleLengths.push(length);
    }
  }

  if (cycleLengths.length === 0) return null;

  // 平均を計算
  const average = cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length;
  return Math.round(average);
}

/**
 * 次回生理日と関連日付を計算
 */
export function calculateCycleData(cycles: Cycle[]): CycleData {
  const averageCycleLength = calculateAverageCycle(cycles);

  if (!averageCycleLength || cycles.length === 0) {
    return {
      nextPeriodDate: null,
      averageCycleLength: null,
      ovulationDate: null,
      pmsStartDate: null,
      pmsEndDate: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
    };
  }

  // 最新の生理開始日
  const latestCycle = cycles.sort((a, b) => 
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )[0];

  const lastPeriodStart = parseISO(latestCycle.start_date);

  // 次回生理予定日 = 最新の開始日 + 平均周期
  const nextPeriodDate = addDays(lastPeriodStart, averageCycleLength);

  // 排卵推定日 = 次回生理予定日の14日前
  const ovulationDate = addDays(nextPeriodDate, -14);

  // PMS期間 = 生理予定日の7日前〜前日
  const pmsStartDate = addDays(nextPeriodDate, -7);
  const pmsEndDate = addDays(nextPeriodDate, -1);

  // 妊娠しやすい期間 = 排卵日の前3日〜後1日
  const fertileWindowStart = addDays(ovulationDate, -3);
  const fertileWindowEnd = addDays(ovulationDate, 1);

  return {
    nextPeriodDate,
    averageCycleLength,
    ovulationDate,
    pmsStartDate,
    pmsEndDate,
    fertileWindowStart,
    fertileWindowEnd,
  };
}

/**
 * 特定の日付の周期フェーズを判定
 */
export function getPhaseForDate(
  date: Date,
  cycles: Cycle[],
  cycleData: CycleData
): PeriodPhase {
  // 生理中かチェック
  const ongoingPeriod = cycles.find(cycle => {
    const start = parseISO(cycle.start_date);
    const end = cycle.end_date ? parseISO(cycle.end_date) : addDays(start, 5); // デフォルト5日
    return date >= start && date <= end;
  });

  if (ongoingPeriod) return 'menstruation';

  // データ不足の場合
  if (!cycleData.nextPeriodDate) return 'unknown';

  const {
    nextPeriodDate,
    ovulationDate,
    pmsStartDate,
    pmsEndDate,
    fertileWindowStart,
    fertileWindowEnd,
  } = cycleData;

  // 次回生理日から5日間は生理中として扱う
  const periodEnd = addDays(nextPeriodDate!, 5);
  if (date >= nextPeriodDate! && date <= periodEnd) {
    return 'menstruation';
  }

  // 排卵日
  if (ovulationDate && isSameDay(date, ovulationDate)) {
    return 'ovulation';
  }

  // 妊娠しやすい期間（危険期）
  if (fertileWindowStart && fertileWindowEnd &&
      date >= fertileWindowStart && date <= fertileWindowEnd) {
    return 'fertile';
  }

  // PMS期間
  if (pmsStartDate && pmsEndDate &&
      date >= pmsStartDate && date <= pmsEndDate) {
    return 'pms';
  }

  // それ以外は安全目安
  return 'safe';
}

/**
 * フェーズに基づいた表示情報を取得
 */
export function getPhaseInfo(phase: PeriodPhase): Omit<DayInfo, 'date'> {
  switch (phase) {
    case 'menstruation':
      return {
        phase,
        label: '生理中',
        description: '生理期間中です',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      };
    case 'pms':
      return {
        phase,
        label: 'PMS',
        description: 'PMS期間（生理前症候群）',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      };
    case 'ovulation':
      return {
        phase,
        label: '排卵日',
        description: '排卵推定日',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      };
    case 'fertile':
      return {
        phase,
        label: '危険期',
        description: '妊娠しやすい期間',
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
      };
    case 'safe':
      return {
        phase,
        label: '安全目安',
        description: '比較的安全な期間',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    case 'unknown':
      return {
        phase,
        label: 'データ不足',
        description: '周期データが不足しています',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
      };
  }
}

/**
 * 特定日付の完全な情報を取得
 */
export function getDayInfo(
  date: Date,
  cycles: Cycle[],
  cycleData: CycleData
): DayInfo {
  const phase = getPhaseForDate(date, cycles, cycleData);
  const info = getPhaseInfo(phase);
  
  return {
    date,
    ...info,
  };
}

/**
 * 今日の状態サマリーを取得
 */
export function getTodaySummary(cycles: Cycle[]): {
  dayInfo: DayInfo;
  cycleData: CycleData;
  daysUntilNextPeriod: number | null;
} {
  const cycleData = calculateCycleData(cycles);
  const today = new Date();
  const dayInfo = getDayInfo(today, cycles, cycleData);

  const daysUntilNextPeriod = cycleData.nextPeriodDate
    ? differenceInDays(cycleData.nextPeriodDate, today)
    : null;

  return {
    dayInfo,
    cycleData,
    daysUntilNextPeriod,
  };
}