'use server'

import { createClient } from '@/lib/supabase/server'

import { revalidatePath } from 'next/cache'
import { saveVideoDetails } from './document-artifacts'

export type DocType = 'page' | 'file' | 'video'

export async function getDocuments(folderId: string | null, scopeType: string, scopeId?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('documents')
        .select('*')
        .eq('scope_type', scopeType)

    if (folderId) {
        query = query.eq('folder_id', folderId)
    } else {
        query = query.is('folder_id', null)
    }

    if (scopeType === 'client' && scopeId) {
        query = query.eq('client_id', scopeId)
    } else if (scopeType === 'project' && scopeId) {
        query = query.eq('project_id', scopeId)
    }

    const { data, error } = await query.order('title')

    if (error) {
        console.error('Error fetching documents:', error)
        return []
    }

    return data
}

export async function createDocument(data: {
    title: string
    docType: DocType
    folderId?: string | null
    scopeType: string
    clientId?: string
    projectId?: string
    videoUrl?: string
}) {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user

    // 1. Create Document
    const { data: doc, error } = await supabase
        .from('documents')
        .insert({
            title: data.title,
            doc_type: data.docType,
            folder_id: data.folderId || null,
            scope_type: data.scopeType,
            client_id: data.clientId,
            project_id: data.projectId,
            created_by: user?.id,
            status: 'draft'
        })
        .select()
        .single()

    if (error) return { error: error.message }

    // 2. If 'page', create initial page entry
    if (data.docType === 'page') {
        const { error: pageError } = await supabase
            .from('document_pages')
            .insert({
                document_id: doc.id,
                content_json: [], // Start empty
                updated_by: user?.id
            })

        if (pageError) console.error('Error creating page content:', pageError)
    }

    // 3. If 'video', save video details
    if (data.docType === 'video' && data.videoUrl) {
        // Simple Youtube ID extraction or just save URL if our player handles it
        // Assuming 'youtube' as default provider for now
        await saveVideoDetails(doc.id, 'youtube', data.videoUrl)
    }

    revalidatePath('/documents', 'layout')


    return { data: doc }
}

export async function getDocument(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('documents')
        .select(`
            *,
            folder:document_folders(id, name),
            content:document_pages(content_json, updated_at),
            files:document_files(*),
            video:document_videos(*)
        `)
        .eq('id', id)
        .single()

    if (error) return null
    return data
}

export async function savePageContent(documentId: string, content: any[]) {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user

    const { error } = await supabase
        .from('document_pages')
        .upsert({
            document_id: documentId,
            content_json: content,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
        })

    return { error }
}

export async function updateDocumentTitle(id: string, title: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('documents').update({ title, updated_at: new Date().toISOString() }).eq('id', id)
    return { error }
}

export async function deleteDocument(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('documents').delete().eq('id', id)
    return { error }
}
