import { requireSession } from '@/server/session'
import { Sidebar } from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // O middleware já barrou quem não tem cookie; aqui validamos o conteúdo (defesa em profundidade).
  await requireSession()

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
    </div>
  )
}
