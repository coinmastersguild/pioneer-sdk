'use client'

import { Button, Container, Stack, Text } from '@chakra-ui/react'
import { FormLayout, SubmitButton } from '@saas-ui/forms'
import { LoadingOverlay } from '@saas-ui/react/loading-overlay'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FaGoogle } from 'react-icons/fa'
import { z } from 'zod'
import { toast } from '@saas-ui/react'

import { Form } from '#components/form/form.tsx'
import { Logo } from '#components/logo'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
})

export const LoginPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <LoadingOverlay.Root>
        <LoadingOverlay.Spinner />
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
