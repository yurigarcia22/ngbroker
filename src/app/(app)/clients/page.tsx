'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Users, Search, Plus, Filter } from 'lucide-react'
import { getClients } from './actions'
import { StatusBadge } from '@/components/clients/status-badge'
import Link from 'next/link'
import { NewClientModal } from '@/components/clients/new-client-modal'

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchClients = async () => {
        setLoading(true)
        const data = await getClients(search, statusFilter)
        setClients(data || [])
        setLoading(false)
    }

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchClients()
        }, 300)
        return () => clearTimeout(timer)
    }, [search, statusFilter])

    // Refetch when modal closes (in case a client was added)
    const handleModalClose = () => {
        setIsModalOpen(false)
        fetchClients()
    }

    return (
        <>
            <PageHeader title="Clientes" description="Gerencie seus clientes PF e PJ">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                </button>
            </PageHeader>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar clientes por nome..."
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative w-full sm:w-48">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Filter className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Todos Status</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Pausado">Pausado</option>
                        <option value="Inadimplente">Inadimplente</option>
                        <option value="Encerrado">Encerrado</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-md bg-gray-200" />
                    ))}
                </div>
            ) : clients.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Nenhum cliente encontrado"
                    description={search || statusFilter ? "Tente ajustar seus filtros." : "Comece adicionando seu primeiro cliente."}
                    action={
                        !search && !statusFilter && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                            >
                                Novo Cliente
                            </button>
                        )
                    }
                />
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Nome / Segmento
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Tipo
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Ticket Médio
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Status
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Ações</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                                <div className="text-sm text-gray-500">{client.segment || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                            {client.type}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {client.ticket ? `R$ ${client.ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <StatusBadge status={client.status} />
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <Link href={`/clients/${client.id}`} className="text-indigo-600 hover:text-indigo-900">
                                            Ver detalhes
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <NewClientModal isOpen={isModalOpen} onClose={handleModalClose} />
        </>
    )
}
