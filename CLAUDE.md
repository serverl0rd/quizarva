# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuizArva is a real-time multiplayer quiz application with Jeopardy-style gameplay built on the Internet Computer blockchain. The application consists of a Motoko backend and React TypeScript frontend.

## Tech Stack

**Backend:**
- Language: Motoko
- Platform: Internet Computer (ICP)
- Storage: Blob storage integration for images
- Authentication: Internet Identity

**Frontend:**
- Framework: React with TypeScript
- Styling: Tailwind CSS with custom design tokens (OKLCH color system)
- Build Tool: Module-based (uses ES modules directly, no bundler config found)
- Key Dependencies: @tailwindcss/typography, @tailwindcss/container-queries, tailwindcss-animate

## Critical Development Notes

**⚠️ Missing Configuration Files:**
This codebase is missing essential configuration files. Before development, you need to create:
- `package.json` - Frontend dependencies and scripts
- `dfx.json` - Internet Computer configuration
- `.gitignore` - Version control exclusions
- `tsconfig.json` - TypeScript configuration

## Architecture

### Backend Structure
```
backend/
├── main.mo              # Main actor with game logic
├── migration.mo         # Data migration logic
└── authorization/
    └── access-control.mo # Role-based access control
```

Key backend concepts:
- Actor-based architecture (Internet Computer pattern)
- Hardcoded limit: Exactly 3 players per game (MaxPlayers = 3)
- Immutable audit logging for all score changes
- Blob storage integration for images

### Frontend Structure
```
frontend/
├── src/
│   ├── pages/          # Route components
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   └── main.tsx        # Entry point
└── index.html          # HTML entry
```

## Core Game Rules (Hardcoded)
- **3 players per game** - This is hardcoded in backend/main.mo as `MaxPlayers = 3`
- 2 boards per game
- 5 categories per board
- 5 questions per category
- Point values: 10, 20, 30, 40, 50

## UI Design Specifications
The app uses a minimalistic design with **no gradients**:
- Light mode: White (#FFFFFF) + Orange (#FF6B35)
- Dark mode: Black (#000000) + Purple (#9C27B0)
- All UI elements use solid colors only
- OKLCH color system via CSS variables

## Development Commands

Since configuration files are missing, typical commands would be:

**Internet Computer Development:**
```bash
# Install dfx CLI first
# dfx new --type=motoko --frontend=react quizarva
# dfx start --clean
# dfx deploy
```

**Frontend Development:**
```bash
# After creating package.json:
# npm install
# npm run dev
```

## Key Implementation Details

1. **Real-time Buzzing**: First-buzz arbitration with race condition protection
2. **Score Tracking**: Board-specific scores (board1Score, board2Score) + totalScore
3. **Current Selector**: Player who answered correctly chooses next question
4. **Tiebreaker**: Automatic sudden-death mode for tied highest scores
5. **Host Overrides**: Manual score adjustments and answer evaluation
6. **Export/Import**: Games can be exported as JSON/CSV and imported as templates

## Critical Files to Review
- `spec.md` - Complete product specification (46KB)
- `backend/main.mo` - Core game logic and state management
- `frontend/src/pages/` - Page components for each user flow
- `frontend/src/hooks/useQueries.ts` - Backend integration hooks

## Known Issues
- No package management configuration
- No test files or testing framework
- No CI/CD configuration
- Frontend appears to use ES modules directly without bundler

## Context Management Rule
When Claude's context usage drops below 40%, Claude MUST:
1. Create a comprehensive handover document at `/Users/rightfulguy/quizarva/HANDOVER.md`
2. Include the current todo list status
3. Detail what was completed in the current session
4. List remaining tasks with priority
5. Note any blockers or important context for the next session
6. Save all work before creating the handover document

This ensures seamless continuation of work across sessions with full context.