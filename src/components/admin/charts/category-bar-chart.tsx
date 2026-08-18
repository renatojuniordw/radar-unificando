'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { NameCount } from '@/lib/core/admin/admin-stats';
import { formatDayShort, formatDayFull } from '@/lib/core/admin/date-format';

interface Props {
  title: string;
  data: NameCount[];
  color?: string;
  horizontal?: boolean;
  /** Quando as categorias são datas (YYYY-MM-DD), formata como dd/mm/aa. */
  dateLabels?: boolean;
}

/** Gráfico de barras para contagens por categoria (ex.: buscas por dia, ferramentas usadas). */
export function CategoryBarChart({ title, data, color = '#ccff00', horizontal = false, dateLabels = false }: Props) {
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
        {horizontal ? (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8' }}
            />
            <Tooltip />
            <Bar dataKey="count" fill={color} stroke="#020617" strokeWidth={2} radius={[0, 0, 0, 0]} />
          </BarChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tickFormatter={dateLabels ? (value) => formatDayShort(value as string) : undefined}
              tick={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#94a3b8' }}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip labelFormatter={dateLabels ? (value) => formatDayFull(value as string) : undefined} />
            <Bar dataKey="count" fill={color} stroke="#020617" strokeWidth={2} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}