'use client'

import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore)
  return (
    <Provider store={store}>
      {/* Sem refetch periódico: a sessão pública só carrega dados de exibição. */}
      <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
    </Provider>
  )
}
