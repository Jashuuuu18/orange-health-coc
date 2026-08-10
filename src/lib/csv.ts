export function toCsv<T extends object>(
  rows: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const escape = (value: unknown) => {
    const str = String(value ?? '')
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  const header = columns.map((c) => escape(c.label)).join(',')
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(',')).join('\n')
  return `${header}\n${body}`
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
