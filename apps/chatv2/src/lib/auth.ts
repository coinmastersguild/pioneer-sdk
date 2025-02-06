import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not set')
}

export const authConfig: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'Password',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock authentication - replace with your actual auth logic
        if (credentials?.email === "user@keepkey.com" && credentials?.password === "123345") {
          return {
            id: "1",
            name: "KeepKey User",
            email: credentials.email,
          }
        }
        return null
      }
    }),
  ],
  pages: {
    signIn: '/login',
    newUser: '/signup',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string
        }
      }
    }
  },
  session: {
    strategy: 'jwt'
  }
} 