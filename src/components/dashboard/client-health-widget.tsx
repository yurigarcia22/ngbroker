
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function ClientHealthWidget({ clients }: { clients: any[] }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Saúde dos Clientes</h3>
                    <p className="text-sm text-gray-500">Clientes que precisam de atenção</p>
                </div>
                <Link href="/clients" className="text-sm font-medium text-gray-900 flex items-center hover:underline">
                    Ver todos <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
            </div>

            <div className="space-y-6">
                {clients.map((client) => (
                    <div key={client.id} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs uppercase flex-shrink-0">
                            {client.name.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="text-sm font-medium text-gray-900 truncate">{client.name}</h4>
                                <div className="text-right">
                                    <span className={`text-xs font-bold ${client.health < 70 ? 'text-red-500' : client.health < 90 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {client.health}%
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${client.health < 70 ? 'bg-red-500' : client.health < 90 ? 'bg-yellow-500' : 'bg-gray-900'}`}
                                    style={{ width: `${client.health}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-red-500 mt-1 text-right font-medium">
                                {client.overdue_count > 0 ? `↘ ${client.overdue_count} atrasadas` : ''}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
