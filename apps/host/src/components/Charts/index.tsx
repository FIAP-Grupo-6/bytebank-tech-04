'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader } from '@bytebank/ui'
import type { ChartsProps } from './ChartsView'

/**
 * ─── LAZY LOADING ───────────────────────────────────────────────────────────
 * O Recharts (+ d3) é a maior dependência do dashboard. Ele sai do bundle
 * inicial e vira um chunk separado, carregado depois da hidratação. O
 * `ssr: false` é deliberado: o ResponsiveContainer precisa medir o DOM,
 * então renderizar no servidor só geraria HTML vazio.
 * Enquanto carrega, um skeleton com as MESMAS dimensões evita layout shift (CLS).
 */
function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Carregando gráficos">
      {['lg:col-span-2', ''].map((span, i) => (
        <Card key={i} className={span}>
          <CardHeader>
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] rounded-lg bg-muted/50 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const ChartsView = dynamic(() => import('./ChartsView'), { ssr: false, loading: ChartsSkeleton })

export function Charts(props: ChartsProps) {
  return <ChartsView {...props} />
}
