'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react'
import { createProjectStatus, deleteProjectStatus } from '@/lib/db/projects'
import { useRouter } from 'next/navigation'

interface ProjectStatusConfigProps {
    statuses: any[]
    projectId: string
}

export function ProjectStatusConfig({ statuses, projectId }: ProjectStatusConfigProps) {
    const [isAdding, setIsAdding] = useState(false)
    const [newStatusName, setNewStatusName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleAddStatus = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const maxSortOrder = Math.max(...statuses.map(s => s.sort_order), -1)

        const { error } = await createProjectStatus({
            projectId,
            name: newStatusName,
            sortOrder: maxSortOrder + 1
        })

        if (error) {
            alert('Erro ao criar status')
        } else {
            setNewStatusName('')
            setIsAdding(false)
            router.refresh()
        }
        setLoading(false)
    }

    const handleDeleteStatus = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o status "${name}"?`)) return

        const { error } = await deleteProjectStatus(id)
        if (error) {
            alert(error)
        } else {
            router.refresh()
        }
    }

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Status do Projeto</h3>
                    <p className="text-sm text-gray-500">Gerencie as etapas do fluxo de trabalho deste projeto.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Status
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddStatus} className="mb-6 rounded-md bg-gray-50 p-4 border border-gray-200">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Nome do Status</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Ex: Em Aprovação"
                                value={newStatusName}
                                onChange={(e) => setNewStatusName(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {statuses.map((status) => (
                        <li key={status.id} className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <div className="flex items-center">
                                <GripVertical className="mr-3 h-5 w-5 text-gray-400 cursor-move" />
                                <span className="text-sm font-medium text-gray-900">{status.name}</span>
                                {status.is_default && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                        Padrão
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={() => handleDeleteStatus(status.id, status.name)}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                    {statuses.length === 0 && (
                        <li className="px-4 py-8 text-center text-sm text-gray-500">
                            Nenhum status configurado.
                        </li>
                    )}
                </ul>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-md bg-yellow-50 p-4">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-700">
                    <p>A reordenação de status (drag & drop) será implementada em breve. Por enquanto, os status são exibidos na ordem de criação/sort_order.</p>
                </div>
            </div>
        </div>
    )
}
