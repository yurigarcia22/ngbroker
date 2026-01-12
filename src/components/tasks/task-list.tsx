'use client'

import { useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { CheckSquare, Filter, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/clients/status-badge' // Reuse or make generic
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function TaskList({ tasks, statuses, projectId, onCreateNew }: { tasks: any[], statuses: any[], projectId: string, onCreateNew: () => void }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '')
    const [filterSearch, setFilterSearch] = useState(searchParams.get('search') || '')

    // Debounced search update
    const handleSearch = (term: string) => {
        setFilterSearch(term)
        const params = new URLSearchParams(searchParams)
        if (term) params.set('search', term)
        else params.delete('search')
        router.replace(`${pathname}?${params.toString()}`)
    }

    const handleStatusFilter = (statusId: string) => {
        setFilterStatus(statusId)
        const params = new URLSearchParams(searchParams)
        if (statusId) params.set('status', statusId)
        else params.delete('status')
        router.replace(`${pathname}?${params.toString()}`)
    }

    if (tasks.length === 0 && !filterSearch && !filterStatus) {
        return (
            <EmptyState
                icon={CheckSquare}
                title="Nenhuma tarefa encontrada"
                description="Crie tarefas para gerenciar o escopo deste projeto."
                action={
                    <button
                        onClick={onCreateNew}
                        className="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        Nova Tarefa
                    </button>
                }
            />
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex-1 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar tarefas..."
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        value={filterSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-64">
                    <select
                        className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        value={filterStatus}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                    >
                        <option value="">Todos Status</option>
                        {statuses.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={onCreateNew}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Tarefa
                </button>
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    Nenhuma tarefa encontrada com os filtros selecionados.
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Título</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Prioridade</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Prazo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-indigo-600 truncate">
                                                    <Link href={`/projects/${projectId}/tasks/${task.id}`} className="hover:underline">
                                                        {task.title}
                                                    </Link>
                                                </p>
                                                {task.tags && task.tags.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {task.tags.map((tag: string) => (
                                                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {task.project_statuses?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${task.priority === 'Urgente' ? 'bg-red-100 text-red-800' :
                                                task.priority === 'Alta' ? 'bg-orange-100 text-orange-800' :
                                                    task.priority === 'Baixa' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link href={`/projects/${projectId}/tasks/${task.id}`} className="text-indigo-600 hover:text-indigo-900">
                                            Ver detalhes
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
