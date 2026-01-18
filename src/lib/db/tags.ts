import { createClient } from '@/lib/supabase/client'

export async function getTags() {
    const supabase = createClient()
    const { data } = await supabase
        .from('tags')
        .select('*')
        .order('name')
    return data || []
}

export async function createTag(name: string, color?: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('tags')
        .insert({ name, color })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function addTagToTask(taskId: string, tagId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('task_tags')
        .insert({ task_id: taskId, tag_id: tagId })

    if (error) throw error
}

export async function removeTagFromTask(taskId: string, tagId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('task_tags')
        .delete()
        .match({ task_id: taskId, tag_id: tagId })

    if (error) throw error
}
