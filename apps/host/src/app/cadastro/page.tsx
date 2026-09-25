import { RegisterForm } from './RegisterForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { redirect } from 'next/navigation'

export default async function CadastroPage() {
  const session = await getServerSession(authOptions)
  
  if (session !== null) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-lg text-foreground">ByteBank</span>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-1">Criar conta</h2>
        <p className="text-muted-foreground text-sm mb-8">
          Preencha os dados abaixo para começar
        </p>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem uma conta?{' '}
          <a href="/login" className="text-brand-green font-medium hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}
