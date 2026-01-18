'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Folder, FileText, MonitorPlay, File as FileIcon, Plus, ChevronRight, Loader2, MoreVertical, FilePlus } from 'lucide-react'
import { getFolders, getFolderPath } from '@/lib/db/folders'
import { getDocuments } from '@/lib/db/documents'
import { DocumentActions } from '@/components/documents/document-actions'
import { DocumentMenu } from '@/components/documents/document-menu'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function FolderPage() {
    const params = useParams()
    const id = params?.id as string

    const [folder, setFolder] = useState<any>(null)
    const [subFolders, setSubFolders] = useState<any[]>([])
    const [docs, setDocs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [openType, setOpenType] = useState<'folder' | 'page' | 'video' | 'file' | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (id) loadContent()
    }, [id])

    const loadContent = async () => {
        setLoading(true)
        const [fDetails, subs, d] = await Promise.all([
            getFolderPath(id),
            getFolders(id, 'global'),
            getDocuments(id, 'global')
        ])

        setFolder(fDetails)
        setSubFolders(subs || [])
        setDocs(d || [])
        setLoading(false)
    }

    if (loading) return <div className="flex h-full items-center justify-center text-gray-400">Carregando...</div>
    if (!folder) return <div className="p-8 text-center text-red-500">Pasta não encontrada</div>

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header / Breadcrumb */}
            <div className="h-16 border-b border-gray-100 flex items-center px-8 gap-2 text-sm text-gray-500 shrink-0">
                <Link href="/documents" className="hover:text-gray-900">Documentos</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-semibold text-gray-900">{folder.name}</span>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-8">
                {/* Actions Toolbar */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{folder.name}</h2>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                <Plus className="h-4 w-4" />
                                Novo
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Criar Novo</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setOpenType('page')} className="gap-2">
                                <FileText className="h-4 w-4 text-green-600" /> Página
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOpenType('folder')} className="gap-2">
                                <Folder className="h-4 w-4 text-indigo-600" /> Pasta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOpenType('video')} className="gap-2">
                                <MonitorPlay className="h-4 w-4 text-red-600" /> Vídeo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOpenType('file')} className="gap-2">
                                <FilePlus className="h-4 w-4 text-yellow-600" /> Arquivo Upload
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {(subFolders.length === 0 && docs.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-100 rounded-xl">
                        <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-3">
                            <Folder className="h-6 w-6" />
                        </div>
                        <h3 className="font-medium text-gray-900">Esta pasta está vazia</h3>
                        <p className="text-sm text-gray-500 mt-1 mb-6">Crie conteúdo para começar</p>
                        <div className="flex gap-3">
                            <button onClick={() => setOpenType('folder')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Nova Pasta</button>
                            <button onClick={() => setOpenType('page')} className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-medium hover:bg-indigo-100 text-indigo-700">Nova Página</button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subFolders.map(sub => (
                            <div key={sub.id} className="relative bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow group flex items-center">
                                <Link href={`/documents/folders/${sub.id}`} className="flex-1 p-4 flex items-start gap-3 min-w-0">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                        <Folder className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{sub.name}</h3>
                                        <p className="text-xs text-gray-500">Pasta</p>
                                    </div>
                                </Link>
                                <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DocumentMenu id={sub.id} title={sub.name} type="folder" onUpdate={loadContent} />
                                </div>
                            </div>
                        ))}
                        {docs.map(doc => (
                            <div key={doc.id} className="relative bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow group flex items-center">
                                <Link href={`/documents/${doc.id}`} className="flex-1 p-4 flex items-start gap-3 min-w-0">
                                    <div className={`p-2 rounded-lg shrink-0 ${doc.doc_type === 'page' ? 'bg-green-50 text-green-600' : doc.doc_type === 'video' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                        {doc.doc_type === 'page' ? <FileText className="h-5 w-5" /> :
                                            doc.doc_type === 'video' ? <MonitorPlay className="h-5 w-5" /> : <FileIcon className="h-5 w-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{doc.title}</h3>
                                        <p className="text-xs text-gray-500 capitalize">{doc.doc_type === 'page' ? 'Página' : doc.doc_type === 'video' ? 'Vídeo' : 'Arquivo'}</p>
                                    </div>
                                </Link>
                                <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DocumentMenu id={doc.id} title={doc.title} type={doc.doc_type} onUpdate={loadContent} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Context-aware Actions */}
            <DocumentActions
                openType={openType}
                setOpenType={setOpenType}
                onSuccess={() => {
                    loadContent()
                    router.refresh()
                }}
                parentId={folder.id}
                scopeType={folder.scope_type}
            />
        </div>
    )
}
