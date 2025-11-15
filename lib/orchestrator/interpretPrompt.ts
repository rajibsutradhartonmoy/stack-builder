// Simple rules-based prompt interpreter
// TODO: Replace with real LLM API calls in the future

import { Blueprint, EntityDefinition, FieldDefinition } from '../types'

export interface InterpretResult {
  success: boolean
  message: string
  updatedBlueprint: Blueprint
}

/**
 * Interprets a user prompt and updates the blueprint accordingly
 * This is a simple pattern-matching system that will be replaced with LLM calls later
 */
export function interpretPrompt(
  prompt: string,
  currentBlueprint: Blueprint
): InterpretResult {
  const lowerPrompt = prompt.toLowerCase().trim()

  // Pattern 1: Create new app (e.g., "create a todo app", "build a blog")
  const createAppMatch = lowerPrompt.match(/create\s+(?:a\s+)?(\w+)\s+app/)
  if (createAppMatch) {
    const appType = createAppMatch[1]
    return createNewApp(appType, currentBlueprint)
  }

  // Pattern 2: Add a field (e.g., "add a due date field", "add description string")
  const addFieldMatch = lowerPrompt.match(
    /add\s+(?:a\s+)?(?:field\s+)?(\w+)(?:\s+(?:of\s+type\s+|as\s+)?(\w+))?/
  )
  if (addFieldMatch && currentBlueprint.entities.length > 0) {
    const fieldName = addFieldMatch[1]
    const fieldType = addFieldMatch[2] || inferFieldType(fieldName)
    return addField(fieldName, fieldType, currentBlueprint)
  }

  // Pattern 3: Remove a field (e.g., "remove the description field")
  const removeFieldMatch = lowerPrompt.match(/remove\s+(?:the\s+)?(?:field\s+)?(\w+)/)
  if (removeFieldMatch && currentBlueprint.entities.length > 0) {
    const fieldName = removeFieldMatch[1]
    return removeField(fieldName, currentBlueprint)
  }

  // Pattern 4: Add a new entity (e.g., "add a user model", "create category entity")
  const addEntityMatch = lowerPrompt.match(/(?:add|create)\s+(?:a\s+)?(\w+)\s+(?:model|entity)/)
  if (addEntityMatch) {
    const entityName = capitalize(addEntityMatch[1])
    return addEntity(entityName, currentBlueprint)
  }

  // If no pattern matches, return a helpful message
  return {
    success: false,
    message: `I didn't understand that command. Try:\n• "create a [name] app"\n• "add [field] field"\n• "add [field] as [type]"\n• "remove [field] field"\n• "add a [name] entity"`,
    updatedBlueprint: currentBlueprint,
  }
}

function createNewApp(appType: string, currentBlueprint: Blueprint): InterpretResult {
  const entityName = capitalize(appType)
  const entity: EntityDefinition = {
    name: entityName,
    fields: getDefaultFieldsForType(appType),
  }

  return {
    success: true,
    message: `Created a new ${appType} app with a ${entityName} entity and ${entity.fields.length} fields: ${entity.fields.map(f => f.name).join(', ')}`,
    updatedBlueprint: { entities: [entity] },
  }
}

function addField(
  fieldName: string,
  fieldType: string,
  currentBlueprint: Blueprint
): InterpretResult {
  const validType = normalizeFieldType(fieldType)
  if (!validType) {
    return {
      success: false,
      message: `Invalid field type "${fieldType}". Use: string, number, boolean, or date`,
      updatedBlueprint: currentBlueprint,
    }
  }

  const entities = [...currentBlueprint.entities]
  if (entities.length === 0) {
    return {
      success: false,
      message: 'No entity exists yet. Create an app first!',
      updatedBlueprint: currentBlueprint,
    }
  }

  // Add field to the first (main) entity
  const mainEntity = { ...entities[0] }
  const fieldExists = mainEntity.fields.some(f => f.name === fieldName)

  if (fieldExists) {
    return {
      success: false,
      message: `Field "${fieldName}" already exists in ${mainEntity.name}`,
      updatedBlueprint: currentBlueprint,
    }
  }

  mainEntity.fields = [...mainEntity.fields, { name: fieldName, type: validType }]
  entities[0] = mainEntity

  return {
    success: true,
    message: `Added field "${fieldName}" of type ${validType} to ${mainEntity.name}`,
    updatedBlueprint: { entities },
  }
}

function removeField(fieldName: string, currentBlueprint: Blueprint): InterpretResult {
  const entities = [...currentBlueprint.entities]
  if (entities.length === 0) {
    return {
      success: false,
      message: 'No entity exists yet',
      updatedBlueprint: currentBlueprint,
    }
  }

  const mainEntity = { ...entities[0] }
  const fieldIndex = mainEntity.fields.findIndex(f => f.name === fieldName)

  if (fieldIndex === -1) {
    return {
      success: false,
      message: `Field "${fieldName}" not found in ${mainEntity.name}`,
      updatedBlueprint: currentBlueprint,
    }
  }

  mainEntity.fields = mainEntity.fields.filter((_, i) => i !== fieldIndex)
  entities[0] = mainEntity

  return {
    success: true,
    message: `Removed field "${fieldName}" from ${mainEntity.name}`,
    updatedBlueprint: { entities },
  }
}

function addEntity(entityName: string, currentBlueprint: Blueprint): InterpretResult {
  const entities = [...currentBlueprint.entities]
  const exists = entities.some(e => e.name.toLowerCase() === entityName.toLowerCase())

  if (exists) {
    return {
      success: false,
      message: `Entity "${entityName}" already exists`,
      updatedBlueprint: currentBlueprint,
    }
  }

  entities.push({
    name: entityName,
    fields: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
    ],
  })

  return {
    success: true,
    message: `Added new entity "${entityName}" with default fields: id, name`,
    updatedBlueprint: { entities },
  }
}

// Helper: Get default fields based on app type
function getDefaultFieldsForType(appType: string): FieldDefinition[] {
  const defaults: Record<string, FieldDefinition[]> = {
    todo: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'completed', type: 'boolean' },
    ],
    blog: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'content', type: 'string' },
      { name: 'published', type: 'boolean' },
    ],
    note: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'content', type: 'string' },
    ],
  }

  return (
    defaults[appType.toLowerCase()] || [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
    ]
  )
}

// Helper: Infer field type from name
function inferFieldType(fieldName: string): 'string' | 'number' | 'boolean' | 'date' {
  const lower = fieldName.toLowerCase()

  if (lower.includes('date') || lower.includes('time')) return 'date'
  if (
    lower.includes('is') ||
    lower.includes('has') ||
    lower.includes('completed') ||
    lower.includes('published')
  )
    return 'boolean'
  if (
    lower.includes('count') ||
    lower.includes('age') ||
    lower.includes('number') ||
    lower.includes('price')
  )
    return 'number'

  return 'string'
}

// Helper: Normalize field type
function normalizeFieldType(
  type: string
): 'string' | 'number' | 'boolean' | 'date' | null {
  const lower = type.toLowerCase()
  if (lower.includes('string') || lower.includes('text')) return 'string'
  if (lower.includes('number') || lower.includes('int') || lower.includes('float'))
    return 'number'
  if (lower.includes('bool')) return 'boolean'
  if (lower.includes('date') || lower.includes('time')) return 'date'
  return null
}

// Helper: Capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
