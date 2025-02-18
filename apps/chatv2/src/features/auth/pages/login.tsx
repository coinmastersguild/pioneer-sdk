'use client'

import { Button, Stack, Text, Box } from '@chakra-ui/react'
import { signIn, useSession, type SessionContextValue } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FaGoogle, FaUser } from 'react-icons/fa'
import { toast } from '@saas-ui/react'
import { usePioneerContext } from '#features/common/providers/app'
import { useState, useEffect } from 'react'
import { Logo } from '#components/logo'

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
)

export const LoginPage = () => {
  const { data: session, status } = useSession() as SessionContextValue
  const router = useRouter()
  const pioneer = usePioneerContext()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Get the callback URL from query params
  const getCallbackUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const callbackUrl = params.get('callbackUrl')
      // If it's an absolute URL on our domain, extract the path
      if (callbackUrl?.startsWith('https://support.keepkey.info/')) {
        try {
          const url = new URL(callbackUrl)
          return url.pathname + url.search
        } catch (e) {
          console.error('Failed to parse callback URL:', e)
        }
      }
      // If it's a relative URL, use it
      if (callbackUrl?.startsWith('/')) {
        return callbackUrl
      }
    }
    return '/getting-started'
  }

  // Handle session redirect
  useEffect(() => {
    if (session && status === 'authenticated') {
      const redirectUrl = getCallbackUrl()
      console.log('Session redirect triggered:', { session, status, redirectUrl })
      router.replace(redirectUrl)
    }
  }, [session, status, router])

  // Show loading screen while session is being fetched
  if (status === 'loading') {
    return <LoadingScreen />
  }

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true)
      
      console.log('🔄 Starting Google login')
      
      const result = await signIn('google', {
        callbackUrl: '/getting-started',
        redirect: true
      })

      // We shouldn't reach here due to redirect: true
      console.log('🔑 SignIn result:', result)
    } catch (error) {
      console.error('❌ Google auth failed:', error)
      toast.error({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Failed to sign in with Google"
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
      
      console.log('🔄 Starting guest login with:', { guestUsername, guestQueryKey })
      
      localStorage.setItem('pioneer_guest_username', guestUsername)
      localStorage.setItem('pioneer_guest_key', guestQueryKey)
      
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=support.keepkey.info'
      
      const callbackUrl = getCallbackUrl()
      await signIn('credentials', {
        username: guestUsername,
        address: '0xguestAddress',
        queryKey: guestQueryKey,
        isGuest: true,
        provider: 'keepkey',
        callbackUrl,
        redirect: true
      })
    } catch (error) {
      console.error('❌ Guest auth request failed:', error)
      toast.error({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Failed to sign in as guest"
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Handle KeepKey login
  const handleKeepKeyLogin = async () => {
    try {
      setIsAuthenticating(true)
      
      const username = pioneer?.state?.app?.username || `keepkey_${Math.random().toString(36).substring(7)}`
      const queryKey = pioneer?.state?.app?.queryKey || `key_${Math.random().toString(36).substring(7)}`
      const address = pioneer?.state?.app?.context?.selectedWallet?.address || '0xkeepkeyAddress'
      
      console.log('🔄 Starting KeepKey login with:', { username, queryKey, address })
      
      const callbackUrl = getCallbackUrl()
      await signIn('credentials', {
        username,
        address,
        queryKey,
        provider: 'keepkey',
        callbackUrl,
        redirect: true
      })
    } catch (error) {
      console.error('❌ Auth request failed:', {
        error,
        pioneerState: pioneer?.state,
        pathname: window.location.pathname
      })
      toast.error({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Failed to sign in with KeepKey"
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Update session restoration effect
  useEffect(() => {
    const restoreGuestSession = async () => {
      const guestUsername = localStorage.getItem('pioneer_guest_username')
      const guestKey = localStorage.getItem('pioneer_guest_key')
      
      if (guestUsername && guestKey && status === 'unauthenticated') {
        try {
          console.log('🔄 Attempting to restore guest session:', { guestUsername, guestKey })
          await signIn('credentials', {
            username: guestUsername,
            queryKey: guestKey,
            address: '0xguestAddress',
            isGuest: true,
            provider: 'keepkey',
            callbackUrl: '/getting-started',
            redirect: true
          })
        } catch (error) {
          console.error('❌ Failed to restore guest session:', error)
          localStorage.removeItem('pioneer_guest_username')
          localStorage.removeItem('pioneer_guest_key')
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=support.keepkey.info'
        }
      }
    }
    
    if (status === 'unauthenticated') {
      restoreGuestSession()
    }
  }, [status])

  // URL parameter handling
  useEffect(() => {
    if (status === 'unauthenticated') {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      const callbackUrl = params.get('callbackUrl')
      
      if (error) {
        console.error('🚫 Auth error from URL:', { error, callbackUrl })
        toast.error({
          title: "Authentication Error",
          description: error
        })
      }
    }
  }, [status])

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
        <div className="w-full max-w-md px-4">
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
        </div>
      </Stack>
    </Stack>
  )
}
