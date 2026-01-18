'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProjects(clientId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select(`
      *,
      project_statuses (
        id,
        name,
        sort_order,
        is_default
      )
    `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    return data
}

export async function getProject(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select(`
      *,
      client:clients(id, name),
      project_statuses (
        id,
        name,
        sort_order,
        is_default
      )
    `)
        .eq('id', projectId)
        .single()

    if (error) {
        console.error('Error fetching project:', error)
        return null
    }

    // Sort statuses by sort_order
    if (data && data.project_statuses) {
        data.project_statuses.sort((a: any, b: any) => a.sort_order - b.sort_order)
    }

    return data
}

export async function createProject(data: { clientId: string; name: string; scopeType: string; scopeCustom?: string }) {
    const supabase = await createClient()

    const { data: project, error } = await supabase
        .from('projects')
        .insert({
            client_id: data.clientId,
            name: data.name,
            scope_type: data.scopeType,
            scope_custom: data.scopeCustom,
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    return { data: project }
}

export async function getProjectStatuses(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_statuses')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })

    if (error) {
        return []
    }

    return data
}

export async function createProjectStatus(data: { projectId: string; name: string; sortOrder: number }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('project_statuses')
        .insert({
            project_id: data.projectId,
            name: data.name,
            sort_order: data.sortOrder,
        })

    return { error }
}

export async function deleteProjectStatus(id: string) {
    const supabase = await createClient()

    // Verify if used
    const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', id)

    if (count && count > 0) {
        return { error: 'Este status possui tarefas associadas e não pode ser excluído.' }
    }

    const { error } = await supabase
        .from('project_statuses')
        .delete()
        .eq('id', id)

    return { error }
}

export async function getAllProjects() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select(`
      *,
      client:clients(id, name),
      project_statuses (
        id,
        name,
        sort_order,
        is_default
      ),
      tasks (
        id,
        due_date,
        status_id,
        status:project_statuses(name),
        assignees:task_assignees(
            user:profiles(id, name, avatar_url)
        )
      )
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all projects:', error)
        return []
    }

    return data
}

export async function getProjectTimesheet(projectId: string) {
    const supabase = await createClient()

    // Query time entries joined with users via tasks
    // Since Supabase doesn't support deep joins easily from child to parent's parent in one go for filtering,
    // we query time_entries and filter by task's project_id

    // Actually, simple way: select * from time_entries, join tasks!inner(project_id)

    const { data, error } = await supabase
        .from('time_entries')
        .select(`
            *,
            user:profiles(id, name),
            task:tasks!inner(id, title, project_id)
        `)
        .eq('task.project_id', projectId)
        .order('entry_date', { ascending: false })

    if (error) {
        console.error('Error fetching timesheet:', error)
        return []
    }

    return data
}
