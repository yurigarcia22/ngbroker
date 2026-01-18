
import { AlertTriangle, Clock, Activity, Users } from 'lucide-react'

export function DashboardStats({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Overdue */}
            <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Atrasadas</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.overdue}</h3>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg text-red-500 group-hover:bg-red-100 transition-colors">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Requer atenção imediata</p>
            </div>

            {/* Due Today */}
            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Para Hoje</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.today}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-500 group-hover:bg-blue-100 transition-colors">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '70%' }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Mantenha o ritmo</p>
            </div>

            {/* In Progress */}
            <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Em Andamento</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.inProgress}</h3>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                        <Activity className="h-5 w-5" />
                    </div>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '30%' }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Tasks ativas</p>
            </div>

            {/* Active Clients */}
            <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Clientes</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.activeClients}</h3>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                        <Users className="h-5 w-5" />
                    </div>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '90%' }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Carteira ativa</p>
            </div>
        </div>
    )
}
