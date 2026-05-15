import React from 'react'
import { IconeCheckVerde } from '../../atoms/compartilhados/IconeCheckVerde'

interface ModalSucessoProps {
  mensagem: string
  submensagem?: string
  onClose?: () => void
}

export const ModalSucesso: React.FC<ModalSucessoProps> = ({ mensagem, submensagem }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="w-[248px] h-[150px] bg-white rounded-[10px] shadow-[0px_8px_30px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center gap-4 border border-[#e0e0e0]">
        <IconeCheckVerde size={40} />
        <div className="flex flex-col items-center gap-1 px-4">
          <h2 className="text-[18px] font-bold text-[#111111] text-center leading-tight">
            {mensagem}
          </h2>
          {submensagem && (
            <p className="text-[14px] font-medium text-[#b3b3b3] text-center">
              {submensagem}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
