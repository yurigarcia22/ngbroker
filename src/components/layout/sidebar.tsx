'use client'

import { LayoutDashboard, Users, FolderKanban, FileText, DollarSign, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Projetos', href: '/projects', icon: FolderKanban, disabled: true },
    { name: 'Documentos', href: '/documents', icon: FileText, disabled: true },
    { name: 'Financeiro', href: '/finance', icon: DollarSign, disabled: true },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col border-r bg-white">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-xl font-bold text-indigo-600">NGBroker</span>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                href={item.disabled ? '#' : item.href}
                                className={cn(
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500',
                                        'mr-3 h-5 w-5 flex-shrink-0'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
