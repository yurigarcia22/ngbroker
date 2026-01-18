'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type FolderScope = 'global' | 'client' | 'project'

export async function getFolders(parentId: string | null, scopeType: FolderScope, scopeId?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('document_folders')
        .select('*')
        .eq('scope_type', scopeType)

    if (parentId) {
        query = query.eq('parent_id', parentId)
    } else {
        query = query.is('parent_id', null)
    }

    if (scopeType === 'client' && scopeId) {
        query = query.eq('client_id', scopeId)
    } else if (scopeType === 'project' && scopeId) {
        query = query.eq('project_id', scopeId)
    }

    const { data, error } = await query.order('name')

    if (error) {
        console.error('Error fetching folders:', error)
        return []
    }

    return data
}

export async function createFolder(data: {
    name: string
    parentId?: string | null
    scopeType: FolderScope
    clientId?: string
    projectId?: string
}) {
    const supabase = await createClient()

    const { data: folder, error } = await supabase
        .from('document_folders')
        .insert({
            name: data.name,
            parent_id: data.parentId || null,
            scope_type: data.scopeType,
            client_id: data.clientId,
            project_id: data.projectId,
            created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/documents', 'layout')

    return { data: folder }
}

export async function updateFolder(id: string, updates: { name?: string; parentId?: string | null }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('document_folders')
        .update({
            name: updates.name,
            parent_id: updates.parentId,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}

export async function deleteFolder(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('document_folders')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}

export async function getFolderPath(folderId: string) {
    // Recursive query or repetitive fetch. For MVP, we stick to simple iterative fetch up to X levels or a recursive Postgres function if we had it.
    // Client-side often easier for small depth.
    // Let's return just the folder details for now.
    const supabase = await createClient()
    const { data } = await supabase.from('document_folders').select('*').eq('id', folderId).single()
    return data
}
