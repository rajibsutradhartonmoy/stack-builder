// API routes for environment variables

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeEnvFile } from '@/lib/codegen/writeEnvFile'

// GET /api/projects/[id]/env - List all env vars for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const envVars = await prisma.envVar.findMany({
      where: { projectId: params.id },
      orderBy: { key: 'asc' },
    })

    return NextResponse.json(envVars)
  } catch (error) {
    console.error('Error fetching env vars:', error)
    return NextResponse.json(
      { error: 'Failed to fetch env vars' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/env - Create or update an env var
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    if (value === undefined) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 })
    }

    // Upsert the env var
    const envVar = await prisma.envVar.upsert({
      where: {
        projectId_key: {
          projectId: params.id,
          key,
        },
      },
      update: { value: String(value) },
      create: {
        projectId: params.id,
        key,
        value: String(value),
      },
    })

    // Regenerate .env file for the generated app
    const allEnvVars = await prisma.envVar.findMany({
      where: { projectId: params.id },
    })

    try {
      await writeEnvFile(
        params.id,
        allEnvVars.map(ev => ({ key: ev.key, value: ev.value }))
      )
    } catch (err) {
      console.error('Error writing env file:', err)
      // Don't fail the request if env file write fails
    }

    return NextResponse.json(envVar, { status: 201 })
  } catch (error) {
    console.error('Error creating env var:', error)
    return NextResponse.json(
      { error: 'Failed to create env var' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/env - Delete an env var
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    await prisma.envVar.delete({
      where: {
        projectId_key: {
          projectId: params.id,
          key,
        },
      },
    })

    // Regenerate .env file
    const allEnvVars = await prisma.envVar.findMany({
      where: { projectId: params.id },
    })

    try {
      await writeEnvFile(
        params.id,
        allEnvVars.map(ev => ({ key: ev.key, value: ev.value }))
      )
    } catch (err) {
      console.error('Error writing env file:', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting env var:', error)
    return NextResponse.json(
      { error: 'Failed to delete env var' },
      { status: 500 }
    )
  }
}
