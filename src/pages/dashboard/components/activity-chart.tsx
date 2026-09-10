import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SERIES = [
  { date: '09.01', views: 184 },
  { date: '09.02', views: 260 },
  { date: '09.03', views: 220 },
  { date: '09.04', views: 390 },
  { date: '09.05', views: 315 },
  { date: '09.06', views: 470 },
  { date: '09.07', views: 420 },
];
export function ActivityChart() {
  return (
    <div
      className="h-[250px] w-full"
      role="img"
      aria-label="예제 일별 조회수: 9월 1일 184회, 2일 260회, 3일 220회, 4일 390회, 5일 315회, 6일 470회, 7일 420회"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={SERIES}
          margin={{ top: 15, right: 12, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 4"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            dy={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid var(--border)',
              fontSize: 12,
            }}
            formatter={(value) => [`${value}회`, '조회수']}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="var(--primary)"
            fill="url(#activity-fill)"
            strokeWidth={2.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
