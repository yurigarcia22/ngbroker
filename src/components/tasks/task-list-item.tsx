import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from 'lucide-react'

interface TaskListItemProps {
    task: any
    isSelected: boolean
    onClick: () => void
}

export function TaskListItem({ task, isSelected, onClick }: TaskListItemProps) {
    const daysOverdue = task.due_date ? Math.floor((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 3600 * 24)) : 0
    const isActuallyOverdue = daysOverdue > 0

    // Status Colors
    const getStatusColor = (name: string) => {
        if (name === 'A Fazer') return 'bg-blue-100 text-blue-700'
        if (name === 'Em Progresso') return 'bg-yellow-100 text-yellow-800'
        if (name === 'Concluído') return 'bg-green-100 text-green-800'
        return 'bg-gray-100 text-gray-700'
    }

    return (
        <li
            onClick={onClick}
            className={`
                group relative bg-white p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-all last:border-0
                ${isSelected ? 'bg-indigo-50/40' : ''}
            `}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                    className="mt-1 flex-shrink-0 cursor-pointer text-gray-300 hover:text-indigo-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); /* Implement toggle status logic here later */ }}
                >
                    <div className="h-5 w-5 rounded-md border-2 border-gray-300 hover:border-indigo-600 transition-colors" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1 mr-2">
                            {/* Top Metadata: Priority & Date */}
                            <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 mb-0.5">
                                <div className={`h-1.5 w-1.5 rounded-full ${task.priority === 'Urgente' ? 'bg-red-500' : task.priority === 'Alta' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                                <span className={isActuallyOverdue ? 'text-red-500 font-semibold' : ''}>
                                    {task.due_date && format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                                </span>
                                {isActuallyOverdue && (
                                    <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[10px] border border-red-100 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {daysOverdue}d atrasado
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className={`text-sm font-semibold truncate leading-tight mb-1 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                                {task.title}
                            </h3>

                            {/* Breadcrumbs (Client / Project) */}
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-2">
                                <span className="font-medium text-gray-600">{task.project?.client?.name}</span>
                                <span>•</span>
                                <span>{task.project?.name}</span>
                            </div>

                            {/* Status & Tags Row */}
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${getStatusColor(task.status?.name)} border border-transparent`}>
                                    {task.status?.name || 'Sem Status'}
                                </span>
                                {task.tags?.map((tt: any) => (
                                    <span key={tt.tag.id} className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                        {tt.tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Right Side: Assignees ONLY */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                            <div className="flex -space-x-1.5">
                                {task.assignees?.map((a: any) => (
                                    <div
                                        key={a.user?.id}
                                        className="h-6 w-6 rounded-full bg-indigo-100 ring-1 ring-white flex items-center justify-center text-[9px] font-bold text-indigo-700"
                                        title={a.user?.name}
                                    >
                                        {a.user?.name?.charAt(0)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    )
}
