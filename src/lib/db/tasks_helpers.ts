'use server'

import { createClient } from '@/lib/supabase/server'

export async function getTaskChecklist(taskId: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('task_checklist_items').select('*').eq('task_id', taskId).order('sort_order')
    return data || []
}

export async function getTaskAttachments(taskId: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('task_attachments').select('*, user:profiles(id, name)').eq('task_id', taskId).order('created_at', { ascending: false })
    return data || []
}

export async function getTaskTimeEntries(taskId: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('time_entries').select('*, user:profiles(id, name)').eq('task_id', taskId).order('created_at', { ascending: false })
    return data || []
}
