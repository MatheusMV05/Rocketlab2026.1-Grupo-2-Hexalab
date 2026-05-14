interface Props {
  status: string
}

export function StatusBadge({ status }: Props) {
  const config: Record<string, { label: string; cor: string }> = {
    'Em risco': { label: 'Em risco', cor: '#e37405' },
    'Dentro do SLA': { label: 'Dentro do SLA', cor: '#1d5358' },
    'Atrasado': { label: 'Atrasado', cor: '#c20000' },
    'Finalizado': { label: 'Finalizado', cor: '#1a9a45' },
  }

  const { label, cor } = config[status] || { label: status, cor: '#898989' }

  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
      <span className="text-[13px] font-medium" style={{ color: cor }}>
        {label}
      </span>
    </div>
  )
}
