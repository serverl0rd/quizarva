import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const setupProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  }),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { username } = setupProfileSchema.parse(body)

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Update user with username
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: { username },
      create: {
        email: session.user.email,
        googleId: session.user.id,
        name: session.user.name,
        username,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Profile setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup profile' },
      { status: 500 }
    )
  }
}