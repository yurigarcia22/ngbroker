'use client'

import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/drawer'
import { getTask, updateTask, getUsers, updateTaskAssignees } from '@/lib/db/tasks'
import { usePathname, useRouter } from 'next/navigation'
import { Check, Calendar, Flag, User, Clock, Loader2, Save, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskDrawerProps {
    taskId: string | null
    onClose: () => void
    onUpdate?: () => void
}

export function TaskDrawer({ taskId, onClose, onUpdate }: TaskDrawerProps) {
    const [task, setTask] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [assigneeOpen, setAssigneeOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (taskId) {
            setLoading(true)
            Promise.all([
                getTask(taskId),
                getUsers()
            ]).then(([taskData, usersData]) => {
                setTask(taskData)
                setUsers(usersData)
                setLoading(false)
            })
        } else {
            setTask(null)
            setUsers([])
        }
    }, [taskId])

    const handleSave = async () => {
        if (!task) return
        setSaving(true)

        try {
            await updateTask(task.id, {
                title: task.title,
                description: task.description,
                priority: task.priority,
                due_date: task.due_date,
            })
            if (onUpdate) onUpdate()
            router.refresh()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Falha ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const handleAssigneeToggle = async (userId: string) => {
        if (!task) return

        const currentAssigneeIds = task.assignees?.map((a: any) => a.user.id) || []
        let newAssigneeIds
        let newAssigneesState

        if (currentAssigneeIds.includes(userId)) {
            // Remove
            newAssigneeIds = currentAssigneeIds.filter((id: string) => id !== userId)
            newAssigneesState = task.assignees.filter((a: any) => a.user.id !== userId)
        } else {
            // Add
            newAssigneeIds = [...currentAssigneeIds, userId]
            const userToAdd = users.find(u => u.id === userId)
            newAssigneesState = [...(task.assignees || []), { user: userToAdd }]
        }

        // Optimistic UI
        setTask({ ...task, assignees: newAssigneesState })

        // Backend Update
        await updateTaskAssignees(task.id, newAssigneeIds)
        if (onUpdate) onUpdate()
        router.refresh()
    }

    // Simplified status update
    const handleStatusChange = async (newStatusId: string) => {
        // Optimistic update would be better, but simple for now
        setTask({ ...task, status_id: newStatusId }) // Update local
        await updateTask(task.id, { status_id: newStatusId })
        if (onUpdate) onUpdate()
        router.refresh()
    }

    if (!taskId) return null

    return (
        <Drawer
            isOpen={!!taskId}
            onClose={onClose}
            title={
                task ? (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm font-normal">#{maskId(task.id)}</span>
                    </div>
                ) : 'Carregando...'
            }
        >
            {loading ? (
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : task ? (
                <div className="space-y-6">
                    {/* Title Input */}
                    <div>
                        <input
                            type="text"
                            className="bg-transparent text-2xl font-semibold text-gray-900 focus:outline-none w-full border-b border-transparent hover:border-gray-200 focus:border-indigo-500 transition-colors"
                            value={task.title}
                            onChange={(e) => setTask({ ...task, title: e.target.value })}
                            placeholder="Título da tarefa"
                        />
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 border border-gray-100">
                        {/* Status */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                    task.status?.is_default ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"
                                )}>
                                    {task.status?.name || 'Sem status'}
                                </span>
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase">Prioridade</label>
                            <select
                                className="block w-full text-sm bg-transparent border-none p-0 focus:ring-0 text-gray-700 font-medium"
                                value={task.priority}
                                onChange={(e) => setTask({ ...task, priority: e.target.value })}
                            >
                                <option value="Baixa">Baixa</option>
                                <option value="Média">Média</option>
                                <option value="Alta">Alta</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase">Prazo</label>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    className="bg-transparent text-sm border-none p-0 focus:ring-0 text-gray-700"
                                    value={task.due_date || ''}
                                    onChange={(e) => setTask({ ...task, due_date: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Assignees (Read-only MVP for now or simple list) */}
                        {/* Assignees */}
                        <div className="space-y-1 relative">
                            <label className="text-xs font-medium text-gray-500 uppercase">Responsáveis</label>
                            <div className="flex flex-wrap gap-1">
                                {task.assignees?.map((a: any) => (
                                    <div key={a.user.id} className="h-6 px-2 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-700 ring-1 ring-white gap-1" title={a.user.name}>
                                        <span>{a.user.name}</span>
                                        <button
                                            onClick={() => handleAssigneeToggle(a.user.id)}
                                            className="hover:text-red-500"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setAssigneeOpen(!assigneeOpen)}
                                    className="h-6 w-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>

                            {/* Assignee Dropdown */}
                            {assigneeOpen && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1 max-h-60 overflow-y-auto">
                                    {users.map(u => {
                                        const isAssigned = task.assignees?.some((a: any) => a.user.id === u.id)
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => handleAssigneeToggle(u.id)}
                                                className={`flex items-center w-full px-2 py-1.5 text-xs text-left rounded-md ${isAssigned ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center text-[9px] font-bold ${isAssigned ? 'bg-indigo-200' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {u.name.charAt(0)}
                                                </div>
                                                <span className="truncate flex-1">{u.name}</span>
                                                {isAssigned && <Check className="h-3 w-3 text-indigo-600" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <textarea
                            rows={6}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={task.description || ''}
                            onChange={(e) => setTask({ ...task, description: e.target.value })}
                            placeholder="Adicione detalhes..."
                        />
                    </div>

                    {/* Checklists & Comments placeholders for next iterations */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Atividade</h3>
                        <div className="text-sm text-gray-500 italic">Comentários e checklist em breve...</div>
                    </div>

                    {/* Footer Actions */}
                    <div className="fixed bottom-0 right-0 p-4 bg-white border-t border-gray-200 w-full max-w-2xl flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Alterações
                        </button>
                    </div>
                    {/* Padding for fixed footer */}
                    <div className="h-16" />
                </div>
            ) : (
                <div className="text-center text-gray-500">Tarefa não encontrada</div>
            )}
        </Drawer>
    )
}

function maskId(id: string) {
    return id.substring(0, 8)
}
