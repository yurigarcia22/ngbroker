'use client'

import { useTimeTrackerStore } from '@/lib/store/time-tracker-store'
import { StopTimerModal } from '@/components/tasks/time-tracker/stop-timer-modal'

export function GlobalTimerModal() {
    const { isStopModalOpen, closeStopModal } = useTimeTrackerStore()

    return (
        <StopTimerModal
            isOpen={isStopModalOpen}
            onClose={() => closeStopModal()}
        />
    )
}
