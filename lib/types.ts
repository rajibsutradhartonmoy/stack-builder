// Type definitions for the app builder

export interface FieldDefinition {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date'
}

export interface EntityDefinition {
  name: string
  fields: FieldDefinition[]
}

export interface Blueprint {
  entities: EntityDefinition[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'system'
  content: string
  createdAt: Date
}

export interface Project {
  id: string
  name: string
  blueprint: Blueprint
  createdAt: Date
  updatedAt: Date
}

export interface PreviewInfo {
  projectId: string
  port: number
  url: string
  pid?: number
  ready: boolean
}
