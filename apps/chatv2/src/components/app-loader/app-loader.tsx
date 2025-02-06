import { keyframes } from '@emotion/react'
import { Box, Spinner } from '@chakra-ui/react'

import { SaasUIGlyph } from '../logo/saas-ui-glyph'

const scale = keyframes`
  0% {
    scale: 1.3;
  }
  100% {
    scale: 1;
  }
`

/**
 * Show a fullscreen loading animation while the app is loading.
 */
export const AppLoader: React.FC = () => {
  return (
    // @ts-ignore
    <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="black" display="flex" alignItems="center" justifyContent="center">
      {/* @ts-ignore */}
      <Box position="relative">
        {/* @ts-ignore */}
        <SaasUIGlyph
          boxSize="8"
          animation={`5s ease-out ${scale}`}
          opacity="0.8"
        />
        {/* @ts-ignore */}
        <Spinner
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          size="xl"
          color="white"
        />
      </Box>
    </Box>
  )
}
