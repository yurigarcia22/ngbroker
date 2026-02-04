'use server'

import { createClient } from '@/lib/supabase/server'

// Unified function for Tasks Dashboard
export async function getAllTasks(filters: {
    projectId?: string;
    clientId?: string;
    assigneeId?: string[];
    status?: string[];
    priority?: string[];
    search?: string;
    datePreset?: string; // 'today', 'overdue', 'next7', 'month', 'range'
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}) {
    const supabase = await createClient()

    const page = filters.page || 1
    const limit = filters.limit || 50
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query: any = supabase
        .from('tasks')
        .select(`
            id, project_id, title, priority, due_date, status_id, updated_at, created_at,
            project:projects!inner (
                id, 
                name, 
                client:clients!inner (id, name),
                statuses:project_statuses(id, name, sort_order)
            ),
            status:project_statuses (id, name, sort_order, is_default),
            assignees:task_assignees (
                user:profiles (id, name)
            ),
            tags:task_tags (
                tag:tags (id, name, color)
            )
        `)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to)

    // 1. Project & Client Filters
    if (filters.projectId) {
        query = query.eq('project_id', filters.projectId)
    }
    if (filters.clientId) {
        query = query.eq('projects.client_id', filters.clientId)
    }

    // 2. Status & Priority (Multi-select support)
    if (filters.status && filters.status.length > 0) {
        query = query.in('status_id', filters.status)
    }
    if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority)
    }

    // 3. Search
    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // 4. Assignee (Requires specific handling for many-to-many filtering if using !inner on assignees, 
    //    but standard PostgREST filtering on embedded resource is: task_assignees!inner(user_id.in.(...)))
    if (filters.assigneeId && filters.assigneeId.length > 0) {
        // We use !inner on task_assignees to filter TASKS that have these assignees
        // alias 'assignees' defined in select must match or use table name. 
        // Supabase select syntax: task_assignees!inner(...)
        // But we aliased it as 'assignees' in select. Let's try referencing the table directly for filtering if alias fails,
        // or just use the relation. common practice: modify select to include !inner if filtering.

        // Actually, to filter by "My Tasks" (current user), we need to ensure we only get tasks where I am assigned.
        // The select above uses `assignees:task_assignees`. referencing `task_assignees!inner` in simple filter might work.
        // Let's try simpler exact match if single, or create a specific filter query.

        // For now, let's filter using the !inner hint in a separate modifier if possible, 
        // OR rely on client-side or specific filter function. 
        // BETTER: PostgREST allows filtering on related tables.
        // `task_assignees.user_id` -> filter.

        // Constructing the filter for relationship:
        query = query.not('task_assignees', 'is', null) // Ensure it has assignees?
        // Actually, straightforward way in supabase js:
        // .eq('task_assignees.user_id', id) <- this often implies !inner.

        // Since we allow multi-select, we need to check if ANY of the assignees match.
        // This is complex in single query without distinct.
        // "Show tasks where user X OR Y is assigned".

        // We will assume "My Tasks" is single ID mostly.
        // For array, we might need:
        // .filter('task_assignees.user_id', 'in', `(${filters.assigneeId.join(',')})`)
        // NOTE: This requires the join to be !inner.
        // We changed select to just `task_assignees`. If we want to filter, we should probably change query construction
        // or accept that we might fetch and filter (bad for pagination).

        // Let's try the .filter notation which applies to the embedding resource if possible.
        // But for specific "My Tasks" tab, it's critical.
        // Let's use `context` injection or let Supabase resolve `!inner` automatically if we filter on it? 
        // No, requires explicit !inner in select usually.

        // Let's try to add !inner to the select string dynamically or just hardcode it?
        // If we hardcode !inner on assignees, tasks WITHOUT assignees will vanish! That breaks "All Tasks".
        // SO: We only use !inner if filter is present? 
        // Supabase query builder is chainable but changing SELECT after creation is hard.

        // Strategy: Build SELECT string based on filters.
    }

    // RE-STRATEGY for Assignee Filter:
    // We will build the select clause dynamically.
    let selectString = `
        id, project_id, title, priority, due_date, status_id, updated_at, created_at,
        project:projects!inner (
            id, 
            name, 
            client:clients!inner (id, name),
            statuses:project_statuses(id, name, sort_order)
        ),
        status:project_statuses (id, name, sort_order, is_default),
        tags:task_tags (
            tag:tags (id, name, color)
        )
    `

    if (filters.assigneeId && filters.assigneeId.length > 0) {
        // Use !inner to force filtering
        selectString += `, assignees:task_assignees!inner(user:profiles(id, name))`
    } else {
        // Left join (show all)
        selectString += `, assignees:task_assignees(user:profiles(id, name))`
    }

    // Reset query with new select
    query = supabase.from('tasks').select(selectString)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to)

    // ... Re-apply filters ...
    if (filters.projectId) query = query.eq('project_id', filters.projectId)
    if (filters.clientId) query = query.eq('projects.client_id', filters.clientId)
    if (filters.status && filters.status.length > 0) query = query.in('status_id', filters.status)
    if (filters.priority && filters.priority.length > 0) query = query.in('priority', filters.priority)
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)

    // Apply Assignee Filter
    if (filters.assigneeId && filters.assigneeId.length > 0) {
        query = query.in('assignees.user_id', filters.assigneeId)
    }

    // 5. Dates
    const today = new Date().toISOString().split('T')[0]

    if (filters.datePreset === 'overdue') {
        query = query.lt('due_date', today).not('status.is_default', 'is', true) // assuming default status checking logic or "done" status logic needed
        // Actually "is_done" checks are usually status-based.
        // We'll rely on frontend or specific status exclusion for overdue if needed.
        // For now: just date.
    } else if (filters.datePreset === 'today') {
        query = query.eq('due_date', today)
    } else if (filters.datePreset === 'next7') {
        const next7 = new Date()
        next7.setDate(next7.getDate() + 7)
        query = query.gte('due_date', today).lte('due_date', next7.toISOString().split('T')[0])
    } else if (filters.datePreset === 'range' && filters.startDate && filters.endDate) {
        query = query.gte('due_date', filters.startDate).lte('due_date', filters.endDate)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching tasks:', error)
        return []
    }

    return data
}

export async function getTasks(projectId: string, filters?: { status?: string; assignee?: string; priority?: string; search?: string }) {
    return getAllTasks({
        projectId,
        status: filters?.status ? [filters.status] : undefined,
        priority: filters?.priority ? [filters.priority] : undefined,
        search: filters?.search
    })
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
      tags:task_tags (
        tag:tags (id, name, color)
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
            parent_task_id: data.parentTaskId,
            is_recurring: data.isRecurring,
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

    // 3. Tags
    if (data.tags && data.tags.length > 0) {
        const tags = data.tags.map((tagId: string) => ({
            task_id: task.id,
            tag_id: tagId
        }))
        await supabase.from('task_tags').insert(tags)
    }

    return { data: task }
}

export async function updateTask(taskId: string, changes: any) {
    const supabase = await createClient()
    const { error } = await supabase.from('tasks').update(changes).eq('id', taskId)
    return { error }
}

// Checklist Actions
// Checklist Actions
export async function addChecklistItem(taskId: string, title: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('task_checklist_items')
        .insert({ task_id: taskId, content: title })
        .select()
        .single()
    return { data, error }
}

export async function updateChecklistItem(itemId: string, changes: any) {
    const supabase = await createClient()
    const { error } = await supabase.from('task_checklist_items').update(changes).eq('id', itemId)
    return { error }
}

export async function deleteChecklistItem(itemId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('task_checklist_items').delete().eq('id', itemId)
    return { error }
}

// Comments with Mentions & Notifications
export async function createComment(taskId: string, body: string, attachments?: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Create Comment
    const { data: comment, error } = await supabase
        .from('task_comments')
        .insert({
            task_id: taskId,
            body,
            user_id: user.id
        })
        .select()
        .single()

    if (error) return { error: error.message }

    // 2. Handle Attachments (associating existing uploads or new logic if handling raw files here)
    // Assuming 'attachments' is array of file_paths or IDs uploaded via storage client-side?
    // The prompt says "uploadAttachment" or insert row. 
    // If we receive file paths, we insert rows.
    if (attachments && attachments.length > 0) {
        // Implementation depends on how frontend handles upload. 
        // We'll assume frontend uploads to storage and sends us paths/names.
        // For MVP, simplistic handling:
        // const attachmentRows = attachments.map(path => ({
        //     task_id: taskId,
        //     comment_id: comment.id,
        //     file_path: path,
        //     file_name: path.split('/').pop(),
        //     uploaded_by: user.id
        // }))
        // await supabase.from('task_attachments').insert(attachmentRows)
    }

    // 3. Parse Mentions @[Name](userId)
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const mentionedUserIds = new Set<string>()
    let match
    while ((match = mentionRegex.exec(body)) !== null) {
        mentionedUserIds.add(match[2])
    }

    // 4. Create Mentions & Notifications
    if (mentionedUserIds.size > 0) {
        const mentions = Array.from(mentionedUserIds).map(mentionedId => ({
            comment_id: comment.id,
            mentioned_user_id: mentionedId
        }))
        await supabase.from('comment_mentions').insert(mentions)

        // Notifications
        const notifications = Array.from(mentionedUserIds).filter(id => id !== user.id).map(mentionedId => ({
            user_id: mentionedId,
            type: 'task_mention',
            entity_type: 'comment',
            entity_id: comment.id,
            title: 'Você foi mencionado em um comentário',
            body: body.length > 100 ? body.substring(0, 100) + '...' : body
        }))
        if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications)
        }
    }

    return { data: comment }
}

export async function getTaskComments(taskId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('task_comments')
        .select(`
            *,
            user:profiles (id, name),
            attachments:task_attachments (*)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

    return data || []
}

// Notifications
export async function getUnreadNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })

    return data || []
}

export async function markNotificationRead(id: string) {
    const supabase = await createClient()
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
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

// User & Profiling Helpers
export async function getUsers() {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('id, name, avatar_url, email').order('name')
    return data || []
}

export async function updateTaskAssignees(taskId: string, assigneeIds: string[]) {
    const supabase = await createClient()

    // 1. Delete existing
    await supabase.from('task_assignees').delete().eq('task_id', taskId)

    // 2. Insert new
    if (assigneeIds.length > 0) {
        const toInsert = assigneeIds.map(uid => ({
            task_id: taskId,
            user_id: uid
        }))
        const { error } = await supabase.from('task_assignees').insert(toInsert)
        return { error }
    }

    return { error: null }
}
