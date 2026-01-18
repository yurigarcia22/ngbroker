'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, FileText, MonitorPlay, File as FileIcon, X, Plus, Upload, Loader2, ExternalLink, Paperclip, Pencil, Trash2, List, ListOrdered, Minus, Square, CheckSquare } from 'lucide-react'
import { getDocument, savePageContent, updateDocumentTitle, deleteDocument } from '@/lib/db/documents'
import { saveVideoDetails, saveFileDetails, deleteDocumentFile } from '@/lib/db/document-artifacts'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

function BlockEditor({ initialContent, onSave }: { initialContent: any[], onSave: (blocks: any[]) => void }) {
    const [blocks, setBlocks] = useState<any[]>(initialContent || [])
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Auto-save logic
    const debouncedSave = (newBlocks: any[]) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
            onSave(newBlocks)
        }, 500) // Reduced from 1000ms to 500ms for faster save, but not flood
    }

    const updateBlock = (index: number, val: string) => {
        const newBlocks = [...blocks]
        const oldBlock = newBlocks[index]

        // Simple YouTube Detection
        if (oldBlock.type === 'paragraph' && (val.includes('youtube.com/watch') || val.includes('youtu.be/'))) {
            newBlocks[index] = { type: 'video', content: val }
        } else {
            newBlocks[index] = { ...oldBlock, content: val }
        }

        setBlocks(newBlocks)
        debouncedSave(newBlocks)
    }

    const addBlock = (type: string = 'paragraph', index?: number) => {
        const insertIndex = index !== undefined ? index + 1 : blocks.length;
        const newBlocks = [...blocks]
        newBlocks.splice(insertIndex, 0, { type, content: '' })
        setBlocks(newBlocks)
        debouncedSave(newBlocks) // Save immediately on structure change
    }

    const removeBlock = (index: number) => {
        const newBlocks = [...blocks]
        newBlocks.splice(index, 1)
        setBlocks(newBlocks)
        debouncedSave(newBlocks) // Save immediately on structure change
    }

    const handleKeyDown = (e: React.KeyboardEvent, index: number, type: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            addBlock(type === 'heading' ? 'paragraph' : type, index)
        } else if (e.key === 'Backspace' && blocks[index].content === '' && blocks.length > 1) {
            e.preventDefault()
            removeBlock(index)
        }
    }

    return (
        <div className="space-y-2 max-w-3xl">
            {blocks.map((block, i) => (
                <div key={i} className="group relative flex items-start gap-2">
                    {/* Block Controls (Hover) */}
                    <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                        <button className="text-gray-400 hover:text-red-500 p-0.5" title="Remover" onClick={() => removeBlock(i)}>
                            <X className="h-3 w-3" />
                        </button>
                    </div>

                    {/* Block Render */}
                    <div className="flex-1 min-w-0">
                        {block.type === 'heading' ? (
                            <input
                                className="w-full text-2xl font-bold border-none focus:ring-0 p-0 placeholder-gray-300 bg-transparent"
                                placeholder="Título section"
                                value={block.content}
                                onChange={(e) => updateBlock(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, i, 'heading')}
                                autoFocus={blocks.length > 0 && String(blocks[blocks.length - 1].content) === '' && i === blocks.length - 1}
                            />
                        ) : block.type === 'bullet-list' ? (
                            <div className="flex items-start gap-2">
                                <div className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-800 shrink-0" />
                                <textarea
                                    className="w-full resize-none overflow-hidden bg-transparent border-none focus:ring-0 p-0 text-gray-700 placeholder-gray-300 leading-relaxed"
                                    placeholder="Item da lista"
                                    rows={1}
                                    value={block.content}
                                    onChange={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                        updateBlock(i, e.target.value)
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, i, 'bullet-list')}
                                />
                            </div>
                        ) : block.type === 'numbered-list' ? (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-500 select-none mt-0.5">1.</span>
                                <textarea
                                    className="w-full resize-none overflow-hidden bg-transparent border-none focus:ring-0 p-0 text-gray-700 placeholder-gray-300 leading-relaxed"
                                    placeholder="Item numerado"
                                    rows={1}
                                    value={block.content}
                                    onChange={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                        updateBlock(i, e.target.value)
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, i, 'numbered-list')}
                                />
                            </div>
                        ) : block.type === 'divider' ? (
                            <div className="py-4">
                                <hr className="border-t border-gray-200" />
                            </div>
                        ) : block.type === 'video' ? (
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden my-2 border border-gray-200 shadow-sm relative group/video">
                                <iframe
                                    src={block.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                                <button className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-red-500 hover:bg-white opacity-0 group-hover/video:opacity-100 transition-opacity" onClick={() => {
                                    const newBlocks = [...blocks];
                                    newBlocks[i] = { type: 'paragraph', content: block.content };
                                    setBlocks(newBlocks);
                                }}>
                                    <Pencil className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <textarea
                                className="w-full resize-none overflow-hidden bg-transparent border-none focus:ring-0 p-0 text-gray-700 placeholder-gray-300 leading-relaxed"
                                placeholder={"Digite '/' para comandos..."}
                                rows={1}
                                value={block.content}
                                onChange={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                    updateBlock(i, e.target.value)
                                }}
                                onKeyDown={(e) => handleKeyDown(e, i, 'paragraph')}
                            />
                        )}
                    </div>
                </div>
            ))}

            {/* Quick Add Menu */}
            <div className="pt-4 border-t border-gray-100 flex gap-2 flex-wrap text-sm text-gray-500 opacity-40 hover:opacity-100 transition-opacity duration-200">
                <button onClick={() => addBlock('paragraph')} className="hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><FileText className="h-3 w-3" /> Texto</button>
                <button onClick={() => addBlock('heading')} className="hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><span className="font-bold text-xs">H1</span> Título</button>
                <button onClick={() => addBlock('bullet-list')} className="hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><List className="h-3 w-3" /> Lista</button>
                <button onClick={() => addBlock('numbered-list')} className="hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><ListOrdered className="h-3 w-3" /> Num</button>
                <button onClick={() => addBlock('divider')} className="hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><Minus className="h-3 w-3" /> Divisor</button>
            </div>

            {blocks.length === 0 && (
                <div className="text-gray-400 italic cursor-pointer p-4 border border-dashed rounded-lg hover:bg-gray-50" onClick={() => addBlock()}>
                    Clique para começar a escrever...
                </div>
            )}
        </div>
    )
}

export function DocumentEditor({ id }: { id: string }) {
    const [doc, setDoc] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const router = useRouter()

    // Video States
    const [videoUrl, setVideoUrl] = useState('')

    // File States
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Realtime
    useEffect(() => {
        load()

        const supabase = createClient()
        const channel = supabase
            .channel('document-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'documents', filter: `id=eq.${id}` },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setTitle(payload.new.title)
                        setDoc((prev: any) => prev ? { ...prev, ...payload.new } : null)
                    }
                    if (payload.eventType === 'DELETE') {
                        router.push('/documents')
                        router.refresh()
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'document_pages', filter: `document_id=eq.${id}` },
                (payload) => {
                    load()
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'document_files', filter: `document_id=eq.${id}` },
                () => {
                    load()
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'document_videos', filter: `document_id=eq.${id}` },
                () => {
                    load()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    const load = async () => {
        const data = await getDocument(id)
        if (data) {
            setDoc(data)
            setTitle(data.title)
            if (data.video) setVideoUrl(data.video.video_url)
        }
        setLoading(false)
    }

    const handleTitleChange = async (val: string) => {
        setTitle(val)
        updateDocumentTitle(id, val)
    }

    const handleContentSave = async (blocks: any[]) => {
        await savePageContent(id, blocks)
    }

    const handleVideoBlur = async () => {
        if (!videoUrl || videoUrl === doc.video?.video_url) return
        let provider = 'custom'
        if (videoUrl.includes('youtube')) provider = 'youtube'
        if (videoUrl.includes('vimeo')) provider = 'vimeo'
        if (videoUrl.includes('loom')) provider = 'loom'

        await saveVideoDetails(id, provider, videoUrl)
    }

    const handleDeleteDocument = async () => {
        if (!confirm('Tem certeza que deseja excluir este documento?')) return

        setLoading(true)
        const { error } = await deleteDocument(id)
        if (error) {
            alert('Erro ao excluir documento')
            setLoading(false)
        } else {
            router.push('/documents')
            router.refresh()
        }
    }

    const handleDeleteFile = async (fileId: string, filePath: string) => {
        if (!confirm('Tem certeza que deseja excluir este anexo?')) return

        const { error } = await deleteDocumentFile(fileId, filePath)
        if (error) {
            alert('Erro ao excluir arquivo')
        }
    }

    const uploadFile = async (file: File) => {
        setUploading(true)
        const supabase = createClient()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${Date.now()}-${sanitizedName}`

        try {
            const { data, error } = await supabase.storage
                .from('documents-files')
                .upload(fileName, file)

            if (error) throw error

            const { data: publicUrl } = supabase.storage.from('documents-files').getPublicUrl(fileName)

            const { error: dbError } = await saveFileDetails(id, publicUrl.publicUrl, file.name, file.size, file.type)
            if (dbError) throw dbError

            await load()
        } catch (err: any) {
            console.error('Upload error:', err)
            alert('Falha ao enviar arquivo: ' + (err.message || 'Erro desconhecido'))
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (doc.doc_type !== 'page') return

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            await uploadFile(files[0])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isDragging && doc.doc_type === 'page') setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isDragging) setIsDragging(false)
    }

    const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) await uploadFile(file)
    }

    if (loading) return <div className="flex items-center justify-center h-full text-gray-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando...</div>
    if (!doc) return <div className="flex items-center justify-center h-full text-gray-400">Documento não encontrado</div>

    return (
        <div
            className={cn("flex flex-col h-full bg-white relative", isDragging && "bg-indigo-50")}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-50/90 border-4 border-indigo-200 border-dashed m-4 rounded-xl">
                    <div className="text-indigo-600 font-medium text-lg flex flex-col items-center">
                        <Upload className="h-12 w-12 mb-2" />
                        Solte para anexar arquivo
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="h-16 border-b border-gray-100 flex items-center px-8 justify-between shrink-0">
                <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded bg-gray-50 text-gray-500">
                        {doc.doc_type === 'page' ? <FileText className="h-5 w-5" /> :
                            doc.doc_type === 'video' ? <MonitorPlay className="h-5 w-5" /> : <FileIcon className="h-5 w-5" />}
                    </div>
                    <input
                        className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:ring-0 p-0 placeholder-gray-300 w-full"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Sem título"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-300">
                        {uploading ? 'Enviando...' : 'Salvo'}
                    </div>
                    <button
                        onClick={handleDeleteDocument}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Excluir documento"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                {doc.doc_type === 'page' && (
                    <>
                        <BlockEditor
                            key={doc.updated_at}
                            initialContent={doc.content?.[0]?.content_json || []}
                            onSave={handleContentSave}
                        />

                        {/* Attachments Section */}
                        {doc.files && doc.files.length > 0 && (
                            <div className="mt-12 pt-6 border-t border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    Anexos ({doc.files.length})
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {doc.files.map((file: any) => (
                                        <div key={file.id} className="p-3 border rounded-lg flex items-center gap-3 bg-gray-50/50 hover:bg-gray-100 transition-colors group">
                                            <div className="h-8 w-8 bg-white rounded border flex items-center justify-center text-gray-400">
                                                <FileIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-700 truncate" title={file.file_name}>{file.file_name}</div>
                                                <div className="text-xs text-gray-400">{(file.size_bytes / 1024 / 1024).toFixed(2)} MB</div>
                                            </div>
                                            <a href={file.file_path} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600 rounded bg-white border border-transparent hover:border-indigo-100" title="Abrir">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                            <button
                                                onClick={() => handleDeleteFile(file.id, file.file_path)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-white border border-transparent hover:border-red-100"
                                                title="Excluir anexo"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {doc.doc_type === 'video' && (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">URL do Vídeo</label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://..."
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                onBlur={handleVideoBlur}
                            />
                        </div>
                        <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center text-white overflow-hidden shadow-lg">
                            {doc.video ? (
                                <iframe
                                    src={doc.video.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            ) : (
                                <span className="text-gray-500">Adicione uma URL para visualizar</span>
                            )}
                        </div>
                    </div>
                )}

                {doc.doc_type === 'file' && (
                    <div className="space-y-6">
                        {doc.files && doc.files.length > 0 ? (
                            <div className="p-4 border rounded-xl flex items-center gap-4 bg-gray-50">
                                <div className="h-10 w-10 bg-white rounded-lg border flex items-center justify-center text-gray-400">
                                    <FileIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{doc.files[0].file_name}</div>
                                    <div className="text-xs text-gray-500">{(doc.files[0].size_bytes / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                                <a href={doc.files[0].file_path} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title="Abrir">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                                <button
                                    onClick={() => handleDeleteFile(doc.files[0].id, doc.files[0].file_path)}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded bg-white border border-transparent hover:border-red-100"
                                    title="Excluir arquivo"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div
                                className="p-12 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                                ) : (
                                    <Upload className="h-8 w-8 mb-2" />
                                )}
                                <span className="text-sm font-medium text-gray-600">Clique para enviar um arquivo</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUploadChange}
                                    disabled={uploading}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
