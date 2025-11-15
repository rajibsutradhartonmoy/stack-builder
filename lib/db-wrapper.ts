// Database wrapper using better-sqlite3
// Provides a Prisma-like interface for database operations

import Database from 'better-sqlite3'
import path from 'path'
import { randomBytes } from 'crypto'

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Helper to generate cuid-like IDs
function cuid(): string {
  return randomBytes(12).toString('base64url')
}

// Project operations
export const project = {
  findMany(args?: { orderBy?: any }) {
    const stmt = db.prepare(`
      SELECT * FROM Project
      ORDER BY ${args?.orderBy?.createdAt === 'desc' ? 'createdAt DESC' : 'createdAt ASC'}
    `)
    return stmt.all()
  },

  findUnique(args: { where: { id: string }; include?: any }) {
    const stmt = db.prepare('SELECT * FROM Project WHERE id = ?')
    const project = stmt.get(args.where.id) as any

    if (!project) return null

    if (args.include) {
      if (args.include.messages) {
        const msgsStmt = db.prepare('SELECT * FROM ChatMessage WHERE projectId = ? ORDER BY createdAt ASC')
        project.messages = msgsStmt.all(args.where.id)
      }
      if (args.include.envVars) {
        const envStmt = db.prepare('SELECT * FROM EnvVar WHERE projectId = ? ORDER BY key ASC')
        project.envVars = envStmt.all(args.where.id)
      }
    }

    return project
  },

  create(args: { data: { name: string; blueprint?: string } }) {
    const id = cuid()
    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO Project (id, name, blueprint, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `)
    stmt.run(id, args.data.name, args.data.blueprint || '{}', now, now)

    return {
      id,
      name: args.data.name,
      blueprint: args.data.blueprint || '{}',
      createdAt: now,
      updatedAt: now,
    }
  },

  update(args: { where: { id: string }; data: Partial<{ name: string; blueprint: string }> }) {
    const now = new Date().toISOString()
    const fields = []
    const values = []

    if (args.data.name !== undefined) {
      fields.push('name = ?')
      values.push(args.data.name)
    }
    if (args.data.blueprint !== undefined) {
      fields.push('blueprint = ?')
      values.push(args.data.blueprint)
    }
    fields.push('updatedAt = ?')
    values.push(now)

    values.push(args.where.id)

    const stmt = db.prepare(`
      UPDATE Project SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)

    const getStmt = db.prepare('SELECT * FROM Project WHERE id = ?')
    return getStmt.get(args.where.id)
  },

  delete(args: { where: { id: string } }) {
    const stmt = db.prepare('DELETE FROM Project WHERE id = ?')
    stmt.run(args.where.id)
    return { id: args.where.id }
  },
}

// ChatMessage operations
export const chatMessage = {
  findMany(args: { where: { projectId: string }; orderBy?: any }) {
    const stmt = db.prepare(`
      SELECT * FROM ChatMessage
      WHERE projectId = ?
      ORDER BY ${args.orderBy?.createdAt === 'asc' ? 'createdAt ASC' : 'createdAt ASC'}
    `)
    return stmt.all(args.where.projectId)
  },

  create(args: { data: { projectId: string; role: string; content: string } }) {
    const id = cuid()
    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO ChatMessage (id, projectId, role, content, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `)
    stmt.run(id, args.data.projectId, args.data.role, args.data.content, now)

    return {
      id,
      projectId: args.data.projectId,
      role: args.data.role,
      content: args.data.content,
      createdAt: now,
    }
  },
}

// EnvVar operations
export const envVar = {
  findMany(args: { where: { projectId: string }; orderBy?: any }) {
    const stmt = db.prepare(`
      SELECT * FROM EnvVar
      WHERE projectId = ?
      ORDER BY ${args.orderBy?.key === 'asc' ? 'key ASC' : 'key ASC'}
    `)
    return stmt.all(args.where.projectId)
  },

  upsert(args: {
    where: { projectId_key: { projectId: string; key: string } }
    update: { value: string }
    create: { projectId: string; key: string; value: string }
  }) {
    const now = new Date().toISOString()

    // Try to find existing
    const findStmt = db.prepare('SELECT * FROM EnvVar WHERE projectId = ? AND key = ?')
    const existing = findStmt.get(args.where.projectId_key.projectId, args.where.projectId_key.key) as any

    if (existing) {
      // Update
      const updateStmt = db.prepare('UPDATE EnvVar SET value = ?, updatedAt = ? WHERE id = ?')
      updateStmt.run(args.update.value, now, existing.id)
      return { ...existing, value: args.update.value, updatedAt: now }
    } else {
      // Create
      const id = cuid()
      const createStmt = db.prepare(`
        INSERT INTO EnvVar (id, projectId, key, value, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      createStmt.run(id, args.create.projectId, args.create.key, args.create.value, now, now)
      return {
        id,
        projectId: args.create.projectId,
        key: args.create.key,
        value: args.create.value,
        createdAt: now,
        updatedAt: now,
      }
    }
  },

  delete(args: { where: { projectId_key: { projectId: string; key: string } } }) {
    const stmt = db.prepare('DELETE FROM EnvVar WHERE projectId = ? AND key = ?')
    stmt.run(args.where.projectId_key.projectId, args.where.projectId_key.key)
    return {}
  },
}

// Export as prisma-like object
export const prisma = {
  project,
  chatMessage,
  envVar,
}
