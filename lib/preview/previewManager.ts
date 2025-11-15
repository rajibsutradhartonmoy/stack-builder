// Manages preview dev servers for generated apps
// Spawns and tracks Node.js processes running `npm run dev`

import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import { PreviewInfo } from '../types'

// In-memory store of running preview servers
// In production, this should be persisted to a database
const runningPreviews = new Map<string, PreviewInfo>()

// Port range for preview servers
const MIN_PORT = 4000
const MAX_PORT = 4100

/**
 * Starts a dev server for a generated app
 * Returns the preview URL and port
 */
export async function startPreview(projectId: string): Promise<PreviewInfo> {
  // If already running, return existing info
  const existing = runningPreviews.get(projectId)
  if (existing) {
    return existing
  }

  const port = allocatePort()
  const appDir = path.join(process.cwd(), 'generated', projectId)

  // First, ensure dependencies are installed
  console.log(`Installing dependencies for project ${projectId}...`)
  await installDependencies(appDir)

  // Start the dev server
  console.log(`Starting dev server for project ${projectId} on port ${port}...`)
  const childProcess = await startDevServer(appDir, port)

  const previewInfo: PreviewInfo = {
    projectId,
    port,
    url: `http://localhost:${port}`,
    pid: childProcess.pid,
    ready: false, // Will be marked ready after a delay
  }

  runningPreviews.set(projectId, previewInfo)

  // Mark as ready after a delay (simple approach)
  setTimeout(() => {
    const info = runningPreviews.get(projectId)
    if (info) {
      info.ready = true
      runningPreviews.set(projectId, info)
    }
  }, 5000) // Wait 5 seconds for Next.js to start

  return previewInfo
}

/**
 * Stops a running preview server
 */
export async function stopPreview(projectId: string): Promise<boolean> {
  const info = runningPreviews.get(projectId)
  if (!info || !info.pid) {
    return false
  }

  try {
    // Kill the process and its children
    process.kill(info.pid, 'SIGTERM')
    runningPreviews.delete(projectId)
    return true
  } catch (err) {
    console.error(`Error stopping preview for ${projectId}:`, err)
    return false
  }
}

/**
 * Restarts a preview server (stop and start)
 */
export async function restartPreview(projectId: string): Promise<PreviewInfo> {
  await stopPreview(projectId)
  // Wait a bit for cleanup
  await new Promise(resolve => setTimeout(resolve, 1000))
  return startPreview(projectId)
}

/**
 * Gets preview info for a project
 */
export function getPreviewInfo(projectId: string): PreviewInfo | null {
  return runningPreviews.get(projectId) || null
}

/**
 * Gets all running previews
 */
export function getAllPreviews(): PreviewInfo[] {
  return Array.from(runningPreviews.values())
}

// Helper: Allocate an available port
function allocatePort(): number {
  const usedPorts = new Set(
    Array.from(runningPreviews.values()).map(info => info.port)
  )

  for (let port = MIN_PORT; port <= MAX_PORT; port++) {
    if (!usedPorts.has(port)) {
      return port
    }
  }

  throw new Error('No available ports in range')
}

// Helper: Install npm dependencies
function installDependencies(appDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['install'], {
      cwd: appDir,
      stdio: 'inherit',
    })

    child.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm install failed with code ${code}`))
      }
    })

    child.on('error', reject)
  })
}

// Helper: Start dev server
function startDevServer(appDir: string, port: number): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'dev', '--', '-p', port.toString()], {
      cwd: appDir,
      stdio: 'pipe',
      detached: false,
      env: {
        ...process.env,
        PORT: port.toString(),
      },
    })

    // Log output for debugging
    child.stdout?.on('data', data => {
      console.log(`[Preview ${port}] ${data.toString()}`)
    })

    child.stderr?.on('data', data => {
      console.error(`[Preview ${port}] ${data.toString()}`)
    })

    child.on('error', reject)

    // Resolve immediately after spawning
    // The process will continue running in the background
    resolve(child)
  })
}

// Cleanup on process exit
process.on('exit', () => {
  for (const [projectId] of runningPreviews) {
    stopPreview(projectId)
  }
})

process.on('SIGINT', () => {
  for (const [projectId] of runningPreviews) {
    stopPreview(projectId)
  }
  process.exit()
})
