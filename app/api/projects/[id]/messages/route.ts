// API routes for chat messages

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { interpretPrompt } from '@/lib/orchestrator/interpretPrompt'
import { generateApp } from '@/lib/codegen/generateApp'
import { Blueprint } from '@/lib/types'
import { writeEnvFile } from '@/lib/codegen/writeEnvFile'

// GET /api/projects/[id]/messages - Get all messages for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/messages - Send a new message (user prompt)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Get current project
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { envVars: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        projectId: params.id,
        role: 'user',
        content,
      },
    })

    // Interpret the prompt and update blueprint (using LLM or pattern matching)
    const currentBlueprint = JSON.parse(project.blueprint) as Blueprint
    const result = await interpretPrompt(content, currentBlueprint)

    // Save updated blueprint to project
    await prisma.project.update({
      where: { id: params.id },
      data: {
        blueprint: JSON.stringify(result.updatedBlueprint),
      },
    })

    // Generate the app code if interpretation was successful
    if (result.success) {
      try {
        await generateApp(params.id, result.updatedBlueprint)

        // Write env vars to the generated app
        const envVars = project.envVars.map(ev => ({
          key: ev.key,
          value: ev.value,
        }))
        if (envVars.length > 0) {
          await writeEnvFile(params.id, envVars)
        }
      } catch (genError) {
        console.error('Error generating app:', genError)
        result.message += '\n\n⚠️ Warning: Code generation failed. Check server logs.'
      }
    }

    // Save system response
    const systemMessage = await prisma.chatMessage.create({
      data: {
        projectId: params.id,
        role: 'system',
        content: result.message,
      },
    })

    return NextResponse.json({
      userMessage,
      systemMessage,
      blueprint: result.updatedBlueprint,
    })
  } catch (error) {
    console.error('Error processing message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
