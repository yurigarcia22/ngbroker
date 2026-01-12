'use server'

import { createProjectStatus, deleteProjectStatus } from '@/lib/db/projects'
import { revalidatePath } from 'next/cache'

export async function createStatusAction(formData: FormData) {
    const projectId = formData.get('projectId') as string
    const name = formData.get('name') as string
    const sortOrder = parseInt(formData.get('sortOrder') as string)

    const { error } = await createProjectStatus({
        projectId,
        name,
        sortOrder
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function deleteStatusAction(id: string, projectId: string) {
    const { error } = await deleteProjectStatus(id)
    if (error) {
        return { error: typeof error === 'string' ? error : error.message }
    }
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}
