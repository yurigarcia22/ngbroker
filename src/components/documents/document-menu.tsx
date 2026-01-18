'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, FolderInput } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateDocumentTitle, deleteDocument } from '@/lib/db/documents'
import { updateFolder, deleteFolder } from '@/lib/db/folders'

interface DocumentMenuProps {
    id: string
    title: string
    type: 'folder' | 'page' | 'video' | 'file'
    onUpdate?: () => void
}

export function DocumentMenu({ id, title, type, onUpdate }: DocumentMenuProps) {
    const [openRename, setOpenRename] = useState(false)
    const [openDelete, setOpenDelete] = useState(false)
    const [newName, setNewName] = useState(title)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleRename = async () => {
        if (!newName) return
        setLoading(true)
        try {
            if (type === 'folder') {
                await updateFolder(id, { name: newName })
            } else {
                await updateDocumentTitle(id, newName)
            }
            setOpenRename(false)
            router.refresh()
            onUpdate?.()
        } catch (error) {
            console.error(error)
            alert('Erro ao renomear')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setLoading(true)
        try {
            if (type === 'folder') {
                await deleteFolder(id)
            } else {
                await deleteDocument(id)
            }
            setOpenDelete(false)
            router.refresh()
            onUpdate?.()
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setOpenRename(true) }} className="gap-2">
                        <Pencil className="h-3 w-3" /> Renomear
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setOpenDelete(true) }} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" /> Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={openRename} onOpenChange={setOpenRename}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Renomear {type === 'folder' ? 'Pasta' : 'Documento'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Novo nome"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenRename(false)}>Cancelar</Button>
                        <Button onClick={handleRename} disabled={loading || !newName} className="bg-indigo-600 text-white">
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Excluir {type === 'folder' ? 'Pasta' : 'Documento'}?</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir &quot;{title}&quot;? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancelar</Button>
                        <Button onClick={handleDelete} disabled={loading} variant="destructive">
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
