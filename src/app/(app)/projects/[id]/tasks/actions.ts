'use server'

import { createTask } from '@/lib/db/tasks'
import { revalidatePath } from 'next/cache'

export async function createTaskAction(formData: FormData) {
    const projectId = formData.get('projectId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as string
    const statusId = formData.get('statusId') as string
    const dueDate = formData.get('dueDate') as string
    const tagsStr = formData.get('tags') as string

    // Parse tags (comma separated)
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []

    const { error } = await createTask({
        projectId,
        title,
        description,
        priority,
        statusId,
        dueDate: dueDate || null,
        tags
    })

    if (error) {
        return { error: error }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}
