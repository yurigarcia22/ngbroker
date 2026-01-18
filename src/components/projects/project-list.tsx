import { ProjectCard } from './project-card'
import { EmptyState } from '@/components/ui/empty-state'
import { FolderKanban } from 'lucide-react'

interface ProjectListProps {
    projects: any[]
    onCreateNew: () => void
}

export function ProjectList({ projects, onCreateNew }: ProjectListProps) {
    if (projects.length === 0) {
        return (
            <EmptyState
                icon={FolderKanban}
                title="Nenhum projeto encontrado"
                description="Crie um novo projeto para começar a gerenciar tarefas."
                action={
                    <button
                        type="button"
                        onClick={onCreateNew}
                        className="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        Criar Primeiro Projeto
                    </button>
                }
            />
        )
    }

    return (
        <div className="space-y-4">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    )
}
