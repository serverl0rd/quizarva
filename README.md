# QuizArva

A real-time multiplayer quiz application with Jeopardy-style gameplay. Built with Next.js, PostgreSQL, and Redis for a seamless, interactive experience.

## Features

- **Real-time Multiplayer**: Exactly 3 players compete in Jeopardy-style gameplay
- **Live Buzzer System**: Race condition-protected buzzing with instant feedback
- **Progressive Web App**: Install on mobile devices for native app-like experience
- **Host Dashboard**: Comprehensive controls for game management
- **Mobile-First Design**: Optimized for portrait mobile play
- **Image Support**: Rich media questions with Vercel Blob storage
- **Export/Import**: Save and reuse game templates

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Real-time State**: Vercel KV (Redis)
- **Real-time Updates**: Server-Sent Events (SSE)
- **Authentication**: NextAuth.js with Google OAuth
- **File Storage**: Vercel Blob
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis instance (or Vercel KV)
- Google OAuth credentials
- Vercel Blob storage token

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quizarva.git
cd quizarva
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```
Edit `.env.local` with your actual values.

4. Set up the database:

**Option A: Automatic Setup (Recommended)**
```bash
npx tsx scripts/setup-database.ts
```
This will check your database connection, run migrations, and prepare your database.

**Option B: Manual Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

**Note**: The profile page will work even without a database connection, showing data from your Google account until the database is set up.

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

See `.env.example` for all required environment variables:

- `NEXTAUTH_URL`: Your app URL
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `GOOGLE_CLIENT_ID/SECRET`: Google OAuth credentials
- `DATABASE_URL`: PostgreSQL connection string
- `KV_REST_API_URL/TOKEN`: Vercel KV credentials
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run typecheck`: Check TypeScript types
- `npm test`: Run Playwright tests
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:studio`: Open Prisma Studio

## Project Structure

```
quizarva/
├── app/                # Next.js App Router pages and API
├── components/         # React components
│   ├── game/          # Game-specific components
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and configurations
├── prisma/            # Database schema
├── public/            # Static assets and PWA files
├── types/             # TypeScript definitions
└── TEST_FILES/        # Playwright E2E tests
```

## Game Rules

- Exactly 3 players per game
- 2 boards, 5 categories each, 5 questions per category
- Point values: 10, 20, 30, 40, 50
- First player to buzz gets to answer
- Correct answers earn points and selection rights
- Wrong answers deduct points
- Tiebreakers for tied winners

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import repository in Vercel
3. Configure environment variables
4. Deploy

The app will automatically:
- Run database migrations
- Build the application
- Start the production server

## Testing

Run the test suite:
```bash
npm test
```

For UI testing mode:
```bash
npm run test:ui
```

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.