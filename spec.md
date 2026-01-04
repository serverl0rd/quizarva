# QuizArva

## Overview
QuizArva is a real-time, multiplayer quiz application inspired by Jeopardy-style gameplay and formats like *Buzzing with Kvizzing*. One host and exactly three players participate in a live game. The host manages the game from a web interface, while players join and play via a mobile-first Progressive Web App (PWA). The system emphasizes fairness, speed, real-time synchronization, and replayability through reusable game content.

The application is built with Next.js and deployed on Vercel, leveraging edge computing for low-latency gameplay. It supports real-time interactions through Server-Sent Events (SSE) and maintains game state using Vercel KV (Redis) with PostgreSQL for persistent storage. All games are strictly limited to exactly three players. Hosts can create custom quiz configurations with two boards, each containing 5 categories with 5 questions each. Players who answer correctly gain control to select the next question. The application includes automatic sudden-death tiebreaker functionality to resolve tied games and comprehensive host override capabilities for game management. Completed games can be exported in multiple formats for backup and future import purposes. Hosts can import previously exported game files to create private game templates for reuse.

## Platforms
- **Host:** Web (desktop-first)
- **Players:** Mobile-first PWA (portrait-only orientation)
- **Deployment:** Vercel with Edge Functions
- **Real-time:** Server-Sent Events (SSE) via Next.js API Routes

## Authentication
- Google SSO required for all users
- Users can act as host or player depending on the game
- Role is contextual per game, not permanent
- Users can view all past games they participated in
- Session persistence across browser refreshes during active games
- Hosts can see game passwords after creation
- Cookie consent includes analytics for game improvement

## Core Entities

### Users
- User profiles linked to Google account IDs
- Store basic user information and game history
- Username required for game participation
- Users can download all their data (GDPR compliance)
- Account deletion anonymizes historical game records

### Games
- Game sessions created by hosts with a fixed limit of exactly 3 players
- Track game configuration, status, and metadata
- Support for multiple concurrent games
- Unique game IDs for player joining
- Hardcoded maximum of 3 players per game
- Store custom quiz configuration with 2 boards
- Include password protection for game access
- Store buzz timeout and answer timeout settings
- Include BuzzState management for first-buzz arbitration
- Track currentSelector (player who has control to select next question)
- Track tiebreaker state including active tiebreaker mode and eligible tied players
- Store game winner information after completion or tiebreaker resolution
- Track game completion status for export functionality

### Game Templates
- Private game templates created from imported JSON files
- Store complete quiz configuration including boards, categories, questions, images, answers, and explanations
- Store game settings including password, buzz timeout, and answer timeout
- Link templates to importing user for privacy and ownership
- Support template editing and modification before game creation
- Templates are private by default and not visible to other users
- Templates can be organized into collections (e.g., "History Pack", "Science Pack")
- Track template creation date and usage analytics
- Support "remix" functionality for public games (copy + edit)
- Maximum import file size: 10MB
- Warn and continue when imported images return 404 errors

### BuzzState
- Track which player buzzed first for each question
- Maintain queue of subsequent buzzers in order
- Track whether question is currently in locked state
- Store active respondent information
- Manage buzz timing and timeout states
- Support tiebreaker mode where only tied players can buzz
- Buzz collision handling: timestamp winner takes precedence (no "photo finish" display)
- When player loses connection after buzzing, game waits for reconnection
- UI verdict is authoritative for buzz order disputes

### Quiz Configuration
- Two boards (Board 1 & Board 2) per game
- Each board contains exactly 5 categories
- Each category contains exactly 5 questions
- Questions include value (points), question text, optional question image URL, correct answer, optional answer image URL, and optional explanation
- Predefined point values: 10, 20, 30, 40, 50 points per question in each category

### Players
- Player participation in specific games
- Track player scores with separate board-specific tracking: board1Score, board2Score, and totalScore
- Board-specific scores track points earned from questions on each respective board
- Total score represents cumulative points across both boards
- Link players to users and games
- Support negative scores with no floor limit for all score types
- Track tiebreaker eligibility status

### Scoring System
- Players receive full point value for correct answers on the corresponding board score and total score
- Players lose points equal to question value for incorrect answers from both board score and total score
- Negative scores are allowed with no minimum floor for board scores and total score
- No score changes when no player buzzes for a question
- Atomic score updates during answer resolution affecting both board-specific and total scores
- Live score propagation to frontend for real-time display of all three score types
- Player who answers correctly becomes the currentSelector for next question
- No score changes during sudden-death tiebreaker rounds
- Score updates must maintain consistency: totalScore = board1Score + board2Score
- Host override capabilities allow manual score adjustments and answer evaluation overrides
- Negative scores displayed with minus sign (not parentheses)
- Score updates show instantly without floating animations
- Scoreboard positions remain fixed (no real-time reordering by rank)

### Tiebreaker System
- Automatic detection of tied highest total scores when game ends
- Sudden-death mode where only tied players can buzz in
- First tied player to buzz gains exclusive response control
- Correct answer results in instant game victory
- Incorrect answer results in automatic victory for remaining tied players
- No score modifications during tiebreaker rounds
- Automatic game completion when tiebreaker resolves

### Audit Logs
- Immutable audit log system that records every score change permanently
- Each log entry includes: Game ID, Player Principal (ID), Board number (1 or 2), Category name, Question ID or text identifier, Points added or deducted (pointDelta), Reason (e.g., "Correct answer", "Incorrect answer", "Host override - Correct", "Host override - Incorrect", "Manual score adjustment", "Question skipped"), and Timestamp
- Append-only system where entries cannot be edited or deleted
- System activity logging for debugging and monitoring
- Track user actions, game events, and system operations
- Record all scoring events with points added/deducted, player, question, board, reason, and timestamp
- Immutable scoring event records for transparency and fairness
- Record tiebreaker events with reason "Sudden death tiebreaker resolution"
- Record host override actions with specific reasons for manual interventions
- Viewable via queries for hosts (their own games) and admin (all games)
- Automatic integration with existing recordScoringEvent and registerScore mechanisms

### Game Export System
- Export completed games in JSON and CSV formats
- Include comprehensive game data: full quiz configuration, game metadata, player information, final scores, and complete audit logs
- Generate downloadable files with structured data format
- Support future import functionality with standardized export format
- Track export events for audit purposes

### Game Import System
- Import previously exported QuizArva game files in JSON format
- Validate imported file structure including boards, categories, questions, timers, and game settings
- Create private game templates from imported configurations
- Store imported templates tied to the importing user for privacy
- Support template editing and modification before game creation
- Handle import errors for invalid or incomplete files with user-friendly messages

## User Roles

### Host
- Create and manage game sessions with exactly 3 players
- Configure custom quiz content with 2 boards, 5 categories each, 5 questions per category
- Upload optional images for questions and answers during quiz creation
- Set game password for access control
- Configure buzz timeout and answer timeout durations
- Control game flow and progression including safety slide transitions (when not overridden by currentSelector)
- View live player scores during gameplay with separate Board 1, Board 2, and Total columns
- Access host-specific interface at `/host` route
- Lose question selection control when a player becomes currentSelector
- Observe sudden-death tiebreaker rounds with specialized UI display
- View audit logs for their own games showing all score changes
- Execute host override functions including:
  - Manually mark answers as correct or incorrect (overriding automatic evaluation)
  - Adjust any player's score manually by adding or subtracting points
  - Skip questions and move to next question selection
- Access Host Override Panel with controls for manual game management
- Export completed games in JSON and CSV formats via "Download Game Data" button
- Import previously exported game files to create private game templates
- Edit imported game templates before starting new games
- Access private template library for reusing imported configurations

### Player
- Join existing game sessions using game ID and password (up to 3 players maximum)
- Participate in quiz gameplay with synchronized game phases
- Buzz in to answer questions with first-buzz arbitration
- View own score and other players' scores in real-time with Board 1, Board 2, and Total breakdowns
- Access player interface at `/player` route
- Gain question selection control when answering correctly (become currentSelector)
- Select next category and question when designated as currentSelector
- Participate in sudden-death tiebreaker rounds if tied for highest total score

### Admin
- View audit logs for all games across the system
- Access comprehensive scoring history and system monitoring data
- Export any completed game data in JSON and CSV formats

## Frontend Structure

### Pages
- `/login` - Authentication page
- `/host` - Host dashboard, quiz builder, game management, and import functionality
- `/player` - Player interface for joining and playing games

### Navigation
- Navigation bar showing authentication status
- Route access to host and player sections
- User authentication state display

### Components
- ProfileSetupModal for username collection when user is not registered
- Quiz Builder interface for creating custom quiz content with image upload capabilities
- Game Import interface for uploading and processing JSON files
- Template selection interface for choosing from imported game templates
- Game ID and password input prompts for joining games
- Host dashboard/waiting room for game creators showing exactly 3 player slots
- Player game screen for participants with synchronized game phases including buzz state
- Game full notifications when 3 players have joined
- Safety slide component displayed between question and answer phases
- Buzz button with lock state management
- Active respondent highlighting
- Buzz queue display
- Live scoreboard displaying Board 1, Board 2, and Total scores for all players in three separate columns
- Score update animations and visual feedback for scoring events
- Question selection controls that appear for currentSelector (player or host)
- Current selector indicator showing who has control to select next question
- Sudden Death Round banner displayed during tiebreaker mode
- Tiebreaker UI showing only eligible tied players can buzz
- Game winner display after tiebreaker resolution
- Audit log viewer for hosts to see scoring history of their games
- Admin audit log interface for viewing all game scoring events
- Host Override Panel with controls for:
  - Mark answer correct/incorrect buttons
  - Manual score adjustment with numeric input and +/- toggle
  - Skip question confirmation button
- Real-time UI updates reflecting host override actions
- Game Export Interface with:
  - "Download Game Data" button that appears when game is completed
  - Format selection dropdown (JSON/CSV)
  - Export confirmation dialog
  - Download progress indicator
  - Export success/error notifications
- Game Import Interface with:
  - File upload dialog for JSON files
  - Import validation and progress indicators
  - Success/error notifications for import operations
  - Template preview before finalizing import

## Backend Operations
- Store and retrieve user data with registration status checking
- Create new game sessions via `createGame` function with hardcoded 3-player limit and custom quiz configuration including image URLs
- Handle player joining via `joinGame` function with game ID validation, password verification, and 3-player limit enforcement
- Implement `buzz(gameId)` function for first-buzz arbitration with lock management
- Implement `advanceToNextBuzzer(gameId)` function to progress through buzz queue
- Implement scoring logic with atomic score updates during answer resolution for board-specific and total scores
- Process correct answers by adding full question point value to appropriate board score and total score, and setting currentSelector to that player
- Process incorrect answers by subtracting question point value from appropriate board score and total score without changing currentSelector
- Handle no-buzz scenarios with no score changes and no currentSelector changes
- Update player scores atomically within answer resolution process maintaining totalScore = board1Score + board2Score
- Track and update currentSelector state variable in game data
- Implement question selection function that validates currentSelector permissions
- Validate quiz configuration: exactly 5 categories per board, exactly 5 questions per category
- Store game password, buzz timeout, and answer timeout settings
- Store optional question and answer image URLs for each question
- Prevent more than 3 players from joining a game with explicit runtime error
- Reject incorrect passwords during game joining with clear error messages
- Manage game sessions and state including safety slide phase transitions and buzz states
- Handle player registrations and game participation
- Maintain immutable audit logs for system monitoring including permanent scoring event records with complete details
- Support concurrent game sessions
- Validate user registration before game operations
- Return appropriate errors for unauthorized access, invalid game IDs, incorrect passwords, or game full scenarios
- Sync buzz state updates, score changes, and currentSelector updates with frontend through game state queries
- Automatically record scoring events in immutable audit log through existing recordScoringEvent and registerScore mechanisms
- Enforce currentSelector permissions for question selection operations
- Detect tied highest total scores when game ends and initiate automatic sudden-death tiebreaker
- Implement tiebreaker buzz logic restricting buzzing to tied players only
- Handle tiebreaker answer resolution with instant win/loss determination
- Record tiebreaker resolution events in audit log
- Set game winner and mark game as inactive after tiebreaker completion
- Extend `getPlayersForGame` and related APIs to return board1Score, board2Score, and totalScore for each player
- Provide audit log query functions for hosts (game-specific) and admin (system-wide)
- Ensure all score changes automatically generate immutable audit log entries
- Implement host override functions:
  - `hostOverrideAnswer(gameId, playerId, isCorrect)` - manually mark answer as correct or incorrect
  - `hostAdjustScore(gameId, playerId, boardNumber, pointsDelta)` - manually adjust player score
  - `hostSkipQuestion(gameId)` - skip current question and move to next selection
- Validate host permissions for all override operations
- Generate audit log entries for all host override actions with appropriate reasons
- Trigger real-time updates to all connected players when host overrides occur
- Implement game export functionality:
  - `exportGameData(gameId, format)` - generate comprehensive game export in JSON or CSV format
  - Validate export permissions (host of the game or admin)
  - Compile complete game data including quiz configuration, metadata, players, scores, and audit logs
  - Generate downloadable file content in requested format
  - Track export events in system logs
- Implement game import functionality:
  - `importGameTemplate(jsonData)` - receive and validate imported JSON game configuration
  - Validate file structure including boards, categories, questions, timers, and settings
  - Create private game template tied to importing user
  - Store template configuration for future use
  - Return validation errors for invalid or incomplete files
  - `getGameTemplates(userId)` - retrieve private templates for specific user
  - `createGameFromTemplate(templateId, customizations)` - create new game from imported template
- Handle import validation errors and provide detailed error messages
- Ensure imported templates are private and only accessible to importing user

## User Flows

### Host Flow
1. User clicks "Host a game" button
2. System checks if user is registered (has username)
3. If not registered, show ProfileSetupModal to collect username
4. Display Quiz Builder interface with:
   - Two board sections (Board 1 & Board 2)
   - 5 category inputs per board
   - 5 question inputs per category (with predefined point values 10-50)
   - Optional image upload fields for questions and answers
   - Game password input field
   - Buzz timeout and answer timeout configuration
   - Import game template option
5. Validate that both boards are fully configured before allowing game creation
6. Call backend `createGame` function with complete quiz configuration including image URLs
7. Display generated Game ID and password for sharing with players
8. Navigate to host dashboard/waiting room showing 3 player slots
9. During gameplay, view live scoreboard with real-time score updates showing Board 1, Board 2, and Total columns
10. Lose question selection control when a player becomes currentSelector
11. Regain control only when designated as currentSelector again
12. Observe sudden-death tiebreaker with specialized UI if game ends in tie
13. Access audit log viewer to see all scoring events for their games
14. Use Host Override Panel to:
    - Manually mark answers as correct or incorrect
    - Adjust player scores with manual point additions or deductions
    - Skip questions when needed
15. View real-time updates from override actions on scoreboard and audit log
16. After game completion, access "Download Game Data" button
17. Select export format (JSON or CSV) from dropdown
18. Confirm export action in dialog
19. Download generated file with complete game data

### Game Import Flow
1. Host accesses Quiz Builder interface
2. Click "Import Game Template" button or similar import option
3. File upload dialog opens for JSON file selection
4. Host selects previously exported QuizArva JSON file
5. Frontend uploads file to backend via `importGameTemplate` function
6. Backend validates file structure including:
   - Two boards with 5 categories each
   - 5 questions per category with required fields
   - Valid game settings (timers, password format)
   - Image URLs and answer formats
7. If validation passes:
   - Backend creates private game template tied to importing user
   - Frontend displays success message
   - Template becomes available in user's private template library
8. If validation fails:
   - Backend returns specific error messages
   - Frontend displays user-friendly error notifications
   - User can retry with corrected file
9. Host can select imported template from template library
10. Template data automatically populates Quiz Builder fields
11. Host can edit any aspect of imported configuration before creating game
12. Host proceeds with normal game creation flow using imported/edited configuration

### Template Management Flow
1. Host accesses template selection interface in Quiz Builder
2. System displays private templates imported by the user
3. Host selects desired template from library
4. Template configuration automatically populates all Quiz Builder fields
5. Host can modify any aspect of the imported configuration
6. Host proceeds with game creation using template as starting point
7. Original template remains unchanged for future reuse

### Player Flow
1. User clicks "Join as a player" button
2. System checks if user is registered (has username)
3. If not registered, show ProfileSetupModal to collect username
4. Prompt user for Game ID and password input
5. Call backend `joinGame` function with provided game ID and password
6. If password is incorrect, display error message
7. If game is full (3 players), display error message
8. If successful, navigate to player game screen for the joined session
9. During gameplay, view own score and other players' scores with live updates showing Board 1, Board 2, and Total breakdowns
10. When designated as currentSelector after correct answer, gain access to question selection controls
11. Select next category and question when having currentSelector status
12. Participate in sudden-death tiebreaker if tied for highest total score at game end
13. Receive real-time updates when host performs override actions

### Admin Flow
1. Admin accesses system-wide audit log interface
2. View comprehensive scoring history across all games
3. Filter and search audit log entries by game, player, or time period
4. Monitor system activity and scoring events for transparency
5. View host override actions across all games
6. Export any completed game data in JSON or CSV format
7. Access game export functionality for any game in the system

### Game Export Flow
1. Host or admin accesses completed game
2. Click "Download Game Data" button (visible only after game completion)
3. Select desired export format from dropdown (JSON or CSV)
4. Confirm export action in confirmation dialog
5. Backend validates export permissions and game completion status
6. Backend compiles comprehensive game data including:
   - Complete quiz configuration (both boards, categories, questions, images, answers, explanations)
   - Game metadata (host information, creation time, password, timeout settings)
   - Player list with usernames and final scores (board1Score, board2Score, totalScore)
   - Complete audit log with all scoring events and timestamps
7. Backend generates downloadable file in requested format
8. Frontend initiates file download
9. Display export success notification
10. Log export event for audit purposes

### Buzz Flow
1. During question phase, players can click buzz button
2. First player to buzz locks the question and becomes active respondent
3. Subsequent buzzers are queued but cannot answer until current respondent finishes
4. Buzz buttons are disabled for non-active players during lock
5. If active respondent fails or times out, next queued player becomes active
6. UI updates automatically to reflect buzz state changes
7. During tiebreaker mode, only tied players can buzz in

### Scoring Flow
1. Player provides answer after buzzing in
2. Host or system evaluates answer as correct or incorrect
3. Backend atomically updates player board-specific score and total score:
   - Correct answer: add full question point value to appropriate board score and total score, set currentSelector to answering player
   - Incorrect answer: subtract question point value from appropriate board score and total score, currentSelector remains unchanged
4. Score changes and currentSelector updates propagate immediately to frontend
5. Scoring event automatically recorded in immutable audit log with complete details including Game ID, Player Principal, Board number, Category name, Question identifier, pointDelta, Reason, and Timestamp
6. Live scoreboard updates for all participants showing all three score columns
7. If no player buzzes, no score changes or currentSelector changes occur
8. Question selection controls appear for new currentSelector
9. No score changes occur during sudden-death tiebreaker rounds

### Host Override Flow
1. Host accesses Host Override Panel during gameplay
2. For answer override:
   - Host clicks "Mark Correct" or "Mark Incorrect" button
   - Backend calls `hostOverrideAnswer` function with appropriate parameters
   - Score is adjusted based on override decision
   - Audit log entry created with reason "Host override - Correct" or "Host override - Incorrect"
3. For manual score adjustment:
   - Host enters point value in numeric input
   - Host selects +/- toggle for addition or subtraction
   - Host confirms adjustment
   - Backend calls `hostAdjustScore` function
   - Audit log entry created with reason "Manual score adjustment"
4. For question skip:
   - Host clicks "Skip Question" button
   - Host confirms skip action
   - Backend calls `hostSkipQuestion` function
   - Game moves to next question selection phase
   - Audit log entry created with reason "Question skipped"
5. All override actions trigger real-time updates to all connected players
6. Scoreboard and audit log viewer update immediately

### Question Selection Flow
1. After correct answer, currentSelector gains question selection controls
2. CurrentSelector chooses category and question from available options
3. Backend validates that requesting user is the currentSelector
4. Selected question is displayed to all participants
5. Game proceeds with new question phase
6. Other players and host see disabled selection controls until currentSelector changes

### Tiebreaker Flow
1. When game ends, backend automatically detects tied highest total scores
2. If tie exists, game enters sudden-death tiebreaker mode
3. Frontend displays "Sudden Death Round" banner
4. Only tied players can buzz in for tiebreaker question
5. First tied player to buzz gains exclusive response control
6. If first buzzer answers correctly, they win the game instantly
7. If first buzzer answers incorrectly, remaining tied players automatically win
8. Tiebreaker resolution recorded in immutable audit log with reason "Sudden death tiebreaker resolution"
9. Game winner is set and game becomes inactive
10. UI displays winner announcement

## Core Game Rules
- Exactly **3 players per game** (hardcoded, non-configurable)
- One host per game
- Games are private and invite-only (no public matchmaking)

## Game Creation & Access Control
- Host creates a game
- System generates a unique **Game ID**
- Host sets a **password**
- Players join using Game ID + password
- Game automatically locks once 3 players have joined

## Game Structure
- Each game has **2 boards**
- Each board contains:
  - 5 categories
  - 5 questions per category
- Question point values per category:
  - 10, 20, 30, 40, 50

## Question Format
- Text-based questions
- Image-based questions (optional)
- Each question includes:
  - Question text or image
  - Correct answer
  - Optional answer image
  - Optional explanation

## Game Flow Phases
1. Question displayed
2. Buzz window opens
3. First buzz locks out other players
4. Player answers
5. **Safety Slide** (host-controlled pause)
6. Answer reveal
7. Score update
8. Next question selected

### Additional Phases
- Question Display: Shows question text and/or question image
- Buzz Phase: Players can buzz in with first-buzz arbitration
- Safety Slide: Automatically displayed after question phase, controlled by host or currentSelector
- Answer Reveal: Shows correct answer text and/or answer image, controlled by host or currentSelector
- Score Update: Atomic score changes based on answer correctness with live propagation and currentSelector update
- Question Selection: CurrentSelector chooses next category and question
- Tiebreaker Mode: Sudden-death round for tied players with specialized buzz restrictions
- Host Override: Host can intervene at any point to manually adjust scores, mark answers, or skip questions
- Game Export: Post-completion phase where hosts can export complete game data
- Template Import: Pre-game phase where hosts can import and customize game templates

## Buzzing Logic
- Single buzz button per player
- First buzz is determined by timestamp
- First buzz locks all other players
- Strong race-condition protection required

## Scoring Rules
- Correct answer: **+ full question points**
- Incorrect answer: **− full question points**
- Negative scores are allowed
- If no player buzzes: **no score change**
- Player who answers correctly selects the next question

## Timers
- Buzz timer (time allowed to buzz)
- Answer timer (time allowed to answer after buzzing)
- Both timers are optional and configurable by the host before game creation

## Tie-Breaker Rules (Official Jeopardy)
- If players are tied for **first place** at game end:
  - Initiate a sudden-death tiebreaker question
  - First player to buzz and answer correctly wins
  - No negative scoring during tiebreaker
  - If buzzer answers incorrectly, remaining tied players automatically win

## Score Tracking
- Scores stored and displayed as:
  - Board 1 total
  - Board 2 total
  - Final cumulative total
- Real-time score updates visible to host and players

## Host Controls
- Advance game phases
- Override answer correctness
- Manually adjust scores
- Skip questions
- Control safety slide transitions

All overrides must be logged.

## Audit Logging
- Immutable audit log required
- Every score change must record:
  - Game ID
  - Player ID
  - Board number
  - Category
  - Question ID
  - Point delta (+ / −)
  - Reason (correct, incorrect, override)
  - Timestamp
- Audit logs are exportable and never editable

## Persistence & History
- Persist all games, questions, answers, scores, and audit logs
- Users can view their past games

## Export / Import / Public Games
- Completed games can be **exported** (full configuration and content)
- Users can **import** games created by others
- Games can be marked **public** and appear in a shared gallery
- Public games can be added to a personal library and played privately with friends
- No ownership restrictions on games or questions

## Rejoin & Reliability
- Players and host can refresh or reconnect without losing game state
- No score desynchronization allowed

## Performance Requirements
- Sub-200ms buzz latency
- Strong concurrency control
- Real-time synchronization across all clients

## Technical Stack
- **Framework:** Next.js 14+ with App Router
- **Deployment:** Vercel with Edge Functions
- **Database:** PostgreSQL (persistent data) + Vercel KV/Redis (live game state)
- **Real-time:** Server-Sent Events (SSE) for game updates
- **State Management:** Origin-based with edge caching (1-second TTL for read-only data)
- **File Storage:** Vercel Blob Storage for images
- **Authentication:** NextAuth.js with Google Provider

## Technical Architecture
- All write operations go directly to origin (Vercel KV)
- Edge functions cache read-only game data with 1-second TTL
- PostgreSQL for persistent storage with triggers for audit log immutability
- Redis (Vercel KV) for live game state with 24-hour TTL
- Atomic operations in Redis for buzz race condition handling
- Fallback to PostgreSQL if Vercel KV is unavailable
- Game state snapshots every 5 questions for recovery

## Quiz Builder Requirements
- Host interface includes Quiz Builder section
- Two boards labeled "Board 1" and "Board 2"
- Each board allows creation of exactly 5 categories
- Each category contains exactly 5 questions with predefined point values (10, 20, 30, 40, 50)
- Question fields include: question text, optional question image upload, correct answer, optional answer image upload, optional explanation
- Image upload functionality integrated with Caffeine blob storage
- Game password input field
- Buzz timeout and answer timeout configuration fields
- UI validation prevents game creation until both boards are fully configured
- Clear indication of completion status for each board and category
- Import game template functionality with file upload dialog
- Template selection interface for choosing from private imported templates
- Auto-population of fields from selected templates
- Template editing capabilities before game creation

## Gameplay Display Requirements
- Question phase displays question text and/or question image if provided
- Buzz phase shows buzz button state (enabled/disabled) based on lock status
- Active respondent is visually highlighted
- Buzz queue is displayed showing order of subsequent buzzers
- Safety slide phase provides transition between question and answer
- Answer reveal phase displays correct answer text and/or answer image if provided
- Both host and player interfaces show synchronized game phases including buzz states
- Images are displayed from stored URLs when available
- Automatic UI refresh when buzz state changes
- Live scoreboard showing Board 1, Board 2, and Total scores for all players in three separate columns
- Score update animations and visual feedback when scores change
- Real-time score propagation without page refresh for all score types
- Current selector indicator showing which player has question selection control
- Question selection controls appear only for currentSelector
- Disabled selection controls for non-currentSelector participants
- "Sudden Death Round" banner during tiebreaker mode
- Tiebreaker UI restricting buzz access to tied players only
- Game winner display after tiebreaker resolution
- Host Override Panel visible to hosts with controls for manual game management
- Real-time UI updates reflecting host override actions across all connected players
- Game Export Interface showing "Download Game Data" button after game completion
- Export format selection and confirmation dialogs
- Export progress indicators and success/error notifications
- Game Import Interface with file upload, validation feedback, and template selection

## Buzz Arbitration Requirements
- First player to buzz locks the question and becomes active respondent
- Subsequent buzzers are queued in order but cannot answer
- Buzz buttons are disabled for non-active players during lock
- Lock timer displays remaining time for active respondent
- System advances to next queued buzzer if current one fails or times out
- New buzzers are ignored while question is locked
- Visual indicators show current active buzzer and queue status
- During tiebreaker mode, only tied players can buzz in

## Scoring Requirements
- Correct answers award full question point value to the appropriate board score and total score
- Incorrect answers deduct question point value from the appropriate board score and total score
- Negative scores are permitted with no minimum floor for all score types
- No score changes when no player buzzes for a question
- Score updates are atomic and occur during answer resolution
- All scoring events are automatically recorded in immutable audit log with complete details
- Live score display updates immediately after score changes for all three score columns
- Scoreboard shows Board 1, Board 2, and Total scores in separate columns
- Score changes include visual feedback and animations
- Correct answers automatically set currentSelector to the answering player
- CurrentSelector state updates propagate immediately to all participants
- No score modifications during sudden-death tiebreaker rounds
- Maintain consistency: totalScore = board1Score + board2Score at all times
- Host override capabilities allow manual score adjustments and answer evaluation overrides
- All host override actions generate appropriate audit log entries

## Tiebreaker Requirements
- Automatic detection of tied highest total scores when game ends
- Initiation of sudden-death tiebreaker mode for tied players
- Restriction of buzz access to tied players only during tiebreaker
- First tied player to buzz gains exclusive response control
- Correct answer results in instant game victory for buzzing player
- Incorrect answer results in automatic victory for remaining tied players
- No score changes during tiebreaker rounds
- Tiebreaker resolution recorded in immutable audit log with reason "Sudden death tiebreaker resolution"
- Automatic game completion and winner determination
- UI display of "Sudden Death Round" banner and winner announcement

## Current Selector Requirements
- Game tracks currentSelector state variable identifying who can select next question
- Initially, host has currentSelector status at game start
- When player answers correctly, that player becomes the currentSelector
- Only currentSelector can invoke question selection functions
- Question selection controls appear only for currentSelector in UI
- All other participants see disabled selection controls
- Current selector status is displayed prominently to all participants
- Real-time updates ensure immediate UI changes when currentSelector changes
- Backend validates currentSelector permissions before allowing question selection

## Host Override Requirements
- Host can manually mark any answer as correct or incorrect, overriding automatic evaluation
- Host can manually adjust any player's score by adding or subtracting points
- Host can skip any question and move directly to next question selection
- All override operations are restricted to host role only
- Each override action automatically generates immutable audit log entry with:
  - Game ID
  - Player Principal (if applicable)
  - Board number
  - Category name
  - Question ID (nullable for skips)
  - Points delta (manual adjustments or zero for skips)
  - Reason ("Host override - Correct", "Host override - Incorrect", "Manual score adjustment", or "Question skipped")
  - Timestamp
- Host Override Panel visible in host interface with controls for:
  - Mark answer correct/incorrect buttons
  - Manual score adjustment with numeric input and +/- toggle
  - Skip question confirmation button
- Real-time updates propagate to all connected players when host performs overrides
- Override actions trigger immediate scoreboard and audit log updates

## Game Export Requirements
- Export functionality available only for completed games
- Support JSON and CSV export formats
- Include comprehensive game data in exports:
  - Complete quiz configuration (both boards, all categories, all questions with text, images, answers, explanations)
  - Game metadata (host information, creation timestamp, game password, buzz timeout, answer timeout settings)
  - Player information (usernames, principals, final scores for board1Score, board2Score, totalScore)
  - Complete audit log (all scoring events, timestamps, reasons, point deltas)
  - Game winner information and completion status
- Export permissions restricted to game host and admin users
- Generate downloadable files with structured, reusable format for future import functionality
- Track export events in system audit logs
- Provide user-friendly export interface with format selection and confirmation
- Handle export errors gracefully with appropriate user feedback
- Ensure exported data maintains referential integrity and completeness

## Game Import Requirements
- Import functionality for previously exported QuizArva JSON files
- Validate imported file structure including:
  - Two boards with exactly 5 categories each
  - 5 questions per category with required fields (question text, answer, point values)
  - Valid game settings (buzz timeout, answer timeout, password format)
  - Optional image URLs for questions and answers
  - Proper data types and formats for all fields
- Create private game templates from validated imports
- Store templates tied to importing user for privacy and ownership
- Provide detailed error messages for invalid or incomplete files
- Support template editing and customization before game creation
- Template library interface for managing imported configurations
- Auto-population of Quiz Builder fields from selected templates
- Preserve original templates when creating games (no overwriting)
- Handle import errors gracefully with user-friendly feedback
- File upload interface with drag-and-drop or file selection
- Import progress indicators and success/error notifications

## Audit Log Requirements
- Immutable audit log system with append-only functionality
- Each scoring event automatically generates a permanent log entry
- Log entries include: Game ID, Player Principal (ID), Board number (1 or 2), Category name, Question ID or text identifier, Points added or deducted (pointDelta), Reason (e.g., "Correct answer", "Incorrect answer", "Host override - Correct", "Host override - Incorrect", "Manual score adjustment", "Question skipped"), and Timestamp
- Integration with existing recordScoringEvent and registerScore mechanisms
- No editing or deletion of log entries once created
- Query functionality for hosts to view their own game logs
- Admin query functionality to view all system logs
- Frontend interfaces for viewing audit logs with filtering and search capabilities
- Transparent scoring history for fairness and debugging
- Host override actions automatically recorded with specific reasons
- Export events recorded in audit logs for tracking purposes

## Error Handling
- Handle unauthorized access errors
- Handle game not found errors for invalid game IDs
- Handle incorrect password errors during game joining
- Handle game full errors when attempting to join a game with 3 players already
- Handle incomplete quiz configuration errors
- Handle image upload errors during quiz creation
- Handle buzz timing conflicts and invalid buzz attempts
- Handle scoring calculation errors and rollback scenarios
- Handle unauthorized question selection attempts (non-currentSelector)
- Handle tiebreaker state errors and invalid tiebreaker operations
- Handle audit log query errors and access permissions
- Handle unauthorized host override attempts (non-host users)
- Handle invalid host override parameters and edge cases
- Handle export permission errors and invalid export requests
- Handle export generation failures and file download errors
- Handle incomplete game export attempts (games not yet completed)
- Handle import validation errors for invalid JSON files
- Handle import permission errors and unauthorized access
- Handle template creation failures and storage errors
- Handle template selection and loading errors
- Display appropriate error messages to users including "Game is full (3/3 players)", "Incorrect password", "Invalid import file format", and "Import validation failed"
- Integrate with React Query for async response handling

## Technical Requirements
- Next.js 14+ with App Router for modular structure
- PostgreSQL for persistent data with audit log triggers
- Vercel KV (Redis) for live game state with atomic operations
- TypeScript for end-to-end type safety
- NextAuth.js for authentication with Google provider
- TanStack Query (React Query) for data fetching and caching
- Server-Sent Events (SSE) for real-time updates
- Edge Functions for low-latency operations
- Origin-based architecture with 1-second edge caching for reads
- User registration validation before game operations
- Hardcoded 3-player limit constant in game creation
- Frontend validation to prevent joining full games
- Quiz configuration validation on both frontend and backend
- Password verification during game joining
- Image upload integration with Vercel Blob Storage
- Real-time game state synchronization via SSE
- Buzz state management with Redis atomic operations
- Automatic UI updates for buzz state changes
- Atomic scoring operations in Redis with immediate propagation
- PostgreSQL triggers for immutable audit logging
- Live score synchronization for all three score types
- CurrentSelector state management in Redis
- Real-time updates across all participants
- Permission-based UI rendering for controls
- Tiebreaker state management and automatic detection
- Sudden-death tiebreaker logic implementation
- Automatic game completion and winner determination
- Append-only audit log storage in PostgreSQL
- Query APIs with proper permission controls
- Host override functions with validation and logging
- Real-time SSE updates for host actions
- Permission validation for all operations
- Game export with data compilation from both databases
- File generation for JSON and CSV formats
- Export permission validation and error handling
- Game import with JSON schema validation
- Template storage with user privacy controls
- Import validation with detailed error reporting
- Template management APIs for game creation
- Multipart file upload for JSON imports
- Vercel KV fallback to PostgreSQL if unavailable
- Game state snapshots every 5 questions
- API responses include all score types for display

## Game Capacity Rules
- All games are strictly limited to exactly 3 players
- No configurable player limits - hardcoded to 3 players
- Frontend displays "3/3 players" when game is full
- Join attempts when game is full result in clear error messages
- Host interface shows exactly 3 player slots without configuration options

## Branding Requirements
- All UI elements, headers, titles, and welcome messages display "QuizArva" as the application name
- Application metadata and configurations reference "QuizArva"
- Code comments and exported metadata consistently identify the application as "QuizArva"
- Application content language is English

## UI / UX Design Specifications

### Design Principles
- **Minimalistic design** with no gradients anywhere
- Clean, flat UI elements with solid colors only
- High-contrast visuals for accessibility
- Mobile-first for players (portrait-only)
- Desktop-optimized for hosts
- Focus on clarity and fast visual recognition
- Consistent spacing and typography

### Color Schemes

#### Light Mode (Default)
- **Primary Color:** Orange - `#FF6B35` (vibrant orange)
- **Secondary Color:** White - `#FFFFFF`
- **Background:** `#FAFAFA` (off-white)
- **Surface/Cards:** `#FFFFFF` (pure white)
- **Text Primary:** `#1A1A1A` (near black)
- **Text Secondary:** `#666666` (gray)
- **Borders:** `#E0E0E0` (light gray)
- **Success:** `#4CAF50` (green)
- **Error:** `#F44336` (red)
- **Warning:** `#FFA726` (amber)
- **Hover State:** `#FF8A50` (lighter orange)
- **Active State:** `#E65100` (darker orange)

#### Dark Mode
- **Primary Color:** Purple - `#9C27B0` (vibrant purple)
- **Secondary Color:** Black - `#000000`
- **Background:** `#0A0A0A` (near black)
- **Surface/Cards:** `#1A1A1A` (dark gray)
- **Text Primary:** `#FFFFFF` (white)
- **Text Secondary:** `#B0B0B0` (light gray)
- **Borders:** `#2A2A2A` (dark gray)
- **Success:** `#66BB6A` (light green)
- **Error:** `#EF5350` (light red)
- **Warning:** `#FFA726` (amber)
- **Hover State:** `#BA68C8` (lighter purple)
- **Active State:** `#6A1B9A` (darker purple)

### Component Styling
- **Buttons:** Solid color fill with no gradients, subtle box-shadow on hover
- **Cards:** Flat design with solid borders, no gradient backgrounds
- **Input Fields:** Clean borders with solid background colors
- **Navigation:** Solid color bars with clear separation
- **Modals:** Solid backgrounds with clear contrast
- **Scoreboards:** High contrast with solid color cells
- **Question Cards:** Flat design with clear typography
- **Buzz Button:** Large, prominent solid color with state changes

### Typography
- Primary Font: System fonts for fast loading
- Heading Sizes: Clear hierarchy with consistent scaling
- Body Text: Optimized for readability on all devices

## Session Management & Recovery
- Sessions persist across browser refreshes during active games
- If host connection drops, game automatically pauses
- Players can rejoin games in progress and see current state
- Host takeover mechanism available for emergency situations
- 15-second window for host to undo their last action
- Game state snapshots every 5 questions for recovery
- Admin capability to force-end stuck games
- No maximum game duration (games continue indefinitely)

## Progressive Web App Features
- **Install Prompt:** Show "Add to Home Screen" after first game completion
- **Orientation:** Portrait-only lock for player interface
- **Screen Wake Lock:** Keep screen on during entire game session
- **Push Notifications:** Alert players when it's their turn to select questions
- **Haptic Feedback:** Vibrate on successful buzz and button presses
- **Offline Mode:** Show "online-only" message (no local game storage)
- **Buzz Button:** Takes up 50% of mobile screen height

## Game Management Features
- **Draft Games:** Hosts can save draft games before setting password
- **Question Order:** Fixed order within categories (10, 20, 30, 40, 50)
- **Ready Check:** All players must confirm before game start
- **Practice Round:** Optional practice round with dummy questions
- **Instant Start:** No minimum wait time between creation and start
- **Connection Indicators:** Show player ping/latency in host dashboard
- **Public Templates:** Show creator names on public game templates
- **Host Control:** Can go back to accidentally skipped questions

## Fair Play & Reliability
- **Multiple Connection Issues:** Auto-pause game if multiple players report problems
- **Safety Slide:** Open-ended duration with no maximum time limit
- **Safety Slide Control:** Only host controls it (currentSelector cannot override)
- **Current Selector Display:** Player name pulses/glows continuously
- **Data Export:** Users can download all their personal game data
- **Rejoin Animation:** Players see current state immediately (no catch-up animation)

## Non-Goals (Out of Scope)
- Monetization
- Public matchmaking
- AI-generated questions
- Audience or spectator mode (not planned)
- Question banks or question reuse features
- Anti-cheat for fast buzzes
- Rate limiting for games per hour
- Offline mode with local storage
- Background sync for draft games
