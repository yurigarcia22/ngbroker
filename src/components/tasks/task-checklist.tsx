'use client'

import { useState } from 'react'
import { addChecklistItemAction, toggleChecklistItemAction } from '@/app/(app)/projects/[id]/tasks/[taskId]/actions'
import { CheckCircle2, Circle, Plus, Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function TaskChecklist({ checklist, taskId }: { checklist: any[], taskId: string }) {
    const pathname = usePathname()
    const [newItem, setNewItem] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItem.trim()) return
        setLoading(true)
        const formData = new FormData()
        formData.append('taskId', taskId)
        formData.append('title', newItem)
        formData.append('path', pathname)

        await addChecklistItemAction(formData)
        setNewItem('')
        setLoading(false)
    }

    const handleToggle = async (itemId: string, currentStatus: boolean) => {
        // Optimistic update could represent here, but for MVP revalidate is fast enough usually
        await toggleChecklistItemAction(itemId, !currentStatus, pathname)
    }

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Checklist</h4>
            <div className="space-y-2">
                {checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-2 group">
                        <button
                            onClick={() => handleToggle(item.id, item.is_done)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                            {item.is_done ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <span className={`text-sm ${item.is_done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {item.title}
                        </span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleCreate} className="flex gap-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Adicionar item..."
                    className="flex-1 rounded-md border-gray-300 text-sm px-3 py-1.5 border"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </button>
            </form>
        </div>
    )
}
