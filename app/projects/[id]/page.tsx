'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'system'
  content: string
  createdAt: string
}

interface Blueprint {
  entities: Array<{
    name: string
    fields: Array<{ name: string; type: string }>
  }>
}

interface Project {
  id: string
  name: string
  blueprint: Blueprint
}

interface EnvVar {
  id: string
  key: string
  value: string
}

interface PreviewInfo {
  url: string
  ready: boolean
}

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'backend' | 'env'>('preview')
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null)
  const [envVars, setEnvVars] = useState<EnvVar[]>([])
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProject()
    fetchMessages()
    fetchEnvVars()
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`)
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  async function fetchEnvVars() {
    try {
      const res = await fetch(`/api/projects/${projectId}/env`)
      const data = await res.json()
      setEnvVars(data)
    } catch (error) {
      console.error('Error fetching env vars:', error)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim() || sending) return

    setSending(true)
    const userContent = inputValue
    setInputValue('')

    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userContent }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.userMessage, data.systemMessage])
        setProject(prev => prev ? { ...prev, blueprint: data.blueprint } : null)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function loadPreview() {
    try {
      const res = await fetch(`/api/projects/${projectId}/preview`)
      const data = await res.json()
      setPreviewInfo(data)
    } catch (error) {
      console.error('Error loading preview:', error)
    }
  }

  async function restartPreview() {
    try {
      const res = await fetch(`/api/projects/${projectId}/preview`, {
        method: 'POST',
      })
      const data = await res.json()
      setPreviewInfo(data)
    } catch (error) {
      console.error('Error restarting preview:', error)
    }
  }

  async function handleAddEnvVar(e: React.FormEvent) {
    e.preventDefault()
    if (!newEnvKey.trim()) return

    try {
      const res = await fetch(`/api/projects/${projectId}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newEnvKey, value: newEnvValue }),
      })

      if (res.ok) {
        setNewEnvKey('')
        setNewEnvValue('')
        fetchEnvVars()
      }
    } catch (error) {
      console.error('Error adding env var:', error)
    }
  }

  async function handleDeleteEnvVar(key: string) {
    if (!confirm(`Delete ${key}?`)) return

    try {
      await fetch(`/api/projects/${projectId}/env?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
      fetchEnvVars()
    } catch (error) {
      console.error('Error deleting env var:', error)
    }
  }

  if (!project) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </main>
    )
  }

  return (
    <main className="h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">{project.name}</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-1/2 flex flex-col border-r">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-lg mb-2">Start building your app!</p>
                <p className="text-sm">Try commands like:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>"create a todo app"</li>
                  <li>"add a due date field"</li>
                  <li>"create a blog app"</li>
                </ul>
              </div>
            )}
            {messages.map(message => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 ml-8'
                    : 'bg-gray-100 mr-8'
                }`}
              >
                <div className="text-xs font-semibold mb-1 text-gray-600">
                  {message.role === 'user' ? 'You' : 'System'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Type your prompt here..."
                className="flex-1 border border-gray-300 rounded px-3 py-2"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !inputValue.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel - Preview/Backend/Env */}
        <div className="w-1/2 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b bg-white">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'preview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('backend')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'backend'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Backend
            </button>
            <button
              onClick={() => setActiveTab('env')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'env'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              ENV
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {activeTab === 'preview' && (
              <div className="h-full flex flex-col">
                {!previewInfo ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Preview not loaded</p>
                      <button
                        onClick={loadPreview}
                        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
                      >
                        Start Preview
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
                      <span className="text-sm text-gray-600">{previewInfo.url}</span>
                      <button
                        onClick={restartPreview}
                        className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                      >
                        Restart
                      </button>
                    </div>
                    <iframe
                      src={previewInfo.url}
                      className="flex-1 w-full border-0"
                      title="Preview"
                    />
                  </>
                )}
              </div>
            )}

            {activeTab === 'backend' && (
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Blueprint</h2>
                <pre className="bg-white p-4 rounded border text-sm overflow-x-auto">
                  {JSON.stringify(project.blueprint, null, 2)}
                </pre>

                {project.blueprint.entities.length > 0 && (
                  <>
                    <h2 className="text-xl font-bold mt-6 mb-4">API Endpoints</h2>
                    <div className="bg-white rounded border divide-y">
                      {project.blueprint.entities.map(entity => {
                        const lower = entity.name.toLowerCase()
                        return (
                          <div key={entity.name} className="p-4">
                            <h3 className="font-semibold mb-2">{entity.name}</h3>
                            <ul className="text-sm space-y-1 text-gray-700">
                              <li>GET /api/{lower} - List all</li>
                              <li>POST /api/{lower} - Create new</li>
                              <li>GET /api/{lower}/[id] - Get by ID</li>
                              <li>PUT /api/{lower}/[id] - Update</li>
                              <li>DELETE /api/{lower}/[id] - Delete</li>
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'env' && (
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Environment Variables</h2>

                <form onSubmit={handleAddEnvVar} className="bg-white p-4 rounded border mb-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={newEnvKey}
                      onChange={e => setNewEnvKey(e.target.value)}
                      placeholder="KEY"
                      className="border border-gray-300 rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      value={newEnvValue}
                      onChange={e => setNewEnvValue(e.target.value)}
                      placeholder="value"
                      className="border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Add Variable
                  </button>
                </form>

                <div className="bg-white rounded border divide-y">
                  {envVars.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No environment variables yet
                    </div>
                  ) : (
                    envVars.map(envVar => (
                      <div
                        key={envVar.id}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <span className="font-mono font-semibold">{envVar.key}</span>
                          <span className="mx-2">=</span>
                          <span className="font-mono text-gray-600">{envVar.value}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteEnvVar(envVar.key)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
