import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          primary: '#2563EB',
          accent: '#3B82F6',
          lightBlue: '#DBEAFE',
          lightGray: '#F8FAFC',
          success: '#10B981',
          textDark: '#111827',
          textGray: '#64748B',
        },
      },
    },
  },
  plugins: [],
};
export default config;
