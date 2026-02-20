import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TimeTrackerState {
    activeTaskId: string | null
    startTime: number | null
    taskTitle: string | null
    isRunning: boolean
    isStopModalOpen: boolean
    startTimer: (taskId: string, taskTitle: string) => void
    stopTimer: () => void
    openStopModal: () => void
    closeStopModal: () => void
    reset: () => void
}

export const useTimeTrackerStore = create<TimeTrackerState>()(
    persist(
        (set) => ({
            activeTaskId: null,
            startTime: null,
            taskTitle: null,
            isRunning: false,
            isStopModalOpen: false,
            startTimer: (taskId, taskTitle) => set({
                activeTaskId: taskId,
                taskTitle,
                startTime: Date.now(),
                isRunning: true,
                isStopModalOpen: false
            }),
            stopTimer: () => set({ isRunning: false }),
            openStopModal: () => set({ isStopModalOpen: true }),
            closeStopModal: () => set({ isStopModalOpen: false }),
            reset: () => set({ activeTaskId: null, startTime: null, taskTitle: null, isRunning: false, isStopModalOpen: false })
        }),
        {
            name: 'time-tracker-storage',
        }
    )
)
