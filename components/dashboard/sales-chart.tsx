'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCentsToBrl } from '@/lib/formatters';
import type { SalesTimePoint } from '@/lib/appwrite/dashboard';

interface SalesChartProps {
  data: SalesTimePoint[];
  title?: string;
  subtitle?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: SalesTimePoint }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const current = payload[0].payload;

  return (
    <div className="rounded-xl border border-amber-200/70 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-zinc-500 mb-1">{label}</p>
      <div className="space-y-0.5">
        <p className="text-sm font-extrabold text-amber-600">
          {formatCentsToBrl(current.revenue)}
        </p>
        <p className="text-zinc-500">
          {current.ordersCount} {current.ordersCount === 1 ? 'pedido' : 'pedidos'}
        </p>
      </div>
    </div>
  );
}

export function SalesChart({
  data,
  title = 'Vendas no Tempo',
  subtitle = 'Evolução do faturamento bruto no período',
}: SalesChartProps) {
  const hasSales = data.some((d) => d.revenue > 0);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="h-64 w-full">
        {!hasSales ? (
          <div className="h-full flex flex-col items-center justify-center rounded-xl bg-zinc-50/70 border border-dashed border-zinc-200 text-xs text-zinc-400">
            Nenhuma venda registrada no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
              <XAxis
                dataKey="label"
                stroke="#A1A1AA"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#A1A1AA"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => {
                  if (val === 0) return 'R$ 0';
                  return `R$ ${(val / 100).toFixed(0)}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#F59E0B"
                strokeWidth={2.5}
                activeDot={{ r: 5, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 2 }}
                fillOpacity={1}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
