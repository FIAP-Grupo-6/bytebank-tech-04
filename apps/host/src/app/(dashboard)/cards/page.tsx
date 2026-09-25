import { CreditCard } from 'lucide-react'
import type { Card } from '@bytebank/domain'
import { requireSession } from '@/server/session'
import { makeUseCases } from '@/server/container'
import { CardItem } from './CardItem'

export const dynamic = 'force-dynamic'

export default async function CardsPage() {
  const session = await requireSession()
  // Mesmo dado do dashboard (GET /account) → servido pelo cache do servidor.
  const cards: Card[] = await makeUseCases(session).listCards.execute().catch(() => [])
  const totalCards = cards.length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Meus cartões</h1>
        <p className="text-sm text-muted-foreground">
          {totalCards} {totalCards === 1 ? 'cartão vinculado' : 'cartões vinculados'} à sua conta
        </p>
      </div>

      {totalCards === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center border border-border">
          <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum cartão encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}
