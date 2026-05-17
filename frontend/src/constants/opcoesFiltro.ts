/** Fonte única de verdade para as opções dos filtros de período */

export const ANOS_FILTRO = ['2022', '2023', '2024', '2025', '2026']

export const MESES_FILTRO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const MES_PARA_NUMERO: Record<string, string> = {
  'Janeiro': '1', 'Fevereiro': '2', 'Março': '3', 'Abril': '4',
  'Maio': '5', 'Junho': '6', 'Julho': '7', 'Agosto': '8',
  'Setembro': '9', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12',
}

/** Siglas usadas no filtro global de período (ex: dropdown compacto) */
export const ESTADOS_SIGLA = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

/** Nomes completos usados na ListaEntregas (filtro expandido) */
export const ESTADOS_NOME = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
  'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
  'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará',
  'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
  'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima',
  'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
]
