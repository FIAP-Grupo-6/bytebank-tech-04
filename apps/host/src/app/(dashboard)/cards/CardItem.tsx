import type { Card } from "@bytebank/domain";
import { Logo } from "@bytebank/ui";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Lock, Unlock } from "lucide-react";

export function CardItem({ card }: { card: Card }) {
    function maskCardNumber(number: string) {
        return '**** **** **** ' + number.slice(-4)
    }

    return (
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="bg-gradient-to-br from-surface-sidebar to-brand-green rounded-xl p-5 mb-4 text-white">
                <div className="flex justify-between items-start mb-8">
                    <Logo size="md" withText={false} />
                    <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                        {card.functions}
                    </span>
                </div>
                <p className="font-mono text-sm tracking-widest mb-4">
                    {maskCardNumber(card.number)}
                </p>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs opacity-60 mb-0.5">Titular</p>
                        <p className="text-sm font-semibold">{card.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs opacity-60 mb-0.5">Validade</p>
                        <p className="text-sm font-semibold">
                            {format(new Date(card.dueDate), 'MM/yy', { locale: ptBR })}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                        {card.type}
                    </span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        card.is_blocked
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                >
                    {card.is_blocked ? (
                        <>
                            <Lock className="w-3 h-3" /> Bloqueado
                        </>
                    ) : (
                        <>
                            <Unlock className="w-3 h-3" /> Ativo
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}