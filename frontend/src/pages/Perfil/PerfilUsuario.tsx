import { useState } from 'react'
import { XCircle, Search, CheckCircle } from 'react-feather'
import { LayoutPrincipal } from '../../components/templates/LayoutPrincipal'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

type Estado = 'perfil' | 'edicao' | 'confirmacao' | 'sucesso'

function iniciais(nome: string): string {
  const partes = nome.trim().split(' ').filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0][0].toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function splitNome(nome: string) {
  const idx = nome.indexOf(' ')
  if (idx === -1) return { primeiroNome: nome, sobrenome: '' }
  return { primeiroNome: nome.slice(0, idx), sobrenome: nome.slice(idx + 1) }
}

export default function PerfilUsuario() {
  const { usuario, atualizarUsuario } = useAuth()
  const [estado, setEstado] = useState<Estado>('perfil')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const { primeiroNome: pnAtual, sobrenome: snAtual } = splitNome(usuario?.nome ?? '')

  const [form, setForm] = useState({
    primeiroNome: pnAtual,
    sobrenome: snAtual,
    genero: usuario?.genero ?? '',
    pais: usuario?.pais ?? '',
    area_empresa: usuario?.area_empresa ?? '',
    filial: usuario?.filial ?? '',
  })

  function abrirEdicao() {
    const { primeiroNome: pn, sobrenome: sn } = splitNome(usuario?.nome ?? '')
    setForm({
      primeiroNome: pn,
      sobrenome: sn,
      genero: usuario?.genero ?? '',
      pais: usuario?.pais ?? '',
      area_empresa: usuario?.area_empresa ?? '',
      filial: usuario?.filial ?? '',
    })
    setErro('')
    setEstado('edicao')
  }

  async function confirmar() {
    setSalvando(true)
    setErro('')
    try {
      const nome = [form.primeiroNome.trim(), form.sobrenome.trim()].filter(Boolean).join(' ')
      const { data } = await api.put('/auth/perfil', {
        nome,
        genero: form.genero || null,
        pais: form.pais || null,
        area_empresa: form.area_empresa || null,
        filial: form.filial || null,
      })
      atualizarUsuario(data)
      setEstado('sucesso')
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
      setEstado('edicao')
    } finally {
      setSalvando(false)
    }
  }

  const nomeAtual = usuario?.nome ?? ''

  return (
    <LayoutPrincipal titulo="PERFIL DO USUÁRIO">

      {/* ── Card principal ── rx=10, shadow blur=15 dy=8 conforme SVG */}
      <div
        className="bg-white p-10"
        style={{
          borderRadius: '10px',
          boxShadow: '0px 8px 30px rgba(0,0,0,0.08)',
        }}
      >
        {/* Cabeçalho: avatar 168px + nome/email + botão Editar */}
        <div className="flex items-center gap-8 mb-12">

          {/* Avatar — r=84 → 168px de diâmetro conforme SVG */}
          <div
            className="flex-shrink-0 flex items-center justify-center text-white font-semibold select-none"
            style={{
              width: 168,
              height: 168,
              borderRadius: '50%',
              backgroundColor: '#1D5358',
              fontSize: 48,
            }}
          >
            {iniciais(nomeAtual || 'U')}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1D1D1D] truncate" style={{ fontSize: 20 }}>
              {nomeAtual}
            </p>
            <p className="text-[#6B6B6B] mt-1 truncate" style={{ fontSize: 14 }}>
              {usuario?.email}
            </p>
          </div>

          {/* Botão Editar — rx=5, width=93, height=44, fill=#1D5358 conforme SVG */}
          <button
            onClick={abrirEdicao}
            className="flex-shrink-0 text-white font-semibold hover:opacity-90 transition-opacity"
            style={{
              width: 93,
              height: 44,
              borderRadius: 5,
              backgroundColor: '#1D5358',
              fontSize: 14,
            }}
          >
            Editar
          </button>
        </div>

        {/* Campos somente leitura — height=52, rx=8, bg=#F9F9F9 conforme SVG */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          {[
            { label: 'Primeiro nome', valor: pnAtual },
            { label: 'Sobrenome', valor: snAtual },
            { label: 'Gênero', valor: usuario?.genero ?? '' },
            { label: 'País', valor: usuario?.pais ?? '' },
            { label: 'Área da empresa', valor: usuario?.area_empresa ?? '' },
            { label: 'Filial', valor: usuario?.filial ?? '' },
          ].map(({ label, valor }) => (
            <div key={label} className="flex flex-col gap-2">
              <span className="font-medium text-[#1D1D1D]" style={{ fontSize: 14 }}>{label}</span>
              <div
                className="flex items-center px-4 text-[#B8B8B8]"
                style={{
                  height: 52,
                  borderRadius: 8,
                  backgroundColor: '#F9F9F9',
                  fontSize: 14,
                }}
              >
                {valor || label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal de edição ── */}
      {estado === 'edicao' && (
        <Overlay>
          {/* Modal: width=1182, height=610, rx=10, bg=#F6F7F9 conforme SVG */}
          <div
            className="w-full mx-4 flex flex-col overflow-hidden"
            style={{
              maxWidth: 1182,
              borderRadius: 10,
              backgroundColor: '#F6F7F9',
            }}
          >
            {/* Header com título centralizado + X — altura ~76px conforme divisor no SVG */}
            <div
              className="relative flex items-center justify-center flex-shrink-0"
              style={{
                height: 76,
                borderBottom: '1px solid rgba(224,224,224,0.3)',
              }}
            >
              <span className="text-[#1D1D1D] font-medium" style={{ fontSize: 14 }}>
                Edição do perfil do usuário
              </span>
              <button
                onClick={() => setEstado('perfil')}
                className="absolute right-5 text-[#6B6B6B] hover:text-[#1D1D1D] transition-colors"
              >
                <XCircle size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Campos — padding lateral ~20px conforme posição dos inputs no SVG */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 px-5 pt-6 pb-4">

              {/* Primeiro nome */}
              <InputTexto
                label="Primeiro nome"
                value={form.primeiroNome}
                onChange={v => setForm(f => ({ ...f, primeiroNome: v }))}
              />

              {/* Sobrenome */}
              <InputTexto
                label="Sobrenome"
                value={form.sobrenome}
                onChange={v => setForm(f => ({ ...f, sobrenome: v }))}
              />

              {/* Gênero */}
              <InputTexto
                label="Gênero"
                value={form.genero}
                onChange={v => setForm(f => ({ ...f, genero: v }))}
              />

              {/* País */}
              <InputTexto
                label="País"
                value={form.pais}
                onChange={v => setForm(f => ({ ...f, pais: v }))}
              />

              {/* Área da empresa — campo busca com tag */}
              <InputBusca
                label="Área da empresa"
                value={form.area_empresa}
                onChange={v => setForm(f => ({ ...f, area_empresa: v }))}
                onRemove={() => setForm(f => ({ ...f, area_empresa: '' }))}
              />

              {/* Filial — campo busca com tag */}
              <InputBusca
                label="Filial"
                value={form.filial}
                onChange={v => setForm(f => ({ ...f, filial: v }))}
                onRemove={() => setForm(f => ({ ...f, filial: '' }))}
              />
            </div>

            {erro && <p className="text-xs text-red-600 text-center">{erro}</p>}

            {/* Botões — posição y=751 no canvas, rx=17/17.5 conforme SVG */}
            <div className="flex justify-end gap-3 px-5 pb-6 pt-3">
              <button
                onClick={() => setEstado('perfil')}
                className="text-[#1D1D1D] hover:bg-gray-100 transition-colors"
                style={{
                  height: 34,
                  paddingLeft: 20,
                  paddingRight: 20,
                  borderRadius: 17,
                  border: '1px solid #000',
                  backgroundColor: 'white',
                  fontSize: 13,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => setEstado('confirmacao')}
                className="text-white font-semibold hover:opacity-90 transition-opacity"
                style={{
                  height: 35,
                  paddingLeft: 20,
                  paddingRight: 20,
                  borderRadius: 17.5,
                  backgroundColor: '#1D5358',
                  fontSize: 13,
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Modal de confirmação ── */}
      {estado === 'confirmacao' && (
        <Overlay>
          <div
            className="bg-white mx-4 px-8 py-8 flex flex-col items-center gap-6"
            style={{ maxWidth: 340, width: '100%', borderRadius: 10 }}
          >
            <p className="font-medium text-[#1D1D1D] text-center leading-relaxed" style={{ fontSize: 14 }}>
              Deseja realmente editar o perfil do usuário?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEstado('edicao')}
                className="text-[#1D1D1D] hover:bg-gray-100 transition-colors"
                style={{
                  height: 34,
                  paddingLeft: 20,
                  paddingRight: 20,
                  borderRadius: 17,
                  border: '1px solid #000',
                  backgroundColor: 'white',
                  fontSize: 13,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={salvando}
                className="text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{
                  height: 35,
                  paddingLeft: 20,
                  paddingRight: 20,
                  borderRadius: 17.5,
                  backgroundColor: '#1D5358',
                  fontSize: 13,
                }}
              >
                {salvando ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Modal de sucesso ── */}
      {estado === 'sucesso' && (
        <Overlay onClick={() => setEstado('perfil')}>
          <div
            className="bg-white mx-4 px-8 py-8 flex flex-col items-center gap-4"
            style={{ maxWidth: 280, width: '100%', borderRadius: 10 }}
            onClick={e => e.stopPropagation()}
          >
            <CheckCircle size={36} strokeWidth={1.5} color="#006733" />
            <p className="font-semibold text-[#1D1D1D] text-center leading-relaxed" style={{ fontSize: 14 }}>
              Perfil do usuário salvo com sucesso!
            </p>
          </div>
        </Overlay>
      )}

    </LayoutPrincipal>
  )
}

/* ── Sub-componentes ── */

function InputTexto({ label, value, onChange }: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#1D1D1D]" style={{ fontSize: 14 }}>{label}</label>
      {/* Input: height=51, rx=7.5, white, borda preta fina conforme SVG */}
      <input
        className="px-4 outline-none text-[#1D1D1D] bg-white"
        style={{
          height: 51,
          borderRadius: 7.5,
          border: '1px solid rgba(0,0,0,0.5)',
          fontSize: 14,
        }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function InputBusca({ label, value, onChange, onRemove }: {
  label: string
  value: string
  onChange: (v: string) => void
  onRemove: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[#1D1D1D]" style={{ fontSize: 14 }}>{label}</label>
      {/* Search input: height=51, rx=7.5, white, borda preta fina conforme SVG */}
      <div
        className="flex items-center gap-2 px-3 bg-white"
        style={{
          height: 51,
          borderRadius: 7.5,
          border: '1px solid rgba(0,0,0,0.5)',
        }}
      >
        <Search size={16} color="#B8B8B8" className="flex-shrink-0" />
        <input
          className="flex-1 outline-none bg-transparent text-[#1D1D1D] placeholder:text-[#B8B8B8]"
          style={{ fontSize: 14 }}
          placeholder="Buscar..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      {/* Tag abaixo do campo — rx=4.5 conforme SVG */}
      {value && (
        <div className="flex flex-wrap gap-2">
          <span
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-[#1D1D1D]"
            style={{
              borderRadius: 4.5,
              border: '1px solid rgba(0,0,0,0.5)',
              fontSize: 12,
            }}
          >
            {value}
            <button
              type="button"
              onClick={onRemove}
              className="text-[#6B6B6B] hover:text-[#1D1D1D] leading-none font-medium"
            >
              ×
            </button>
          </span>
        </div>
      )}
    </div>
  )
}

function Overlay({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClick}
    >
      <div onClick={e => e.stopPropagation()} className="w-full flex justify-center">
        {children}
      </div>
    </div>
  )
}
