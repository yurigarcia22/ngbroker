'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getUnreadNotifications, markNotificationRead } from '@/lib/db/tasks'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        // Initial Fetch
        const fetch = async () => {
            const data = await getUnreadNotifications()
            setNotifications(data || [])
        }
        fetch()

        // Realtime Subscription
        const channel = supabase
            .channel('notifications-bell')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    // We should check if it belongs to current user, but RLS on insert/select might not trigger here without filter?
                    // Best to just re-fetch to be safe and simple
                    fetch()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleRead = async (id: string) => {
        await markNotificationRead(id)
        setNotifications(notifications.filter(n => n.id !== id))
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full focus:outline-none transition-colors"
            >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                        <div className="py-1">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    Nenhuma notificação nova.
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{notif.body}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRead(notif.id)}
                                                    className="ml-2 text-xs text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Lida
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
