'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DayCount } from '@/lib/core/admin/admin-stats';
import { formatDayShort, formatDayFull } from '@/lib/core/admin/date-format';

interface Props {
  title: string;
  data: DayCount[];
  color?: string;
}

/** Gráfico de linha para séries temporais diárias (ex.: usuários/logins por dia). */
export function SeriesChart({ title, data, color = '#ccff00' }: Props) {
  return (
    <div className="card-brutalist" style={{ padding: 20 }}>
      <h2
        style={{
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          fontSize: '0.8rem',
          color: '#020617',
          margin: '0 0 16px',
        }}
      >
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDayShort(value as string)}
            tick={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
            tickLine={false}
            axisLine={{ stroke: '#94a3b8' }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip labelFormatter={(value) => formatDayFull(value as string)} />
          <Line type="monotone" dataKey="count" stroke={color} strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}