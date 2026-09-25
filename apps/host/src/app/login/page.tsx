import { LoginForm } from './LoginForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background flex">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-surface-sidebar">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-foreground font-semibold text-lg">ByteBank</span>
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Controle suas<br />finanças com<br />
            <span className="text-brand-green">clareza.</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Acompanhe entradas, saídas e o saldo da sua conta em tempo real.
          </p>
        </div>
        <p className="text-muted-foreground/40 text-xs">© 2025 ByteBank · FIAP Grupo 6</p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-lg text-foreground">ByteBank</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            Bem-vindo de volta
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Entre na sua conta para continuar
          </p>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem uma conta?{' '}
            <a href="/cadastro" className="text-brand-green font-medium hover:underline">
              Criar conta
            </a>
          </p>
          <p className="text-center text-xs text-foreground/80 mt-3">
            <a href="/sobre" className="text-foreground/80 hover:text-foreground hover:underline transition-colors">
              Sobre o ByteBank
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
