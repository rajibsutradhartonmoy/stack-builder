// Unified prompt interpreter
// Uses LLM when available, falls back to pattern matching

import { Blueprint } from '../types'
import { interpretPromptWithLLM, isLLMAvailable } from './interpretPromptWithLLM'
import { interpretPrompt as interpretWithPatterns } from './interpretPromptWithPatterns'

export interface InterpretResult {
  success: boolean
  message: string
  updatedBlueprint: Blueprint
}

/**
 * Main entry point for prompt interpretation
 * Automatically chooses between LLM and pattern matching
 */
export async function interpretPrompt(
  prompt: string,
  currentBlueprint: Blueprint
): Promise<InterpretResult> {
  // Check if LLM is available
  if (isLLMAvailable()) {
    console.log('🤖 Using Claude AI for prompt interpretation')
    try {
      const result = await interpretPromptWithLLM(prompt, currentBlueprint)

      // If LLM fails, fall back to patterns
      if (!result.success) {
        console.log('⚠️  LLM interpretation failed, trying pattern matching...')
        return interpretWithPatterns(prompt, currentBlueprint)
      }

      return result
    } catch (error) {
      console.error('Error with LLM, falling back to pattern matching:', error)
      return interpretWithPatterns(prompt, currentBlueprint)
    }
  } else {
    console.log('📝 Using pattern matching (set ANTHROPIC_API_KEY for AI)')
    return interpretWithPatterns(prompt, currentBlueprint)
  }
}

/**
 * Export for backwards compatibility
 */
export { interpretPromptWithLLM, isLLMAvailable }
