import { debounceTime, distinctUntilChanged, map, type Observable, type SchedulerLike, asyncScheduler } from 'rxjs'

/**
 * ─── PROGRAMAÇÃO REATIVA: busca textual como stream ─────────────────────────
 *
 * Cada tecla vira um evento no stream. O pipeline:
 *  1. debounceTime  → espera o usuário parar de digitar (300 ms) antes de
 *                     recalcular filtros/paginação/contagem — evita refiltrar
 *                     a lista inteira a cada tecla;
 *  2. map(trim)     → "  aluguel " e "aluguel" são a mesma busca;
 *  3. distinctUntilChanged → não emite se o termo efetivo não mudou.
 *
 * Função pura sobre Observables (sem React) → testável com marble tests
 * (TestScheduler), ver search-pipeline.test.ts.
 */
export interface SearchPipelineOptions {
  debounceMs?: number
  scheduler?: SchedulerLike
}

export function createSearchPipeline(
  terms$: Observable<string>,
  { debounceMs = 300, scheduler = asyncScheduler }: SearchPipelineOptions = {}
): Observable<string> {
  return terms$.pipe(
    debounceTime(debounceMs, scheduler),
    map((term) => term.trim()),
    distinctUntilChanged()
  )
}
