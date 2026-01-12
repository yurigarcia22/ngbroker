import { FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'

export function ProjectList({ projects, onCreateNew }: { projects: any[]; onCreateNew: () => void }) {
    if (projects.length === 0) {
        return (
            <EmptyState
                icon={FolderKanban}
                title="Nenhum projeto encontrado"
                description="Comece criando um projeto para este cliente."
                action={
                    <button
                        onClick={onCreateNew}
                        className="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        Novo Projeto
                    </button>
                }
            />
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-lg border border-gray-200 bg-white shadow-sm hover:border-indigo-500 hover:shadow-md transition duration-150 ease-in-out"
                >
                    <div className="p-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-2 truncate">{project.name}</h4>
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                {project.scope_type}
                            </span>
                        </div>
                        {project.scope_custom && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                {project.scope_custom}
                            </p>
                        )}
                        <div className="text-xs text-gray-400">
                            Criado em {new Date(project.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}
