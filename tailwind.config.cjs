/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2563eb" },
        secondary: { DEFAULT: "#0ea5e9" },
        accent: "#22d3ee"
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
};