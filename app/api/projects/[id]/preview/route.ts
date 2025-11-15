// API route for preview server management

import { NextRequest, NextResponse } from 'next/server'
import { startPreview, getPreviewInfo, restartPreview } from '@/lib/preview/previewManager'

// GET /api/projects/[id]/preview - Get preview info (start if not running)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if already running
    let previewInfo = getPreviewInfo(params.id)

    // If not running, start it
    if (!previewInfo) {
      previewInfo = await startPreview(params.id)
    }

    return NextResponse.json(previewInfo)
  } catch (error: any) {
    console.error('Error starting preview:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start preview' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/preview - Restart preview server
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const previewInfo = await restartPreview(params.id)
    return NextResponse.json(previewInfo)
  } catch (error: any) {
    console.error('Error restarting preview:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restart preview' },
      { status: 500 }
    )
  }
}
