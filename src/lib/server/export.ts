// ─── Export CSV — côté serveur ────────────────────────────────────────────────
// Utilisé par les routes API /api/export/*

export function toCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
): string {
  const header = columns.map(c => escapeCsvField(c.label)).join(',')
  const body = rows.map(row =>
    columns.map(c => escapeCsvField(String(row[c.key] ?? ''))).join(','),
  )
  return '\uFEFF' + [header, ...body].join('\r\n') // BOM UTF-8 pour Excel
}

export function csvHeaders(filename: string): Record<string, string> {
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  }
}

export function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
