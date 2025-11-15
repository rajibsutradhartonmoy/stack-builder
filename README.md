# Stack Builder

A minimal full-stack app builder that generates complete Next.js applications from natural language prompts.

## Overview

Stack Builder demonstrates the core loop of a no-code platform:

**User prompt → system interprets → generates code → runs preview → shows live app**

This is a working MVP that runs on a single server, focusing on clean architecture and functional UX.

## Features

- **Natural Language Interface**: Type simple prompts to build apps
- **Real-time Code Generation**: Automatically generates Next.js apps based on your blueprint
- **Live Preview**: See your generated app running in an iframe
- **Blueprint Management**: View and modify your app's data models
- **Environment Variables**: Manage ENV vars for generated apps
- **In-Memory Storage**: Generated apps use in-memory data stores (upgradable to real DB)

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite via Prisma
- **Process Management**: Node.js child_process for preview servers
- **Package Manager**: npm

## Installation

1. **Install dependencies** (this will automatically initialize the database):
   ```bash
   npm install
   ```

2. **Verify setup**:
   The database will be created at `prisma/dev.db` and the `generated/` folder will be ready for generated apps.

## Usage

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Create a new project**:
   - Click "Create New Project"
   - Enter a project name
   - Click "Create"

4. **Build your app with prompts**:
   Try these example commands:

   - `create a todo app` - Creates a Todo entity with title and completed fields
   - `add a due date field` - Adds a due date field to the entity
   - `add description as string` - Adds a description field
   - `create a blog app` - Creates a Blog entity with default fields
   - `add a user entity` - Adds a new User entity

5. **View the preview**:
   - Click the "Preview" tab
   - Click "Start Preview" to launch the generated app
   - The preview will load in an iframe (takes ~5-10 seconds)

6. **Check the backend**:
   - Click the "Backend" tab to see the blueprint JSON
   - View auto-generated API endpoints

7. **Manage environment variables**:
   - Click the "ENV" tab
   - Add key-value pairs for your generated app
   - Variables are written to `.env.local` in the generated app

## How It Works

### 1. Prompt Interpretation

The system uses a rules-based interpreter (`lib/orchestrator/interpretPrompt.ts`) that:
- Matches patterns in your prompts
- Updates the app blueprint (JSON structure)
- Returns a summary of changes

**Note**: This is a simple pattern matcher. In production, replace with LLM API calls.

### 2. Code Generation

Based on the blueprint, the system generates (`lib/codegen/generateApp.ts`):
- Complete Next.js project structure
- CRUD pages for each entity
- API routes for all operations
- Tailwind-styled UI components

### 3. Preview Management

The preview manager (`lib/preview/previewManager.ts`):
- Spawns a dev server for each generated app
- Allocates ports in range 4000-4100
- Tracks running processes
- Handles restarts and cleanup

### 4. Database Schema

Projects are stored in SQLite:
- **Project**: Stores name and blueprint JSON
- **ChatMessage**: Conversation history
- **EnvVar**: Environment variables for generated apps

## Project Structure

```
stack-builder/
├── app/
│   ├── api/                    # API routes
│   │   └── projects/
│   │       ├── route.ts        # List/create projects
│   │       └── [id]/
│   │           ├── route.ts    # Get/delete project
│   │           ├── messages/   # Chat messages
│   │           ├── preview/    # Preview management
│   │           └── env/        # ENV variables
│   ├── projects/
│   │   └── [id]/
│   │       └── page.tsx        # Project builder UI
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── lib/
│   ├── db.ts                   # Prisma client
│   ├── types.ts                # TypeScript interfaces
│   ├── orchestrator/
│   │   └── interpretPrompt.ts  # Rules-based interpreter
│   ├── codegen/
│   │   ├── generateApp.ts      # Code generator
│   │   └── writeEnvFile.ts     # ENV file writer
│   └── preview/
│       └── previewManager.ts   # Dev server management
├── prisma/
│   └── schema.prisma           # Database schema
└── generated/                  # Generated apps (gitignored)
    └── <projectId>/
        └── ...                 # Full Next.js app
```

## Supported Commands

### Create Apps
- `create a todo app`
- `create a blog app`
- `create a note app`
- `create a [name] app` (creates basic entity)

### Modify Fields
- `add [field]` (type auto-inferred)
- `add [field] as [type]` (explicit type)
- `remove [field]`

Supported types: `string`, `number`, `boolean`, `date`

### Add Entities
- `add a [name] entity`
- `create [name] model`

## Extending

### Replace with Real LLM

To use a real LLM instead of the pattern matcher:

1. Install an LLM SDK (OpenAI, Anthropic, etc.)
2. Replace `interpretPrompt()` in `lib/orchestrator/interpretPrompt.ts`
3. Send the prompt and current blueprint to the LLM
4. Parse the LLM response to update the blueprint

### Add Database to Generated Apps

Currently, generated apps use in-memory storage. To add a real database:

1. Modify `lib/codegen/generateApp.ts`
2. Generate Prisma schema in each app
3. Update API routes to use Prisma instead of in-memory store

### Deploy to Production

For production deployment:

1. Use a real database (PostgreSQL, MySQL)
2. Add user authentication
3. Implement proper process isolation (Docker containers)
4. Add resource limits and cleanup
5. Use a proper job queue for code generation
6. Implement security measures (rate limiting, input validation)

## Known Limitations

- **Single Machine**: All preview servers run on one machine
- **No Authentication**: No user login or multi-tenancy
- **Simple Interpreter**: Pattern matching, not true AI
- **In-Memory Data**: Generated apps don't persist data
- **Port Range**: Limited to 100 concurrent projects (ports 4000-4100)
- **No Cleanup**: Zombie processes may persist on crashes

## Future Improvements

- [ ] Real LLM integration (OpenAI, Claude, etc.)
- [ ] User authentication and project ownership
- [ ] Database persistence for generated apps
- [ ] More entity types and relationships
- [ ] File upload and image handling
- [ ] Deployment to production (Vercel, etc.)
- [ ] Version control for blueprints
- [ ] Undo/redo functionality
- [ ] Template library

## License

MIT

## Contributing

This is a prototype for demonstration purposes. Feel free to fork and extend!
