'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ActiveTimer } from '../tasks/time-tracker/active-timer'

export function Topbar() {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <div className="flex h-16 flex-shrink-0 bg-white border-b shadow-sm px-6 items-center justify-between">
            <div className="flex-1 flex justify-center">
                <ActiveTimer />
            </div>
            <div className="flex items-center space-x-4">
                <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                    title="Sair"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
