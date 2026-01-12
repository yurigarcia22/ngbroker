import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, DollarSign } from 'lucide-react'

// Placeholder Card Component (since we don't have a full UI library yet)
function DashboardCard({ title, value, icon: Icon, description, className }: any) {
    return (
        <div className={`bg-white overflow-hidden rounded-lg shadow ${className}`}>
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
                        <dd>
                            <div className="text-lg font-medium text-gray-900">{value}</div>
                        </dd>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                    <span className="font-medium text-gray-500 hover:text-gray-700">
                        {description}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <>
            <PageHeader title="Dashboard" description="Visão geral do sistema NGBroker" />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DashboardCard
                    title="Tarefas Atrasadas"
                    value="3"
                    icon={AlertCircle}
                    description="Necessitam atenção"
                />
                <DashboardCard
                    title="Clientes Ativos"
                    value="12"
                    icon={CheckCircle2}
                    description="+2 essa semana"
                />
                <DashboardCard
                    title="Caixa Previsto"
                    value="R$ 45.000,00"
                    icon={DollarSign}
                    description="Próximos 30 dias"
                />
            </div>

            <div className="mt-8">
                <div className="rounded-md bg-white p-6 shadow">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Atividade Recente</h3>
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-500">Nenhuma atividade recente para mostrar.</p>
                    </div>
                </div>
            </div>
        </>
    )
}
