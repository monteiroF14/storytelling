/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {
			animation: {
				"slide-in": "slideIn 0.3s ease-out",
				"slide-out": "slideOut 0.3s ease-in",
			},
			keyframes: {
				slideIn: {
					"0%": { transform: "translateY(-20px)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
				slideOut: {
					"0%": { transform: "translateY(0)", opacity: "1" },
					"100%": { transform: "translateY(20px)", opacity: "0" },
				},
			},
			fontFamily: {
				inter: ["Inter", "sans-serif"],
			},
		},
	},
	plugins: [],
};
