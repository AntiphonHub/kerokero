'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCentsToBrl } from '@/lib/formatters';
import type { ChannelSalesPoint } from '@/lib/appwrite/analytics';

interface ChannelSalesChartProps {
  data: ChannelSalesPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-lg text-xs space-y-1.5 min-w-36">
      <p className="font-semibold text-zinc-500 border-b border-zinc-100 pb-1">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
            <span>{item.name}</span>
          </div>
          <span className="font-bold text-zinc-900">{formatCentsToBrl(item.value)}</span>
        </div>
      ))}
      <div className="pt-1 border-t border-zinc-100 flex items-center justify-between font-extrabold text-zinc-900">
        <span>Total:</span>
        <span>{formatCentsToBrl(total)}</span>
      </div>
    </div>
  );
}

export function ChannelSalesChart({ data }: ChannelSalesChartProps) {
  const hasSales = data.some((d) => d.totalRevenue > 0);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">
          Evolução de Vendas por Canal
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Composição temporal dos recebimentos via PIX Asaas e Maquininha física
        </p>
      </div>

      <div className="h-72 w-full">
        {!hasSales ? (
          <div className="h-full flex flex-col items-center justify-center rounded-xl bg-zinc-50/70 border border-dashed border-zinc-200 text-xs text-zinc-400">
            Nenhuma venda realizada no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />
              <Bar
                name="PIX Asaas"
                dataKey="pixRevenue"
                stackId="channel"
                fill="#F59E0B"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                name="Maquininha"
                dataKey="posRevenue"
                stackId="channel"
                fill="#27272A"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
