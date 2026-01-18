'use client'

import { useState, useEffect } from 'react'
import { getTemplates, applyTemplate } from '@/lib/db/templates'
import { Loader2, Check } from 'lucide-react'

export function ProjectTemplatesTab({ projectId }: { projectId: string }) {
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        setLoading(true)
        const data = await getTemplates()
        setTemplates(data || [])
        setLoading(false)
    }

    const handleApply = async (templateId: string) => {
        if (!confirm('Deseja aplicar este template? Isso criará novas tarefas no projeto.')) return

        setApplying(templateId)
        setSuccessMessage('')

        const result = await applyTemplate(projectId, templateId)

        setApplying(null)
        if (result?.success) {
            setSuccessMessage('Template aplicado com sucesso! As tarefas foram criadas.')
            setTimeout(() => setSuccessMessage(''), 5000)
        } else {
            alert('Erro ao aplicar template.')
        }
    }

    if (loading) return <div className="text-gray-500 text-sm">Carregando templates...</div>

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Templates Disponíveis</h3>
            <p className="text-sm text-gray-500">Aplique templates para criar rapidamente um conjunto de tarefas padrão.</p>

            {successMessage && (
                <div className="p-4 rounded-md bg-green-50 text-green-700 text-sm flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map(template => (
                    <div key={template.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between h-full">
                        <div>
                            <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{template.scope_type || 'Geral'}</p>
                            <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                                {template.description || 'Sem descrição.'}
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => handleApply(template.id)}
                                disabled={!!applying}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {applying === template.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Aplicar Template'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Nenhum template encontrado.
                </div>
            )}
        </div>
    )
}
