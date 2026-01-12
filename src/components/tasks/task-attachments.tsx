'use client'

import { Paperclip } from 'lucide-react'

// Placeholder for attachments as storage setup is needed for real upload
export function TaskAttachments({ }: { taskId: string }) {
    return (
        <div className="space-y-4 opacity-50 pointer-events-none">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Anexos (Em breve)
            </h4>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-gray-500">Upload de arquivos será habilitado em breve.</p>
            </div>
        </div>
    )
}
