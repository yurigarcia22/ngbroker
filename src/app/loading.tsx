import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
            <LoadingSpinner size="xl" />
        </div>
    )
}
