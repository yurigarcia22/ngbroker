'use client'

import { useState } from 'react'
import { Folder, FileText, MonitorPlay, File as FileIcon } from 'lucide-react'
import { DocumentActions } from '@/components/documents/document-actions'
import { useRouter } from 'next/navigation'

export default function DocumentsPage() {
    const [openType, setOpenType] = useState<'folder' | 'page' | 'video' | 'file' | null>(null)
    const router = useRouter()

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Biblioteca de Documentos</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onClick={() => setOpenType('folder')} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                        <Folder className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Nova Pasta</h3>
                    <p className="text-sm text-gray-500 mt-1">Organize seu conhecimento</p>
                </div>

                <div onClick={() => setOpenType('page')} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Nova Página</h3>
                    <p className="text-sm text-gray-500 mt-1">Escreva e colabore</p>
                </div>

                <div onClick={() => setOpenType('video')} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-3 group-hover:scale-110 transition-transform">
                        <MonitorPlay className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Novo Vídeo</h3>
                    <p className="text-sm text-gray-500 mt-1">Aulas e tutoriais</p>
                </div>

                <div onClick={() => setOpenType('file')} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="h-12 w-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 mb-3 group-hover:scale-110 transition-transform">
                        <FileIcon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Novo Arquivo</h3>
                    <p className="text-sm text-gray-500 mt-1">PDFs, Imagens, Docs</p>
                </div>
            </div>

            <div className="mt-12 text-center text-gray-400 text-sm">
                Selecione um item na barra lateral ou crie um novo para começar.
            </div>

            <DocumentActions
                openType={openType}
                setOpenType={setOpenType}
                onSuccess={() => {
                    // Force refresh
                    window.location.reload()
                }}
            />
        </div>
    )
}
