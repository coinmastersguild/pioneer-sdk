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
      
      // Store guest session data immediately
      localStorage.setItem('pioneer_guest_username', guestUsername)
      localStorage.setItem('pioneer_guest_key', guestQueryKey)
      
      // Use signIn directly with credentials
      const result = await signIn('credentials', {
        username: guestUsername,
        address: '0xguestAddress',
        queryKey: guestQueryKey,
        isGuest: true,
        provider: 'keepkey',
        redirect: false
      })

      console.log('🔑 SignIn result:', result)

      // Always proceed with login
      toast.success({
        title: "Welcome!",
        description: "Signed in as guest"
      })

      // Wait briefly for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to getting started
      router.push('/getting-started')
    } catch (error) {
      console.error('❌ Guest auth request failed:', error)
      // Even if there's an error, try to proceed
      router.push('/getting-started')
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Simplify KeepKey login button handler
  const handleKeepKeyLogin = async () => {
    try {
      setIsAuthenticating(true)
      
      // Generate random credentials if Pioneer isn't available
      const username = pioneer?.state?.app?.username || `keepkey_${Math.random().toString(36).substring(7)}`
      const queryKey = pioneer?.state?.app?.queryKey || `key_${Math.random().toString(36).substring(7)}`
      const address = pioneer?.state?.app?.context?.selectedWallet?.address || '0xkeepkeyAddress'
      
      // Use signIn directly with credentials
      const result = await signIn('credentials', {
        username,
        address,
        queryKey,
        provider: 'keepkey',
        redirect: false
      })

      console.log('🔑 SignIn result:', result)
      
      // Always proceed with login
      toast.success({
        title: "Welcome!",
        description: "Signed in with KeepKey"
      })

      // Wait briefly for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to getting started
      router.push('/getting-started')
    } catch (error) {
      console.error('❌ Auth request failed:', error)
      // Even if there's an error, try to proceed
      router.push('/getting-started')
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Update session restoration effect
  useEffect(() => {
    const restoreGuestSession = async () => {
      const guestUsername = localStorage.getItem('pioneer_guest_username')
      const guestKey = localStorage.getItem('pioneer_guest_key')
      
      if (guestUsername && guestKey && !session) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin
          const callbackUrl = `${baseUrl}/getting-started`
          const encodedCallback = encodeURIComponent(callbackUrl)
          
          console.log('🔄 Attempting to restore guest session:', {
            username: guestUsername,
            key: guestKey,
            callback: encodedCallback
          })
          
          const result = await signIn('credentials', {
            username: guestUsername,
            queryKey: guestKey,
            address: '0xguestAddress',
            isGuest: true,
            callbackUrl: encodedCallback,
            redirect: true
          })
          
          console.log('🔑 Session restoration result:', result)
        } catch (error) {
          console.error('Failed to restore guest session:', error)
          // Clear invalid session data
          localStorage.removeItem('pioneer_guest_username')
          localStorage.removeItem('pioneer_guest_key')
        }
      }
    }
    
    restoreGuestSession()
  }, [session])

  // Add URL parameter handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error) {
      console.error('🚫 Auth error from URL:', error)
      toast.error({
        title: "Authentication Error",
        description: error
      })
    }
  }, [])

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
            onClick={handleKeepKeyLogin}
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
