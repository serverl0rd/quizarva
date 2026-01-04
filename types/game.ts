export interface QuizQuestion {
  id: string
  categoryId: string
  value: number
  questionText: string
  questionImage?: string
  correctAnswer: string
  answerImage?: string
  explanation?: string
  isAnswered: boolean
}

export interface QuizCategory {
  id: string
  name: string
  order: number
  questions: QuizQuestion[]
}

export interface QuizBoard {
  id: string
  boardNumber: number
  categories: QuizCategory[]
}

export interface GamePlayer {
  id: string
  userId: string
  username: string
  board1Score: number
  board2Score: number
  totalScore: number
  isActive: boolean
}

export interface GameConfig {
  password: string
  buzzTimeout?: number
  answerTimeout?: number
  boards: {
    board1: {
      categories: Array<{
        name: string
        questions: Array<{
          questionText: string
          questionImage?: string
          correctAnswer: string
          answerImage?: string
          explanation?: string
        }>
      }>
    }
    board2: {
      categories: Array<{
        name: string
        questions: Array<{
          questionText: string
          questionImage?: string
          correctAnswer: string
          answerImage?: string
          explanation?: string
        }>
      }>
    }
  }
}

export interface GameSession {
  id: string
  hostId: string
  status: 'WAITING' | 'READY' | 'IN_PROGRESS' | 'PAUSED' | 'TIEBREAKER' | 'COMPLETED' | 'CANCELLED'
  currentBoard: number
  currentQuestion?: string
  currentSelector?: string
  players: GamePlayer[]
  boards: QuizBoard[]
}

export interface GameTemplate {
  id: string
  name: string
  description?: string
  collection?: string
  configuration: GameConfig
  isPublic: boolean
  creatorName?: string
  usageCount: number
  createdAt: Date
}