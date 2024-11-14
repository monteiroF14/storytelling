/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {
			colors: {
				"story-100": "#FFF9E0",
				"story-200": "#FFF2B2",
				"story-300": "#FFEB7D",
				"story-400": "#FFE84A",
				"story-500": "#FFE81F",
				"story-600": "#FFD300",
				"story-700": "#D9B600",
				"story-800": "#A68A00",
				"story-900": "#7D6E00",
			},
			fontFamily: {
				inter: ["Inter", "sans-serif"],
			},
			animation: {
				"loading-animation": "loading-animation 0.8s infinite ease-in-out",
			},
			keyframes: {
				"loading-animation": {
					"0%, 80%, 100%": { opacity: "0.75", boxShadow: "0 0 #FFEB7D", height: "32px" },
					"40%": { opacity: "1", boxShadow: "0 -8px #FFEB7D", height: "40px" },
				},
			},
			spacing: {
				"loading-offset": "19.992px",
				"loader-width": "13.6px",
				"loader-height": "32px",
			},
		},
	},
	plugins: [
		({ addUtilities }) => {
			addUtilities({
				".delay-1": { animationDelay: "0s" },
				".delay-2": { animationDelay: "0.16s" },
				".delay-3": { animationDelay: "0.32s" },
			});
		},
	],
};
