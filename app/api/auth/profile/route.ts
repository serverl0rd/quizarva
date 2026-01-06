import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        profilePhoto: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            hostedGames: true,
            playerGames: true
          }
        }
      },
    })

    // If user doesn't exist, create it
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          googleId: session.user.id || '',
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          profilePhoto: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              hostedGames: true,
              playerGames: true
            }
          }
        },
      })
      user = newUser
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile fetch error:', error)
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      : 'Failed to fetch profile'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, username, bio, profilePhoto } = body

    // Validate username uniqueness if provided
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          email: { not: session.user.email }
        }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        username,
        bio,
        profilePhoto
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        profilePhoto: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            hostedGames: true,
            playerGames: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}