import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const activeGames = await prisma.game.findMany({
      where: {
        hostId: user.id,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        players: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(activeGames)
  } catch (error) {
    console.error('Active games fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active games' },
      { status: 500 }
    )
  }
}