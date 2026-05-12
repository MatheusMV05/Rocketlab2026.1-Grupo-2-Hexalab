/** Utilitários de formatação numérica/textual compartilhados entre organisms e pages */

/** Converte "2024-06" → "Jun" */
const NOMES_MESES: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

export function formatarMes(mesAno: string): string {
  const partes = mesAno.split('-')
  return NOMES_MESES[partes[1]] ?? mesAno
}

/** Formata valor numérico em Real brasileiro compacto (1K, 1M, etc.) */
export function formatarReais(valor: number): string {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (valor >= 1_000)     return `R$ ${(valor / 1_000).toFixed(0)}K`
  return `R$ ${valor.toLocaleString('pt-BR')}`
}

/** Formata valor em Real com casas decimais completas (para KPIs) */
export function formatarReaisCompleto(valor: number): string {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (valor >= 1_000)     return `R$ ${(valor / 1_000).toFixed(0)}K`
  return `R$ ${valor.toLocaleString('pt-BR')}`
}
