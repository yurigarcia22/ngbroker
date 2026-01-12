'use server'

import { createProject } from '@/lib/db/projects'
import { revalidatePath } from 'next/cache'

export async function createProjectAction(formData: FormData) {
    const clientId = formData.get('clientId') as string
    const name = formData.get('name') as string
    const scopeType = formData.get('scopeType') as string
    const scopeCustom = formData.get('scopeCustom') as string

    const { error } = await createProject({
        clientId,
        name,
        scopeType,
        scopeCustom
    })

    if (error) {
        return { error: error }
    }

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
}
