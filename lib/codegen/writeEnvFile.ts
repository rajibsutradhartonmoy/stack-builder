// Writes environment variables to .env file in generated app

import * as fs from 'fs/promises'
import * as path from 'path'

export interface EnvVar {
  key: string
  value: string
}

/**
 * Writes environment variables to .env file in the generated app directory
 */
export async function writeEnvFile(
  projectId: string,
  envVars: EnvVar[]
): Promise<void> {
  const appDir = path.join(process.cwd(), 'generated', projectId)
  const envPath = path.join(appDir, '.env.local')

  const content = envVars
    .map(({ key, value }) => `${key}=${value}`)
    .join('\n')

  await fs.writeFile(envPath, content, 'utf-8')
}
