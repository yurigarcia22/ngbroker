'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, Pencil, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createComment, getTaskComments, getTask, getUsers } from '@/lib/db/tasks'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TaskChatPanelProps {
    taskId: string | null
    onClose: () => void
    onEdit?: () => void
}

export function TaskChatPanel({ taskId, onClose, onEdit }: TaskChatPanelProps) {
    const [task, setTask] = useState<any>(null)
    const [comments, setComments] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([]) // For mentions
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)
    const [mentionSearch, setMentionSearch] = useState<string | null>(null) // null = not searching, string = search term
    const [mentionIndex, setMentionIndex] = useState(0) // Highlighted item in dropdown

    const supabase = createClient()
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Fetch Task & Comments
    useEffect(() => {
        if (!taskId) return

        const fetchData = async () => {
            const [t, c, u] = await Promise.all([
                getTask(taskId),
                getTaskComments(taskId),
                getUsers()
            ])
            setTask(t)
            setComments(c)
            setUsers(u)
        }
        fetchData()

        // Realtime Subscription
        const channel = supabase
            .channel(`task-comments-${taskId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'task_comments',
                    filter: `task_id=eq.${taskId}`
                },
                (payload) => {
                    // Fetch fresh to get user relation
                    // Optimization: Could optimistically add if we knew user, but let's re-fetch for simplicity/correctness
                    getTaskComments(taskId).then(setComments)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [taskId])

    // Scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [comments])

    const [activeMentions, setActiveMentions] = useState<any[]>([])

    const handleSend = async () => {
        if (!body.trim() || !taskId) return
        setSending(true)
        try {
            // Process mentions before sending
            let finalBody = body
            // Sort by name length desc to avoid partial replacements if names overlap
            const uniqueMentions = Array.from(new Set(activeMentions.map(u => u.id)))
                .map(id => activeMentions.find(u => u.id === id))
                .sort((a, b) => b.name.length - a.name.length)

            uniqueMentions.forEach(user => {
                // Replace @Name with @[Name](id)
                // Use a regex to ensure we match @Name boundaries if needed, but simple replace is usually enough for full names
                // careful with regex special chars in names
                const escapedName = user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const regex = new RegExp(`@${escapedName}\\b`, 'g')

                // Only replace if it doesn't already look like a formatted mention (avoid double encoding if something weird happens)
                // Actually, simple replace logic:
                // We want to replace "@Name" with "@[Name](id)"
                finalBody = finalBody.replace(regex, `@[${user.name}](${user.id})`)
            })

            await createComment(taskId, finalBody)
            setBody('')
            setActiveMentions([])
        } catch (error) {
            console.error(error)
        } finally {
            setSending(false)
        }
    }

    if (!taskId) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 border-l border-gray-200">
                <p className="text-gray-400">Selecione uma tarefa para ver detalhes</p>
            </div>
        )
    }

    if (!task) return <div className="p-4">Carregando...</div>

    // Mention Logic
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        const selStart = e.target.selectionStart
        setBody(val)

        // Check for @ mention trigger
        const textBeforeCursor = val.substring(0, selStart)
        const lastAt = textBeforeCursor.lastIndexOf('@')

        if (lastAt !== -1) {
            // Check if there are spaces between @ and cursor (allow spaces for first/last name, but maybe limit length)
            const query = textBeforeCursor.substring(lastAt + 1)
            // Regex: only allow if @ is at start or preceded by space
            const isStart = lastAt === 0
            const isPrecededBySpace = lastAt > 0 && val[lastAt - 1] === ' '

            if (isStart || isPrecededBySpace) {
                // If query contains newline, probably not a mention
                if (!query.includes('\n')) {
                    setMentionSearch(query)
                    return
                }
            }
        }
        setMentionSearch(null)
    }

    const insertMention = (user: any) => {
        if (!mentionSearch && mentionSearch !== '') return

        const selStart = textareaRef.current?.selectionStart || 0
        const textBeforeCursor = body.substring(0, selStart)
        const lastAt = textBeforeCursor.lastIndexOf('@')

        const textBeforeAt = body.substring(0, lastAt)
        const textAfterCursor = body.substring(selStart)

        // Insert format: Just @Name for display
        const mentionText = `@${user.name} `
        const newBody = textBeforeAt + mentionText + textAfterCursor

        setBody(newBody)
        setMentionSearch(null)
        setActiveMentions(prev => [...prev, user])

        // Restore focus Next tick
        setTimeout(() => {
            textareaRef.current?.focus()
            // And maybe set cursor position logic if needed, but putting at end of inserted mention is default
        }, 0)
    }

    // Filtered Users
    const filteredUsers = mentionSearch !== null
        ? users.filter(u => u.name.toLowerCase().includes(mentionSearch.toLowerCase()))
        : []

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl z-20 w-full max-w-[500px] relative">
            {/* Mention Dropdown */}
            {mentionSearch !== null && filteredUsers.length > 0 && (
                <div className="absolute bottom-20 left-4 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500">Mencionar...</div>
                    {filteredUsers.map((u, i) => (
                        <button
                            key={u.id}
                            onClick={() => insertMention(u)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2"
                        >
                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                {u.name.charAt(0)}
                            </div>
                            <span className="truncate">{u.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">#{taskId.substring(0, 8)}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${task.status?.is_default ? 'bg-gray-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {task.status?.name}
                        </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">{task.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    {onEdit && (
                        <button onClick={onEdit} className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50" title="Editar Tarefa">
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                {/* Task Description as first "message" context */}
                {task.description && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                        {task.description}
                    </div>
                )}

                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                            {comment.user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-gray-900">{comment.user?.name}</span>
                                <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}</span>
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {/* Basic Mention Highlighting (Visual only for now) */}
                                {comment.body.split(/(@\[[^\]]+\]\([^)]+\))/g).map((part: string, i: number) => {
                                    if (part.match(/@\[[^\]]+\]\([^)]+\)/)) {
                                        const name = part.match(/@\[([^\]]+)\]/)?.[1]
                                        return <span key={i} className="text-indigo-600 font-medium bg-indigo-50 px-1 rounded">@{name}</span>
                                    }
                                    return part
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div className="p-4 border-t bg-gray-50">
                <div className="bg-white rounded-lg border border-gray-300 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                    <textarea
                        ref={textareaRef}
                        rows={3}
                        className="block w-full border-0 bg-transparent p-3 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm resize-none"
                        placeholder="Escreva um comentário... Use @ para mencionar."
                        value={body}
                        onChange={handleInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-2 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-lg">
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
                                <Paperclip className="h-4 w-4" />
                            </button>
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={sending || !body.trim()}
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                        >
                            <Send className="h-3 w-3 mr-1" />
                            Enviar
                        </button>
                    </div>
                </div>
                <div className="text-xs text-gray-400 mt-2 text-center">
                    Pressione Enter para enviar, Shift+Enter para pular linha.
                </div>
            </div>
        </div>
    )
}
