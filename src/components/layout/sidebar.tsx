'use client'

import { LayoutDashboard, Users, FolderKanban, FileText, DollarSign, LogOut, CheckSquare, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NotificationsBell } from '@/components/layout/notifications-bell'
import { UserSettingsModal } from '@/components/layout/user-settings-modal'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Projetos', href: '/projects', icon: FolderKanban },
    { name: 'Documentos', href: '/documents', icon: FileText },
    { name: 'Financeiro', href: '/finance', icon: DollarSign, disabled: true },
]

export function Sidebar() {
    const pathname = usePathname()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<{ name: string } | null>(null)

    useEffect(() => {
        async function loadUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('name')
                    .eq('id', authUser.id)
                    .single()

                if (profile) {
                    setUser(profile)
                }
            }
        }
        loadUser()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const userName = user?.name || 'Usuário'
    const userInitial = userName.charAt(0).toUpperCase()

    return (
        <div className="flex h-full w-64 flex-col bg-[#1A1F2C] text-sm font-medium">
            <div className="flex h-16 items-center px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0EA5E9] text-white font-bold shadow-lg shadow-blue-900/20">
                        NG
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">NGBroker</span>
                </div>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto py-6">
                <nav className="flex-1 space-y-1 px-4">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                href={item.disabled ? '#' : item.href}
                                className={cn(
                                    isActive
                                        ? 'bg-[#0EA5E9] text-white shadow-md shadow-blue-900/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white',
                                    item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                                    'group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-white',
                                        'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
                                    )}
                                    // strokeWidth={isActive ? 2.5 : 2} // Optional: make icons bolder when active
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="p-4 mt-auto">
                <div className="space-y-1">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex w-full items-center px-3 py-2.5 text-gray-400 rounded-lg hover:bg-white/5 hover:text-white group transition-colors"
                    >
                        <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-white" />
                        Configurações
                    </button>

                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="h-9 w-9 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {userInitial}
                            </div>
                            <div className="flex flex-1 flex-col min-w-0">
                                <span className="text-white font-medium truncate">{userName}</span>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                title="Sair"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <UserSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    )
}
