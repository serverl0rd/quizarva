import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { z } from 'zod'

// Schema for imported game data
const importSchema = z.object({
  password: z.string().optional(),
  boards: z.array(z.object({
    boardNumber: z.number(),
    categories: z.array(z.object({
      name: z.string(),
      position: z.number(),
      questions: z.array(z.object({
        value: z.number(),
        question: z.string(),
        answer: z.string(),
        explanation: z.string().optional(),
        questionImageUrl: z.string().optional(),
        answerImageUrl: z.string().optional(),
      })),
    })),
  })),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate the imported data
    const validatedData = importSchema.parse(body)

    // Transform imported data to match QuizBuilder format
    const transformedData = {
      password: validatedData.password || '',
      board1: {
        categories: validatedData.boards
          .find(b => b.boardNumber === 1)
          ?.categories
          .sort((a, b) => a.position - b.position)
          .map(cat => ({
            name: cat.name,
            questions: cat.questions
              .sort((a, b) => a.value - b.value)
              .map(q => ({
                questionText: q.question,
                correctAnswer: q.answer,
                explanation: q.explanation,
                questionImageUrl: q.questionImageUrl,
                answerImageUrl: q.answerImageUrl,
              })),
          })) || [],
      },
      board2: {
        categories: validatedData.boards
          .find(b => b.boardNumber === 2)
          ?.categories
          .sort((a, b) => a.position - b.position)
          .map(cat => ({
            name: cat.name,
            questions: cat.questions
              .sort((a, b) => a.value - b.value)
              .map(q => ({
                questionText: q.question,
                correctAnswer: q.answer,
                explanation: q.explanation,
                questionImageUrl: q.questionImageUrl,
                answerImageUrl: q.answerImageUrl,
              })),
          })) || [],
      },
    }

    return NextResponse.json({
      success: true,
      data: transformedData,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid import data format', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to process import data' },
      { status: 500 }
    )
  }
}