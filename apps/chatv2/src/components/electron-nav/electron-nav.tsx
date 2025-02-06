import { Box } from '@chakra-ui/react'

/**
 * Render a draggable area when running in Electron.
 * This is used at the top of the Sidebar.
 * Currently disabled until Electron support is added.
 */
export const ElectronNav = () => {
  // Temporarily disabled until Electron support is added
  return null

  // return (
  //   <Box
  //     height="20px"
  //     sx={{
  //       '-webkit-user-select': 'none',
  //       '-webkit-app-region': 'drag',
  //     }}
  //   ></Box>
  // )
}
