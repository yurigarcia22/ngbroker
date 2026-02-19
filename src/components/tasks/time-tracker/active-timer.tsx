'use client'

import { useState, useEffect } from 'react'
import { useTimeTrackerStore } from '@/lib/store/time-tracker-store'
import { StopCircle, Play, Timer } from 'lucide-react'
import { StopTimerModal } from './stop-timer-modal'
import { cn } from '@/lib/utils'

export function ActiveTimer() {
    const { isRunning, startTime, taskTitle, activeTaskId } = useTimeTrackerStore()
    const [elapsed, setElapsed] = useState('00:00:00')
    const [isStopModalOpen, setIsStopModalOpen] = useState(false)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isRunning || !startTime) return

        const interval = setInterval(() => {
            const now = Date.now()
            const diff = now - startTime

            const hours = Math.floor(diff / 3600000)
            const minutes = Math.floor((diff % 3600000) / 60000)
            const seconds = Math.floor((diff % 60000) / 1000)

            setElapsed(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            )
        }, 1000)

        // Initial update
        // We can do an immediate update but interval does it after 1s.

        return () => clearInterval(interval)
    }, [isRunning, startTime])

    if (!isClient || !activeTaskId) return null

    return (
        <>
            <div className={cn(
                "flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all animate-in fade-in slide-in-from-top-2 duration-300",
                isRunning ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-100 border-gray-200 text-gray-500 opacity-80"
            )}>
                <div className="flex items-center gap-2">
                    <div className={`relative flex h-2 w-2`}>
                        {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? 'bg-indigo-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <span className="font-mono font-medium text-sm tabular-nums">{elapsed}</span>
                </div>

                <div className="hidden md:block max-w-[150px] truncate text-xs font-medium" title={taskTitle || ''}>
                    {taskTitle || 'Sem título'}
                </div>

                <button
                    onClick={() => setIsStopModalOpen(true)}
                    className="p-1 rounded-full hover:bg-white/50 text-current transition-colors"
                >
                    <StopCircle className="h-4 w-4 fill-current" />
                </button>
            </div>

            <StopTimerModal
                isOpen={isStopModalOpen}
                onClose={() => setIsStopModalOpen(false)}
            />
        </>
    )
}
