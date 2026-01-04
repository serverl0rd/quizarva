# QuizArva Project Structure

## Clean Architecture Overview

The QuizArva codebase follows a clean, modern Next.js architecture with clear separation of concerns.

```
quizarva/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── host/              # Host pages
│   ├── player/            # Player pages
│   └── providers.tsx      # Global providers
├── components/            # React Components
│   ├── game/             # Game-specific components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── prisma/               # Database schema
├── public/               # Static assets
├── types/                # TypeScript definitions
└── OLD_FILES/            # Archived legacy code

## Key Architectural Decisions

### 1. **Next.js App Router**
- Modern React Server Components architecture
- File-based routing with clear URL structure
- API routes colocated with pages

### 2. **Database Architecture**
- **PostgreSQL**: Primary persistent storage
- **Redis (Vercel KV)**: Live game state and caching
- **Prisma ORM**: Type-safe database access

### 3. **Real-time Updates**
- Server-Sent Events (SSE) for live game updates
- Centralized broadcast system
- Reconnection with exponential backoff

### 4. **State Management**
- React Query for server state
- Local state with React hooks
- No global client state needed

### 5. **Authentication**
- NextAuth.js with Google provider
- Session-based authentication
- Role-based access (Host vs Player)

## Component Architecture

### Game Components (`/components/game/`)
- **GameDashboard**: Host's main control panel
- **QuizBuilder**: Game creation with import/export
- **AuditLogViewer**: Activity tracking

### Gameplay Components (`/components/game/gameplay/`)
- **BuzzButton**: Mobile-optimized buzzer
- **QuestionSelection**: Board grid interface
- **AnswerSubmission**: Player answer input
- **AnswerEvaluation**: Host answer review
- **TiebreakerQuestionSelect**: Sudden death mode

### UI Components (`/components/ui/`)
- Reusable, styled components
- Consistent design tokens
- Dark mode support

## API Structure

### Game Management
- `/api/game/create` - New game creation
- `/api/game/join` - Player joining
- `/api/game/[gameId]/*` - Game-specific endpoints

### Real-time
- `/api/sse/game/[gameId]` - SSE connection
- Event-driven updates for all clients

### File Storage
- `/api/upload` - Vercel Blob integration
- Image uploads for questions/answers

## Design Patterns

### 1. **Separation of Concerns**
- API routes handle business logic
- Components focus on presentation
- Hooks manage data fetching

### 2. **Type Safety**
- Full TypeScript coverage
- Zod validation for API inputs
- Prisma-generated types

### 3. **Error Handling**
- Consistent error responses
- User-friendly error messages
- Graceful degradation

### 4. **Performance**
- React Query caching
- Optimistic updates
- Lazy loading images

## Mobile vs Desktop

### Player Experience (Mobile-first)
- Portrait orientation enforced
- Touch-optimized controls
- 50vh buzz button
- Simplified UI

### Host Experience (Desktop-first)
- Multi-panel dashboard
- Comprehensive controls
- Audit logging
- Override capabilities

## Security Considerations

1. **Authentication Required**: All game actions require auth
2. **Role-based Access**: Host-only endpoints protected
3. **Input Validation**: Zod schemas on all inputs
4. **Audit Trail**: All actions logged
5. **No Direct DB Access**: API layer enforces rules

## Deployment Ready

The codebase is production-ready with:
- Environment variable support
- Database migrations
- Build optimization
- PWA capabilities
- Error tracking setup

## Why This Architecture?

1. **Scalability**: Stateless API, Redis for live data
2. **Maintainability**: Clear structure, TypeScript
3. **Performance**: SSE for real-time, caching
4. **Developer Experience**: Modern tooling, hot reload
5. **User Experience**: Fast, responsive, offline-capable