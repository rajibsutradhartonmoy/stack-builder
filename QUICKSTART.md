# Quick Start Guide

Get up and running with Stack Builder in 3 minutes!

## Installation

```bash
# Clone the repository (if not already done)
# cd stack-builder

# Install dependencies (this automatically sets up the database)
npm install
```

## Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Create Your First App

1. **Click "Create New Project"**
   - Enter a name like "My Todo App"
   - Click "Create"

2. **Build with prompts** - Try these commands:
   ```
   create a todo app
   ```

   Wait for the system to respond, then try:
   ```
   add a due date field
   ```

   Or:
   ```
   add description as string
   ```

3. **View the Preview**
   - Click the "Preview" tab on the right
   - Click "Start Preview"
   - Wait ~5-10 seconds for the app to build
   - Your generated app will appear in the iframe!

4. **Check the Backend**
   - Click the "Backend" tab to see the blueprint JSON
   - View the auto-generated API endpoints

## Example Commands

### Create Apps
- `create a todo app`
- `create a blog app`
- `create a note app`

### Add Fields
- `add priority` (type auto-detected as string)
- `add count as number`
- `add published as boolean`
- `add createdAt as date`

### Remove Fields
- `remove description`

### Add New Entities
- `add a user entity`
- `create category model`

## Tips

- **One command at a time**: Wait for the system to respond before sending the next command
- **Preview reload**: If your preview doesn't update, click "Restart" in the Preview tab
- **ENV variables**: Use the ENV tab to add environment variables for your generated app
- **Generated code**: Find your generated apps in the `generated/` folder

## What Gets Generated?

For each project, a complete Next.js app is created with:
- ✅ Full CRUD pages for each entity
- ✅ API routes for all operations
- ✅ Tailwind CSS styling
- ✅ TypeScript types
- ✅ In-memory data storage

## Troubleshooting

**Preview won't load?**
- Make sure no other processes are using ports 4000-4100
- Check the terminal for error messages
- Try restarting the preview

**Changes not appearing?**
- Make sure you clicked "Send" after typing your prompt
- Wait for the system response before expecting changes
- Restart the preview if code was regenerated

**Database errors?**
- Run `npm run db:init` to reinitialize the database
- Check that `prisma/dev.db` exists

## Next Steps

1. Explore the generated code in `generated/your-project-id/`
2. Try building more complex apps with multiple entities
3. Add environment variables for API keys or config
4. Read the full [README.md](README.md) for architecture details

Happy building! 🚀
