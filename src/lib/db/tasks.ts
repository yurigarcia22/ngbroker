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
    activeFilter?: string; // 'today' | 'pending' | 'overdue' | 'completed' | 'next-week' | 'all'
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

    // Optimization 1: Removed redundant statuses fetch from project inner join
    // We build the select string dynamically to handle Assignee !inner filtering if needed
    // IMPORTANT: Keep nested queries to absolute minimum to reduce payload size over the network
    let selectString = `
            id, project_id, title, priority, due_date, status_id, updated_at, created_at,
            project:projects!inner (
                id, 
                name, 
                client:clients (name)
            ),
            status:project_statuses (id, name, sort_order, is_default),
            tags:task_tags (
                tag:tags (id, name, color)
            )
        `

    if (filters.assigneeId && filters.assigneeId.length > 0) {
        // Use !inner to force filtering if we want only tasks WITH these assignees
        selectString += `, assignees:task_assignees!inner(user_id, user:profiles(name))`
    } else {
        // Left join (show all assignees for display)
        selectString += `, assignees:task_assignees(user_id, user:profiles(name))`
    }

    let query = supabase.from('tasks').select(selectString)
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

    // 4. Assignee Filter
    if (filters.assigneeId && filters.assigneeId.length > 0) {
        query = query.in('assignees.user_id', filters.assigneeId)
    }

    // 5. Optimization: Backend Filters (replacing client-side Date/Status logic)
    const today = new Date().toISOString().split('T')[0]

    // Helper to query not done
    // We first fetch all status IDs that mean "done"
    const { data: doneStatuses } = await supabase
        .from('project_statuses')
        .select('id')
        .or('name.ilike.%Concluíd%,name.ilike.%Done%,name.ilike.%Finalizado%,name.ilike.%Cancelad%')

    const doneStatusIds = doneStatuses?.map((s) => s.id) || []

    const notDoneFilter = (q: any) => {
        if (doneStatusIds.length > 0) {
            return q.not('status_id', 'in', `(${doneStatusIds.join(',')})`)
        }
        return q
    }

    if (filters.activeFilter) {
        switch (filters.activeFilter) {
            case 'today':
                // Due date <= today AND not done (User request: overdue should appear in today)
                query = query.lte('due_date', today)
                query = notDoneFilter(query)
                break

            case 'overdue':
                // Due date < today AND not done
                query = query.lt('due_date', today)
                query = notDoneFilter(query)
                break

            case 'pending':
                // Not done
                query = notDoneFilter(query)
                break

            case 'completed':
                if (doneStatusIds.length > 0) {
                    query = query.in('status_id', doneStatusIds)
                } else {
                    // Fallback if no done statuses exist
                    query = query.eq('id', '00000000-0000-0000-0000-000000000000') // returns empty
                }
                break

            case 'next-week':
                const nextWeekStart = new Date()
                nextWeekStart.setDate(nextWeekStart.getDate() + 1) // Tomorrow
                const nextWeekEnd = new Date()
                nextWeekEnd.setDate(nextWeekEnd.getDate() + 8)

                query = query.gte('due_date', nextWeekStart.toISOString().split('T')[0])
                    .lte('due_date', nextWeekEnd.toISOString().split('T')[0])
                query = notDoneFilter(query)
                break

            case 'all':
            default:
                // Show everything (pending + completed) or just pending?
                // "Tarefas concluídas devem parar de aparecer nos filtros de todos... deve aparecer somente concluídas"
                // This implies 'all' (default view?) should Hide Completed?
                // If 'all' means "Everything", then we show everything.
                // If the user meant "General view" (All tabs?), then hide completed.
                // I will assume 'all' filter explicitly means "All Tasks", so show everything.
                // But if default 'activeFilter' is 'pending' in frontend?
                // Frontend default is 'today'.
                // If user clicks 'Todos', they usually want to see everything.
                // But the user said: "As tarefas concluídas devem parar de aparecer nos filtros de todos".
                // "Filtros de todos" might refer to the "All" TAB or "All" Filter.
                // I will interpret: "All" FILTER should NOT show completed tasks.
                // Wait, if "All" doesn't show completed, and "Pending" doesn't show completed... what's the difference?
                // Maybe "All" means "All Pending Tasks" regardless of priority/date?
                // And "Completed" shows "Completed Tasks".
                // So "All" = Pending.
                // Let's apply notDoneFilter for 'all' too.
                if (filters.activeFilter === 'all') {
                    query = notDoneFilter(query)
                }
                break
        }
    }

    // 6. Legacy Date Presets (compatibility)
    if (filters.datePreset === 'range' && filters.startDate && filters.endDate) {
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
      ),
      project:projects!inner (
        id, 
        name, 
        client:clients!inner (id, name),
        statuses:project_statuses(id, name, sort_order)
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

export async function getKanbanStatuses(projectId?: string) {
    const supabase = await createClient()

    // Optimization: fetch statuses
    if (projectId) {
        const { data } = await supabase
            .from('project_statuses')
            .select('id, name, sort_order, is_default')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true })
        return data || []
    }

    // Return global/all statuses for Kanban
    const { data } = await supabase
        .from('project_statuses')
        .select('id, name, sort_order, is_default, project_id')
        .order('sort_order')
    return data || []
}
