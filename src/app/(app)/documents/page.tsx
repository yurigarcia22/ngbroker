'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { FileText, Plus, Menu } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SidebarDocumentos } from '@/components/documents/sidebar-documentos'

const DocumentEditor = dynamic(
    () => import('@/components/documents/document-editor').then(mod => mod.DocumentEditor),
    { ssr: false, loading: () => <div className="p-8 text-gray-400">Carregando editor...</div> }
)

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([])
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
    const [selectedDocContent, setSelectedDocContent] = useState<any>(null)
    const [selectedDocTitle, setSelectedDocTitle] = useState('')
    const [isLoadingContent, setIsLoadingContent] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // Modal State
    const [modal, setModal] = useState<{
        open: boolean,
        mode: 'create' | 'rename',
        type: 'pasta' | 'pagina',
        parentId?: string | null,
        targetId?: string | null,
        initialName?: string
    }>({ open: false, mode: 'create', type: 'pasta', parentId: null })
    const [itemName, setItemName] = useState('')

    const supabase = createClient()

    // 1. Fetch & Build Tree
    const fetchDocuments = async () => {
        const { data } = await supabase.from('documentos').select('id, titulo, tipo, parent_id, icone').order('created_at')
        if (data) {
            setDocuments(buildTree(data))
        }
    }

    const buildTree = (flatDocs: any[], parentId: string | null = null): any[] => {
        return flatDocs
            .filter(d => d.parent_id === parentId)
            .map(d => ({
                ...d,
                children: buildTree(flatDocs, d.id)
            }))
    }

    useEffect(() => {
        fetchDocuments()
        const channel = supabase.channel('kb_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos' }, () => fetchDocuments())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    // 2. Select Document
    useEffect(() => {
        const loadDoc = async () => {
            if (!selectedDocId) {
                setSelectedDocContent(null); setSelectedDocTitle(''); return
            }
            setIsLoadingContent(true)
            const { data } = await supabase.from('documentos').select('conteudo, titulo, tipo').eq('id', selectedDocId).single()
            if (data) {
                if (data.tipo === 'pasta') {
                    setSelectedDocTitle(data.titulo)
                    setSelectedDocContent(null)
                } else {
                    setSelectedDocContent(data.conteudo)
                    setSelectedDocTitle(data.titulo)
                }
            }
            setIsLoadingContent(false)
        }
        loadDoc()
    }, [selectedDocId])

    const handleCreate = (type: 'pasta' | 'pagina', parentId?: string) => {
        setItemName('')
        setModal({ open: true, mode: 'create', type, parentId: parentId || null })
    }

    const handleRename = (id: string, currentName: string) => {
        setItemName(currentName)
        setModal({ open: true, mode: 'rename', type: 'pagina', targetId: id, parentId: null })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso excluirá todos os itens filhos.')) return
        await supabase.from('documentos').delete().eq('id', id)
        if (selectedDocId === id) setSelectedDocId(null)
        fetchDocuments() // Forced update
    }

    const handleConfirmModal = async () => {
        if (!itemName.trim()) return

        try {
            if (modal.mode === 'create') {
                const { data } = await supabase.from('documentos').insert({
                    titulo: itemName,
                    tipo: modal.type,
                    parent_id: modal.parentId || null
                }).select().single()

                if (data && modal.type === 'pagina') setSelectedDocId(data.id)
            } else if (modal.mode === 'rename' && modal.targetId) {
                await supabase.from('documentos').update({ titulo: itemName }).eq('id', modal.targetId)
            }
            fetchDocuments() // Forced update
        } catch (e) {
            console.error(e)
        } finally {
            setModal({ ...modal, open: false })
            setItemName('')
        }
    }

    return (
        <div className="flex h-full w-full bg-white text-gray-900 font-sans overflow-hidden">
            {/* Sidebar */}
            <div className={`
                flex-shrink-0 bg-[#F7F7F5] border-r border-gray-200 flex flex-col transition-all duration-300
                ${isSidebarOpen ? 'w-64' : 'w-0 opacity-0'}
            `}>
                <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-gray-700">
                        <div className="h-5 w-5 bg-indigo-600 rounded text-white flex items-center justify-center text-xs">NG</div>
                        Base de Conhecimento
                    </div>
                    {/* Root Create Action */}
                    <button onClick={() => handleCreate('pasta')} className="p-1 hover:bg-gray-200 rounded" title="Nova Pasta Raiz">
                        <Plus className="h-4 w-4 text-gray-500" />
                    </button>
                </div>

                <SidebarDocumentos
                    documents={documents}
                    selectedId={selectedDocId}
                    onSelect={setSelectedDocId}
                    onCreate={(type, parentId) => handleCreate(type, parentId)}
                    onDelete={handleDelete}
                    onRename={handleRename}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full bg-white relative">
                {/* Toggle Sidebar Button */}
                {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-50 p-2 bg-gray-100 rounded-md">
                        <Menu className="h-4 w-4" />
                    </button>
                )}

                {/* Hide Sidebar Button */}
                {isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute top-1/2 -left-3 z-50 p-1 bg-white border rounded-full shadow-sm hover:bg-gray-50 text-gray-400"
                        title="Recolher Sidebar"
                    >
                        <Menu className="h-3 w-3 rotate-90" />
                    </button>
                )}


                {isLoadingContent ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">Carregando...</div>
                ) : selectedDocId ? (
                    <DocumentEditor
                        key={selectedDocId} // Force remount on doc change
                        initialId={selectedDocId}
                        initialTitle={selectedDocTitle}
                        initialContent={selectedDocContent}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                        <FileText className="h-16 w-16 mb-4 text-gray-200" />
                        <p>Selecione um documento</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Dialog open={modal.open} onOpenChange={(open: boolean) => setModal({ ...modal, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {modal.mode === 'create' ? `Nova ${modal.type === 'pasta' ? 'Pasta' : 'Página'}` : 'Renomear'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={itemName}
                            onChange={e => setItemName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleConfirmModal()}
                            autoFocus
                            placeholder="Nome..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModal({ ...modal, open: false })}>Cancelar</Button>
                        <Button onClick={handleConfirmModal}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
