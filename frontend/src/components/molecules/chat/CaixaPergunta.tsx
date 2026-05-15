import { useState, useEffect, type KeyboardEvent } from 'react'
import { ArrowUp, Image as ImageIcon, Mic } from 'react-feather'

interface Props {
  valor: string
  onChange: (valor: string) => void
  onEnviar: (valor: string) => void
  desabilitado?: boolean
  placeholder?: string
}

export function CaixaPergunta({
  valor,
  onChange,
  onEnviar,
  desabilitado = false,
  placeholder = 'Pergunte a IA',
}: Props) {
  const [interno, setInterno] = useState(valor)

  useEffect(() => {
    setInterno(valor)
  }, [valor])

  function disparar() {
    const texto = interno.trim()
    if (!texto || desabilitado) return
    onEnviar(texto)
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()
      disparar()
    }
  }

  return (
    <div className="border border-[#d8dadf] rounded-[14px] bg-white px-[14px] pt-[12px] pb-[10px] flex flex-col gap-[8px]">
      <input
        type="text"
        value={interno}
        onChange={(e) => {
          setInterno(e.target.value)
          onChange(e.target.value)
        }}
        onKeyDown={aoTeclar}
        placeholder={placeholder}
        disabled={desabilitado}
        className="w-full text-[14px] text-[#1a1a1a] placeholder:text-[#898989] bg-transparent focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[10px] text-[#3f7377]">
          <button
            type="button"
            className="transition-colors"
            aria-label="Anexar imagem"
            disabled={desabilitado}
          >
            <ImageIcon size={18} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="transition-colors"
            aria-label="Gravar áudio"
            disabled={desabilitado}
          >
            <Mic size={18} strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          onClick={disparar}
          disabled={desabilitado || !interno.trim()}
          aria-label="Enviar pergunta"
          className={`flex items-center justify-center w-9 h-9 rounded-full border transition-colors ${
            interno.trim() && !desabilitado
              ? 'border-[#3f7377] bg-white text-[#3f7377] hover:bg-[#3f7377] hover:text-white'
              : 'border-[#d8dadf] bg-[#f5f5f6] text-[#bfc0c4] cursor-not-allowed'
          }`}
        >
          <ArrowUp size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}
