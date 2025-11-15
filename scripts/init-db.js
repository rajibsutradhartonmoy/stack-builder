// Simple database initialization script
// Creates SQLite database and tables manually

const sqlite3 = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db')

// Ensure prisma directory exists
const prismaDir = path.dirname(dbPath)
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true })
}

const db = new sqlite3(dbPath)

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Project (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    blueprint TEXT NOT NULL DEFAULT '{}',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ChatMessage (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS ChatMessage_projectId_idx ON ChatMessage(projectId);

  CREATE TABLE IF NOT EXISTS EnvVar (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE,
    UNIQUE(projectId, key)
  );

  CREATE INDEX IF NOT EXISTS EnvVar_projectId_idx ON EnvVar(projectId);
`)

console.log('Database initialized successfully at', dbPath)
db.close()
