'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createProject, createProjectStatus } from '@/lib/db/projects'
import { useRouter } from 'next/navigation'

interface NewProjectModalProps {
    isOpen: boolean
    onClose: () => void
    clientId?: string
    clients?: any[]
}

export function NewProjectModal({ isOpen, onClose, clientId: preselectedClientId, clients = [] }: NewProjectModalProps) {
    const [name, setName] = useState('')
    const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '')
    const [scopeType, setScopeType] = useState('Recorrente')
    const [scopeCustom, setScopeCustom] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (preselectedClientId) {
            setSelectedClientId(preselectedClientId)
        } else if (clients.length > 0 && !selectedClientId) {
            setSelectedClientId(clients[0].id)
        }
    }, [preselectedClientId, clients, isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClientId) {
            alert('Selecione um cliente')
            return
        }
        setLoading(true)

        try {
            // 1. Create Project
            const result = await createProject({
                clientId: selectedClientId,
                name,
                scopeType,
                scopeCustom: scopeType === 'Outro' ? scopeCustom : undefined
            })

            if (result.error) {
                alert('Erro ao criar projeto: ' + result.error)
                return
            }

            const projectId = result.data.id



            // Success
            setName('')
            setScopeType('Recorrente')
            setScopeCustom('')
            if (!preselectedClientId) setSelectedClientId('') // Reset if not fixed
            onClose()
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro inesperado ao criar projeto.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Novo Projeto</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!preselectedClientId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cliente</label>
                            <select
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                                required
                            >
                                <option value="" disabled>Selecione um cliente...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Projeto</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Ex: Site Institucional"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Escopo</label>
                        <select
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={scopeType}
                            onChange={(e) => setScopeType(e.target.value)}
                        >
                            <option value="Recorrente">Recorrente (Fee Mensal)</option>
                            <option value="Fechado">Escopo Fechado (Projeto)</option>
                            <option value="Horas">Banco de Horas</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>

                    {scopeType === 'Outro' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Detalhe do Escopo</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={scopeCustom}
                                onChange={(e) => setScopeCustom(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? 'Criando...' : 'Criar Projeto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
