import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates the PNG icons, favicon.ico and apple-touch-icon from public/icon.svg.
// Run `npm run icons` after changing the SVG, then commit the generated files.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // The SVG already keeps its mark inside the maskable safe zone (radius 40%),
    // so no extra padding is added.
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0,
      resizeOptions: { background: '#0e1220' },
    },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#0e1220' } },
  },
  images: ['public/icon.svg'],
})
