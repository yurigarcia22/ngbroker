import { Suspense } from 'react'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getAllTasks, getKanbanStatuses } from '@/lib/db/tasks'
import { TasksContent } from '@/components/tasks/tasks-content'

export default async function TasksPage() {
    let initialTasks: any[] = []
    let initialStatuses: any[] = []

    try {
        // Run initial data fetch in parallel on the server during the SSR pass
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        const fetchTasksReq = user ? getAllTasks({
            assigneeId: [user.id],
            activeFilter: 'today',
            page: 1,
            limit: 30
        }) : Promise.resolve([])

        const fetchStatusesReq = getKanbanStatuses()

        const [tasksResult, statusesResult] = await Promise.all([fetchTasksReq, fetchStatusesReq])
        initialTasks = tasksResult || []
        initialStatuses = statusesResult || []
    } catch (e) {
        console.error("Failed to fetch initial data for Tasks via SSR", e)
    }

    return (
        <Suspense fallback={<div className="p-6">Carregando tarefas...</div>}>
            <TasksContent initialTasks={initialTasks} initialStatuses={initialStatuses} />
        </Suspense>
    )
}
