'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePioneer } from '@coinmasters/pioneer-react'
import { useOnStartApp } from './utils/onStart'
import { Box, Spinner } from '@chakra-ui/react'

export default function RootPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const onStartApp = useOnStartApp()
  const pioneer = usePioneer()

  useEffect(() => {
    const initPioneer = async () => {
      console.log('🚀 Initializing Pioneer at root level')
      try {
        await onStartApp()
        console.log('✅ Pioneer initialized successfully')
      } catch (e) {
        console.error('❌ Pioneer initialization error:', e)
      }
    }

    initPioneer()
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'authenticated') {
      router.push('/getting-started')
    } else {
      router.push('/login')
    }
  }, [status, router])

  // Show loading state while checking auth and initializing Pioneer
  return (
    <Box height="100vh" display="flex" alignItems="center" justifyContent="center" bg="black">
      <Spinner size="xl" color="white" />
    </Box>
  )
} 