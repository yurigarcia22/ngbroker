'use client'

import { EmptyState } from '@/components/ui/empty-state'
import { CheckSquare, User as UserIcon, Calendar, Clock, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface TaskListProps {
    tasks: any[]
    statuses: any[]
    projectId: string
    onCreateNew: () => void
}

export function TaskList({ tasks, statuses, projectId, onCreateNew }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <EmptyState
                icon={CheckSquare}
                title="Nenhuma tarefa encontrada"
                description="Crie tarefas para acompanhar o progresso do projeto."
                action={
                    <button
                        onClick={onCreateNew}
                        className="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        Criar Primeira Tarefa
                    </button>
                }
            />
        )
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Alta': return 'text-red-600 bg-red-100'
            case 'Média': return 'text-yellow-600 bg-yellow-100'
            case 'Baixa': return 'text-blue-600 bg-blue-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const getStatusName = (statusId: string) => {
        return statuses.find(s => s.id === statusId)?.name || 'Unknown'
    }

    return (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
                {tasks.map((task) => (
                    <li key={task.id} className="hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="truncate">
                                    <div className="flex text-sm">
                                        <p className="truncate font-medium text-indigo-600">{task.title}</p>
                                        <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex">
                                        <div className="flex items-center text-sm text-gray-500 mr-4">
                                            <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <p>
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sem prazo'}
                                            </p>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 mr-4">
                                            <div className={`mr-1.5 h-2 w-2 rounded-full bg-gray-400`} /> {/* Status dot could be colored if status has color */}
                                            <p>{getStatusName(task.status_id)}</p>
                                        </div>
                                        {task.task_assignees && task.task_assignees.length > 0 && (
                                            <div className="flex items-center text-sm text-gray-500">
                                                <UserIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                                <div className="flex -space-x-1 overflow-hidden">
                                                    {task.task_assignees.map((assignee: any) => (
                                                        <span key={assignee.user.id} className="inline-block h-6 w-6 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs font-bold text-gray-600" title={assignee.user.name}>
                                                            {assignee.user.name.charAt(0)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-5 flex-shrink-0">
                                    {/* Action buttons could go here */}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
