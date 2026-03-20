export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lime: { 50:'#f7fee7',100:'#ecfccb',200:'#d9f99d',300:'#bef264',
          400:'#a3e635',500:'#84cc16',600:'#65a30d',700:'#4d7c0f',800:'#3f6212',900:'#365314' }
      },
      animation: {
        'ring':       'ring 1s ease-in-out infinite',
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-lime': 'pulseLime 2s infinite',
        'bounce-soft':'bounceSoft 1s infinite'
      },
      keyframes: {
        ring:       { '0%,100%':{ transform:'scale(1)' }, '50%':{ transform:'scale(1.08)' } },
        fadeIn:     { from:{ opacity:'0', transform:'translateY(8px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        slideUp:    { from:{ opacity:'0', transform:'translateY(20px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        pulseLime:  { '0%,100%':{ boxShadow:'0 0 0 0 rgba(132,204,22,0.4)' }, '50%':{ boxShadow:'0 0 0 8px rgba(132,204,22,0)' } },
        bounceSoft: { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-4px)' } }
      }
    }
  },
  plugins: []
}
