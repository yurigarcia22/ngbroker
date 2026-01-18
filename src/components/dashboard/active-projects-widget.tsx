
import { ArrowRight, FolderKanban } from 'lucide-react'
import Link from 'next/link'

export function ActiveProjectsWidget({ projects }: { projects: any[] }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-3 mt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Projetos Ativos</h3>
                    <p className="text-sm text-gray-500">Visão geral dos projetos em andamento</p>
                </div>
                <Link href="/projects" className="text-sm font-medium text-gray-900 flex items-center hover:underline">
                    Ver todos <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 transition-colors bg-gray-50/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                <FolderKanban className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{project.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{project.client?.name}</p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progresso</span>
                                <span>{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-indigo-600 h-1.5 rounded-full"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
