'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import useSWR from 'swr'

import { PageHeader } from '@/components/ui/page-header'
import { getAllTasks, updateTask } from '@/lib/db/tasks'
import { createClient } from '@/lib/supabase/client'
import { KanbanBoard } from '@/components/tasks/kanban/kanban-board'
import { LayoutList, LayoutGrid, Plus, Search, Filter, ArrowUpDown, Calendar, User as UserIcon } from 'lucide-react'
import { TaskDrawer } from '@/components/tasks/task-drawer'
import { NewTaskModal } from '@/components/tasks/new-task-modal'
import { TaskDetailView } from '@/components/tasks/task-detail-view'
import { TaskListItem } from '@/components/tasks/task-list-item'
import { format, startOfDay, isToday, isPast, addDays, isWithinInterval, startOfWeek, endOfWeek, addWeeks, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'

// Fetcher for SWR
const fetcher = async (key: string) => {
    // We decode the key to get params
    // key format: '/api/tasks?params...' or custom object
    // Since we use server actions, we can wrapper it.
    // But SWR keys can be arrays: ['tasks', filters]
    const [_, filters] = JSON.parse(key)
    return await getAllTasks(filters)
}

function TasksContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Data state
    // Data state
    // SWR handles data and loading state now


    // UI state
    const [activeTab, setActiveTab] = useState<'my' | 'projects' | 'clients' | 'all'>('my')
    const [activeFilter, setActiveFilter] = useState<'today' | 'pending' | 'overdue' | 'completed' | 'next-week' | 'all'>('today')
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500) // Debounce search for 500ms
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
    const [page, setPage] = useState(1)
    const ITEMS_PER_PAGE = 30

    // Selection (Mapped to URL)
    const selectedTaskId = searchParams.get('taskId')

    // We use SWR now, so this manual fetch is deprecated for initial load, 
    // but useful for manual refresh if needed (though mutate is better).
    const fetchTasks = async () => {
        mutate()
    }

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
    }, [])

    // SWR Integration
    const { data: tasksData, error, mutate, isLoading: swrLoading } = useSWR(
        (activeTab === 'my' && !currentUserId) ? null : JSON.stringify(['tasks', {
            search: debouncedSearch || undefined,
            projectId: activeTab === 'projects' ? undefined : undefined,
            assigneeId: activeTab === 'my' && currentUserId ? [currentUserId] : undefined,
            page,
            limit: ITEMS_PER_PAGE,
            activeFilter, // Pass filter to server
        }]),
        async (key) => {
            const [_, params] = JSON.parse(key)
            return await getAllTasks(params)
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    )

    const tasks = (tasksData as any[]) || []
    const loading = swrLoading

    const handleTaskClick = (id: string) => {
        const params = new URLSearchParams(searchParams)
        if (selectedTaskId === id) {
            params.delete('taskId')
        } else {
            params.set('taskId', id)
        }
        router.replace(`${pathname}?${params.toString()}`)
    }

    const handleTaskUpdate = (updatedTask?: any) => {
        if (!updatedTask) {
            mutate()
            return
        }
        mutate((prev: any[] | undefined) => (prev || []).map((t: any) => t.id === updatedTask.id ? updatedTask : t), false)
    }

    const handleToggleStatus = async (task: any) => {
        const projectStatuses = task.project?.statuses || derivedStatuses
        const doneStatus = projectStatuses.find((s: any) => s.name?.toLowerCase().includes('concluíd') || s.name?.toLowerCase().includes('done'))
        const pendingStatus = projectStatuses.find((s: any) => s.name?.toLowerCase().includes('fazer') || s.name?.toLowerCase().includes('todo') || s.name?.toLowerCase().includes('pendente'))

        const isCurrentlyDone = task.status?.name?.toLowerCase().includes('concluíd') || task.status?.name?.toLowerCase().includes('done')

        const newStatus = isCurrentlyDone ? pendingStatus : doneStatus

        if (newStatus) {
            const updatedTask = {
                ...task,
                status: newStatus,
                status_id: newStatus.id,
                project: task.project
            }
            mutate((prev: any[] | undefined) => (prev || []).map((t: any) => t.id === task.id ? updatedTask : t), false)
            await updateTask(task.id, { status_id: newStatus.id })
        }
    }

    // Cleaned up client-side filter since server handles it now
    // We apply custom sorting to prioritize today's tasks if the 'today' filter is active
    const filteredTasks = useMemo(() => {
        if (!tasks) return []

        let sortedTasks = [...tasks]

        if (activeFilter === 'today') {
            const todayStr = new Date().toISOString().split('T')[0]
            sortedTasks.sort((a, b) => {
                const isAToday = a.due_date === todayStr
                const isBToday = b.due_date === todayStr
                if (isAToday && !isBToday) return -1
                if (!isAToday && isBToday) return 1
                return 0 // Maintain existing order for others
            })
        }

        return sortedTasks
    }, [tasks, activeFilter])

    // Quick check if statuses are loaded
    const { data: fetchedStatuses, isLoading: statusesLoading } = useSWR(
        ['statuses', activeTab],
        async () => {
            const mod = await import('@/lib/db/tasks')
            if (mod.getKanbanStatuses) return await mod.getKanbanStatuses(undefined)
            return []
        },
        {
            revalidateOnFocus: false, // Prevent aggressive refetching
            dedupingInterval: 300000 // Cache statuses for 5 minutes
        }
    )

    // We pass all statuses to KanbanBoard so it can resolve project-specific IDs.
    // The KanbanBoard component will handle deduplication of columns by name.
    const derivedStatuses = useMemo(() => {
        if (fetchedStatuses && fetchedStatuses.length > 0) {
            return [...fetchedStatuses].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        }
        if (!tasks || tasks.length === 0) return []

        // Fallback to extracting from tasks
        const statusMap = new Map()
        for (const t of tasks) {
            if (t.status && typeof t.status === 'object' && 'id' in t.status) {
                if (!statusMap.has(t.status.id)) {
                    statusMap.set(t.status.id, t.status)
                }
            }
        }
        return Array.from(statusMap.values()).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    }, [tasks, fetchedStatuses])

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gray-50">
            {/* Header/Filters Area */}
            <div className="flex-none px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
                    <button
                        onClick={() => setIsNewTaskModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Tarefa
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {[
                                { id: 'my', name: 'Minhas' },
                                { id: 'projects', name: 'Por Projeto' },
                                { id: 'clients', name: 'Por Cliente' },
                                { id: 'all', name: 'Tudo' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Buscar tarefas..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar max-w-[600px]">
                                {[
                                    { id: 'today', label: 'Hoje' },
                                    { id: 'pending', label: 'Pendentes' },
                                    { id: 'overdue', label: 'Atrasadas' },
                                    { id: 'completed', label: 'Concluídas' },
                                    { id: 'next-week', label: 'Próxima Semana' },
                                    { id: 'all', label: 'Todos' },
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setActiveFilter(f.id as any)}
                                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap
                                            ${activeFilter === f.id
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
                                <Filter className="h-4 w-4" /> Filtros
                            </button>

                            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
                                <ArrowUpDown className="h-4 w-4" /> Ordenar
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutList className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-hidden ${viewMode === 'list' ? 'flex' : 'p-6'}`}>

                {/* Grouped Rendering Logic */}
                {(() => {
                    // Helper to organize tasks
                    const getGroupedTasks = (): Record<string, any[]> => {
                        if (activeTab === 'projects') {
                            const groups: Record<string, any[]> = {}
                            filteredTasks.forEach((t: any) => {
                                const key = t.project?.name || 'Sem Projeto'
                                if (!groups[key]) groups[key] = []
                                groups[key].push(t)
                            })
                            return groups
                        }
                        if (activeTab === 'clients') {
                            const groups: Record<string, any[]> = {}
                            filteredTasks.forEach((t: any) => {
                                const key = t.project?.client?.name || 'Sem Cliente'
                                if (!groups[key]) groups[key] = []
                                groups[key].push(t)
                            })
                            return groups
                        }
                        return { 'Todas': filteredTasks }
                    }

                    const grouped = getGroupedTasks()
                    const groupKeys = Object.keys(grouped).sort() // Alphabetical sort for keys

                    if (viewMode === 'kanban') {
                        return (
                            <div className="h-full overflow-x-auto w-full space-y-8">
                                {groupKeys.map(group => {
                                    const tasksInGroup = grouped[group]
                                    if (tasksInGroup.length === 0) return null
                                    return (
                                        <div key={group} className="min-w-full">
                                            {activeTab !== 'my' && activeTab !== 'all' && (
                                                <h2 className="text-sm font-bold text-gray-700 mb-3 px-2 sticky left-0">{group}</h2>
                                            )}
                                            <KanbanBoard
                                                tasks={tasksInGroup}
                                                statuses={derivedStatuses}
                                                onTaskClick={(id) => handleTaskClick(id)}
                                                onUpdate={fetchTasks}
                                            />
                                        </div>
                                    )
                                })}
                                {selectedTaskId && (
                                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 sm:p-6" onClick={() => handleTaskClick(selectedTaskId)}>
                                        <div
                                            className="bg-white rounded-xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <TaskDetailView
                                                taskId={selectedTaskId}
                                                onClose={() => handleTaskClick(selectedTaskId)}
                                                onUpdate={handleTaskUpdate}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    } else {
                        // List View
                        return (
                            <>
                                <div className={`flex-1 overflow-y-auto bg-gray-50 p-4 ${selectedTaskId ? 'hidden lg:block lg:w-3/5 xl:w-[55%]' : 'w-full'}`}>
                                    {loading ? (
                                        <div className="flex justify-center p-12">
                                            <LoadingSpinner size="lg" />
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {groupKeys.map(group => {
                                                const tasksInGroup = grouped[group]
                                                if (tasksInGroup.length === 0) return null
                                                return (
                                                    <div key={group}>
                                                        {activeTab !== 'my' && activeTab !== 'all' && (
                                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">{group}</h3>
                                                        )}
                                                        <ul className="space-y-3">
                                                            {tasksInGroup.map((task: any) => (
                                                                <TaskListItem
                                                                    key={task.id}
                                                                    task={task}
                                                                    isSelected={selectedTaskId === task.id}
                                                                    onClick={() => handleTaskClick(task.id)}
                                                                    onToggleStatus={handleToggleStatus}
                                                                />
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )
                                            })}
                                            {filteredTasks.length === 0 && (
                                                <div className="p-12 text-center text-gray-400">
                                                    Nenhuma tarefa encontrada.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* Pagination Controls */}
                                    <div className="mt-4 flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm sticky bottom-0">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-sm text-gray-500">Página {page}</span>
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={tasksData && tasksData.length < ITEMS_PER_PAGE} // Simple logic, assumes if < limit we are at end
                                            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        >
                                            Próximo
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Task Detail View */}
                                {selectedTaskId && (
                                    <div className="w-full lg:w-2/5 xl:w-[45%] flex-none border-l border-gray-200 bg-white h-full overflow-hidden absolute lg:relative inset-0 lg:inset-auto z-10 lg:z-0">
                                        <TaskDetailView
                                            taskId={selectedTaskId}
                                            onClose={() => handleTaskClick(selectedTaskId)}
                                            onUpdate={handleTaskUpdate}
                                        />
                                    </div>
                                )}
                            </>
                        )
                    }
                })()}
            </div>

            <NewTaskModal
                isOpen={isNewTaskModalOpen}
                onClose={() => setIsNewTaskModalOpen(false)}
            />
        </div>
    )
}

export default function TasksPage() {
    return (
        <Suspense fallback={<div className="p-6">Carregando layout...</div>}>
            <TasksContent />
        </Suspense>
    )
}
