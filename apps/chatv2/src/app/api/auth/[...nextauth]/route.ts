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

          // Return the user object (this will be the JWT payload)
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
      // Initial sign in
      if (user) {
        token.provider = user.provider
        token.address = user.address
        token.username = user.username
        token.queryKey = user.queryKey
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.provider = token.provider
        session.address = token.address
        session.username = token.username
        session.queryKey = token.queryKey
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})

export { handler as GET, handler as POST } 