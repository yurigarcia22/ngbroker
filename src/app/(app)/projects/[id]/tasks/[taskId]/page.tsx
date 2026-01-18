'use client'

import { use, useEffect, useState } from 'react'
import { getTask } from '@/lib/db/tasks'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft, Clock, CheckSquare, MessageSquare, Paperclip, Calendar } from 'lucide-react'
import Link from 'next/link'
import { TaskChecklist } from '@/components/tasks/task-checklist'
import { TaskComments } from '@/components/tasks/task-comments'
import { TaskAttachments } from '@/components/tasks/task-attachments'
import { TaskTimeLog } from '@/components/tasks/task-time-log'

export default function TaskDetailPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
    const { id: projectId, taskId } = use(params)
    const [task, setTask] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('checklist')

    const fetchTask = async () => {
        setLoading(true)
        const data = await getTask(taskId)
        setTask(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchTask()
    }, [taskId])

    if (loading) return <div>Carregando tarefa...</div>
    if (!task) return <div>Tarefa não encontrada.</div>

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <Link href={`/projects/${projectId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar para o projeto
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                ${task.priority === 'Alta' || task.priority === 'Urgente' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {task.priority}
                            </span>
                            <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </span>
                            {task.status && (
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                    {task.status.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Descrição</h3>
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {task.description || 'Sem descrição.'}
                        </div>
                    </div>

                    {/* Tabs Area */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('checklist')}
                                    className={`${activeTab === 'checklist' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                                >
                                    <CheckSquare className="h-4 w-4 mr-2" /> Checklist
                                </button>
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`${activeTab === 'comments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" /> Comentários
                                </button>
                                <button
                                    onClick={() => setActiveTab('attachments')}
                                    className={`${activeTab === 'attachments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                                >
                                    <Paperclip className="h-4 w-4 mr-2" /> Anexos
                                </button>
                                <button
                                    onClick={() => setActiveTab('time')}
                                    className={`${activeTab === 'time' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                                >
                                    <Clock className="h-4 w-4 mr-2" /> Tempo
                                </button>
                            </nav>
                        </div>
                        <div className="p-6">
                            {activeTab === 'checklist' && <TaskChecklist checklist={task.checklist || []} taskId={task.id} />}
                            {activeTab === 'comments' && <TaskComments comments={task.comments || []} taskId={task.id} />}
                            {activeTab === 'attachments' && <TaskAttachments taskId={task.id} />}
                            {activeTab === 'time' && <TaskTimeLog timeEntries={task.time_entries || []} taskId={task.id} />}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Responsáveis</h3>
                        <div className="flex -space-x-2 overflow-hidden">
                            {task.assignees?.map((assignee: any) => (
                                <div key={assignee.user.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700" title={assignee.user.name}>
                                    {assignee.user.name.charAt(0)}
                                </div>
                            ))}
                            {(!task.assignees || task.assignees.length === 0) && <span className="text-sm text-gray-500">Nenhum responsável</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
