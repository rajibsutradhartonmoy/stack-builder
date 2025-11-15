// API routes for project CRUD operations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Blueprint } from '@/lib/types'

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Parse blueprint JSON
    const projectsWithBlueprint = projects.map(p => ({
      ...p,
      blueprint: JSON.parse(p.blueprint) as Blueprint,
    }))

    return NextResponse.json(projectsWithBlueprint)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        blueprint: JSON.stringify({ entities: [] }),
      },
    })

    return NextResponse.json(
      {
        ...project,
        blueprint: JSON.parse(project.blueprint) as Blueprint,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
