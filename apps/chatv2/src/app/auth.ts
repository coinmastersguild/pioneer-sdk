import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { JWT } from "next-auth/jwt"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string | null
      firstName?: string
      lastName?: string
      locale?: string
    }
  }

  interface Profile {
    picture?: string
    given_name?: string
    family_name?: string
    locale?: string
  }
}

// Extend JWT type
declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name?: string
    picture?: string
    given_name?: string
    family_name?: string
    locale?: string
  }
}

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not set')
}

export const authConfig: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'Password',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password')
        }

        if (credentials?.email === "user@keepkey.com" && credentials?.password === "123345") {
          return {
            id: "1",
            name: "KeepKey User",
            email: credentials.email,
          }
        }
        throw new Error('Invalid email or password')
      }
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        
        if (account?.provider === 'google' && profile) {
          token.picture = profile.picture
          token.given_name = profile.given_name
          token.family_name = profile.family_name
          token.locale = profile.locale
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name
        session.user.image = token.picture || null
        
        if (token.given_name) {
          session.user.firstName = token.given_name
        }
        if (token.family_name) {
          session.user.lastName = token.family_name
        }
        if (token.locale) {
          session.user.locale = token.locale
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // Only allow redirects to the same host
      const urlObj = new URL(url)
      const baseUrlObj = new URL(baseUrl)
      if (urlObj.hostname === baseUrlObj.hostname) {
        return url
      }
      return baseUrl
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
} 