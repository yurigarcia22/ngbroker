'use client'

import { useState } from 'react'
import { addTimeEntryAction } from '@/app/(app)/projects/[id]/tasks/[taskId]/actions'
import { Loader2, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function TaskTimeLog({ timeEntries, taskId }: { timeEntries: any[], taskId: string }) {
    const pathname = usePathname()
    const [minutes, setMinutes] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!minutes) return
        setLoading(true)
        const formData = new FormData()
        formData.append('taskId', taskId)
        formData.append('minutes', minutes)
        formData.append('notes', notes)
        formData.append('path', pathname)

        await addTimeEntryAction(formData)
        setMinutes('')
        setNotes('')
        setLoading(false)
    }

    const totalMinutes = timeEntries.reduce((acc, curr) => acc + curr.minutes, 0)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Time Tracking</h4>
                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                    Total: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </span>
            </div>

            <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                <div className="max-h-40 overflow-y-auto p-2 space-y-2 bg-gray-50">
                    {timeEntries.map(entry => (
                        <div key={entry.id} className="flex justify-between text-xs text-gray-600">
                            <span>{new Date(entry.entry_date).toLocaleDateString()} - {entry.user?.name}</span>
                            <div className="flex gap-2">
                                {entry.notes && <span className="italic text-gray-400 truncate max-w-[100px]">{entry.notes}</span>}
                                <span className="font-medium text-gray-900">{entry.minutes}m</span>
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="p-2 border-t border-gray-200 bg-white space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            placeholder="Minutos"
                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs px-2 py-1 border"
                            required
                        />
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Nota (opcional)"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs px-2 py-1 border"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
