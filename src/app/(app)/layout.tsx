import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/layout/sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'NGBroker',
    description: 'Sistema de Gestão Interno',
}

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={`h-full bg-gray-50 ${inter.className}`}>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
