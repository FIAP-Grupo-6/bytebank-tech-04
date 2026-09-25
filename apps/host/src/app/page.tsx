import { redirect } from 'next/navigation'
import { getServerSessionData } from '@/server/session'

export default async function HomePage() {
  redirect((await getServerSessionData()) ? '/dashboard' : '/login')
}
