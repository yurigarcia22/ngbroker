import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'NG Brain - Login',
    description: 'Acesso restrito',
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" className="h-full bg-gray-50">
            <body className={`${inter.className} h-full`}>
                <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
                    {children}
                </div>
            </body>
        </html>
    )
}
