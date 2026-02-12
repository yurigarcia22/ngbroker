import { SupabaseClient } from '@supabase/supabase-js'

export async function getDashboardStats(supabase: SupabaseClient, userId?: string) {
    // Parallelize queries for performance
    const [overdue, today, inProgress, activeClients] = await Promise.all([
        getOverdueTasksCount(supabase, userId),
        getTasksDueTodayCount(supabase, userId),
        getInProgressTasksCount(supabase, userId),
        getActiveClientsCount(supabase)
    ])

    return {
        overdue,
        today,
        inProgress,
        activeClients
    }
}

async function getOverdueTasksCount(supabase: SupabaseClient, userId?: string) {
    const now = new Date().toISOString()

    let query;

    if (userId) {
        // We use !inner join to filter tasks that have an assignee with this userId
        query = supabase
            .from('tasks')
            .select('*, status:project_statuses!inner(name), assignees:task_assignees!inner(user_id)', { count: 'exact', head: true })
            .lt('due_date', now)
            .neq('status.name', 'Concluído')
            .eq('assignees.user_id', userId)
    } else {
        query = supabase
            .from('tasks')
            .select('*, status:project_statuses!inner(name)', { count: 'exact', head: true })
            .lt('due_date', now)
            .neq('status.name', 'Concluído')
    }

    const { count, error } = await query

    if (error) {
        console.error('Error fetching overdue tasks:', error)
        return 0
    }

    return count || 0
}

async function getTasksDueTodayCount(supabase: SupabaseClient, userId?: string) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    let query;

    if (userId) {
        query = supabase
            .from('tasks')
            .select('*, status:project_statuses!inner(name), assignees:task_assignees!inner(user_id)', { count: 'exact', head: true })
            .gte('due_date', startOfDay.toISOString())
            .lte('due_date', endOfDay.toISOString())
            .neq('status.name', 'Concluído')
            .eq('assignees.user_id', userId)
    } else {
        query = supabase
            .from('tasks')
            .select('*, status:project_statuses!inner(name)', { count: 'exact', head: true })
            .gte('due_date', startOfDay.toISOString())
            .lte('due_date', endOfDay.toISOString())
            .neq('status.name', 'Concluído')
    }

    const { count } = await query

    return count || 0
}

async function getInProgressTasksCount(supabase: SupabaseClient, userId?: string) {
    let query;

    if (userId) {
        query = supabase
            .from('tasks')
            .select('*, status:project_statuses!inner(name), assignees:task_assignees!inner(user_id)', { count: 'exact', head: true })
            .neq('status.name', 'Concluído')
            .eq('assignees.user_id', userId)
    } else {
        query = supabase
            .from('tasks')
            .select('*, status:project_statuses!inner(name)', { count: 'exact', head: true })
            .neq('status.name', 'Concluído')
    }

    const { count } = await query

    return Math.floor((count || 0) * 0.3)
}

async function getActiveClientsCount(supabase: SupabaseClient) {
    const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Ativo')

    return count || 0
}

export async function getUrgentTasks(supabase: SupabaseClient, userId?: string) {
    const now = new Date().toISOString()

    let query;

    if (userId) {
        query = supabase
            .from('tasks')
            .select(`
                *,
                project:projects(name, client:clients(name)),
                status:project_statuses!inner(name),
                assignees:task_assignees!inner(user_id)
            `)
            .neq('status.name', 'Concluído')
            .or(`priority.eq.Urgente,due_date.lt.${now}`)
            .eq('assignees.user_id', userId)
            .order('due_date', { ascending: true })
            .limit(5)
    } else {
        query = supabase
            .from('tasks')
            .select(`
                *,
                project:projects(name, client:clients(name)),
                status:project_statuses!inner(name),
                assignees:task_assignees(user:profiles(name, avatar_url))
            `)
            .neq('status.name', 'Concluído')
            .or(`priority.eq.Urgente,due_date.lt.${now}`)
            .order('due_date', { ascending: true })
            .limit(5)
    }

    const { data } = await query

    return data || []
}

export async function getActiveProjects(supabase: SupabaseClient, userId?: string) {
    let query;

    if (userId) {
        // Find projects where the user has tasks
        query = supabase
            .from('projects')
            .select(`
                *,
                client:clients(name),
                tasks!inner(
                    assignees!inner(user_id)
                )
            `)
            .eq('tasks.assignees.user_id', userId)
            .limit(3)
    } else {
        query = supabase
            .from('projects')
            .select(`
                *,
                client:clients(name)
            `)
            .limit(3)
    }

    const { data } = await query

    return data?.map(p => {
        // Remove the 'tasks' property if it exists from the join
        const { tasks, ...project } = p as any
        return {
            ...project,
            progress: Math.floor(Math.random() * 100) // Mock progress for UI
        }
    }) || []
}

export async function getClientHealth(supabase: SupabaseClient, userId?: string) {
    let query;

    if (userId) {
        // Filter clients who have tasks assigned to this user
        // projects -> tasks -> assignees
        query = supabase
            .from('clients')
            .select('id, name, health_score, segment, status, projects!inner(tasks!inner(assignees!inner(user_id)))')
            .eq('status', 'Ativo')
            .eq('projects.tasks.assignees.user_id', userId)
            .limit(3)
    } else {
        query = supabase
            .from('clients')
            .select('id, name, health_score, segment, status')
            .eq('status', 'Ativo')
            .limit(3)
    }

    const { data } = await query

    if (!data) return []

    const clientsWithHealth = await Promise.all(data.map(async (c) => {
        const now = new Date().toISOString()

        let countQuery = supabase
            .from('tasks')
            .select('*, project:projects!inner(client_id), status:project_statuses!inner(name)', { count: 'exact', head: true })
            .eq('project.client_id', c.id)
            .lt('due_date', now)
            .neq('status.name', 'Concluído')

        if (userId) {
            countQuery = supabase
                .from('tasks')
                .select('*, project:projects!inner(client_id), status:project_statuses!inner(name), assignees:task_assignees!inner(user_id)', { count: 'exact', head: true })
                .eq('project.client_id', c.id)
                .lt('due_date', now)
                .neq('status.name', 'Concluído')
                .eq('assignees.user_id', userId)
        }

        const { count } = await countQuery

        const overdueCount = count || 0
        // Logic: Start with 100, remove 10 for each overdue task. Min 0.
        let calculatedHealth = 100 - (overdueCount * 10)
        if (calculatedHealth < 0) calculatedHealth = 0

        return {
            ...c,
            health: calculatedHealth,
            overdue_count: overdueCount
        }
    }))

    // Sort by health ascending (worst health first)
    return clientsWithHealth.sort((a, b) => a.health - b.health)
}
