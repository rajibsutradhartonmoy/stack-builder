'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export default function HomePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName }),
      })

      if (res.ok) {
        const project = await res.json()
        router.push(`/projects/${project.id}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteProject(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) {
      return
    }

    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading...</div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to Stack Builder</h1>
          <p className="text-gray-600">
            Build full-stack applications using natural language prompts
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            + Create New Project
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="My Awesome App"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  autoFocus
                  disabled={creating}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating || !newProjectName.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewProjectName('')
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No projects yet. Create one to get started!
            </div>
          ) : (
            <div className="divide-y">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/projects/${project.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Open
                    </a>
                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
