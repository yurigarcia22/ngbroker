'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createTask } from '@/lib/db/tasks'
import { getClients } from '@/app/(app)/clients/actions'
import { getProjects } from '@/lib/db/projects'

interface NewTaskModalProps {
    isOpen: boolean
    onClose: () => void
    projectId?: string
    statuses?: any[]
}

type Step = 'client' | 'project' | 'details'

export function NewTaskModal({ isOpen, onClose, projectId, statuses }: NewTaskModalProps) {
    const [step, setStep] = useState<Step>('client')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Data
    const [clients, setClients] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])

    // Selection
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [selectedProject, setSelectedProject] = useState<any>(null)

    // Form
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('Média')
    const [dueDate, setDueDate] = useState('')

    // Load clients on open
    useEffect(() => {
        if (isOpen) {
            setLoading(true)
            getClients().then(data => {
                setClients(data || [])
                setLoading(false)
            })
            // Reset
            setStep('client')
            setSelectedClient(null)
            setSelectedProject(null)
            setTitle('')
        }
    }, [isOpen])

    // Load projects when client selected
    const handleSelectClient = async (client: any) => {
        setSelectedClient(client)
        setLoading(true)
        const data = await getProjects(client.id)
        setProjects(data || [])
        setLoading(false)
        setStep('project')
    }

    const handleSelectProject = (project: any) => {
        setSelectedProject(project)
        setStep('details')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await createTask({
                projectId: selectedProject.id,
                title,
                description,
                priority,
                dueDate: dueDate || null,
                statusId: selectedProject.project_statuses?.find((s: any) => s.is_default)?.id
            })

            router.refresh()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Erro ao criar tarefa')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl h-[600px] flex flex-col">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Nova Tarefa</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span className={step === 'client' ? 'font-medium text-indigo-600' : ''}>Cliente</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className={step === 'project' ? 'font-medium text-indigo-600' : ''}>Projeto</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className={step === 'details' ? 'font-medium text-indigo-600' : ''}>Detalhes</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0 py-2">
                    {loading && (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    )}

                    {!loading && step === 'client' && (
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="w-full rounded-md border-gray-300 text-sm mb-4"
                            />
                            {clients.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => handleSelectClient(client)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 text-left transition-colors"
                                >
                                    <span className="font-medium text-gray-900">{client.name}</span>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </button>
                            ))}
                            {clients.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum cliente encontrado.</p>}
                        </div>
                    )}

                    {!loading && step === 'project' && (
                        <div className="space-y-2">
                            <div className="mb-4 p-2 bg-indigo-50 text-indigo-700 rounded text-sm font-medium">
                                Cliente: {selectedClient?.name}
                            </div>
                            {projects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => handleSelectProject(project)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 text-left transition-colors"
                                >
                                    <div>
                                        <span className="font-medium text-gray-900 block">{project.name}</span>
                                        <span className="text-xs text-gray-500">{project.scope_type}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </button>
                            ))}
                            {projects.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">Nenhum projeto encontrado.</p>
                                    <button className="text-indigo-600 text-sm hover:underline">Criar novo projeto</button>
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && step === 'details' && (
                        <form id="new-task-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                <span className="bg-gray-100 px-2 py-1 rounded">{selectedClient?.name}</span>
                                <span>/</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">{selectedProject?.name}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">O que precisa ser feito?</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Ex: Criar layout da home"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                    >
                                        <option value="Baixa">Baixa</option>
                                        <option value="Média">Média</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Urgente">Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Prazo</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                <textarea
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detalhes adicionais..."
                                />
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-4 flex justify-between border-t pt-4">
                    {step !== 'client' ? (
                        <button
                            type="button"
                            onClick={() => setStep(step === 'details' ? 'project' : 'client')}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Voltar
                        </button>
                    ) : <div></div>}

                    {step === 'details' && (
                        <button
                            type="submit"
                            form="new-task-form"
                            disabled={loading || !title}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Criar Tarefa
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
