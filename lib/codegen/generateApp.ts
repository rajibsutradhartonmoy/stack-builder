// Code generation for Next.js apps based on blueprint
// Generates a complete Next.js app with CRUD operations

import * as fs from 'fs/promises'
import * as path from 'path'
import { Blueprint, EntityDefinition, FieldDefinition } from '../types'

const GENERATED_APPS_DIR = path.join(process.cwd(), 'generated')

/**
 * Generates a complete Next.js application based on the blueprint
 * Creates all necessary files and folders in /generated/{projectId}/
 */
export async function generateApp(projectId: string, blueprint: Blueprint): Promise<void> {
  const appDir = path.join(GENERATED_APPS_DIR, projectId)

  // Ensure generated directory exists
  await fs.mkdir(GENERATED_APPS_DIR, { recursive: true })

  // Remove old app if exists
  try {
    await fs.rm(appDir, { recursive: true, force: true })
  } catch (err) {
    // Ignore if doesn't exist
  }

  // Create app directory structure
  await fs.mkdir(appDir, { recursive: true })
  await fs.mkdir(path.join(appDir, 'app'), { recursive: true })
  await fs.mkdir(path.join(appDir, 'app', 'api'), { recursive: true })
  await fs.mkdir(path.join(appDir, 'lib'), { recursive: true })

  // Generate core files
  await generatePackageJson(appDir, projectId)
  await generateNextConfig(appDir)
  await generateTsConfig(appDir)
  await generateTailwindConfig(appDir)
  await generatePostCssConfig(appDir)
  await generateGitignore(appDir)

  // Generate app files based on blueprint
  await generateGlobalCss(appDir)
  await generateLayout(appDir, blueprint)
  await generateHomePage(appDir, blueprint)

  // Generate lib files
  await generateStore(appDir, blueprint)

  // For each entity, generate pages and API routes
  for (const entity of blueprint.entities) {
    await generateEntityPage(appDir, entity)
    await generateApiRoutes(appDir, entity)
  }

  console.log(`Generated app for project ${projectId} at ${appDir}`)
}

async function generatePackageJson(appDir: string, projectId: string): Promise<void> {
  const content = {
    name: `generated-app-${projectId}`,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
    dependencies: {
      next: '^14.2.0',
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      '@types/node': '^20.14.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      autoprefixer: '^10.4.19',
      postcss: '^8.4.38',
      tailwindcss: '^3.4.3',
      typescript: '^5.4.5',
    },
  }

  await fs.writeFile(
    path.join(appDir, 'package.json'),
    JSON.stringify(content, null, 2)
  )
}

async function generateNextConfig(appDir: string): Promise<void> {
  const content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`
  await fs.writeFile(path.join(appDir, 'next.config.js'), content)
}

async function generateTsConfig(appDir: string): Promise<void> {
  const content = {
    compilerOptions: {
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }

  await fs.writeFile(
    path.join(appDir, 'tsconfig.json'),
    JSON.stringify(content, null, 2)
  )
}

async function generateTailwindConfig(appDir: string): Promise<void> {
  const content = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
  await fs.writeFile(path.join(appDir, 'tailwind.config.js'), content)
}

async function generatePostCssConfig(appDir: string): Promise<void> {
  const content = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
  await fs.writeFile(path.join(appDir, 'postcss.config.js'), content)
}

async function generateGitignore(appDir: string): Promise<void> {
  const content = `node_modules
.next
.env*.local
`
  await fs.writeFile(path.join(appDir, '.gitignore'), content)
}

async function generateGlobalCss(appDir: string): Promise<void> {
  const content = `@tailwind base;
@tailwind components;
@tailwind utilities;
`
  await fs.writeFile(path.join(appDir, 'app', 'globals.css'), content)
}

async function generateLayout(appDir: string, blueprint: Blueprint): Promise<void> {
  const entityLinks = blueprint.entities
    .map(e => `        <a href="/${e.name.toLowerCase()}" className="text-blue-600 hover:underline">${e.name}s</a>`)
    .join('\n')

  const content = `import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Generated App',
  description: 'Auto-generated full-stack application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex gap-6">
            <a href="/" className="font-bold text-xl">Home</a>
${entityLinks}
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  )
}
`
  await fs.writeFile(path.join(appDir, 'app', 'layout.tsx'), content)
}

async function generateHomePage(appDir: string, blueprint: Blueprint): Promise<void> {
  const entityList = blueprint.entities
    .map(
      e => `      <li>
        <a href="/${e.name.toLowerCase()}" className="text-blue-600 hover:underline text-lg">
          ${e.name}s
        </a>
      </li>`
    )
    .join('\n')

  const content = `export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Welcome to Your Generated App</h1>
      <p className="text-gray-600 mb-8">
        This app was automatically generated. Navigate to any of the sections below:
      </p>
      <ul className="space-y-3">
${entityList}
      </ul>
    </div>
  )
}
`
  await fs.writeFile(path.join(appDir, 'app', 'page.tsx'), content)
}

async function generateStore(appDir: string, blueprint: Blueprint): Promise<void> {
  const storeInterfaces = blueprint.entities
    .map(entity => {
      const fields = entity.fields.map(f => `  ${f.name}: ${mapFieldTypeToTs(f.type)}`).join('\n')
      return `export interface ${entity.name} {\n${fields}\n}`
    })
    .join('\n\n')

  const storeObjects = blueprint.entities
    .map(entity => `let ${entity.name.toLowerCase()}s: ${entity.name}[] = []`)
    .join('\n')

  const storeFunctions = blueprint.entities
    .map(entity => {
      const lower = entity.name.toLowerCase()
      return `
// ${entity.name} CRUD operations
export function getAll${entity.name}s(): ${entity.name}[] {
  return ${lower}s
}

export function get${entity.name}ById(id: string): ${entity.name} | undefined {
  return ${lower}s.find(item => item.id === id)
}

export function create${entity.name}(data: Omit<${entity.name}, 'id'>): ${entity.name} {
  const newItem = { ...data, id: Date.now().toString() }
  ${lower}s.push(newItem)
  return newItem
}

export function update${entity.name}(id: string, data: Partial<${entity.name}>): ${entity.name} | null {
  const index = ${lower}s.findIndex(item => item.id === id)
  if (index === -1) return null
  ${lower}s[index] = { ...${lower}s[index], ...data }
  return ${lower}s[index]
}

export function delete${entity.name}(id: string): boolean {
  const index = ${lower}s.findIndex(item => item.id === id)
  if (index === -1) return false
  ${lower}s.splice(index, 1)
  return true
}
`
    })
    .join('\n')

  const content = `// In-memory data store for the generated app
// TODO: Replace with a real database in production

${storeInterfaces}

${storeObjects}

${storeFunctions}
`
  await fs.writeFile(path.join(appDir, 'lib', 'store.ts'), content)
}

async function generateEntityPage(appDir: string, entity: EntityDefinition): Promise<void> {
  const entityLower = entity.name.toLowerCase()
  const fieldsExceptId = entity.fields.filter(f => f.name !== 'id')

  const formFields = fieldsExceptId
    .map(field => {
      const inputType = getInputType(field.type)
      return `          <div>
            <label className="block text-sm font-medium mb-1">${capitalize(field.name)}</label>
            <input
              type="${inputType}"
              name="${field.name}"
              defaultValue={editingItem?.${field.name}${field.type === 'date' ? '?.toString()' : ''} ?? ${getDefaultValue(field.type)}}
              className="w-full border border-gray-300 rounded px-3 py-2"
              ${field.type === 'boolean' ? 'checked={editingItem?.' + field.name + ' ?? false}' : ''}
            />
          </div>`
    })
    .join('\n')

  const tableHeaders = entity.fields.map(f => `            <th className="px-4 py-2 border">${capitalize(f.name)}</th>`).join('\n')

  const tableCells = entity.fields
    .map(f => {
      if (f.type === 'boolean') {
        return `              <td className="px-4 py-2 border">{item.${f.name} ? '✓' : '✗'}</td>`
      } else if (f.type === 'date') {
        return `              <td className="px-4 py-2 border">{new Date(item.${f.name}).toLocaleDateString()}</td>`
      } else {
        return `              <td className="px-4 py-2 border">{item.${f.name}}</td>`
      }
    })
    .join('\n')

  const content = `'use client'

import { useState, useEffect } from 'react'

interface ${entity.name} {
${entity.fields.map(f => `  ${f.name}: ${mapFieldTypeToTs(f.type)}`).join('\n')}
}

export default function ${entity.name}Page() {
  const [items, setItems] = useState<${entity.name}[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<${entity.name} | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    const res = await fetch('/api/${entityLower}')
    const data = await res.json()
    setItems(data)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: any = {}

    ${fieldsExceptId.map(f => {
      if (f.type === 'boolean') {
        return `data.${f.name} = formData.get('${f.name}') === 'on'`
      } else if (f.type === 'number') {
        return `data.${f.name} = Number(formData.get('${f.name}'))`
      } else {
        return `data.${f.name} = formData.get('${f.name}')`
      }
    }).join('\n    ')}

    if (editingItem) {
      await fetch(\`/api/${entityLower}/\${editingItem.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/${entityLower}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }

    setShowForm(false)
    setEditingItem(null)
    fetchItems()
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure?')) {
      await fetch(\`/api/${entityLower}/\${id}\`, { method: 'DELETE' })
      fetchItems()
    }
  }

  function handleEdit(item: ${entity.name}) {
    setEditingItem(item)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">${entity.name}s</h1>
        <button
          onClick={() => { setShowForm(true); setEditingItem(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border">
          <h2 className="text-xl font-bold mb-4">
            {editingItem ? 'Edit' : 'Create'} ${entity.name}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
${formFields}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {editingItem ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingItem(null); }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
${tableHeaders}
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
${tableCells}
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No items yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  )
}
`

  const entityDir = path.join(appDir, 'app', entityLower)
  await fs.mkdir(entityDir, { recursive: true })
  await fs.writeFile(path.join(entityDir, 'page.tsx'), content)
}

async function generateApiRoutes(appDir: string, entity: EntityDefinition): Promise<void> {
  const entityLower = entity.name.toLowerCase()

  // List and Create
  const listCreateContent = `import { NextRequest, NextResponse } from 'next/server'
import { getAll${entity.name}s, create${entity.name} } from '@/lib/store'

export async function GET() {
  const items = getAll${entity.name}s()
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  const newItem = create${entity.name}(data)
  return NextResponse.json(newItem, { status: 201 })
}
`

  // Get, Update, Delete by ID
  const byIdContent = `import { NextRequest, NextResponse } from 'next/server'
import { get${entity.name}ById, update${entity.name}, delete${entity.name} } from '@/lib/store'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = get${entity.name}ById(params.id)
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(item)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await request.json()
  const updated = update${entity.name}(params.id, data)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const success = delete${entity.name}(params.id)
  if (!success) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
`

  const apiDir = path.join(appDir, 'app', 'api', entityLower)
  const byIdDir = path.join(apiDir, '[id]')

  await fs.mkdir(apiDir, { recursive: true })
  await fs.mkdir(byIdDir, { recursive: true })

  await fs.writeFile(path.join(apiDir, 'route.ts'), listCreateContent)
  await fs.writeFile(path.join(byIdDir, 'route.ts'), byIdContent)
}

// Helper functions

function mapFieldTypeToTs(type: string): string {
  switch (type) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'date':
      return 'string' // We'll store dates as ISO strings
    default:
      return 'string'
  }
}

function getInputType(type: string): string {
  switch (type) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'checkbox'
    case 'date':
      return 'date'
    default:
      return 'text'
  }
}

function getDefaultValue(type: string): string {
  switch (type) {
    case 'number':
      return '0'
    case 'boolean':
      return 'false'
    case 'date':
      return 'new Date().toISOString().split("T")[0]'
    default:
      return '""'
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
