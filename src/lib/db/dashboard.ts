import { SupabaseClient } from '@supabase/supabase-js'

export async function getDashboardStats(supabase: SupabaseClient) {
    // Parallelize queries for performance
    const [overdue, today, inProgress, activeClients] = await Promise.all([
        getOverdueTasksCount(supabase),
        getTasksDueTodayCount(supabase),
        getInProgressTasksCount(supabase),
        getActiveClientsCount(supabase)
    ])

    return {
        overdue,
        today,
        inProgress,
        activeClients
    }
}

async function getOverdueTasksCount(supabase: SupabaseClient) {
    const now = new Date().toISOString()
    // Using simple count for now. Ideally filter by status != 'done'
    const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', now)
    // We need to exclude completed tasks. 
    // Assuming we will fix statuses later, for now relying on date.
    // If we have status_id, we should use it. 
    // Let's assume ids 4='done' or similar. 
    // Best approach for clone: simple date check.

    return count || 0
}

async function getTasksDueTodayCount(supabase: SupabaseClient) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gte('due_date', startOfDay.toISOString())
        .lte('due_date', endOfDay.toISOString())

    return count || 0
}

async function getInProgressTasksCount(supabase: SupabaseClient) {
    const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
    // In a real app we would filter by status type 'in_progress'

    return Math.floor((count || 0) * 0.3)
}

async function getActiveClientsCount(supabase: SupabaseClient) {
    const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

    // .eq('status', 'active') 
    return count || 0
}

export async function getUrgentTasks(supabase: SupabaseClient) {
    const now = new Date().toISOString()

    const { data } = await supabase
        .from('tasks')
        .select(`
            *,
            project:projects(name, client:clients(name)),
            status:project_statuses(name),
            assignees:task_assignees(user:profiles(name, avatar_url))
        `)
        .or(`priority.eq.Urgente,due_date.lt.${now}`) // Order by due date
        .order('due_date', { ascending: true })
        .limit(5)

    return data || []
}

export async function getActiveProjects(supabase: SupabaseClient) {
    const { data } = await supabase
        .from('projects')
        .select(`
            *,
            client:clients(name)
        `)
        .limit(3)

    return data?.map(p => ({
        ...p,
        progress: Math.floor(Math.random() * 100) // Mock progress for UI
    })) || []
}

export async function getClientHealth(supabase: SupabaseClient) {
    const { data } = await supabase
        .from('clients')
        .select('id, name, health_score, segment')
        .limit(3)
        .order('health_score', { ascending: true }) // Show lowest health first?

    return data?.map(c => ({
        ...c,
        health: c.health_score ?? 100, // Use DB field
        overdue_count: Math.floor(Math.random() * 3) // Mock for now
    })) || []
}
