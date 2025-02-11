// theme.ts
import { createSystem, defineConfig } from '@chakra-ui/react'
import { defaultConfig } from '@saas-ui-pro/react'
console.log('defaultConfig: ',defaultConfig)

//colorPalette.solid
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        blue: {
          50: { value: "#e6ffe6" },
          100: { value: "#ccffcc" },
          200: { value: "#b3ffb3" },
          300: { value: "#99ff99" },
          400: { value: "#80ff80" },
          500: { value: "#00ff00" }, // new green value instead of blue
          600: { value: "#00cc00" },
          700: { value: "#009900" },
          800: { value: "#007700" },
          900: { value: "#005500" },
        },
      },
    },
    recipes: {
      card: {
        variants: {
          // Override the variant that uses blue
          primary: {
            baseStyle: {
              bg: "#00ff00", // set background to green
              color: "black",
              // Other style overrides...
            },
          },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Background colors
        bg: {
          DEFAULT: {
            value: { _light: "#ffffff", _dark: "#121212" },
          },
          subtle: {
            value: { _light: "#f5f5f5", _dark: "#1f1f1f" },
          },
        },
        // Foreground/text colors
        fg: {
          DEFAULT: {
            value: { _light: "#171717", _dark: "#E0E0E0" },
          },
          muted: {
            value: { _light: "#171717", _dark: "#B0B0B0" },
          },
        },
        // Border colors
        border: {
          DEFAULT: {
            value: { _light: "#e2e2e2", _dark: "#333333" },
          },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
