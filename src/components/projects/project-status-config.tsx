'use client'

import { useState } from 'react'
import { createStatusAction, deleteStatusAction } from '@/app/(app)/projects/[id]/actions'
import { Trash2, Plus, Loader2 } from 'lucide-react'

export function ProjectStatusConfig({ statuses, projectId }: { statuses: any[], projectId: string }) {
    const [newStatusName, setNewStatusName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newStatusName.trim()) return

        setIsCreating(true)
        const nextSortOrder = statuses.length > 0 ? Math.max(...statuses.map((s: any) => s.sort_order)) + 1 : 1

        // Use FormData to match action signature
        const formData = new FormData()
        formData.append('projectId', projectId)
        formData.append('name', newStatusName)
        formData.append('sortOrder', nextSortOrder.toString())

        await createStatusAction(formData)

        setNewStatusName('')
        setIsCreating(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso falhará se houver tarefas neste status.')) return
        const res = await deleteStatusAction(id, projectId)
        if (res.error) alert(res.error)
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Configuração de Status</h3>

            <div className="space-y-4">
                {statuses.map((status: any) => (
                    <div key={status.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
                        <div className="flex items-center">
                            <span className="font-medium text-gray-700">{status.name}</span>
                            {status.is_default && <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded-full">Padrão</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handleDelete(status.id)}
                                disabled={status.is_default} // Prevent deleting logic default for now if simpler
                                className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400"
                                title="Excluir status"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                <form onSubmit={handleCreate} className="mt-4 flex gap-2">
                    <input
                        type="text"
                        value={newStatusName}
                        onChange={(e) => setNewStatusName(e.target.value)}
                        placeholder="Nome do novo status"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isCreating ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4 mr-2" />}
                        Adicionar
                    </button>
                </form>
            </div>
        </div>
    )
}
