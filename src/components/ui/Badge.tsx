export function Badge({
  children,
  tone = 'ink',
}: {
  children: React.ReactNode
  tone?: 'brand' | 'ink' | 'red' | 'green'
}) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-200',
    ink: 'bg-ink-100 text-ink-700 ring-ink-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    green: 'bg-green-50 text-green-700 ring-green-200',
  }[tone]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses}`}
    >
      {children}
    </span>
  )
}
