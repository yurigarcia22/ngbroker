import { useState } from 'react'
import { Folder, Clock, AlertTriangle, Calendar, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProjectCardProps {
    project: any
}

export function ProjectCard({ project }: ProjectCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // 1. Calculate Stats
    const tasks = Array.isArray(project.tasks) ? project.tasks : []
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t: any) => t.status?.name === 'Concluído').length
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const now = new Date()
    const overdueTasks = tasks.filter((t: any) => {
        if (!t.due_date) return false
        const isDone = t.status?.name === 'Concluído'
        return !isDone && new Date(t.due_date) < now
    }).length

    const inProgressTasks = tasks.filter((t: any) => t.status?.name === 'Em Progresso').length

    // Date Range
    const dates = tasks
        .map((t: any) => t.due_date ? new Date(t.due_date).getTime() : 0)
        .filter((d: number) => d > 0)

    const maxDueDate = dates.length > 0 ? new Date(Math.max(...dates)) : null
    const startDate = project.created_at ? new Date(project.created_at) : new Date()

    const dateRangeString = `${format(startDate, "d 'de' MMM", { locale: ptBR })}.${maxDueDate ? ` - ${format(maxDueDate, "d 'de' MMM", { locale: ptBR })}` : ''}`

    // Assignees (Unique)
    const allAssignees: any[] = []
    tasks.forEach((t: any) => {
        if (Array.isArray(t.assignees)) {
            t.assignees.forEach((a: any) => {
                if (a && a.user) {
                    allAssignees.push(a.user)
                }
            })
        }
    })

    const uniqueAssignees = Array.from(new Map(allAssignees.map((u: any) => [u.id, u])).values())

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-700">
                        <Folder className="h-5 w-5" />
                    </div>
                    <div>
                        <Link href={`/projects/${project.id}`} className="block">
                            <h3 className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors">
                                {project.name}
                            </h3>
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {project.client?.name || project.scope_type}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 relative">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 border border-green-100">
                        Ativo
                    </span>
                    <button
                        onClick={(e) => { e.preventDefault(); setIsMenuOpen(!isMenuOpen) }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false) }} />
                            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-left"
                                >
                                    Ver detalhes
                                </Link>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                    Editar
                                </button>
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-left"
                                >
                                    Ver tarefas
                                </Link>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                    Aplicar template
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5">
                    <span className="font-medium">Progresso</span>
                    <span>{completedTasks}/{totalTasks} tarefas</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Metrics Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1" title="Em Progresso">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>{inProgressTasks} em progresso</span>
                    </div>
                    {overdueTasks > 0 && (
                        <div className="flex items-center gap-1 text-red-600 font-medium" title="Atrasadas">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>{overdueTasks} atrasadas</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 hidden sm:flex" title="Período">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate max-w-[100px]">{dateRangeString}</span>
                    </div>
                </div>

                {/* Avatars */}
                <div className="flex -space-x-1.5">
                    {uniqueAssignees.slice(0, 3).map((user: any) => (
                        <div
                            key={user.id}
                            className="h-6 w-6 rounded-full bg-indigo-100 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-indigo-700"
                            title={user.name}
                        >
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                user.name?.charAt(0)
                            )}
                        </div>
                    ))}
                    {uniqueAssignees.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-gray-50 ring-2 ring-white flex items-center justify-center text-[9px] font-medium text-gray-500">
                            +{uniqueAssignees.length - 3}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
