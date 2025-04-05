'use client'

import type { Metadata } from "next";
import { Provider } from './provider';

import { Geist, Geist_Mono } from "next/font/google";
import { KKConnectionStatus } from '@/components/KKConnectionStatus'
import { Box, Flex, Heading, HStack, Image, Text, Circle, Icon, IconButton, Button } from '@chakra-ui/react'
import { LogoIcon } from '@/components/logo'
import { KeepKeyUiGlyph } from '@/components/logo/keepkey-ui-glyph'
import { FaExclamation, FaCheckCircle } from 'react-icons/fa'
import { RiWallet3Fill } from 'react-icons/ri'
import { Tooltip } from "@/components/ui/tooltip"
import { 
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import React from 'react'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Animation keyframes
const scaleAnimation = `
  0% { transform: scale(0.8); }
  50% { transform: scale(1.2); }
  100% { transform: scale(0.8); }
`;

const fadeInAnimation = `
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [isDesktopRunning, setIsDesktopRunning] = React.useState(false);
  const [isGlyphDialogOpen, setIsGlyphDialogOpen] = React.useState(false);
  const [showVault, setShowVault] = React.useState(true);

  const handleGlyphClick = async () => {
    await checkDesktopStatus();
    setIsGlyphDialogOpen(true);
  };

  const handleOpenChange = async (details: { open: boolean }) => {
    if (details.open) {
      await checkDesktopStatus();
    }
    setIsGlyphDialogOpen(details.open);
  };

  const handleLaunchKeepKey = () => {
    try {
      window.location.assign('keepkey://launch')
    } catch {
      console.error("Could not launch KeepKey Desktop");
    }
  }

  // Check if KeepKey Desktop is running
  const checkDesktopStatus = React.useCallback(async () => {
    try {
      // Try main port first
      try {
        const response = await fetch('http://localhost:1646/docs', { 
          signal: AbortSignal.timeout(2000)
        });
        if (response.status === 200) {
          setIsDesktopRunning(true);
          return true;
        }
      } catch (error) {
        console.log('Desktop not found on port 1646, trying alternatives...');
      }
      
      // Try alternative common ports
      const alternativePorts = [8999, 1645, 9001, 80];
      for (const port of alternativePorts) {
        try {
          const response = await fetch(`http://localhost:${port}/docs`, {
            signal: AbortSignal.timeout(1000)
          });
          if (response.status === 200) {
            console.log(`KeepKey Desktop found on port ${port}`);
            setIsDesktopRunning(true);
            return true;
          }
        } catch {
          // Continue to next port
        }
      }
      
      // If we got here, no connection was successful
      setIsDesktopRunning(false);
      return false;
    } catch {
      setIsDesktopRunning(false);
      return false;
    }
  }, []);

  React.useEffect(() => {
    checkDesktopStatus();
  }, [checkDesktopStatus]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider>
          {/* Header */}
          <Box
            as="header"
            height="40px"
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px={6}
            bg="black"
            borderBottom="1px solid"
            borderColor="gray.800"
          >
            <HStack gap={4}>
              <Image src="/images/logos/keepkey_logo.png" alt="KeepKey Logo" height="24px" />
              <Text color="white" fontWeight="semibold">KeepKey Template</Text>
            </HStack>
            
            <HStack gap={4}>
              <IconButton
                aria-label="Toggle wallet view"
                variant="ghost"
                colorScheme="gray"
                size="sm"
                onClick={() => setShowVault(!showVault)}
              >
                <RiWallet3Fill />
              </IconButton>
              <Tooltip 
                content={isDesktopRunning ? "KeepKey Desktop is running" : "KeepKey Desktop is not connected"}
                showArrow
              >
                <Box onClick={handleGlyphClick} cursor="pointer">
                  <Box position="relative">
                    <KeepKeyUiGlyph 
                      boxSize={9}
                      animation={isDesktopRunning ? undefined : `${scaleAnimation} 5s ease-out infinite`}
                      opacity={isDesktopRunning ? "1" : "0.8"}
                    />
                    <Circle
                      size="4"
                      bg={isDesktopRunning ? "green.500" : "red.500"}
                      position="absolute"
                      top="-1"
                      right="-1"
                      border="2px solid"
                      borderColor="gray.800"
                    >
                      {!isDesktopRunning && (
                        <Icon as={FaExclamation} boxSize={1.5} color="white" />
                      )}
                    </Circle>
                  </Box>
                </Box>
              </Tooltip>

              <KKConnectionStatus size="md" />
            </HStack>
          </Box>
          
          {/* Main Content */}
          <Box as="main">
            {children}
          </Box>

          {/* KeepKey Desktop Dialog */}
          <DialogRoot
            open={isGlyphDialogOpen}
            onOpenChange={handleOpenChange}
            placement='center'
          >
            <DialogContent
              style={{
                minWidth: '400px',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--chakra-colors-gray-800)',
                borderRadius: 'var(--chakra-radii-xl)',
                border: '1px solid var(--chakra-colors-gray-700)',
                padding: '24px',
              }}
            >
              <DialogHeader>
                <DialogTitle>
                  {isDesktopRunning ? 'KeepKey Desktop Settings' : 'KeepKey Desktop Connection'}
                </DialogTitle>
              </DialogHeader>
              <DialogBody style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  gap={8} 
                  alignItems="center"
                  justifyContent="center"
                  flex={1}
                  px={4}
                >
                  {isDesktopRunning ? (
                    <>
                      <Box display="flex" justifyContent="center">
                        <Icon 
                          as={FaCheckCircle} 
                          boxSize={24} 
                          color="green.500"
                          animation={`${fadeInAnimation} 0.5s ease-in`}
                        />
                      </Box>
                      <Text textAlign="center" fontSize="xl" fontWeight="medium">
                        KeepKey Desktop is running
                      </Text>
                    </>
                  ) : (
                    <>
                      <Box display="flex" justifyContent="center">
                        <Icon 
                          as={FaExclamation} 
                          boxSize={24} 
                          color="red.500"
                          animation={`${fadeInAnimation} 0.5s ease-in`}
                        />
                      </Box>
                      <Text textAlign="center" fontSize="xl" fontWeight="medium" color="red.400">
                        KeepKey Desktop is not running
                      </Text>
                    </>
                  )}
                </Box>
              </DialogBody>
              <DialogFooter>
                <Box px={4} width="full">
                  {isDesktopRunning ? (
                    <>
                      <Button
                        onClick={() => {
                          window.open('http://localhost:1646/docs', '_blank');
                          handleOpenChange({ open: false });
                        }}
                        size="md"
                        width="full"
                        mb={3}
                        colorScheme="blue"
                      >
                        View KeepKey Docs
                      </Button>
                      <Button
                        onClick={() => {
                          window.open('https://docs.keepkey.com', '_blank');
                          handleOpenChange({ open: false });
                        }}
                        variant="outline"
                        size="md"
                        width="full"
                      >
                        View API Documentation
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={() => {
                          handleLaunchKeepKey();
                          handleOpenChange({ open: false });
                        }}
                        size="lg"
                        width="full"
                        colorScheme="blue"
                      >
                        Launch KeepKey Desktop
                      </Button>
                    </>
                  )}
                </Box>
              </DialogFooter>
              <DialogCloseTrigger ref={closeRef} />
            </DialogContent>
          </DialogRoot>
        </Provider>
      </body>
    </html>
  );
}
