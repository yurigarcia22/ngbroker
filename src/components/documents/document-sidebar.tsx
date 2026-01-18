'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { Folder, FileText, ChevronRight, ChevronDown, Plus, MoreHorizontal, File, MonitorPlay } from 'lucide-react'
import { getFolders, createFolder } from '@/lib/db/folders'
import { getDocuments, createDocument } from '@/lib/db/documents'
import { DocumentMenu } from './document-menu'

// ... imports
import { createClient } from '@/lib/supabase/client'

// Recursive Folder Item Component
function FolderItem({ folder, depth = 0, isActive }: { folder: any, depth?: number, isActive: (id: string, type: string) => boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [subFolders, setSubFolders] = useState<any[]>([])
    const [docs, setDocs] = useState<any[]>([])
    const router = useRouter()

    const loadContent = async () => {
        const [f, d] = await Promise.all([
            getFolders(folder.id, folder.scope_type, folder.client_id || folder.project_id),
            getDocuments(folder.id, folder.scope_type, folder.client_id || folder.project_id)
        ])
        setSubFolders(f || [])
        setDocs(d || [])
    }

    const toggle = () => {
        if (!isOpen) loadContent()
        setIsOpen(!isOpen)
    }

    // Realtime Subscription for this folder's content
    useEffect(() => {
        if (!isOpen) return

        const supabase = createClient()
        const channel = supabase
            .channel(`folder-${folder.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'documents', filter: `folder_id=eq.${folder.id}` },
                () => loadContent()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'document_folders', filter: `parent_id=eq.${folder.id}` },
                () => loadContent() // Corrected: reload content to show new subfolders
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isOpen, folder.id]) // subscription depends on isOpen state to save resources? Or just keep it open? 
    // If we only listen when open, we miss updates when closed, but that's fine as we load on open.
    // Actually, if we add something and it's closed, we loadContent() when we click open.
    // If it is OPEN, we want to see it appear.

    // ... render ...
    // SAME RENDER CODE
    // Just need to match the return of the component cleanly.

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-1 py-1 px-2 hover:bg-gray-100 rounded group text-sm ${isActive(folder.id, 'folder') ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                <div
                    className="p-0.5 rounded hover:bg-gray-200 text-gray-400 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); toggle() }}
                >
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </div>

                <Link
                    href={`/documents/folders/${folder.id}`}
                    className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer"
                    onClick={(e) => {
                        // toggle() 
                    }}
                >
                    <Folder className={`h-4 w-4 ${isActive(folder.id, 'folder') ? 'text-indigo-500' : 'text-gray-400'}`} />
                    <span className="truncate">{folder.name}</span>
                </Link>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <button onClick={(e) => {
                        e.stopPropagation(); /* Add Subfolder logic via DocumentActions later if needed, prompt for now or custom */
                        const name = prompt('Nome da sub-pasta:')
                        if (name) createFolder({ name, parentId: folder.id, scopeType: folder.scope_type }).then(() => { if (isOpen) loadContent(); else { setIsOpen(true); loadContent(); } })
                    }} className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Nova Sub-pasta">
                        <Plus className="h-3 w-3" />
                    </button>
                    <DocumentMenu id={folder.id} title={folder.name} type="folder" onUpdate={() => { if (folder.parent_id) {/* parent should update, tricky in recursive. router.refresh handles it usually */ }; loadContent() }} />
                </div>
            </div>

            {isOpen && (
                <div>
                    {subFolders.map(sub => (
                        <FolderItem key={sub.id} folder={sub} depth={depth + 1} isActive={isActive} />
                    ))}
                    {docs.map(doc => (
                        <div
                            key={doc.id}
                            className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded group/doc text-sm ${isActive(doc.id, 'doc') ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600'}`}
                            style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
                        >
                            <Link href={`/documents/${doc.id}`} className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                {doc.doc_type === 'page' ? <FileText className="h-3.5 w-3.5 shrink-0" /> :
                                    doc.doc_type === 'video' ? <MonitorPlay className="h-3.5 w-3.5 shrink-0" /> : <File className="h-3.5 w-3.5 shrink-0" />}
                                <span className="truncate">{doc.title}</span>
                            </Link>
                            <div className="opacity-0 group-hover/doc:opacity-100 transition-opacity">
                                <DocumentMenu id={doc.id} title={doc.title} type={doc.doc_type} onUpdate={loadContent} />
                            </div>
                        </div>
                    ))}
                    {subFolders.length === 0 && docs.length === 0 && (
                        <div className="text-xs text-gray-400 py-1 pl-[32px] italic">Vazio</div>
                    )}
                </div>
            )}
        </div>
    )
}


export function DocumentSidebar() {
    const [rootFolders, setRootFolders] = useState<any[]>([])
    const [rootDocs, setRootDocs] = useState<any[]>([])
    const params = useParams()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        loadRoot()

        const supabase = createClient()
        const channel = supabase
            .channel('root-documents')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'documents', filter: 'folder_id=is.null' },
                () => loadRoot()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'document_folders', filter: 'parent_id=is.null' },
                () => loadRoot()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const loadRoot = async () => {
        const [f, d] = await Promise.all([
            getFolders(null, 'global'),
            getDocuments(null, 'global')
        ])
        setRootFolders(f || [])
        setRootDocs(d || [])
    }

    // ... rest of component
    const isActive = (id: string, type: string) => {
        if (type === 'doc') return pathname === `/documents/${id}`
        if (type === 'folder') return pathname === `/documents/folders/${id}`
        return false
    }

    const handleNewFolder = async () => {
        const name = prompt('Nome da nova pasta:') // MVP
        if (name) {
            await createFolder({ name, scopeType: 'global' })
            // loadRoot() // Handled by Realtime now, but safe to keep or remove
        }
    }

    const handleNewPage = async () => {
        const title = prompt('Título da página:')
        if (title) {
            const { data } = await createDocument({ title, docType: 'page', scopeType: 'global' })
            if (data) {
                // loadRoot() // Handled by Realtime
                router.push(`/documents/${data.id}`)
            }
        }
    }

    return (
        <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-gray-700 text-sm">Documentos</span>
                <div className="flex gap-1">
                    <button onClick={handleNewFolder} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Nova Pasta">
                        <Folder className="h-4 w-4" />
                        <span className="sr-only">Nova Pasta</span>
                    </button>
                    <button onClick={handleNewPage} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Nova Página">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Nova Página</span>
                    </button>
                </div>
            </div>
            <div className="p-2 space-y-1">
                {rootFolders.map(folder => (
                    <FolderItem key={folder.id} folder={folder} isActive={isActive} />
                ))}
                {rootDocs.map(doc => (
                    <Link
                        key={doc.id}
                        href={`/documents/${doc.id}`}
                        className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer text-sm block ${isActive(doc.id, 'doc') ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600'}`}
                    >
                        {doc.doc_type === 'page' ? <FileText className="h-3.5 w-3.5" /> :
                            doc.doc_type === 'video' ? <MonitorPlay className="h-3.5 w-3.5" /> : <File className="h-3.5 w-3.5" />}
                        <span className="truncate">{doc.title}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}
