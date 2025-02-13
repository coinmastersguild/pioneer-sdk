'use client'

import React, { useMemo } from 'react';
import { PioneerProvider } from "@coinmasters/pioneer-react"
import { ChakraProvider, createSystem, defineConfig } from '@chakra-ui/react';
// //@ts-ignore
// import { defaultConfig } from '@saas-ui-pro/react';

interface ProviderProps {
  children: React.ReactNode;
  initialColorMode?: 'light' | 'dark';
}

// const config = defineConfig({
//   theme: {
//     tokens: {
//       colors: {
//         blue: {
//           50: { value: "#e6ffe6" },
//           100: { value: "#ccffcc" },
//           200: { value: "#b3ffb3" },
//           300: { value: "#99ff99" },
//           400: { value: "#80ff80" },
//           500: { value: "#00ff00" },
//           600: { value: "#00cc00" },
//           700: { value: "#009900" },
//           800: { value: "#007700" },
//           900: { value: "#005500" }
//         }
//       }
//     },
//     recipes: {
//       card: {
//         variants: {
//           primary: {
//             baseStyle: {
//               bg: "#00ff00",
//               color: "black"
//             }
//           }
//         }
//       }
//     },
//     semanticTokens: {
//       colors: {
//         bg: {
//           DEFAULT: {
//             value: { _light: "#ffffff", _dark: "#121212" }
//           },
//           subtle: {
//             value: { _light: "#f5f5f5", _dark: "#1f1f1f" }
//           }
//         },
//         fg: {
//           DEFAULT: {
//             value: { _light: "#171717", _dark: "#E0E0E0" }
//           },
//           muted: {
//             value: { _light: "#171717", _dark: "#B0B0B0" }
//           }
//         },
//         border: {
//           DEFAULT: {
//             value: { _light: "#e2e2e2", _dark: "#333333" }
//           }
//         }
//       }
//     }
//   }
// });

export function Provider({ children, initialColorMode = 'dark' }: ProviderProps) {
  const system = useMemo(() => createSystem({}), []);
  return (
    <PioneerProvider>
      <ChakraProvider value={system}>
        {children}
      </ChakraProvider>
    </PioneerProvider>
  );
} 
