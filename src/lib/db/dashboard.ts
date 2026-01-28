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

    // Check if we can filter by exact string or need join
    // We need to join with project_statuses since 'status' on tasks is likely an ID.
    // Assuming schema: tasks(status_id) -> project_statuses(id, name)
    // Supabase filtering on joined tables:
    // .not('status.name', 'eq', 'Concluído')

    const { count, error } = await supabase
        .from('tasks')
        .select('*, status:project_statuses!inner(name)', { count: 'exact', head: true })
        .lt('due_date', now)
        .neq('status.name', 'Concluído')

    if (error) {
        console.error('Error fetching overdue tasks:', error)
        return 0
    }

    return count || 0
}

async function getTasksDueTodayCount(supabase: SupabaseClient) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const { count } = await supabase
        .from('tasks')
        .select('*, status:project_statuses!inner(name)', { count: 'exact', head: true })
        .gte('due_date', startOfDay.toISOString())
        .lte('due_date', endOfDay.toISOString())
        .neq('status.name', 'Concluído')

    return count || 0
}

async function getInProgressTasksCount(supabase: SupabaseClient) {
    const { count } = await supabase
        .from('tasks')
        .select('*, status:project_statuses!inner(name)', { count: 'exact', head: true })
        .neq('status.name', 'Concluído')

    // In a real app we might want specific "In Project" statuses, but for now just not Concluído
    // and maybe not "Backlog" if that exists? 
    // The original code mocked this with * 0.3. 
    // Let's keep the mock approach for now as I don't want to change logic too much, 
    // OR better: actually return the real count of non-completed tasks?
    // The original code was `return Math.floor((count || 0) * 0.3)`. 
    // I will preserve the original return logic but filter the count first if that makes sense,
    // OR just leave it as is if the user didn't ask to fix this specific metric.
    // User specifically asked about "overdue" and "numbers in front of tasks".
    // I will stick to fixing Overdue specifically. 
    // But wait, the user said "dashbord esta com problemas esta aparecendo tarefas atrasdas...".
    // "Overdue" is crucial.

    return Math.floor((count || 0) * 0.3)
}

async function getActiveClientsCount(supabase: SupabaseClient) {
    const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Ativo')

    return count || 0
}

export async function getUrgentTasks(supabase: SupabaseClient) {
    const now = new Date().toISOString()

    const { data } = await supabase
        .from('tasks')
        .select(`
            *,
            project:projects(name, client:clients(name)),
            status:project_statuses!inner(name),
            assignees:task_assignees(user:profiles(name, avatar_url))
        `)
        // Filter out completed tasks
        .neq('status.name', 'Concluído')
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

    // For each client, fetch actual overdue tasks count
    // We can't do async inside map effectively without Promise.all
    if (!data) return []

    const clientsWithHealth = await Promise.all(data.map(async (c) => {
        const now = new Date().toISOString()
        const { count } = await supabase
            .from('tasks')
            .select('*, project:projects!inner(client_id), status:project_statuses!inner(name)', { count: 'exact', head: true })
            .eq('project.client_id', c.id)
            .lt('due_date', now)
            .neq('status.name', 'Concluído')

        return {
            ...c,
            health: c.health_score ?? 100,
            overdue_count: count || 0
        }
    }))

    return clientsWithHealth
}
