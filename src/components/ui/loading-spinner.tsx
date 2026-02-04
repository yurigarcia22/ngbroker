import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function LoadingSpinner({ size = 'md', className, ...props }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
    }

    return (
        <div className={cn('flex items-center justify-center', className)} {...props}>
            <Loader2 className={cn('animate-spin text-indigo-600', sizeClasses[size])} />
        </div>
    )
}
