import { formatDistanceToNow, format, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from 'lucide-react'

interface TaskListItemProps {
    task: any
    isSelected: boolean
    onClick: () => void
}

export function TaskListItem({ task, isSelected, onClick }: TaskListItemProps) {
    const daysOverdue = task.due_date ? differenceInCalendarDays(new Date(), new Date(task.due_date + 'T12:00:00')) : 0
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
                            {/* Date Header: Big Due Date + Creation Date */}
                            <div className="flex items-baseline justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    {task.due_date ? (
                                        <div className={`flex flex-col leading-none ${isActuallyOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                                            <span className="text-[10px] font-medium uppercase text-gray-500 mb-0.5">Prazo</span>
                                            <span className="text-xl font-bold tracking-tight">
                                                {format(new Date(task.due_date + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })}
                                            </span>
                                            {isActuallyOverdue && (
                                                <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {daysOverdue}d atrasado
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 font-medium">Sem prazo</span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 block mb-0.5">Criado em</span>
                                    <span className="text-xs font-medium text-gray-600">
                                        {format(new Date(task.created_at), "dd/MM/yy", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>

                            {/* Priority Badge */}
                            <div className="mb-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium
                                    ${task.priority === 'Urgente' ? 'bg-red-100 text-red-700' :
                                        task.priority === 'Alta' ? 'bg-orange-100 text-orange-700' :
                                            task.priority === 'Média' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-600'}`}>
                                    {task.priority || 'Normal'}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className={`text-base font-bold truncate leading-tight mb-1 ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
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
