'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'

import { PageHeader } from '@/components/ui/page-header'
import { getAllTasks } from '@/lib/db/tasks'
import { createClient } from '@/lib/supabase/client'
import { KanbanBoard } from '@/components/tasks/kanban/kanban-board'
import { LayoutList, LayoutGrid, Plus, Search, Filter, ArrowUpDown, Calendar, User as UserIcon } from 'lucide-react'
import { TaskDrawer } from '@/components/tasks/task-drawer'
import { NewTaskModal } from '@/components/tasks/new-task-modal'
import { TaskDetailView } from '@/components/tasks/task-detail-view'
import { TaskListItem } from '@/components/tasks/task-list-item'
import { format, startOfDay, isToday, isPast, addDays, isWithinInterval, startOfWeek, endOfWeek, addWeeks, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

function TasksContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Data state
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // UI state
    const [activeTab, setActiveTab] = useState<'my' | 'projects' | 'clients' | 'all'>('my')
    const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'overdue' | 'pending' | 'completed' | 'next-week'>('all')
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

    // Selection (Mapped to URL)
    const selectedTaskId = searchParams.get('taskId')

    const fetchTasks = async () => {
        setLoading(true)
        // Ensure we pass real filters based on activeTab
        // Assuming current user ID logic handles "my" in backend default if no filters, 
        // or we need to pass current user ID. For MVP we fetch all and filter in backend or frontend?
        // getAllTasks handles many filters.
        const data = await getAllTasks({
            search: search || undefined
        })
        setTasks(data || [])
        setLoading(false)
    }

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
    }, [])

    useEffect(() => {
        fetchTasks()
    }, [search])

    const handleTaskClick = (id: string) => {
        const params = new URLSearchParams(searchParams)
        if (selectedTaskId === id) {
            params.delete('taskId')
        } else {
            params.set('taskId', id)
        }
        router.replace(`${pathname}?${params.toString()}`)
    }

    const filteredTasks = useMemo(() => {
        let result = tasks

        // 1. Tab Filtering
        if (activeTab === 'my') {
            if (currentUserId) {
                result = result.filter(t => t.assignees?.some((a: any) => a.user.id === currentUserId))
            }
        }
        // Projects and Clients tabs are handled in the rendering logic (grouping), 
        // but we still rely on 'result' here. No filtering needed for them implies showing ALL tasks 
        // (that the user has access to) grouped. 
        // If 'projects' means "all projects", we don't filter. 
        // If 'clients' means "all clients", we don't filter.

        // 2. Date/Status Filtering
        if (activeFilter === 'all') return result

        const today = startOfDay(new Date())

        return result.filter(task => {
            const isDone = task.status?.name?.toLowerCase().includes('concluíd')
                || task.status?.name?.toLowerCase().includes('done')
                || task.status?.name?.toLowerCase().includes('finalizado')
                || task.status?.name?.toLowerCase().includes('cancelad')

            // Parse specifically as local date YYYY-MM-DD if exists
            const taskDate = task.due_date ? startOfDay(parseISO(task.due_date)) : null

            switch (activeFilter) {
                case 'today':
                    return taskDate && isToday(taskDate)

                case 'overdue':
                    // Overdue: Date < Today AND Not Done
                    return taskDate && isPast(taskDate) && !isToday(taskDate) && !isDone

                case 'pending':
                    // Pending: Not Done
                    return !isDone

                case 'completed':
                    // Completed: Is Done
                    return isDone

                case 'next-week':
                    if (!taskDate) return false
                    // Next calendar week (Monday to Sunday)
                    const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }) // Monday
                    const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })   // Sunday
                    return isWithinInterval(taskDate, {
                        start: nextWeekStart,
                        end: nextWeekEnd
                    })

                default:
                    return true
            }
        })
    }, [tasks, activeFilter])

    // Derive statuses from tasks for Kanban (Unique IDs)
    const derivedStatuses = useMemo(() => Array.from(
        new Map(
            (tasks || [])
                .filter(t => t.status && typeof t.status === 'object' && 'id' in t.status)
                .map(t => [t.status.id, t.status])
        ).values()
    ).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)), [tasks])

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
                                    { id: 'all', label: 'Todos' },
                                    { id: 'today', label: 'Hoje' },
                                    { id: 'pending', label: 'Pendentes' },
                                    { id: 'overdue', label: 'Atrasadas' },
                                    { id: 'completed', label: 'Concluídas' },
                                    { id: 'next-week', label: 'Próxima Semana' },
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
                    const getGroupedTasks = () => {
                        if (activeTab === 'projects') {
                            const groups: Record<string, any[]> = {}
                            filteredTasks.forEach(t => {
                                const key = t.project?.name || 'Sem Projeto'
                                if (!groups[key]) groups[key] = []
                                groups[key].push(t)
                            })
                            return groups
                        }
                        if (activeTab === 'clients') {
                            const groups: Record<string, any[]> = {}
                            filteredTasks.forEach(t => {
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
                                            />
                                        </div>
                                    )
                                })}
                                {/* Drawer for Kanban */}
                                {selectedTaskId && (
                                    <TaskDetailView
                                        taskId={selectedTaskId}
                                        onClose={() => handleTaskClick(selectedTaskId)}
                                        onUpdate={fetchTasks}
                                    />
                                )}
                            </div>
                        )
                    } else {
                        // List View
                        return (
                            <>
                                <div className={`flex-1 overflow-y-auto bg-gray-50 p-4 ${selectedTaskId ? 'hidden lg:block lg:w-3/5 xl:w-[55%]' : 'w-full'}`}>
                                    {loading ? (
                                        <div className="p-6 text-center text-gray-500">Carregando tarefas...</div>
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
                                                            {tasksInGroup.map((task) => (
                                                                <TaskListItem
                                                                    key={task.id}
                                                                    task={task}
                                                                    isSelected={selectedTaskId === task.id}
                                                                    onClick={() => handleTaskClick(task.id)}
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
                                </div>

                                {/* Right: Task Detail View */}
                                {selectedTaskId && (
                                    <div className="w-full lg:w-2/5 xl:w-[45%] flex-none border-l border-gray-200 bg-white h-full overflow-hidden absolute lg:relative inset-0 lg:inset-auto z-10 lg:z-0">
                                        <TaskDetailView
                                            taskId={selectedTaskId}
                                            onClose={() => handleTaskClick(selectedTaskId)}
                                            onUpdate={fetchTasks}
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
