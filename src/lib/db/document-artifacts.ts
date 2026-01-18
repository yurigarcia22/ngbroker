'use server'

import { createClient } from '@/lib/supabase/server'

// ... existing imports ...

export async function saveVideoDetails(documentId: string, provider: string, videoUrl: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()

    // Upsert video details
    const { error } = await supabase
        .from('document_videos')
        .upsert({
            document_id: documentId,
            provider,
            video_url: videoUrl,
            created_by: user.user?.id
        })

    return { error }
}

export async function saveFileDetails(documentId: string, filePath: string, fileName: string, sizeBytes: number, mimeType: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()

    // Create file record
    const { error } = await supabase
        .from('document_files')
        .insert({
            document_id: documentId,
            file_path: filePath,
            file_name: fileName,
            size_bytes: sizeBytes,
            mime_type: mimeType,
            created_by: user.user?.id
        })

    return { error }
}

export async function deleteDocumentFile(fileId: string, filePath: string) {
    const supabase = await createClient()

    // 1. Delete from Storage
    // Extract filename from path (assuming URL structure)
    // filePath is usually full URL. We need the path relative to bucket.
    // E.g., http.../documents-files/filename.pdf -> filename.pdf
    const urlParts = filePath.split('/documents-files/')
    if (urlParts.length > 1) {
        const relativePath = urlParts[1]
        const { error: storageError } = await supabase.storage
            .from('documents-files')
            .remove([relativePath])

        if (storageError) {
            console.error('Error deleting from storage:', storageError)
            // Continue to delete from DB even if storage fails (orphan cleanup)
        }
    }

    // 2. Delete from DB
    const { error } = await supabase
        .from('document_files')
        .delete()
        .eq('id', fileId)

    return { error }
}
