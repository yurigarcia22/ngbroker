'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTimeTrackerStore } from '@/lib/store/time-tracker-store'
import { addTimeEntry } from '@/lib/db/tasks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface StopTimerModalProps {
    isOpen: boolean
    onClose: () => void
}

export function StopTimerModal({ isOpen, onClose }: StopTimerModalProps) {
    const { activeTaskId, startTime, taskTitle, reset } = useTimeTrackerStore()
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [minutes, setMinutes] = useState(0)

    useEffect(() => {
        if (isOpen && startTime) {
            const now = Date.now()
            const diff = now - startTime
            const mins = Math.max(1, Math.ceil(diff / 60000))
            setMinutes(mins)
        }
    }, [isOpen, startTime])

    const handleConfirm = async () => {
        if (!activeTaskId) return

        setLoading(true)
        try {
            await addTimeEntry(activeTaskId, minutes, notes)
            reset()
            onClose()
            setNotes('')
        } catch (error) {
            console.error('Failed to save time entry', error)
        } finally {
            setLoading(false)
        }
    }

    // Don't render if no active task (safety)
    if (!activeTaskId && !isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Parar Cronômetro</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Tarefa</p>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{taskTitle || 'Tarefa sem título'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-indigo-600">{minutes}</span>
                            <span className="text-xs text-indigo-600 font-medium">Minutos</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                                {startTime ? format(startTime, "HH:mm", { locale: ptBR }) : '--:--'}
                            </span>
                            <span className="text-xs text-gray-500">Início</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Notas (Opcional)</label>
                        <Textarea
                            placeholder="O que você fez?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {loading ? 'Salvando...' : 'Salvar e Parar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
