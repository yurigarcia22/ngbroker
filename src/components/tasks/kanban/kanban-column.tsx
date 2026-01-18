'use client'

import { Droppable } from '@hello-pangea/dnd'
import { KanbanCard } from './kanban-card'

interface KanbanColumnProps {
    columnId: string
    title: string
    tasks: any[]
    onTaskClick: (taskId: string) => void
}

export function KanbanColumn({ columnId, title, tasks, onTaskClick }: KanbanColumnProps) {
    return (
        <div className="flex flex-col w-80 bg-gray-50/50 rounded-lg mr-4 border border-gray-200/60 max-h-full flex-shrink-0">
            {/* Header */}
            <div className="p-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-gray-200 text-xs text-gray-600 font-medium">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-2 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                            }`}
                    >
                        {tasks.map((task, index) => (
                            <KanbanCard
                                key={task.id}
                                task={task}
                                index={index}
                                onClick={onTaskClick}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    )
}
