'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { ProjectList } from '@/components/projects/project-list'
import { NewProjectModal } from '@/components/projects/new-project-modal'
import { getAllProjects } from '@/lib/db/projects'
import { getClients } from '../clients/actions'
import { Plus } from 'lucide-react'

import { getCurrentUser, getUsers } from '@/lib/db/profiles'

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        const [projectsData, clientsData, usersData, currentUserData] = await Promise.all([
            getAllProjects(),
            getClients(undefined, 'Ativo'),
            getUsers(),
            getCurrentUser()
        ])
        setProjects(projectsData || [])
        setClients(clientsData || [])
        setUsers(usersData || [])
        setCurrentUser(currentUserData)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleModalClose = () => {
        setIsModalOpen(false)
        fetchData()
    }

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
            </div>
        )
    }

    return (
        <>
            <PageHeader title="Todos os Projetos" description="Visão geral de todos os projetos em andamento">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Projeto
                </button>
            </PageHeader>

            <div className="mt-6">
                <ProjectList
                    projects={projects}
                    onCreateNew={() => setIsModalOpen(true)}
                />
            </div>

            <NewProjectModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                clients={clients}
                users={users}
                currentUser={currentUser}
            />
        </>
    )
}
