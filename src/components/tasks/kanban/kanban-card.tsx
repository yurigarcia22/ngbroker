'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Calendar, MoreHorizontal, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface KanbanCardProps {
    task: any
    index: number
    onClick: (taskId: string) => void
}

const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
}

export function KanbanCard({ task, index, onClick }: KanbanCardProps) {
    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(task.id)}
                    className={`bg-white p-3 rounded-lg border shadow-sm mb-2 group hover:border-indigo-300 transition-colors ${snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-indigo-500 ring-opacity-50 z-50' : 'border-gray-200'
                        }`}
                    style={provided.draggableProps.style}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-gray-500">#{task.id.substring(0, 4)}</span>
                        {task.priority && (
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${priorityColors[task.priority] || 'bg-gray-100'}`}>
                                {task.priority}
                            </span>
                        )}
                    </div>

                    <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
                        {task.title}
                    </h4>

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex -space-x-1.5 overflow-hidden">
                            {task.assignees?.map((a: any, i: number) => (
                                <div
                                    key={a.user?.id || i}
                                    className="inline-block h-5 w-5 rounded-full ring-1 ring-white bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700"
                                    title={a.user?.name}
                                >
                                    {a.user?.name?.charAt(0)}
                                </div>
                            ))}
                            {(!task.assignees || task.assignees.length === 0) && (
                                <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <User className="h-3 w-3" />
                                </div>
                            )}
                        </div>

                        {task.due_date && (
                            <div className={`flex items-center text-xs ${new Date(task.due_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-500'
                                }`}>
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(task.due_date), 'd MMM', { locale: ptBR })}
                            </div>
                        )}
                    </div>

                    {task.project && (
                        <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{task.project.client?.name}</span>
                            <span className="text-[10px] text-gray-500 font-medium truncate max-w-[100px]">{task.project.name}</span>
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    )
}
