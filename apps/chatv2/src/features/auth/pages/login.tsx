'use client'

import { Button, Container, Stack, Text, Box } from '@chakra-ui/react'
import { FormLayout, SubmitButton } from '@saas-ui/forms'
import { LoadingOverlay } from '@saas-ui/react/loading-overlay'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FaGoogle } from 'react-icons/fa'
import { z } from 'zod'
import { toast } from '@saas-ui/react'
import { usePioneerContext } from '#features/common/providers/app'
import { useState } from 'react'

import { Form } from '#components/form/form.tsx'
import { Logo } from '#components/logo'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
})

export const LoginPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pioneer = usePioneerContext()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  if (status === 'loading') {
    return (
      <LoadingOverlay.Root>
        {/*<LoadingOverlay.Spinner />*/}
      </LoadingOverlay.Root>
    )
  }

  if (session) {
    router.replace('/getting-started')
    return null
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', {
        callbackUrl: '/getting-started',
      })
      
      if (result?.error) {
        toast.error({
          title: "Authentication failed",
          description: result.error,
        })
      }
    } catch (error) {
      console.error('Failed to sign in with Google:', error)
      toast.error({
        title: "Authentication failed",
        description: "Failed to sign in with Google",
      })
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
      >
        <Container maxWidth="sm">
          <Logo margin="0 auto" mb="12" />

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
                  await router.push('/getting-started')
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
            isLoading={isAuthenticating}
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

          <Form
            schema={schema}
            defaultValues={{
              email: 'user@keepkey.com',
              password: '123345',
            }}
            onSubmit={async (values) => {
              try {
                const result = await signIn('credentials', {
                  ...values,
                  callbackUrl: '/getting-started',
                })

                if (result?.error) {
                  toast.error({
                    title: "Authentication failed",
                    description: result.error,
                  })
                  return { error: result.error }
                }
              } catch (error) {
                console.error('Failed to sign in:', error)
                toast.error({
                  title: "Authentication failed",
                  description: "An unexpected error occurred",
                })
              }
            }}
          >
            {({ Field }) => (
              <FormLayout>
                <Field name="email" label="Email" type="email" />
                <Field name="password" label="Password" type="password" />
                <SubmitButton>Log in</SubmitButton>
              </FormLayout>
            )}
          </Form>
        </Container>
      </Stack>
    </Stack>
  )
}
