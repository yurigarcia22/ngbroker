import React from 'react'

interface PageHeaderProps {
    title: string
    description?: string
    children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between space-y-2 mb-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
                {description && (
                    <p className="text-muted-foreground text-sm text-gray-500">{description}</p>
                )}
            </div>
            <div className="flex items-center space-x-2">{children}</div>
        </div>
    )
}
