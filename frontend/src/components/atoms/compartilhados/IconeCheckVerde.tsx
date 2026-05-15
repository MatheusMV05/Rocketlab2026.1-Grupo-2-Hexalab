import React from 'react'

export const IconeCheckVerde: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={(size * 20) / 20} // Mantendo a proporção aproximada
      viewBox="113 31 22 22" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M134 41.08V42C133.999 44.1564 133.301 46.2547 132.009 47.9818C130.718 49.709 128.903 50.9725 126.835 51.5839C124.767 52.1953 122.557 52.1219 120.534 51.3746C118.512 50.6273 116.785 49.2461 115.611 47.4371C114.437 45.628 113.88 43.4881 114.022 41.3363C114.164 39.1846 114.997 37.1363 116.398 35.4971C117.799 33.8578 119.693 32.7154 121.796 32.2401C123.9 31.7649 126.1 31.9823 128.07 32.86" 
        stroke="#12632F" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M134 34L124 44.01L121 41.01" 
        stroke="#12632F" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}
