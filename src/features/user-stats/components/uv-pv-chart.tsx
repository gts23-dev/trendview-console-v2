import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { UvPvPoint } from '../model/uv-pv';

interface UvPvChartProps {
  points: UvPvPoint[];
}

const SERIES: {
  key: keyof Pick<
    UvPvPoint,
    'uvCount' | 'pvCount' | 'uvClickCount' | 'articleCount'
  >;
  name: string;
  color: string;
}[] = [
  { key: 'uvCount', name: 'UV (방문)', color: '#2563eb' },
  { key: 'pvCount', name: 'PV (방문)', color: '#059669' },
  { key: 'uvClickCount', name: 'UV (클릭)', color: '#d97706' },
  // 기존 콘솔도 이 계열을 'PV (클릭)'로 표시하지만 실제 값은 article_count다.
  { key: 'articleCount', name: 'PV (클릭)', color: '#7c3aed' },
];

/** 일간 사용자 유입량의 UV·PV 추이 차트. 이 화면에서만 쓰여 공용 UI로
 * 옮기지 않는다. */
export function UvPvChart({ points }: UvPvChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="dateLabel"
            fontSize={12}
            tickLine={false}
            className="fill-muted-foreground"
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
          />
          <Tooltip />
          <Legend />
          {SERIES.map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.name}
              stroke={series.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
