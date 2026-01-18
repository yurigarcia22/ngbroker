'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Folder, FileText, MonitorPlay, FilePlus, Loader2 } from 'lucide-react'
import { createDocument } from '@/lib/db/documents'
import { createFolder } from '@/lib/db/folders'

export function DocumentActions({
    openType,
    setOpenType,
    onSuccess,
    parentId,
    scopeType = 'global'
}: {
    openType: 'folder' | 'page' | 'video' | 'file' | null,
    setOpenType: (t: 'folder' | 'page' | 'video' | 'file' | null) => void,
    onSuccess: () => void,
    parentId?: string,
    scopeType?: string
}) {
    const [name, setName] = useState('')
    const [videoUrl, setVideoUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleCreate = async () => {
        if (!name) return
        if (openType === 'video' && !videoUrl) return

        setIsLoading(true)

        try {
            if (openType === 'folder') {
                await createFolder({ name, scopeType: scopeType as any, parentId })
                onSuccess()
                setOpenType(null)
            } else if (openType === 'page') {
                const { data } = await createDocument({ title: name, docType: 'page', scopeType, folderId: parentId })
                if (data) {
                    onSuccess()
                    setOpenType(null)
                    router.push(`/documents/${data.id}`)
                }
            } else if (openType === 'video') {
                const { data } = await createDocument({
                    title: name,
                    docType: 'video',
                    scopeType,
                    folderId: parentId,
                    videoUrl
                })
                if (data) {
                    onSuccess()
                    setOpenType(null)
                    router.push(`/documents/${data.id}`)
                }
            } else if (openType === 'file') {
                // For file, we create the doc wrapper then redirect to editor for upload.
                const { data } = await createDocument({ title: name, docType: 'file', scopeType, folderId: parentId })
                if (data) {
                    onSuccess()
                    setOpenType(null)
                    router.push(`/documents/${data.id}`)
                }
            }
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao criar')
        } finally {
            setIsLoading(false)
            setName('')
            setVideoUrl('')
        }
    }

    const titleMap = {
        folder: 'Nova Pasta',
        page: 'Nova Página',
        video: 'Novo Vídeo',
        file: 'Novo Arquivo'
    }

    const iconMap = {
        folder: Folder,
        page: FileText,
        video: MonitorPlay,
        file: FilePlus
    }

    const Icon = openType ? iconMap[openType] : Folder

    return (
        <Dialog open={!!openType} onOpenChange={() => setOpenType(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded text-indigo-600">
                            <Icon className="h-5 w-5" />
                        </div>
                        {openType && titleMap[openType]}
                    </DialogTitle>
                    <DialogDescription>
                        {openType === 'video' ? 'Adicione o link do YouTube.' : 'Dê um nome para começar.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={openType === 'folder' ? 'Ex: Marketing, Financeiro...' : 'Ex: Reunião Semanal, Aula 1...'}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>

                    {openType === 'video' && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">URL do Vídeo (YouTube)</label>
                            <Input
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>
                    )}

                    {openType === 'file' && (
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-100">
                            Você poderá fazer o upload do arquivo na próxima tela.
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenType(null)}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={isLoading || !name || (openType === 'video' && !videoUrl)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
