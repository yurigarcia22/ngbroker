import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

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
        <html lang="pt-BR" className="h-full bg-gray-50">
            <body className={`${inter.className} h-full`}>
                <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Topbar />
                        <main className="flex-1 overflow-y-auto p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </body>
        </html>
    )
}
