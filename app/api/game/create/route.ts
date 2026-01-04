import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { updateGameState } from '@/lib/redis/kv'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createGameSchema = z.object({
  password: z.string().min(1),
  buzzTimeout: z.number().optional(),
  answerTimeout: z.number().optional(),
  boards: z.object({
    board1: z.object({
      categories: z.array(z.object({
        name: z.string().min(1),
        questions: z.array(z.object({
          questionText: z.string().min(1),
          questionImage: z.string().optional(),
          correctAnswer: z.string().min(1),
          answerImage: z.string().optional(),
          explanation: z.string().optional(),
        })).length(5),
      })).length(5),
    }),
    board2: z.object({
      categories: z.array(z.object({
        name: z.string().min(1),
        questions: z.array(z.object({
          questionText: z.string().min(1),
          questionImage: z.string().optional(),
          correctAnswer: z.string().min(1),
          answerImage: z.string().optional(),
          explanation: z.string().optional(),
        })).length(5),
      })).length(5),
    }),
  }),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.username) {
      return NextResponse.json(
        { error: 'Please set up your profile first' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const config = createGameSchema.parse(body)

    // Create game in database
    const game = await prisma.game.create({
      data: {
        hostId: user.id,
        password: config.password,
        buzzTimeout: config.buzzTimeout,
        answerTimeout: config.answerTimeout,
        boards: {
          create: [
            {
              boardNumber: 1,
              categories: {
                create: config.boards.board1.categories.map((cat, catIndex) => ({
                  name: cat.name,
                  order: catIndex,
                  questions: {
                    create: cat.questions.map((q, qIndex) => ({
                      value: [10, 20, 30, 40, 50][qIndex],
                      questionText: q.questionText,
                      questionImage: q.questionImage,
                      correctAnswer: q.correctAnswer,
                      answerImage: q.answerImage,
                      explanation: q.explanation,
                    })),
                  },
                })),
              },
            },
            {
              boardNumber: 2,
              categories: {
                create: config.boards.board2.categories.map((cat, catIndex) => ({
                  name: cat.name,
                  order: catIndex,
                  questions: {
                    create: cat.questions.map((q, qIndex) => ({
                      value: [10, 20, 30, 40, 50][qIndex],
                      questionText: q.questionText,
                      questionImage: q.questionImage,
                      correctAnswer: q.correctAnswer,
                      answerImage: q.answerImage,
                      explanation: q.explanation,
                    })),
                  },
                })),
              },
            },
          ],
        },
      },
    })

    // Initialize game state in Redis
    await updateGameState(game.id, {
      currentPhase: 'waiting',
      lastUpdate: Date.now(),
    })

    return NextResponse.json({ gameId: game.id, success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid game configuration' },
        { status: 400 }
      )
    }
    console.error('Game creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}