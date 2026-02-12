'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function UserFilter({ users }: { users: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get current userId from URL or default to empty (All)
    const currentUserId = searchParams.get('userId') || ''

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set(name, value)
            } else {
                params.delete(name)
            }
            return params.toString()
        },
        [searchParams]
    )

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">Filtrar por usuário:</span>
            <select
                value={currentUserId}
                onChange={(e) => {
                    const userId = e.target.value
                    router.push('?' + createQueryString('userId', userId))
                }}
                className="block w-full rounded-md border-gray-300 py-1.5 text-base border-none bg-white shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
                <option value="">Todos</option>
                {users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name || user.email}
                    </option>
                ))}
            </select>
        </div>
    )
}
