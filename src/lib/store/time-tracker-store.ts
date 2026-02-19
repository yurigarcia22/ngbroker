import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TimeTrackerState {
    activeTaskId: string | null
    startTime: number | null
    taskTitle: string | null
    isRunning: boolean
    startTimer: (taskId: string, taskTitle: string) => void
    stopTimer: () => void
    reset: () => void
}

export const useTimeTrackerStore = create<TimeTrackerState>()(
    persist(
        (set) => ({
            activeTaskId: null,
            startTime: null,
            taskTitle: null,
            isRunning: false,
            startTimer: (taskId, taskTitle) => set({
                activeTaskId: taskId,
                taskTitle,
                startTime: Date.now(),
                isRunning: true
            }),
            stopTimer: () => set({ isRunning: false }), // Just pauses state logic, actual clearing happens after save
            reset: () => set({ activeTaskId: null, startTime: null, taskTitle: null, isRunning: false })
        }),
        {
            name: 'time-tracker-storage',
        }
    )
)
