'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, FileText, Folder, MoreHorizontal, Plus, Trash, CornerDownRight, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface SidebarDocumentosProps {
    documents: any[]
    selectedId: string | null
    onSelect: (id: string) => void
    onCreate: (type: 'pasta' | 'pagina', parentId?: string) => void
    onDelete: (id: string) => void
    onRename: (id: string, currentName: string) => void
}

export function SidebarDocumentos({ documents, selectedId, onSelect, onCreate, onDelete, onRename }: SidebarDocumentosProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    // Initialize with all Expanded on load (or logic to expand path to selected)
    useEffect(() => {
        // Optional: Expand all on first load if small number of docs
        const allIds = new Set(documents.map(d => d.id))
        if (expanded.size === 0 && documents.length > 0) setExpanded(allIds) // Expand all by default for better UX initially
    }, [documents.length]) // Only on count change approx

    const toggleExpand = (id: string) => {
        const newSet = new Set(expanded)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setExpanded(newSet)
    }

    // Recursive Render
    const renderNode = (nodes: any[], level = 0) => {
        return nodes.map(node => {
            const hasChildren = node.children && node.children.length > 0
            const isExpanded = expanded.has(node.id)
            const isSelected = selectedId === node.id
            const isFolder = node.tipo === 'pasta'

            return (
                <div key={node.id}>
                    <div
                        className={cn(
                            "group flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors min-h-[32px]",
                            isSelected ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100",
                        )}
                        style={{ paddingLeft: `${Math.max(8, level * 16 + 8)}px` }}
                    >
                        {/* Expand/Collapse or Icon Placeholder */}
                        <div
                            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id) }}
                            className={cn(
                                "p-0.5 rounded hover:bg-black/5 transition-opacity",
                                (hasChildren || isFolder) ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}
                        >
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </div>

                        {/* Icon & Title */}
                        <div className="flex-1 flex items-center gap-2 truncate" onClick={() => onSelect(node.id)}>
                            {node.icone ? (
                                <span className="text-sm">{node.icone}</span>
                            ) : isFolder ? (
                                <Folder className={cn("h-4 w-4", isSelected ? "text-indigo-500" : "text-gray-400")} />
                            ) : (
                                <FileText className={cn("h-4 w-4", isSelected ? "text-indigo-500" : "text-gray-400")} />
                            )}
                            <span className="truncate flex-1">{node.titulo || 'Sem Título'}</span>
                        </div>

                        {/* Actions */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            {isFolder && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onCreate('pagina', node.id) }}
                                    className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded"
                                    title="Nova Página"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded">
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuItem onClick={() => onRename(node.id, node.titulo)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Renomear
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onCreate(isFolder ? 'pasta' : 'pagina', node.id)}>
                                        <CornerDownRight className="mr-2 h-4 w-4" />
                                        {isFolder ? 'Nova Sub-pasta' : 'Nova Sub-página'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(node.id)} className="text-red-600 focus:text-red-600">
                                        <Trash className="mr-2 h-4 w-4" /> Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Children */}
                    {isExpanded && node.children && (
                        <div className="border-l border-gray-100 ml-[15px]">
                            {renderNode(node.children, level + 1)}
                        </div>
                    )}
                </div>
            )
        })
    }

    // Prepare Tree
    // We assume documents passed here are ALREADY nested? Or flat?
    // It's better if the parent component sends the tree, BUT to keep this dumb, let's assume parent sends flat and we build tree?
    // No, for performance, better the parent handles data. I will assume `documents` is an array of ROOT nodes with `.children` populated.

    return (
        <div className="flex-1 overflow-y-auto py-2">
            {documents.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhum documento
                </div>
            ) : (
                renderNode(documents)
            )}
        </div>
    )
}
