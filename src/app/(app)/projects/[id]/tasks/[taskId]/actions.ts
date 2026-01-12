'use server'

import { addChecklistItem, toggleChecklistItem, addComment, addTimeEntry, updateTask } from '@/lib/db/tasks'
import { revalidatePath } from 'next/cache'

export async function toggleChecklistItemAction(itemId: string, isDone: boolean, path: string) {
    await toggleChecklistItem(itemId, isDone)
    revalidatePath(path)
}

export async function addChecklistItemAction(formData: FormData) {
    const taskId = formData.get('taskId') as string
    const title = formData.get('title') as string
    const path = formData.get('path') as string

    await addChecklistItem(taskId, title)
    revalidatePath(path)
}

export async function addCommentAction(formData: FormData) {
    const taskId = formData.get('taskId') as string
    const body = formData.get('body') as string
    const path = formData.get('path') as string

    await addComment(taskId, body)
    revalidatePath(path)
}

export async function addTimeEntryAction(formData: FormData) {
    const taskId = formData.get('taskId') as string
    const minutes = parseInt(formData.get('minutes') as string)
    const notes = formData.get('notes') as string
    const path = formData.get('path') as string

    await addTimeEntry(taskId, minutes, notes)
    revalidatePath(path)
}

export async function completeTaskAction(taskId: string, statusId: string, path: string) {
    await updateTask(taskId, { status_id: statusId })
    revalidatePath(path)
}
