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

const prodUrl = 'https://keepkey-template-v8.vercel.app'

export const authConfig: NextAuthOptions = {
  debug: true, // Enable debug logs
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
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        
        // Add Google-specific profile data if available
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
        session.user.image = token.picture || null // Use Google profile picture if available
        
        // Add additional Google profile data to the session
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
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
} 