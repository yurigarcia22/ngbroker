'use client'

import { use, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { getProject, getProjectStatuses } from '@/lib/db/projects'
import { getTasks } from '@/lib/db/tasks'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProjectTimesheet } from '@/components/projects/project-timesheet'
import { ProjectTemplatesTab } from '@/components/projects/project-templates-tab'
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

    // Reload when tab changes if needed (e.g. to refresh timesheet data)
    // Actually simplicity: components fetch their own data or use props. 
    // Timesheet fetches its own. Templates fetch their own. Tasks use page state.

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
                <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Link href={`/clients/${project.client_id}`} className="hover:text-gray-700 flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        {project.client?.name || 'Cliente'}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-semibold text-gray-900">{project.name}</span>
                </div>

                <PageHeader
                    title={project.name}
                    description={`${project.scope_type} • Início: ${project.start_date || '-'} • Fim: ${project.end_date || '-'}`}
                >
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            + Nova Tarefa
                        </button>
                    </div>
                </PageHeader>
            </div>

            <div className="bg-white shadow rounded-lg mb-6 min-h-[500px]">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
                        {['tasks', 'timesheet', 'config', 'templates'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                            >
                                {tab === 'config' ? 'Configuração' :
                                    tab === 'templates' ? 'Templates' :
                                        tab === 'timesheet' ? 'Timesheet' : 'Tarefas'}
                            </button>
                        ))}
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

                    {activeTab === 'timesheet' && <ProjectTimesheet projectId={id} />}

                    {activeTab === 'config' && (
                        <ProjectStatusConfig statuses={project.project_statuses} projectId={project.id} />
                    )}

                    {activeTab === 'templates' && <ProjectTemplatesTab projectId={id} />}
                </div>
            </div>
        </>
    )
}
