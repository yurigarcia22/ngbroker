'use client'

import { use, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { getProject, getProjectStatuses } from '@/lib/db/projects'
import { getTasks } from '@/lib/db/tasks'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProjectStatusConfig } from '@/components/projects/project-status-config'
import { TaskList } from '@/components/tasks/task-list'
import { NewTaskModal } from '@/components/tasks/new-task-modal'

export default function ProjectDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string; search?: string }> }) {
    const { id } = use(params)
    const { status, search } = use(searchParams)

    const [project, setProject] = useState<any>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [statuses, setStatuses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('tasks')
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        const projectData = await getProject(id)
        const statusesData = projectData?.project_statuses || []

        // Fetch tasks with filters
        const tasksData = await getTasks(id, { status, search })

        setProject(projectData)
        setStatuses(statusesData)
        setTasks(tasksData || [])
        setLoading(false)
    }

    // Refetch when modal closes
    const handleTaskModalClose = async () => {
        setIsTaskModalOpen(false)
        const tasksData = await getTasks(id, { status, search })
        setTasks(tasksData || [])
    }

    useEffect(() => {
        fetchData()
    }, [id, status, search])

    if (loading) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
        </div>
    }

    if (!project) {
        return <div>Projeto não encontrado.</div>
    }

    return (
        <>
            <div className="mb-6">
                <Link href={`/clients/${project.client_id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar para cliente
                </Link>
                <PageHeader
                    title={project.name}
                    description={project.client ? `Cliente: ${project.client.name}` : ''}
                >
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-medium text-indigo-800">
                            {project.scope_type}
                        </span>
                    </div>
                </PageHeader>
            </div>

            <div className="bg-white shadow rounded-lg mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`${activeTab === 'tasks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Tarefas
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`${activeTab === 'config' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Configuração
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'tasks' && (
                        <>
                            <TaskList
                                tasks={tasks}
                                statuses={statuses}
                                projectId={id}
                                onCreateNew={() => setIsTaskModalOpen(true)}
                            />
                            <NewTaskModal
                                isOpen={isTaskModalOpen}
                                onClose={handleTaskModalClose}
                                projectId={id}
                                statuses={statuses}
                            />
                        </>
                    )}

                    {activeTab === 'config' && (
                        <ProjectStatusConfig statuses={project.project_statuses} projectId={project.id} />
                    )}
                </div>
            </div>
        </>
    )
}
