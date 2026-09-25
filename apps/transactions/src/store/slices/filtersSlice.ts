import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { TransactionFilters } from '@bytebank/domain'

/**
 * Estado de UI (cliente) separado do estado de servidor (RTK Query):
 * filtros e paginação não são dados da API, então não se misturam com o cache.
 */
export interface FiltersState {
  filters: TransactionFilters
  currentPage: number
  pageSize: number
}

export const initialFilters: TransactionFilters = { type: 'all', category: '', dateFrom: '', dateTo: '', search: '' }

const initialState: FiltersState = { filters: initialFilters, currentPage: 1, pageSize: 10 }

const filtersSlice = createSlice({
  name: 'transactionFilters',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<TransactionFilters>>) {
      state.filters = { ...state.filters, ...action.payload }
      state.currentPage = 1
    },
    resetFilters(state) {
      state.filters = initialFilters
      state.currentPage = 1
    },
    setPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload
    },
  },
})

export const { setFilters, resetFilters, setPage } = filtersSlice.actions
export default filtersSlice.reducer
