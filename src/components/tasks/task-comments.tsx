'use client'

import { useState } from 'react'
import { addCommentAction } from '@/app/(app)/projects/[id]/tasks/[taskId]/actions'
import { Loader2, Send } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function TaskComments({ comments, taskId }: { comments: any[], taskId: string }) {
    const pathname = usePathname()
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return
        setLoading(true)
        const formData = new FormData()
        formData.append('taskId', taskId)
        formData.append('body', newComment)
        formData.append('path', pathname)

        await addCommentAction(formData)
        setNewComment('')
        setLoading(false)
    }

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Comentários</h4>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900">{comment.user?.name || 'Usuário'}</h3>
                                <p className="text-gray-500 text-xs">{new Date(comment.created_at).toLocaleString()}</p>
                            </div>
                            <p className="text-gray-700 bg-gray-50 p-2 rounded-md">{comment.body}</p>
                        </div>
                    </div>
                ))}
                {comments.length === 0 && <p className="text-gray-400 text-sm italic">Nenhum comentário ainda.</p>}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border pr-10"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute bottom-2 right-2 p-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                </button>
            </form>
        </div>
    )
}
