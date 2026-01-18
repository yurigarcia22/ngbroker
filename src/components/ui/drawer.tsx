'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrawerProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: React.ReactNode
    description?: React.ReactNode
    className?: string
}

export function Drawer({ isOpen, onClose, children, title, description, className }: DrawerProps) {
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            document.body.style.overflow = 'hidden'
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300) // Match transition duration
            document.body.style.overflow = 'unset'
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isVisible && !isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={cn(
                    "relative z-50 h-full w-full max-w-2xl transform bg-white shadow-xl transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full",
                    className
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <div>
                            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
                            {description && <p className="text-sm text-gray-500">{description}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
