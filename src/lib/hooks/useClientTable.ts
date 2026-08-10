'use client'

import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

interface Options<T> {
  data: T[]
  searchFields: (keyof T)[]
  initialSort?: { field: keyof T; direction: SortDirection }
  pageSize?: number
}

export function useClientTable<T>({
  data,
  searchFields,
  initialSort,
  pageSize = 10,
}: Options<T>) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState(initialSort ?? null)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.trim().toLowerCase()
    return data.filter((row) =>
      searchFields.some((field) => String(row[field] ?? '').toLowerCase().includes(q))
    )
  }, [data, search, searchFields])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { field, direction } = sort
    return [...filtered].sort((a, b) => {
      const av = a[field]
      const bv = b[field]
      let cmp: number
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''))
      }
      return direction === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const clampedPage = Math.min(page, totalPages)
  const pageData = sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize)

  function toggleSort(field: keyof T) {
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, direction: 'asc' }
      return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
    })
    setPage(1)
  }

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  return {
    search,
    setSearch: updateSearch,
    sort,
    toggleSort,
    page: clampedPage,
    setPage,
    totalPages,
    pageData,
    filteredCount: sorted.length,
  }
}
