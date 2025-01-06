/** @type {import('tailwindcss').Config} */
module.exports = {
  //告诉 Tailwind 在哪些文件中查找类名，以便进行按需生成。
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

