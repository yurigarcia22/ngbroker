'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, User, Plus, Calendar, Tag, Clock, RefreshCcw, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createComment, getTaskComments, getTask, getUsers, updateTask, addTimeEntry, updateTaskAssignees, addChecklistItem, deleteChecklistItem, updateChecklistItem } from '@/lib/db/tasks'
import { getTaskChecklist, getTaskAttachments, getTaskTimeEntries } from '@/lib/db/tasks_helpers'
import { getTags, createTag, addTagToTask, removeTagFromTask } from '@/lib/db/tags'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TaskDetailViewProps {
    taskId: string | null
    onClose: () => void
    onUpdate?: (updatedTask?: any) => void // Callback when task changes
}

export function TaskDetailView({ taskId, onClose, onUpdate }: TaskDetailViewProps) {
    const [task, setTask] = useState<any>(null)
    const [comments, setComments] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [allTags, setAllTags] = useState<any[]>([])
    const [statuses, setStatuses] = useState<any[]>([])
    const [activeDropdown, setActiveDropdown] = useState<'assignees' | 'tags' | null>(null)

    // Chat State
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const supabase = createClient()

    // Fetch Data
    useEffect(() => {
        if (!taskId) return

        const fetchData = async () => {
            const [t, c, u, tags, checklist, attachments, timeEntries] = await Promise.all([
                getTask(taskId),
                getTaskComments(taskId),
                getUsers(),
                getTags(),
                getTaskChecklist(taskId),
                getTaskAttachments(taskId),
                getTaskTimeEntries(taskId)
            ])

            // Merge parallel data into task object for backward compatibility with UI components that expect them nested
            setTask({
                ...t,
                checklist,
                attachments,
                time_entries: timeEntries
            })
            setComments(c)
            setUsers(u)
            setAllTags(tags)

            // Fetch statuses for this project
            if (t?.project_id) {
                const { data: projectStatuses } = await supabase
                    .from('project_statuses')
                    .select('*')
                    .eq('project_id', t.project_id)
                    .order('sort_order')

                // Deduplicate by name to prevent UI clutter if data source has dups
                const uniqueStatuses = Array.from(
                    new Map((projectStatuses || []).map(s => [s.name, s])).values()
                ).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))

                setStatuses(uniqueStatuses)
            }
        }
        fetchData()

        const channel = supabase
            .channel(`task-detail-${taskId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` }, () => {
                getTaskComments(taskId).then(setComments)
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `id=eq.${taskId}` }, () => {
                getTask(taskId).then(t => {
                    // CRITICAL: Merge with existing to preserve local-only or pre-fetched fields if t is missing them
                    // But usually t from getTask IS the source of truth for the task record.
                    // However, we must ensure we don't lose the 'project' reference if getTask somehow fails to join correctly (unlikely with new fix).
                    // We also need to preserve checklist/attachments/time_entries which are stored in SEPARATE states in this component,
                    // BUT they were merged into 'task' state for backward compatibility. 
                    // To be safe, we re-merge them here using current state values.

                    setTask((prev: any) => ({
                        ...prev,
                        ...t,
                        // Preserve sub-resources from state if not returned by getTask
                        checklist: checklistItems,
                        attachments: prev?.attachments, // these are not fully reactive in this block yet
                        time_entries: prev?.time_entries
                    }))

                    if (onUpdate) onUpdate(t)
                })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [taskId])

    useEffect(() => {
        if (comments.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [comments])

    const handleSend = async () => {
        if (!body.trim() || !taskId) return
        setSending(true)
        try {
            await createComment(taskId, body)
            setBody('')
        } catch (error) {
            console.error(error)
        } finally {
            setSending(false)
        }
    }

    const handleStatusChange = async (newStatusId: string) => {
        if (!task) return
        await updateTask(task.id, { status_id: newStatusId })
        // Optimistic update or wait for realtime? Realtime handles it but optimistic is snappier.
        const s = statuses.find(s => s.id === newStatusId)
        const validStatus = statuses.find(s => s.id === newStatusId)
        const updatedTask = { ...task, status: validStatus, status_id: newStatusId }
        setTask(updatedTask)

        // System comment for status change? User requested "line for status change inside chat".
        // Use a special system comment or just normal comment?
        // Let's Insert a system comment manually to be safe
        await createComment(task.id, `mudou o status para **${validStatus?.name}**`)
        if (onUpdate) onUpdate(updatedTask)
    }

    const handleAddTag = async (tagId: string) => {
        if (!task) return
        // Check if already has tag
        if (task.tags?.some((tt: any) => tt.tag.id === tagId)) return

        await addTagToTask(task.id, tagId)
        // Refetch task to get updated tags relational data structure (complex to mock locally)
        const t = await getTask(task.id)
        setTask(t)
        if (onUpdate) onUpdate(t)
    }

    const handleRemoveTag = async (tagId: string) => {
        if (!task) return
        await removeTagFromTask(task.id, tagId)
        const t = await getTask(task.id)
        setTask(t)
        if (onUpdate) onUpdate(t)
    }

    const handleCreateTag = async (name: string) => {
        if (!name.trim()) return
        const newTag = await createTag(name.trim())
        setAllTags([...allTags, newTag])
        await handleAddTag(newTag.id)
    }

    const handleAddAssignee = async (userId: string) => {
        if (!task) return
        const currentIds = task.assignees?.map((a: any) => a.user.id) || []
        const newIds = [...currentIds, userId]

        // Optimistic UI
        const userToAdd = users.find(u => u.id === userId)
        if (userToAdd) {
            const newAssignees = [...(task.assignees || []), { user: userToAdd }]
            setTask({ ...task, assignees: newAssignees })
        }

        await updateTaskAssignees(task.id, newIds)
        const t = await getTask(task.id)
        setTask(t)
        if (onUpdate) onUpdate(t)
    }

    const handleRemoveAssignee = async (userId: string) => {
        if (!task) return
        const currentIds = task.assignees?.map((a: any) => a.user.id) || []
        const newIds = currentIds.filter((id: string) => id !== userId)

        // Optimistic UI
        const newAssignees = task.assignees?.filter((a: any) => a.user.id !== userId) || []
        setTask({ ...task, assignees: newAssignees })

        await updateTaskAssignees(task.id, newIds)
        const t = await getTask(task.id)
        setTask(t)
        if (onUpdate) onUpdate(t)
    }

    const handleDateChange = async (date: string) => {
        if (!task) return
        await updateTask(task.id, { due_date: date })
        setTask({ ...task, due_date: date })
        // Create system comment
        await createComment(task.id, `alterou o prazo para **${format(new Date(date + 'T12:00:00'), 'dd/MM/yy')}**`)
        const updatedTask = { ...task, due_date: date }
        if (onUpdate) onUpdate(updatedTask)
    }

    const handleToggleComplete = async () => {
        if (!task) return
        // Try to find a "Done" status
        const doneStatus = statuses.find(s => ['concluído', 'concluido', 'done', 'finalizado'].includes(s.name.toLowerCase()))

        if (doneStatus) {
            if (task.status_id === doneStatus.id) {
                // Already done, maybe Reopen? For now just do nothing or toggle back to first?
                // Let's just allow setting to Done. If already done, maybe show "Reabrir" logic later.
            } else {
                await handleStatusChange(doneStatus.id)
            }
        } else {
            alert('Não foi possível encontrar um status de "Concluído" neste projeto.')
        }
    }

    const [checklistItems, setChecklistItems] = useState<any[]>([])

    // Update effect to set checklist items from task data
    useEffect(() => {
        if (task?.checklist) {
            setChecklistItems(task.checklist)
        }
    }, [task])

    const handleAddChecklistItem = async (e: any) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            const content = e.currentTarget.value.trim()
            e.currentTarget.value = ''

            // Optimistic
            const tempId = 'temp-' + Date.now()
            const newItem = { id: tempId, content, is_completed: false, task_id: task.id }
            setChecklistItems([...checklistItems, newItem])

            const { data, error } = await addChecklistItem(task.id, content)
            if (data) {
                // Replace temp with real
                setChecklistItems(prev => prev.map(item => item.id === tempId ? data : item))
            }
        }
    }

    const handleToggleChecklist = async (itemId: string, currentStatus: boolean) => {
        // Optimistic
        setChecklistItems(prev => prev.map(item => item.id === itemId ? { ...item, is_completed: !currentStatus } : item))

        await updateChecklistItem(itemId, { is_completed: !currentStatus })
    }

    const handleDeleteChecklist = async (itemId: string) => {
        // Optimistic
        setChecklistItems(prev => prev.filter(item => item.id !== itemId))
        await deleteChecklistItem(itemId)
    }

    const handleCompleteCycle = async () => {
        if (!task || !task.is_recurring) return

        const feedback = window.prompt("Deixe um feedback para este ciclo (opcional):")
        if (feedback === null) return // Cancelled

        // 1. Add comment/feedback
        if (feedback) {
            await createComment(task.id, `**Ciclo Concluído:** ${feedback}`)
        } else {
            await createComment(task.id, `**Ciclo Concluído**`)
        }

        // 2. Reschedule to next day
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        const newDateStr = format(tomorrow, 'yyyy-MM-dd') // Safe local format

        await updateTask(task.id, { due_date: newDateStr })

        // 3. Update local state
        const updatedTask = { ...task, due_date: newDateStr }
        setTask(updatedTask)
        if (onUpdate) onUpdate(updatedTask)
    }

    if (!taskId) return <div className="hidden" /> // Should likely not render
    if (!task) return <div className="w-[500px] border-l bg-white p-8">Carregando...</div>

    const isCompleted = task.status?.name?.toLowerCase().includes('concluíd') || task.status?.name?.toLowerCase().includes('done')

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl w-[600px] z-30 fixed right-0 top-0 bottom-0 md:relative md:w-full md:z-0 md:right-auto md:top-auto md:shadow-none">
            {/* Header (Top Bar) */}
            <div className="flex-none px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <select
                        value={task.priority}
                        onChange={(e) => {
                            const newPriority = e.target.value;
                            updateTask(task.id, { priority: newPriority }); // Direct update
                            const updatedTask = { ...task, priority: newPriority };
                            setTask(updatedTask);
                            if (onUpdate) onUpdate(updatedTask);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border-0 cursor-pointer focus:ring-1 focus:ring-indigo-500 ${task.priority === 'Urgente' ? 'bg-red-100 text-red-700' :
                            task.priority === 'Alta' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        <option value="Baixa">Baixa</option>
                        <option value="Normal">Normal</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                    </select>
                    <span className="text-gray-400 text-xs">
                        {task.project?.client?.name} / {task.project?.name}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!isCompleted && (
                        <button
                            onClick={handleToggleComplete}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-xs font-bold transition-colors shadow-sm"
                        >
                            <Check className="h-3.5 w-3.5" />
                            Concluir
                        </button>
                    )}
                    {task.is_recurring && (
                        <button
                            onClick={handleCompleteCycle}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium transition-colors border border-green-200"
                        >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Concluir Ciclo
                        </button>
                    )}
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Fixed Task Info (Title + Compact Metadata) */}
            <div className="flex-none px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
                <input
                    type="text"
                    value={task.title}
                    onChange={(e) => setTask({ ...task, title: e.target.value })}
                    onBlur={(e) => {
                        updateTask(task.id, { title: e.target.value });
                        const updatedTask = { ...task, title: e.target.value };
                        setTask(updatedTask);
                        if (onUpdate) onUpdate(updatedTask);
                    }}
                    className="text-lg font-bold text-gray-900 mb-4 leading-tight w-full border-none p-0 focus:ring-0 placeholder:text-gray-400"
                    placeholder="Título da Tarefa"
                />

                {/* Description */}
                <div className="mb-4">
                    <textarea
                        value={task.description || ''}
                        onChange={(e) => setTask({ ...task, description: e.target.value })}
                        onBlur={(e) => {
                            updateTask(task.id, { description: e.target.value });
                        }}
                        placeholder="Adicionar descrição..."
                        rows={2}
                        className="w-full text-sm text-gray-600 border-transparent hover:border-gray-200 focus:border-indigo-500 rounded px-2 py-1 -ml-2 resize-none bg-transparent focus:bg-white transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Compact Metadata Row */}
                <div className="grid grid-cols-4 gap-4">
                    {/* Status */}
                    <div className="min-w-0">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Status
                        </label>
                        <select
                            value={task.status_id}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="block w-full rounded border-gray-200 bg-gray-50 py-1.5 px-2 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            {statuses.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Due Date */}
                    <div className="min-w-0">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Prazo
                        </label>
                        <div className="relative group">
                            <div className="relative flex items-center gap-2 text-xs font-medium text-gray-900 bg-gray-50 py-1.5 px-2 rounded border border-transparent hover:border-gray-200 cursor-pointer">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <input
                                    type="date"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                                    value={task.due_date || ''}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    onClick={(e) => {
                                        try {
                                            e.currentTarget.showPicker()
                                        } catch (error) {
                                            // Fallback or ignore
                                        }
                                    }}
                                />
                                <span className="truncate">{task.due_date ? format(new Date(task.due_date + 'T12:00:00'), 'dd/MM/yy') : 'Definir'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Assignees */}
                    <div className="min-w-0">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Responsáveis
                        </label>
                        <div className="flex items-center bg-gray-50 rounded border border-transparent hover:border-gray-200 px-1 py-1 h-[30px]">
                            <div className="flex -space-x-1.5 overflow-hidden">
                                {task.assignees?.map((a: any) => (
                                    <div key={a.user.id} className="h-5 w-5 rounded-full bg-indigo-100 ring-1 ring-white flex items-center justify-center text-[8px] font-bold text-indigo-700" title={a.user.name}>
                                        {a.user.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <div className="relative ml-1">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'assignees' ? null : 'assignees')}
                                    className="h-4 w-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                                {/* Assignee Dropdown */}
                                {activeDropdown === 'assignees' && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                        <div className="absolute top-full text-left left-0 mt-1 w-48 bg-white rounded shadow-lg border border-gray-100 z-50 max-h-48 overflow-y-auto">
                                            {users.length === 0 && <div className="p-2 text-xs text-gray-400">Nenhum usuário encontrado</div>}
                                            {users.filter(u => !task.assignees?.some((a: any) => a.user.id === u.id)).map(user => (
                                                <button key={user.id} onClick={() => { handleAddAssignee(user.id); setActiveDropdown(null) }} className="w-full text-left px-2 py-1 text-xs hover:bg-gray-50 block truncate">
                                                    {user.name}
                                                </button>
                                            ))}
                                            {task.assignees?.length > 0 && <div className="border-t my-1" />}
                                            {task.assignees?.map((a: any) => (
                                                <button key={a.user.id} onClick={() => { handleRemoveAssignee(a.user.id); setActiveDropdown(null) }} className="w-full text-left px-2 py-1 text-xs hover:bg-red-50 text-red-600 block truncate">
                                                    Remover {a.user.name.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="min-w-0 relative">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Tags
                        </label>
                        <div className="flex items-center gap-1 bg-gray-50 rounded border border-transparent hover:border-gray-200 px-1 py-1 h-[30px]">
                            <div className="flex-1 flex items-center gap-1 overflow-hidden">
                                {task.tags?.length > 0 ? (
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded truncate max-w-[50px]">
                                        {task.tags[0].tag.name}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-gray-400 italic px-1">Tags</span>
                                )}
                                {(task.tags?.length || 0) > 1 && (
                                    <span className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded">+{task.tags.length - 1}</span>
                                )}
                            </div>

                            <div className="relative flex-none">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'tags' ? null : 'tags')}
                                    className="h-4 w-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                                {/* Tag Dropdown */}
                                {activeDropdown === 'tags' && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                        <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded shadow-lg border border-gray-100 z-50 p-2 text-left">
                                            <div className="max-h-48 overflow-y-auto mb-2 custom-scrollbar">
                                                {task.tags?.map((tt: any) => (
                                                    <div key={tt.tag.id} className="flex justify-between items-center text-xs px-2 py-1 hover:bg-gray-50 rounded">
                                                        <span className="truncate flex-1 text-gray-700">{tt.tag.name}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); handleRemoveTag(tt.tag.id) }} className="p-1 hover:text-red-500 text-gray-400"><X className="h-3 w-3" /></button>
                                                    </div>
                                                ))}
                                                <div className="border-t my-1 border-gray-100" />
                                                <div className="text-[10px] text-gray-400 px-2 py-1">Adicionar existentes</div>
                                                {allTags.filter(t => !task.tags.some((tt: any) => tt.tag.id === t.id)).map(tag => (
                                                    <button key={tag.id} onClick={() => handleAddTag(tag.id)} className="block w-full text-left text-xs px-2 py-1.5 hover:bg-gray-50 rounded text-gray-700 truncate">{tag.name}</button>
                                                ))}
                                                {allTags.length === 0 && <span className="text-xs text-gray-400 px-2">Sem tags criadas</span>}
                                            </div>
                                            <input
                                                className="w-full text-xs border border-gray-200 rounded p-1.5 focus:border-indigo-500 focus:outline-none"
                                                placeholder="Criar nova tag..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleCreateTag(e.currentTarget.value)
                                                        e.currentTarget.value = ''
                                                    }
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-6">

                {/* Checklists (Subtasks) */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Subtarefas
                        </label>
                        {checklistItems.length > 0 && (
                            <span className="text-[10px] text-gray-400 font-medium">
                                {Math.round((checklistItems.filter(i => i.is_completed).length / checklistItems.length) * 100)}% concluído
                            </span>
                        )}
                    </div>

                    <div className="space-y-1 mb-3">
                        {checklistItems.map(item => (
                            <div key={item.id} className="group flex items-center gap-3 text-sm text-gray-700 py-1.5 px-2 -mx-2 hover:bg-gray-50 rounded-md transition-colors">
                                <input
                                    type="checkbox"
                                    checked={item.is_completed}
                                    onChange={() => handleToggleChecklist(item.id, item.is_completed)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className={`flex-1 break-words ${item.is_completed ? 'line-through text-gray-400' : ''}`}>
                                    {item.content}
                                </span>
                                <button
                                    onClick={() => handleDeleteChecklist(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-all"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="+ Adicionar item..."
                            className="w-full text-sm border-0 border-b border-gray-200 focus:border-indigo-500 focus:ring-0 px-0 py-1.5 bg-transparent placeholder-gray-400 transition-colors"
                            onKeyDown={handleAddChecklistItem}
                        />
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                        <div className="h-px bg-gray-100 flex-1" />
                        <span>Início da Atividade</span>
                        <div className="h-px bg-gray-100 flex-1" />
                    </div>

                    {comments.map((comment) => (
                        <div key={comment.id} className="group flex gap-3">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                                {comment.user?.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm font-bold text-gray-900">{comment.user?.name}</span>
                                    <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}</span>
                                </div>
                                <div
                                    className="text-sm text-gray-700 bg-gray-50 rounded-r-lg rounded-bl-lg p-3 inline-block max-w-[90%]"
                                    dangerouslySetInnerHTML={{
                                        __html: comment.body
                                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            .replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="text-indigo-600 font-medium">@$1</span>')
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input is handled below in next block, kept as is */}

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="bg-gray-50 rounded-lg border border-gray-200 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                    <textarea
                        ref={textareaRef}
                        rows={1} // Auto-expand would be nice
                        className="block w-full border-0 bg-transparent p-3 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm resize-none"
                        placeholder="Escreva um comentário... Use @ para mencionar"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-200/50">
                        <div className="flex items-center gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors">
                                <Paperclip className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 hidden md:inline-block">Enter para enviar</span>
                            <button
                                onClick={handleSend}
                                disabled={sending || !body.trim()}
                                className="inline-flex items-center justify-center p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                <Send className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
