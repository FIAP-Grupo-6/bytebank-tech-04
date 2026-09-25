'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader } from '@bytebank/ui'
import type { CreditDebitSplit, MonthlyPoint } from '@bytebank/domain'
import { formatBRL } from '@/lib/format'

/** A agregação (regra de negócio) vem pronta do domínio, calculada no servidor. */
function toChartData(monthly: MonthlyPoint[]) {
  return monthly.map((p) => {
    const [year, month] = p.month.split('-').map(Number)
    return {
      month: format(new Date(year!, (month ?? 1) - 1, 1), 'MMM/yy', { locale: ptBR }),
      credit: p.credit,
      debit: p.debit,
    }
  })
}

const COLORS = ['hsl(148, 80%, 40%)', 'hsl(0, 100%, 71%)']
const AXIS_COLOR = 'hsl(215, 20%, 65%)'
const GRID_COLOR = 'hsl(220, 14%, 15%)'

const TOOLTIP_CONTENT_STYLE = {
  borderRadius: '8px',
  border: '1px solid hsl(220, 14%, 18%)',
  backgroundColor: 'hsl(220, 14%, 10%)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  fontSize: 12,
}
const TOOLTIP_ITEM_STYLE = { color: 'hsl(215, 20%, 88%)' }
const TOOLTIP_LABEL_STYLE = { color: 'hsl(215, 20%, 65%)', fontWeight: 500 }
const TOOLTIP_CURSOR = { fill: 'hsl(220, 14%, 16%)' }


export interface ChartsProps {
  monthly: MonthlyPoint[]
  split: CreditDebitSplit
}

export default function ChartsView({ monthly, split }: ChartsProps) {
  const monthlyData = toChartData(monthly)
  const pieData = [
    { name: 'Entradas', value: split.credit },
    { name: 'Saídas', value: split.debit },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Gráfico de barras — evolução mensal */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Evolução mensal
          </p>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              Sem dados suficientes para exibir o gráfico.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatBRL(value)}
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  cursor={TOOLTIP_CURSOR}
                />
                <Bar dataKey="credit" name="Entradas" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="debit" name="Saídas" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de pizza — distribuição */}
      <Card>
        <CardHeader>
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Distribuição
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatBRL(v)}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: 11, color: AXIS_COLOR }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
