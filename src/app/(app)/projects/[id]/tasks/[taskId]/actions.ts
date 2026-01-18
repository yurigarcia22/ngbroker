'use server'

import { revalidatePath } from 'next/cache'
import { addChecklistItem, toggleChecklistItem, createComment, addTimeEntry } from '@/lib/db/tasks'

export async function addChecklistItemAction(formData: FormData) {
    const taskId = formData.get('taskId') as string
    const title = formData.get('title') as string
    const path = formData.get('path') as string

    if (!taskId || !title) return { error: 'Missing fields' }

    await addChecklistItem(taskId, title)
    revalidatePath(path)
}

export async function toggleChecklistItemAction(itemId: string, isDone: boolean, path: string) {
    await toggleChecklistItem(itemId, isDone)
    revalidatePath(path)
}

export async function addCommentAction(formData: FormData) {
    const taskId = formData.get('taskId') as string
    const body = formData.get('body') as string
    const path = formData.get('path') as string

    if (!taskId || !body) return { error: 'Missing fields' }

    await createComment(taskId, body)
    revalidatePath(path)
}

export async function addTimeEntryAction(formData: FormData) {
    const taskId = formData.get('taskId') as string
    const minutes = Number(formData.get('minutes'))
    const notes = formData.get('notes') as string
    const path = formData.get('path') as string

    if (!taskId || !minutes) return { error: 'Missing fields' }

    await addTimeEntry(taskId, minutes, notes)
    revalidatePath(path)
}
