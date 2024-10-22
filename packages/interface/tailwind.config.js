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
		},
	},
	plugins: [],
};
