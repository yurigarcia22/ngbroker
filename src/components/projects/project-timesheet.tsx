'use client'

import { useState, useEffect } from 'react'
import { getProjectTimesheet } from '@/lib/db/projects'
import { Clock } from 'lucide-react'

export function ProjectTimesheet({ projectId }: { projectId: string }) {
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [projectId])

    const loadData = async () => {
        setLoading(true)
        const data = await getProjectTimesheet(projectId)
        setEntries(data || [])
        setLoading(false)
    }

    // Aggregations
    const totalMinutes = entries.reduce((acc, curr) => acc + curr.minutes, 0)

    // By User
    const byUser: Record<string, number> = {}
    entries.forEach(entry => {
        const name = entry.user?.name || 'Desconhecido'
        byUser[name] = (byUser[name] || 0) + entry.minutes
    })

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return `${h}h ${m}m`
    }

    if (loading) return <div>Carregando timesheet...</div>

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Investido</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">{formatDuration(totalMinutes)}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Breakdown by User */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Por Membro</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {Object.entries(byUser).map(([name, mins]) => (
                            <li key={name} className="px-4 py-4 sm:px-6 flex justify-between">
                                <span className="text-sm font-medium text-gray-900">{name}</span>
                                <span className="text-sm text-gray-500">{formatDuration(mins)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Recent Entries */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg lg:col-span-2">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Entradas Recentes</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membro</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarefa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {entries.slice(0, 10).map(entry => (
                                    <tr key={entry.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.user?.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{entry.task?.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(entry.minutes)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(entry.entry_date).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
