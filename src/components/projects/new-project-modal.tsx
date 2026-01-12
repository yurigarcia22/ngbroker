'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { createProjectAction } from '@/app/(app)/projects/actions'
import { Loader2 } from 'lucide-react'

export function NewProjectModal({ isOpen, onClose, clientId }: { isOpen: boolean; onClose: () => void; clientId: string }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [scopeType, setScopeType] = useState('Personalizado')

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)
        formData.append('clientId', clientId)

        const result = await createProjectAction(formData)

        setLoading(false)

        if (result?.error) {
            setError(result.error)
        } else {
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Projeto">
            <form onSubmit={onSubmit} className="space-y-4 mt-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Projeto</label>
                    <input type="text" name="name" id="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>

                <div>
                    <label htmlFor="scopeType" className="block text-sm font-medium text-gray-700">Tipo de Escopo</label>
                    <select
                        name="scopeType"
                        id="scopeType"
                        value={scopeType}
                        onChange={(e) => setScopeType(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    >
                        <option value="Personalizado">Personalizado</option>
                        <option value="Treinamento">Treinamento</option>
                        <option value="Tráfego">Tráfego</option>
                        <option value="CRM">CRM</option>
                        <option value="IA">IA</option>
                    </select>
                </div>

                {scopeType === 'Personalizado' && (
                    <div>
                        <label htmlFor="scopeCustom" className="block text-sm font-medium text-gray-700">Detalhes do Escopo</label>
                        <textarea name="scopeCustom" id="scopeCustom" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                    </div>
                )}

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
