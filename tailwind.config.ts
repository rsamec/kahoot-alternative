import type { Config } from 'tailwindcss'
const plugin = require('tailwindcss/plugin');

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

    },

  },
  plugins: [
    plugin(function ({ addBase, theme }: { addBase: (o: object) => void, theme: (classNames: string) => string }) {
      const darkBlockquote = {
        borderColor: '#6b7280',
        backgroundColor: '#1f2937',
      }

      // const darkDetailsSummary = {
      //   backgroundColor: theme("colors.gray.600")
      // }
      addBase({
        'h1': { fontSize: theme('fontSize.xl'), fontWeight: 600 },
        'h2': { fontSize: theme('fontSize.lg') },
        'h3': { fontSize: theme('fontSize.lg'), },
        'hr': { border: 'solid 1px black' },
        'blockquote': {
          padding: '12px',
          margin:'5px 0px',
          borderLeftWidth: '4px',
          borderStyle: 'solid',
          borderColor: '#6b7280',
          backgroundColor: '#1f2937',
        },
        '.dark': {
          'blockquote': darkBlockquote
        },
        '@media (prefers-color-scheme: dark)': {
          'blockquote': darkBlockquote
        },
        '@media print': {
        }
        // 'ol': { listStyleType: 'upper-alpha', listStylePosition: 'inside' },
      })
    }),
  ],
  darkMode: 'class',
}
export default config
