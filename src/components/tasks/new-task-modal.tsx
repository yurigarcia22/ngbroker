'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { createTaskAction } from '@/app/(app)/projects/[id]/tasks/actions'
import { Loader2 } from 'lucide-react'

export function NewTaskModal({ isOpen, onClose, projectId, statuses }: { isOpen: boolean; onClose: () => void; projectId: string; statuses: any[] }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)
        formData.append('projectId', projectId)

        // If no status select, default to first one
        if (!formData.get('statusId') && statuses.length > 0) {
            formData.append('statusId', statuses[0].id)
        }

        const result = await createTaskAction(formData)

        setLoading(false)

        if (result?.error) {
            setError(result.error as string)
        } else {
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nova Tarefa">
            <form onSubmit={onSubmit} className="space-y-4 mt-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
                    <input type="text" name="title" id="title" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea name="description" id="description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Prioridade</label>
                        <select name="priority" id="priority" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border">
                            <option value="Baixa">Baixa</option>
                            <option value="Média" selected>Média</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="statusId" className="block text-sm font-medium text-gray-700">Status Inicial</label>
                        <select name="statusId" id="statusId" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border">
                            {statuses.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Prazo (opcional)</label>
                        <input type="date" name="dueDate" id="dueDate" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                    </div>
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (separar por vírgula)</label>
                        <input type="text" name="tags" id="tags" placeholder="Ex: dev, bug" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                    </div>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Salvar'}
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </Modal>
    )
}
