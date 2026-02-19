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
    onUpdate?: () => void
}

export function KanbanBoard({ tasks, statuses, onTaskClick, onUpdate }: KanbanBoardProps) {
    const [boardData, setBoardData] = useState<Record<string, any[]>>({})
    const [isMounted, setIsMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setIsMounted(true)
        // Group tasks by status NAME
        const grouped: Record<string, any[]> = {}

        // Initialize columns using status names
        statuses.forEach(s => {
            if (s.name) grouped[s.name] = []
        })

        tasks.forEach(task => {
            const statusName = task.status?.name
            if (statusName) {
                if (!grouped[statusName]) grouped[statusName] = []
                grouped[statusName].push(task)
            }
        })
        setBoardData(grouped)
    }, [tasks, statuses])

    if (!isMounted) {
        return <div className="p-6">Carregando quadro...</div>
    }

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        const startStatusName = source.droppableId
        const finishStatusName = destination.droppableId

        // Optimistic Update
        const startColumn = [...(boardData[startStatusName] || [])]
        const finishColumn = startStatusName === finishStatusName ? startColumn : [...(boardData[finishStatusName] || [])]

        const [movedTask] = startColumn.splice(source.index, 1)

        // Find the correct status ID for the task's project
        let newStatusId = movedTask.status_id
        // Try to find a status with the target name AND the same project_id as the task
        // We look in the `statuses` prop which contains all statuses
        const matchingStatus = statuses.find(s => s.name === finishStatusName && s.project_id === movedTask.project_id)

        if (matchingStatus) {
            newStatusId = matchingStatus.id
            // Update local task status object for display
            movedTask.status = matchingStatus
        } else {
            // Fallback: This shouldn't happen if data is consistent, but if it does, 
            // we should probably warn or maybe the task is in a project that is not fully loaded?
            // Or maybe specific project status doesn't exist?
            // For now, valid move visually, but might fail DB update if we don't have ID.
            // If we don't find it, we keep original ID? No, that would revert the status.
            // We just let it be name update visually?
            // Update visual name so it sticks in column
            movedTask.status = { ...movedTask.status, name: finishStatusName }
            console.warn(`Could not resolve status ID for project ${movedTask.project_id} and status ${finishStatusName}`)
        }

        movedTask.status_id = newStatusId // Update ID

        if (startStatusName === finishStatusName) {
            startColumn.splice(destination.index, 0, movedTask)
            setBoardData({
                ...boardData,
                [startStatusName]: startColumn
            })
        } else {
            finishColumn.splice(destination.index, 0, movedTask)
            setBoardData({
                ...boardData,
                [startStatusName]: startColumn,
                [finishStatusName]: finishColumn
            })

            // DB Update
            try {
                if (newStatusId && newStatusId !== draggableId) { // Check if we have a valid ID to update
                    await updateTask(draggableId, { status_id: newStatusId })
                    router.refresh()
                    if (onUpdate) onUpdate()
                }
            } catch (error) {
                console.error('Failed to update task status', error)
            }
        }
    }

    // Deduplicate statuses by name for rendering columns
    // We use the first one encountered for ID (key) but use Name for title
    const uniqueColumns = statuses.reduce((acc: any[], current) => {
        if (!acc.find(item => item.name === current.name)) {
            acc.push(current)
        }
        return acc
    }, [])

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full overflow-x-auto pb-4 custom-scrollbar">
                {uniqueColumns.map((status: any) => (
                    <KanbanColumn
                        key={status.name} // Use Name as key/id for droppable
                        columnId={status.name}
                        title={status.name}
                        tasks={boardData[status.name] || []}
                        onTaskClick={onTaskClick}
                    />
                ))}
            </div>
        </DragDropContext>
    )
}
