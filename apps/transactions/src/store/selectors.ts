import { createSelector } from '@reduxjs/toolkit'
import { collectContacts, filterTransactions, paginate, totalPages, type Transaction } from '@bytebank/domain'
import type { RootState } from './index'
import { transactionsApi } from './api/transactionsApi'

const EMPTY: Transaction[] = []

// ─── Seletores base ──────────────────────────────────────────────────────────
const selectListResult = transactionsApi.endpoints.listTransactions.select()
export const selectAllTransactions = (state: RootState) => selectListResult(state).data ?? EMPTY
export const selectFilters = (state: RootState) => state.transactionFilters.filters
export const selectCurrentPage = (state: RootState) => state.transactionFilters.currentPage
const selectPageSize = (state: RootState) => state.transactionFilters.pageSize

// ─── Seletores memorizados (a regra de filtro vem do domínio) ────────────────
export const selectFilteredTransactions = createSelector([selectAllTransactions, selectFilters], filterTransactions)

export const selectPaginatedTransactions = createSelector(
  [selectFilteredTransactions, selectCurrentPage, selectPageSize],
  paginate
)

export const selectTotalPages = createSelector([selectFilteredTransactions, selectPageSize], (filtered, size) =>
  totalPages(filtered.length, size)
)

export const selectFilteredCount = createSelector([selectFilteredTransactions], (filtered) => filtered.length)

export const selectContacts = createSelector([selectAllTransactions], collectContacts)
