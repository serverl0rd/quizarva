import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import type { NextAuthConfig } from 'next-auth'
import { prisma } from '@/lib/db/prisma'

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Create or update user in database
          await prisma.user.upsert({
            where: { email: user.email! },
            update: {
              name: user.name,
              googleId: account.providerAccountId,
            },
            create: {
              email: user.email!,
              name: user.name,
              googleId: account.providerAccountId,
            },
          })
        } catch (error) {
          console.error('Error creating/updating user in database:', error)
          // Don't block sign in if database operation fails
          // User can still sign in, profile will be created later
        }
      }
      return true // Always allow sign in
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)