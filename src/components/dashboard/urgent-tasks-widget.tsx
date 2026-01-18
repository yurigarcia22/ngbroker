
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function UrgentTasksWidget({ tasks }: { tasks: any[] }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-2">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Tarefas Urgentes</h3>
                    <p className="text-sm text-gray-500">Tarefas atrasadas ou com prazo hoje</p>
                </div>
                <Link href="/tasks" className="text-sm font-medium text-gray-900 flex items-center hover:underline">
                    Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
            </div>

            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between group py-2">
                        <div className="flex items-start gap-3">
                            <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${task.priority === 'Urgente' ? 'bg-red-500' : 'bg-orange-400'}`} />
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    {task.title}
                                </h4>
                                <p className="text-xs text-gray-500">
                                    {task.project?.client?.name} • {task.project?.name}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                                {task.priority || 'Atrasado'}
                            </span>
                            <div className="flex -space-x-2">
                                {task.assignees?.map((a: any) => (
                                    <div
                                        key={a.user?.id || Math.random()}
                                        className="h-6 w-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-indigo-700"
                                    >
                                        {a.user?.name?.charAt(0)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
