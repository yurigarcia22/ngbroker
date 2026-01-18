'use client'

import { use, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { getClient, updateClientStatus } from '../actions'
import { StatusBadge } from '@/components/clients/status-badge'
import { ArrowLeft, Building2, User, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getProjects } from '@/lib/db/projects'
import { ProjectList } from '@/components/projects/project-list'
import { NewProjectModal } from '@/components/projects/new-project-modal'
import { EditClientModal } from '@/components/clients/edit-client-modal'
import { AlertCircle, FileText, Pencil } from 'lucide-react'

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [client, setClient] = useState<any>(null)
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const fetchClient = async () => {
        setLoading(true)
        const data = await getClient(id)
        const projectsData = await getProjects(id)
        setClient(data)
        setProjects(projectsData || [])
        setLoading(false)
    }

    // Refetch projects when modal closes (in case of creation)
    const handleProjectModalClose = async () => {
        setIsProjectModalOpen(false)
        const projectsData = await getProjects(id)
        setProjects(projectsData || [])
    }

    useEffect(() => {
        fetchClient()
    }, [id])

    const handleStatusChange = async (newStatus: string) => {
        const result = await updateClientStatus(id, newStatus)
        if (result.success) {
            // just update local state or re-fetch
            setClient({ ...client, status: newStatus })
        }
    }

    if (loading) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
        </div>
    }

    if (!client) {
        return <div>Cliente não encontrado.</div>
    }

    return (
        <>
            <div className="mb-6">
                <Link href="/clients" className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar para lista
                </Link>
                <PageHeader
                    title={client.name}
                    description={`Cliente desde ${new Date(client.created_at).toLocaleDateString()}`}
                >
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 mr-2">Status:</span>
                        <StatusBadge status={client.status} />
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-white p-1.5 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50 mb-0.5 ml-2"
                            title="Editar Cliente"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        {activeTab === 'projects' && (
                            <button
                                onClick={() => setIsProjectModalOpen(true)}
                                className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                            >
                                Novo Projeto
                            </button>
                        )}
                    </div>
                </PageHeader>
            </div>

            <div className="bg-white shadow rounded-lg mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Visão Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`${activeTab === 'projects' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Projetos ({projects.length})
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Informações do Cliente</h3>
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Nome</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{client.name}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">CNPJ</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-mono">{client.cnpj || '-'}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Periodicidade</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{client.payment_type || '-'}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Contrato (Vigência)</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {client.contract_start ? new Date(client.contract_start).toLocaleDateString() : '?'}
                                            {' - '}
                                            {client.contract_end ? new Date(client.contract_end).toLocaleDateString() : '?'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Documento</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {client.contract_url ? (
                                                <a href={client.contract_url} target="_blank" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    Abrir Contrato (PDF)
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 italic">Sem contrato anexado</span>
                                            )}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                                            {client.type === 'PJ' ? <Building2 className="w-4 h-4 text-gray-400" /> : <User className="w-4 h-4 text-gray-400" />}
                                            {client.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Segmento</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{client.segment || '-'}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Ticket Médio</dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                                            <Wallet className="w-4 h-4 text-gray-400" />
                                            {client.ticket ? `R$ ${typeof client.ticket === 'number' ? client.ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : parseFloat(client.ticket).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Criado em</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{new Date(client.created_at).toLocaleString()}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Ações Rápidas</h3>
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 uppercase">Alterar Status</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {['Ativo', 'Pausado', 'Inadimplente', 'Encerrado'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(status)}
                                                disabled={client.status === status}
                                                className={`px-3 py-1 text-xs rounded-full border ${client.status === status ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <ProjectList
                            projects={projects}
                            onCreateNew={() => setIsProjectModalOpen(true)}
                        />
                    )}
                </div>
            </div>

            <NewProjectModal
                isOpen={isProjectModalOpen}
                onClose={handleProjectModalClose}
                clientId={id}
            />

            <EditClientModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    fetchClient() // Refresh data after edit
                }}
                client={client}
            />
        </>
    )
}
