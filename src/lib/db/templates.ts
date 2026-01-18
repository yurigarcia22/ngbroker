'use server'

import { createClient } from '@/lib/supabase/server'
import { addChecklistItem } from './tasks'

export async function getTemplates() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching templates:', error)
        return []
    }

    return data
}

export async function getTemplateDetails(templateId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_templates')
        .select(`
            *,
            tasks:template_tasks (
                *,
                checklist:template_checklist_items (*)
            )
        `)
        .eq('id', templateId)
        .single()

    if (error) return null
    return data
}

export async function applyTemplate(projectId: string, templateId: string) {
    const supabase = await createClient()

    // 1. Fetch template data
    const template = await getTemplateDetails(templateId)
    if (!template) return { error: 'Template not found' }

    // 2. Fetch project to know start date (or just use today)
    const { data: project } = await supabase.from('projects').select('start_date').eq('id', projectId).single()

    const baseDate = project?.start_date ? new Date(project.start_date) : new Date()

    // 3. Create tasks
    const tasksToCreate = template.tasks || []

    for (const tTask of tasksToCreate) {
        // Calculate due date based on offset
        const dueDate = new Date(baseDate)
        dueDate.setDate(dueDate.getDate() + (tTask.offset_days || 0))

        // Create Task
        const { data: newTask, error: taskError } = await supabase
            .from('tasks')
            .insert({
                project_id: projectId,
                title: tTask.title,
                description: tTask.description,
                priority: tTask.priority,
                due_date: dueDate.toISOString().split('T')[0],
                // Assign default status (usually Backlog or first one)
                // We'd need to fetch default status for project, but for now let DB handle default or null
            })
            .select()
            .single()

        if (taskError) {
            console.error('Error creating task from template:', taskError)
            continue
        }

        // Create Checklist Items
        if (tTask.checklist && tTask.checklist.length > 0) {
            const checklistItems = tTask.checklist.map((item: any) => ({
                task_id: newTask.id,
                title: item.title,
                sort_order: item.sort_order,
                is_done: false
            }))

            await supabase.from('task_checklist_items').insert(checklistItems)
        }
    }

    return { success: true }
}
