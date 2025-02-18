import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

declare module "next-auth" {
  interface Session {
    provider?: string
    address?: string
    username?: string
    queryKey?: string
  }

  interface User {
    provider?: string
    address?: string
    username?: string
    queryKey?: string
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        address: { label: "Address", type: "text" },
        queryKey: { label: "QueryKey", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.queryKey) {
            console.error('Missing required credentials')
            return null
          }

          return {
            id: credentials.username,
            username: credentials.username,
            address: credentials.address,
            queryKey: credentials.queryKey,
            provider: 'keepkey',
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.provider = user.provider as string
        token.address = user.address as string
        token.username = user.username as string
        token.queryKey = user.queryKey as string
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.provider = token.provider as string
        session.address = token.address as string
        session.username = token.username as string
        session.queryKey = token.queryKey as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  }
})

export { handler as GET, handler as POST } 