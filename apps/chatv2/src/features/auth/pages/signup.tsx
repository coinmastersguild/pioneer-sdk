'use client'

import {
  Avatar,
  Box,
  Center,
  Container,
  HStack,
  Stack,
  Text,
  Button,
} from '@chakra-ui/react'
import { useAuth } from '@saas-ui/auth-provider'
import { FormLayout, SubmitButton } from '@saas-ui/forms'
import { LoadingOverlay } from '@saas-ui/react/loading-overlay'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FaGoogle } from 'react-icons/fa'
import { z } from 'zod'
import { toast } from '@saas-ui/react'

import { Form } from '#components/form/form.tsx'
import { Link } from '#components/link'
import { Logo } from '#components/logo'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const SignupPage = () => {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  if (isAuthenticated) {
    router.replace('/')
    return (
      <LoadingOverlay.Root>
        <LoadingOverlay.Spinner />
      </LoadingOverlay.Root>
    )
  }

  const handleGoogleSignIn = async () => {
    try {
      //console.log('Starting Google sign-up...')
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false
      })
      
      if (result?.error) {
        toast.error({
          title: "Sign up failed",
          description: result.error,
        })
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      console.error('Failed to sign up with Google:', error)
      toast.error({
        title: "Sign up failed",
        description: "Failed to sign up with Google",
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
            <Text color="fg.muted">
              or
            </Text>
            <Stack flex="1" h="1px" bg="gray.200" />
          </Stack>

          <Form
            schema={schema}
            defaultValues={{
              email: '',
              password: '',
            }}
            onSubmit={async (values) => {
              try {
                const result = await signIn('credentials', {
                  ...values,
                  redirect: false,
                })
                
                if (result?.error) {
                  toast.error({
                    title: "Sign up failed",
                    description: result.error,
                  })
                  return { error: result.error }
                } else if (result?.url) {
                  router.push(result.url)
                }
              } catch (error) {
                console.error('Failed to sign up:', error)
                toast.error({
                  title: "Sign up failed",
                  description: "An unexpected error occurred",
                })
              }
            }}
          >
            {({ Field }) => (
              <FormLayout>
                <Field name="email" label="Email" type="email" />
                <Field name="password" label="Password" type="password" />
                <SubmitButton>Sign up</SubmitButton>
              </FormLayout>
            )}
          </Form>
        </Container>

        <Text color="fg.muted" textStyle="sm">
          Already have an account?{' '}
          <Link href="/login" color="fg">
            Log in
          </Link>
          .
        </Text>
      </Stack>
      <Stack flex="1" bg="colorPalette.solid">
        <Center flex="1">
          <Container maxWidth="md">
            <HStack mb="4" gap="4">
              <Box>
                <Text color="fg.inverted" fontSize="md" fontWeight="medium">
                  KeepKey Support Portal
                </Text>
              </Box>
            </HStack>
            <Text color="white" fontSize="md">
            </Text>
          </Container>
        </Center>
      </Stack>
    </Stack>
  )
}
