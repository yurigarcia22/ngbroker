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
import Image from 'next/image'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Projetos', href: '/projects', icon: FolderKanban },
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
        <div className="glass-sidebar m-4 flex h-[calc(100vh-2rem)] w-64 flex-col rounded-2xl border border-white/20 text-sm font-medium transition-all duration-300 shadow-2xl shadow-rose-500/10">
            <div className="flex h-32 items-center justify-center border-b border-white/10 px-4">
                {/* Logo Area */}
                <div className="relative h-24 w-48">
                    <Image
                        src="/logo.png"
                        alt="NG Grupo"
                        fill
                        className="object-contain"
                        priority
                        unoptimized
                    />
                </div>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto py-6">
                <nav className="flex-1 space-y-1 px-5">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                href={item.disabled ? '#' : item.href}
                                className={cn(
                                    isActive
                                        ? 'bg-gradient-to-r from-rose-500/10 to-orange-500/10 text-white border-l-2 border-rose-500'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white hover:pl-4',
                                    item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                                    'group flex items-center px-3 py-2.5 transition-all duration-200 ease-in-out'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-rose-400' : 'text-slate-500 group-hover:text-white',
                                        'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
                                    )}
                                    // strokeWidth={isActive ? 2.5 : 2} // Optional
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
                        className="flex w-full items-center px-3 py-2.5 text-slate-400 hover:bg-white/5 hover:text-white group transition-colors rounded-lg"
                    >
                        <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-slate-500 group-hover:text-white" />
                        Configurações
                    </button>

                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-rose-500/20">
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
