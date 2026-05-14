interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Checkbox({ checked, onChange }: Props) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-4 h-4 rounded-[4px] border-2 cursor-pointer flex items-center justify-center transition-colors ${
        checked ? 'bg-[#1d5358] border-[#1d5358]' : 'bg-white border-[#d1d5db]'
      }`}
    >
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}
