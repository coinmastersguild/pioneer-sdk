/**
 * Authentication is handled by Next-auth.
 * @see https://saas-ui.dev/docs/pro/configuration/authentication
 */
import { AuthParams, User } from '@saas-ui/auth-provider'
import { signIn, signOut, getSession } from 'next-auth/react'

// Extend the next-auth session user type
declare module 'next-auth' {
  interface Session {
    user: User
  }
}

export const authService = {
  onLogin: async (params: AuthParams) => {
    // Handle Google provider
    if (params.provider === 'google') {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/getting-started'
      })
      
      if (result?.error) {
        throw new Error(result.error)
      }
    } else {
      // Regular credentials login
      const result = await signIn('credentials', {
        ...params,
        redirect: false,
        callbackUrl: '/getting-started'
      })
      
      if (result?.error) {
        throw new Error(result.error)
      }
    }

    const session = await getSession()
    return session?.user
  },
  onSignup: async (params: AuthParams) => {
    // For Google sign up, use the same flow as login
    if (params.provider === 'google') {
      return authService.onLogin(params)
    }
    
    // For now, just use the same login flow since we're mocking
    return authService.onLogin(params)
  },
  onLogout: async () => {
    await signOut({ redirect: false })
  },
  onLoadUser: async () => {
    const session = await getSession()
    return session?.user
  },
  onGetToken: async () => {
    const session = await getSession()
    return session?.user?.id
  },
}
