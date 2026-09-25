import { distinctUntilChanged, fromEvent, map, merge, of, shareReplay, type Observable } from 'rxjs'

/**
 * Stream reativo do estado de conexão do browser. Combina os eventos
 * `online`/`offline` com o valor inicial e só emite quando muda.
 * `shareReplay` garante UMA única assinatura dos eventos do window, não
 * importa quantos componentes observem.
 */
let shared: Observable<boolean> | null = null

export function connectivity$(): Observable<boolean> {
  if (typeof window === 'undefined') return of(true)
  shared ??= merge(
    of(navigator.onLine),
    fromEvent(window, 'online').pipe(map(() => true)),
    fromEvent(window, 'offline').pipe(map(() => false))
  ).pipe(distinctUntilChanged(), shareReplay({ bufferSize: 1, refCount: true }))
  return shared
}
