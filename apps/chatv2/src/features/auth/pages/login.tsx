'use client'

import { Button, Container, Stack, Text, Box, Spinner } from '@chakra-ui/react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FaGoogle, FaUser } from 'react-icons/fa'
import { toast } from '@saas-ui/react'
import { usePioneerContext } from '#features/common/providers/app'
import { useState, useEffect } from 'react'
import { Logo } from '#components/logo'

export const LoginPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pioneer = usePioneerContext()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Handle session redirect in useEffect to avoid React state updates during render
  useEffect(() => {
    if (session) {
      router.replace('/getting-started')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <Box 
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.900"
      >
        <Spinner size="xl" color="blue.500" />
      </Box>
    )
  }

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true)
      const result = await signIn('google', {
        callbackUrl: '/getting-started',
        redirect: false,
      })
      
      if (result?.error) {
        toast.error({
          title: "Google Sign In Failed",
          description: result.error,
        })
      } else {
        toast.success({
          title: "Welcome!",
          description: "Signed in with Google"
        })
        router.push('/getting-started')
      }
    } catch (error) {
      console.error('Failed to sign in with Google:', error)
      toast.error({
        title: "Authentication failed",
        description: "Failed to sign in with Google",
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Handle guest login
  const handleGuestLogin = async () => {
    try {
      setIsAuthenticating(true)
      const guestUsername = `guest_${Math.random().toString(36).substring(7)}`
      const guestQueryKey = `guest_${Math.random().toString(36).substring(7)}`
      
      // First authenticate with the backend
      const payload = {
        username: guestUsername,
        queryKey: guestQueryKey,
        address: '0xguestAddress',
        isGuest: true
      }

      const response = await fetch('/api/auth/kkauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Guest auth successful')
        toast.success({
          title: "Authentication successful",
          description: "Setting up guest session..."
        })
        
        // Use signIn to establish the session with the same structure as KeepKey
        const result = await signIn('credentials', {
          username: data.username,
          address: data.address,
          queryKey: data.queryKey,
          isGuest: true,
          redirect: false
        })

        if (result?.error) {
          console.error('❌ Guest session setup failed:', result.error)
          toast.error({
            title: "Session setup failed",
            description: result.error
          })
          return
        }

        console.log('✅ Guest session established successfully')
        router.push('/getting-started')
      } else {
        console.error('❌ Guest auth failed:', data.error)
        toast.error({
          title: "Authentication failed",
          description: data.error || "Failed to authenticate as guest"
        })
      }
    } catch (error) {
      console.error('❌ Guest auth request failed:', error)
      toast.error({
        title: "Authentication failed",
        description: "Failed to sign in as guest"
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <Stack flex="1" direction="row" minH="100vh">
      <Stack
        flex="1"
        alignItems="center"
        justify="center"
        direction="column"
        gap="8"
        bg="gray.900"
      >
        <Container maxWidth="sm">
          <Logo margin="0 auto" mb="12" />

          {/* Google Login Button */}
          <Button
            w="100%"
            mb="4"
            onClick={handleGoogleSignIn}
            variant="outline"
          >
            <Stack direction="row" gap={2} align="center">
              <FaGoogle />
              <Text>Continue with Google</Text>
            </Stack>
          </Button>

          {/* KeepKey Login Button */}
          <Button
            w="100%"
            mb="4"
            onClick={async () => {
              try {
                setIsAuthenticating(true)
                console.log('🔍 Button clicked, checking Pioneer state:', {
                  queryKey: pioneer?.state?.app?.queryKey,
                  username: pioneer?.state?.app?.username,
                  context: pioneer?.state?.app?.context
                })

                if (!pioneer?.state?.app) {
                  console.log('❌ Pioneer app is not available')
                  toast.error({
                    title: "Pioneer not initialized",
                    description: "Please wait for Pioneer to initialize"
                  })
                  return
                }

                if (!pioneer.state.app.queryKey) {
                  console.log('❌ QueryKey not found in Pioneer state')
                  toast.error({
                    title: "KeepKey not ready",
                    description: "Please connect your KeepKey first"
                  })
                  return
                }

                console.log('🔑 Attempting KeepKey login with queryKey:', pioneer.state.app.queryKey)
                
                const payload = {
                  username: pioneer.state.app.username || 'keepkey-user',
                  queryKey: pioneer.state.app.queryKey,
                  address: pioneer.state.app.context?.selectedWallet?.address || '0xplaceholderAddress'
                }
                console.log('📦 Auth payload:', payload)

                const response = await fetch('/api/auth/kkauth', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload)
                })

                console.log('🔄 Auth response status:', response.status)
                const data = await response.json()
                console.log('📡 Auth response data:', data)

                if (data.success) {
                  console.log('✅ KeepKey auth successful')
                  toast.success({
                    title: "Authentication successful",
                    description: "Setting up session..."
                  })
                  
                  // Use signIn to establish the session
                  const result = await signIn('credentials', {
                    username: data.username,
                    address: data.address,
                    queryKey: data.queryKey,
                    redirect: false
                  })

                  if (result?.error) {
                    console.error('❌ Session setup failed:', result.error)
                    toast.error({
                      title: "Session setup failed",
                      description: result.error
                    })
                    return
                  }

                  console.log('✅ Session established successfully')
                  router.push('/getting-started')
                } else {
                  console.error('❌ Auth failed:', data.error)
                  toast.error({
                    title: "Authentication failed",
                    description: data.error || "Failed to authenticate with KeepKey"
                  })
                }
              } catch (error) {
                console.error('❌ Auth request failed:', error)
                toast.error({
                  title: "Authentication failed",
                  description: "An unexpected error occurred"
                })
              } finally {
                setIsAuthenticating(false)
              }
            }}
            variant="outline"
            colorScheme="blue"
            isLoading={isAuthenticating && pioneer?.state?.app?.queryKey}
            loadingText="Authenticating..."
            disabled={isAuthenticating}
          >
            <Stack direction="row" gap={2} align="center">
              <img src="https://pioneers.dev/coins/keepkey.png" alt="KeepKey" style={{ width: '20px', height: '20px' }} />
              <Text>Continue with KeepKey</Text>
            </Stack>
          </Button>

          <Stack direction="row" gap={4} align="center" my="4">
            <Stack flex="1" h="1px" bg="gray.200" />
            <Text color="fg.muted">or</Text>
            <Stack flex="1" h="1px" bg="gray.200" />
          </Stack>

          {/* Guest Login Button */}
          <Button
            w="100%"
            onClick={handleGuestLogin}
            variant="outline"
            isLoading={isAuthenticating && !pioneer?.state?.app?.queryKey}
            loadingText="Signing in..."
          >
            <Stack direction="row" gap={2} align="center">
              <FaUser />
              <Text>Continue as Guest</Text>
            </Stack>
          </Button>
        </Container>
      </Stack>
    </Stack>
  )
}
