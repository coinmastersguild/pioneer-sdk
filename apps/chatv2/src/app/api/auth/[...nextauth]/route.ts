import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        address: { label: "Address", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.address) return null

          // Return the user object (this will be the JWT payload)
          return {
            id: credentials.address,
            address: credentials.address,
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
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.provider = token.provider
        session.address = token.address
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