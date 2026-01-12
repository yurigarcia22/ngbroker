import { createClient } from '@/lib/supabase/server'

export async function getTasks(projectId: string, filters?: { status?: string; assignee?: string; priority?: string; search?: string }) {
    const supabase = await createClient()

    let query = supabase
        .from('tasks')
        .select(`
      *,
      project_statuses (id, name, sort_order),
      task_assignees (
        user:profiles (id, name)
      ),
      time_entries (minutes)
    `)
        .eq('project_id', projectId)

    if (filters?.status) {
        query = query.eq('status_id', filters.status)
    }

    // Note: Filtering by assignee in linked table is tricky in simple Supabase query. 
    // For MVP we might filter in client or do a separate query if needed, 
    // but let's try !inner join trick if Supabase supports it, or just basic filtering.
    // For now let's skip complex relation filtering server-side strictly if difficult, 
    // but we can try basic filters.

    if (filters?.priority) {
        query = query.eq('priority', filters.priority)
    }

    if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching tasks:', error)
        return []
    }

    // Calculate total minutes
    const tasks = data.map((task: any) => ({
        ...task,
        total_minutes: task.time_entries?.reduce((acc: number, curr: any) => acc + curr.minutes, 0) || 0
    }))

    return tasks
}

export async function getTask(taskId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tasks')
        .select(`
      *,
      status:project_statuses (*),
      assignees:task_assignees (
        user:profiles (id, name)
      ),
      checklist:task_checklist_items (*),
      comments:task_comments (
        *,
        user:profiles (id, name)
      ),
      attachments:task_attachments (
        *,
        user:profiles (id, name)
      ),
      time_entries (
        *,
        user:profiles (id, name)
      )
    `)
        .eq('id', taskId)
        // Order relations
        // .order('created_at', { foreignTable: 'task_comments', ascending: true }) // Supabase JS doesn't support easy nested ordering yet in one query usually
        .single()

    if (error) {
        return null
    }

    // Sort manually
    if (data.checklist) data.checklist.sort((a: any, b: any) => a.sort_order - b.sort_order)
    if (data.comments) data.comments.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return data
}

export async function createTask(data: any) {
    const supabase = await createClient()

    // 1. Create task
    const { data: task, error } = await supabase
        .from('tasks')
        .insert({
            project_id: data.projectId,
            title: data.title,
            description: data.description,
            priority: data.priority,
            due_date: data.dueDate,
            status_id: data.statusId,
            parent_task_id: data.parentTaskId, // For subtasks
        })
        .select()
        .single()

    if (error) return { error: error.message }

    // 2. Assignees
    if (data.assignees && data.assignees.length > 0) {
        const assignees = data.assignees.map((userId: string) => ({
            task_id: task.id,
            user_id: userId
        }))
        await supabase.from('task_assignees').insert(assignees)
    }

    return { data: task }
}

export async function updateTask(taskId: string, changes: any) {
    const supabase = await createClient()
    const { error } = await supabase.from('tasks').update(changes).eq('id', taskId)
    return { error }
}

// Checklist Actions
export async function addChecklistItem(taskId: string, title: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('task_checklist_items').insert({ task_id: taskId, title })
    return { error }
}

export async function toggleChecklistItem(itemId: string, isDone: boolean) {
    const supabase = await createClient()
    const { error } = await supabase.from('task_checklist_items').update({ is_done: isDone }).eq('id', itemId)
    return { error }
}

// Comments
export async function addComment(taskId: string, body: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('task_comments').insert({
        task_id: taskId,
        body,
        user_id: user.id
    })
    return { error }
}

// Time Entries
export async function addTimeEntry(taskId: string, minutes: number, notes?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('time_entries').insert({
        task_id: taskId,
        minutes,
        notes,
        user_id: user.id
    })
    return { error }
}
