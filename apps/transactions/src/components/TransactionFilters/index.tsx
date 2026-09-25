'use client'

import { startTransition, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setFilters, resetFilters } from '@/store/slices/filtersSlice'
import { selectFilteredCount, selectFilters } from '@/store/selectors'
import { Card, CardContent, CardHeader, Input, Select, SelectItem, DatePicker, Combobox } from '@bytebank/ui'
import { CREDIT_CATEGORIES, DEBIT_CATEGORIES } from '@bytebank/domain'
import type { ComboboxOption } from '@bytebank/ui'
import { createSearchPipeline } from '@/presentation/reactive/search-pipeline'
import { useSubjectCallback } from '@/presentation/reactive/hooks'

const ALL_CATEGORY_OPTIONS: ComboboxOption[] = Array.from(
  new Map(
    [...CREDIT_CATEGORIES, ...DEBIT_CATEGORIES].map((c) => [c.value, { value: c.value, label: c.value }])
  ).values()
)

const CREDIT_OPTIONS: ComboboxOption[] = CREDIT_CATEGORIES.map((c) => ({ value: c.value, label: c.value }))
const DEBIT_OPTIONS: ComboboxOption[] = DEBIT_CATEGORIES.map((c) => ({ value: c.value, label: c.value }))

function getCategoryOptions(type: string | undefined): ComboboxOption[] {
  if (type === 'Credit') return CREDIT_OPTIONS
  if (type === 'Debit') return DEBIT_OPTIONS
  return ALL_CATEGORY_OPTIONS
}

export function TransactionFilters() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectFilters)
  const total = useAppSelector(selectFilteredCount)

  // O input responde a cada tecla (estado local); o filtro global só é
  // atualizado pelo stream reativo (debounce + distinct). startTransition
  // marca o refiltro/re-render da lista como não urgente → digitação fluida.
  const [searchText, setSearchText] = useState(filters.search ?? '')
  const pushSearch = useSubjectCallback(createSearchPipeline, (search: string) =>
    startTransition(() => {
      dispatch(setFilters({ search }))
    })
  )

  const clearAll = () => {
    setSearchText('')
    pushSearch('')
    dispatch(resetFilters())
  }

  const categoryOptions = getCategoryOptions(filters.type)

  return (
    <Card role="search" aria-label="Filtros de transação">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <span className="text-sm text-muted-foreground font-medium" aria-live="polite">
          {total} transaç{total !== 1 ? 'ões' : 'ão'} encontrada{total !== 1 ? 's' : ''}
        </span>
        <button
          onClick={clearAll}
          className="text-xs text-primary hover:underline"
          aria-label="Limpar todos os filtros"
        >
          Limpar filtros
        </button>
      </CardHeader>

      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <Input
          type="text"
          label="Buscar"
          placeholder="Buscar transação..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value)
            pushSearch(e.target.value)
          }}
        />

        <Select
          label="Tipo"
          value={filters.type ?? 'all'}
          onValueChange={(v) =>
            dispatch(setFilters({ type: v as 'Credit' | 'Debit' | 'all', category: '' }))
          }
        >
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="Credit">Crédito</SelectItem>
          <SelectItem value="Debit">Débito</SelectItem>
        </Select>

        <Combobox
          label="Categoria"
          placeholder="Todas as categorias"
          searchPlaceholder="Buscar categoria..."
          emptyText="Nenhuma categoria encontrada."
          clearable
          value={filters.category || undefined}
          onValueChange={(v) => dispatch(setFilters({ category: v }))}
          options={categoryOptions}
        />

        <DatePicker
          id="filter-date-from"
          label="De"
          placeholder="Data inicial"
          value={filters.dateFrom ?? ''}
          onChange={(v) => dispatch(setFilters({ dateFrom: v }))}
        />

        <DatePicker
          id="filter-date-to"
          label="Até"
          placeholder="Data final"
          value={filters.dateTo ?? ''}
          onChange={(v) => dispatch(setFilters({ dateTo: v }))}
        />
      </CardContent>
    </Card>
  )
}
