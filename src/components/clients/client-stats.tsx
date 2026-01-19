import { TrendingUp, Users, DollarSign } from 'lucide-react'

interface ClientStatsProps {
    clients: any[]
    monthFilter?: string
}

export function ClientStats({ clients, monthFilter }: ClientStatsProps) {
    // Calculate metrics
    const activeClients = clients.filter(c => c.status === 'Ativo')

    const mrr = activeClients
        .filter(c => c.payment_type === 'Recorrente')
        .reduce((sum, client) => sum + (Number(client.ticket) || 0), 0)

    const oneOff = activeClients
        .filter(c => {
            if (c.payment_type !== 'Pontual') return false

            // If filtering by month, only count if contract started in that month
            if (monthFilter && c.contract_start) {
                // monthFilter is "YYYY-MM", contract_start is "YYYY-MM-DD"
                return c.contract_start.startsWith(monthFilter)
            }

            return true
        })
        .reduce((sum, client) => sum + (Number(client.ticket) || 0), 0)

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    const stats = [
        {
            name: 'MRR Mensal',
            value: formatCurrency(mrr),
            subtext: 'Receita Recorrente',
            icon: TrendingUp,
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            name: 'Contratos Pontuais',
            value: formatCurrency(oneOff),
            subtext: 'Receita Única (Ativos)',
            icon: DollarSign,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            name: 'Clientes Ativos',
            value: activeClients.length.toString(),
            subtext: 'Base Total',
            icon: Users,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
        }
    ]

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            {stats.map((item) => (
                <div key={item.name} className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-md ${item.color} text-white`}>
                                    <item.icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
                                    <dd>
                                        <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                                    </dd>
                                    <dd>
                                        <div className={`text-xs font-medium ${item.textColor} mt-1`}>
                                            {item.subtext}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
