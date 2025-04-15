
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				blue: {
					50: '#EBF5FF',
					100: '#D6EBFF',
					200: '#A8D7FF',
					300: '#7AC2FF',
					400: '#56AEFF',
					500: '#3498ff',
					600: '#2A7CD6',
					700: '#2063AD',
					800: '#154984',
					900: '#0B305B',
				},
				// Aviation-inspired colors
				sky: {
					50: '#F0F7FF',
					100: '#E0EFFF',
					200: '#C2DFFF',
					300: '#A3CFFF',
					400: '#85BFFF',
					500: '#66AFFF',
					600: '#4D8CD9',
					700: '#336BB3',
					800: '#1A4A8C',
					900: '#0C2A66',
				},
				cloud: {
					50: '#FFFFFF',
					100: '#F9FAFC',
					200: '#F1F3F9',
					300: '#E9ECF6',
					400: '#E1E5F3',
					500: '#D9DEEF',
					600: '#B0B5C6',
					700: '#878C9D',
					800: '#5E6374',
					900: '#353A4B',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				"accordion-down": {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				"accordion-up": {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				"fade-in": {
					"0%": { opacity: '0' },
					"100%": { opacity: '1' },
				},
				"fade-out": {
					"0%": { opacity: '1' },
					"100%": { opacity: '0' },
				},
				"slide-in-right": {
					"0%": { transform: 'translateX(100%)' },
					"100%": { transform: 'translateX(0)' },
				},
				"slide-out-left": {
					"0%": { transform: 'translateX(0)' },
					"100%": { transform: 'translateX(-100%)' },
				},
				"float": {
					"0%": { transform: 'translateY(0px)' },
					"50%": { transform: 'translateY(-5px)' },
					"100%": { transform: 'translateY(0px)' },
				},
				"pulse-soft": {
					"0%, 100%": { opacity: '1' },
					"50%": { opacity: '0.8' },
				}
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.5s ease-out",
				"fade-out": "fade-out 0.5s ease-out",
				"slide-in-right": "slide-in-right 0.3s ease-out",
				"slide-out-left": "slide-out-left 0.3s ease-out",
				"float": "float 3s ease-in-out infinite",
				"pulse-soft": "pulse-soft 3s ease-in-out infinite",
			},
			backdropFilter: {
				'none': 'none',
				'blur': 'blur(20px)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
