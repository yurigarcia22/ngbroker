import { Suspense } from 'react'
import { getDashboardStats, getUrgentTasks, getClientHealth, getActiveProjects } from '@/lib/db/dashboard'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { UrgentTasksWidget } from '@/components/dashboard/urgent-tasks-widget'
import { ClientHealthWidget } from '@/components/dashboard/client-health-widget'
import { ActiveProjectsWidget } from '@/components/dashboard/active-projects-widget'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { UserFilter } from '@/components/dashboard/user-filter'

export const dynamic = 'force-dynamic'

async function DashboardContent({ searchParams }: { searchParams: { userId?: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please log in</div>
    }

    // Fetch user profile for name
    const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

    const userName = profile?.name?.split(' ')[0] || 'Usuário'

    // Fetch all users for the filter
    const { data: users } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name')

    const selectedUserId = searchParams.userId

    // Fetch Dashboard Data
    const [stats, urgentTasks, clientHealth, activeProjects] = await Promise.all([
        getDashboardStats(supabase, selectedUserId),
        getUrgentTasks(supabase, selectedUserId),
        getClientHealth(supabase, selectedUserId),
        getActiveProjects(supabase, selectedUserId)
    ])

    const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Bom dia, {userName}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Aqui está o resumo da sua operação hoje
                    </p>
                </div>
                <div className="flex flex-col md:flex-row items-end md:items-center gap-4 mt-4 md:mt-0">
                    <UserFilter users={users || []} />
                    <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex items-center">
                        <span className="capitalize">{today}</span>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <DashboardStats stats={stats} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Urgent Tasks (2 columns) */}
                <UrgentTasksWidget tasks={urgentTasks} />

                {/* Client Health (1 column) */}
                <ClientHealthWidget clients={clientHealth} />
            </div>

            {/* Active Projects Row */}
            <ActiveProjectsWidget projects={activeProjects} />
        </div>
    )
}

export default async function DashboardPage(props: { searchParams: Promise<{ userId?: string }> }) {
    const searchParams = await props.searchParams;
    return (
        <Suspense fallback={
            <div className="flex justify-center p-12">
                <LoadingSpinner size="lg" />
            </div>
        }>
            <DashboardContent searchParams={searchParams} />
        </Suspense>
    )
}
