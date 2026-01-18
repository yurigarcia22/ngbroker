'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { KanbanColumn } from './kanban-column'
import { updateTask } from '@/lib/db/tasks'
import { useRouter } from 'next/navigation'

interface KanbanBoardProps {
    tasks: any[]
    statuses: any[]
    onTaskClick: (taskId: string) => void
}

export function KanbanBoard({ tasks, statuses, onTaskClick }: KanbanBoardProps) {
    const [boardData, setBoardData] = useState<Record<string, any[]>>({})
    const [isMounted, setIsMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setIsMounted(true)
        // Group tasks logic...
        const grouped: Record<string, any[]> = {}
        statuses.forEach(s => grouped[s.id] = [])

        tasks.forEach(task => {
            const statusId = task.status_id
            if (grouped[statusId]) {
                grouped[statusId].push(task)
            }
        })
        setBoardData(grouped)
    }, [tasks, statuses])

    if (!isMounted) {
        return <div className="p-6">Carregando quadro...</div>
    }

    const onDragEnd = async (result: DropResult) => {
        // ... (rest of onDragEnd) ...
        const { destination, source, draggableId } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        const startStatusId = source.droppableId
        const finishStatusId = destination.droppableId

        // Optimistic Update
        const startColumn = [...boardData[startStatusId]]
        const finishColumn = startStatusId === finishStatusId ? startColumn : [...boardData[finishStatusId]]

        const [movedTask] = startColumn.splice(source.index, 1)

        // Update task status object locally for display
        const newStatus = statuses.find(s => s.id === finishStatusId)
        movedTask.status = newStatus
        movedTask.status_id = finishStatusId

        if (startStatusId === finishStatusId) {
            startColumn.splice(destination.index, 0, movedTask)
            setBoardData({
                ...boardData,
                [startStatusId]: startColumn
            })
        } else {
            finishColumn.splice(destination.index, 0, movedTask)
            setBoardData({
                ...boardData,
                [startStatusId]: startColumn,
                [finishStatusId]: finishColumn
            })

            // DB Update
            try {
                await updateTask(draggableId, { status_id: finishStatusId })
                router.refresh()
            } catch (error) {
                console.error('Failed to update task status', error)
            }
        }
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full overflow-x-auto pb-4">
                {statuses.map(status => (
                    <KanbanColumn
                        key={status.id}
                        columnId={status.id}
                        title={status.name}
                        tasks={boardData[status.id] || []}
                        onTaskClick={onTaskClick}
                    />
                ))}
            </div>
        </DragDropContext>
    )
}
