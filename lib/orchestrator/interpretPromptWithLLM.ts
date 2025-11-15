// LLM-based prompt interpreter using Anthropic's Claude
// Replaces pattern matching with real AI understanding

import Anthropic from '@anthropic-ai/sdk'
import { Blueprint, EntityDefinition, FieldDefinition } from '../types'

export interface InterpretResult {
  success: boolean
  message: string
  updatedBlueprint: Blueprint
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

/**
 * Interprets a user prompt using Claude AI and updates the blueprint
 * This replaces the simple pattern matching with real LLM understanding
 */
export async function interpretPromptWithLLM(
  prompt: string,
  currentBlueprint: Blueprint
): Promise<InterpretResult> {
  try {
    // Prepare the system prompt
    const systemPrompt = `You are a full-stack app blueprint assistant. Your job is to interpret user requests and update a JSON blueprint that describes their application.

The blueprint has this structure:
{
  "entities": [
    {
      "name": "EntityName",
      "fields": [
        { "name": "fieldName", "type": "string" | "number" | "boolean" | "date" }
      ]
    }
  ]
}

Rules:
1. Field types are limited to: string, number, boolean, date
2. Every entity should have an "id" field of type "string"
3. When creating a new app, replace all existing entities with the new one
4. When adding fields, add them to the first (main) entity
5. When removing fields, remove from the first entity
6. Infer sensible defaults for common app types (todo, blog, note, etc.)
7. Be smart about inferring field types from names (e.g., "dueDate" → date, "isCompleted" → boolean)

Respond ONLY with valid JSON in this exact format:
{
  "success": true,
  "message": "A brief description of what you did",
  "updatedBlueprint": { "entities": [...] }
}

If you can't understand the request, set success to false and provide a helpful message.`

    const userMessage = `Current blueprint:
${JSON.stringify(currentBlueprint, null, 2)}

User request: ${prompt}

Please update the blueprint according to the user's request.`

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    // Parse the response
    const textContent = response.content[0]
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const result = JSON.parse(textContent.text) as InterpretResult

    // Validate the response
    if (!result.updatedBlueprint || !Array.isArray(result.updatedBlueprint.entities)) {
      throw new Error('Invalid blueprint structure in response')
    }

    // Ensure all entities have an id field
    result.updatedBlueprint.entities = result.updatedBlueprint.entities.map(entity => {
      const hasId = entity.fields.some(f => f.name === 'id')
      if (!hasId) {
        entity.fields.unshift({ name: 'id', type: 'string' })
      }
      return entity
    })

    return result
  } catch (error: any) {
    console.error('Error interpreting prompt with LLM:', error)

    // Return error result
    return {
      success: false,
      message: `I encountered an error processing your request: ${error.message}. Please try rephrasing or use simpler commands.`,
      updatedBlueprint: currentBlueprint,
    }
  }
}

/**
 * Check if LLM is available (API key is set)
 */
export function isLLMAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 0
}
