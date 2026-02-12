'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Loader2, Bold, Italic, List, Paperclip, FileText, ChevronLeft, ImageIcon, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Type, ListOrdered, CheckSquare } from 'lucide-react'

interface DocumentEditorProps {
    initialId?: string
    initialTitle?: string
    initialContent?: any
}

export function DocumentEditor({ initialId, initialTitle = '', initialContent }: DocumentEditorProps) {
    const [title, setTitle] = useState(initialTitle)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [docId, setDocId] = useState<string | null>(initialId || null)

    // Attachments State
    const [attachments, setAttachments] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const supabase = createClient()

    const editor = useEditor({
        extensions: [
            StarterKit, // Includes BulletList, OrderedList, Heading, etc.
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content: initialContent || '',
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[800px] marker:text-gray-400', // Prose for styling
            },
        },
        immediatelyRender: false,
    })

    // Update internal state if props change (switching docs)
    useEffect(() => {
        if (initialId !== docId) {
            setDocId(initialId || null)
            setTitle(initialTitle)
            editor?.commands.setContent(initialContent || '')
            if (initialId) fetchAttachments(initialId)
            else setAttachments([])
        }
    }, [initialId, initialTitle, initialContent, editor])

    const fetchAttachments = async (id: string) => {
        const { data } = await supabase.from('doc_attachments').select('*').eq('page_id', id).order('created_at', { ascending: false })
        if (data) setAttachments(data)
    }

    const handleSave = async () => {
        if (!editor || !docId) return

        setIsSaving(true)
        try {
            const content = editor.getJSON()

            const payload: any = {
                conteudo: content,
                updated_at: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('documentos')
                .update(payload)
                .eq('id', docId)
                .select()
                .single()

            if (error) throw error

            if (data) {
                setLastSaved(new Date())
            }

        } catch (error: any) {
            console.error('Erro ao salvar:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Image Upload
    const handleAddImage = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e: any) => {
            const file = e.target.files[0]
            if (file) {
                const url = await uploadImage(file)
                if (url && editor) {
                    editor.chain().focus().setImage({ src: url }).run()
                }
            }
        }
        input.click()
    }

    const uploadImage = async (file: File): Promise<string | null> => {
        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `editor-images/${Math.random().toString(36).substr(2, 9)}.${fileExt}`

            const { error: uploadError } = await supabase.storage.from('arquivos').upload(fileName, file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('arquivos').getPublicUrl(fileName)
            return publicUrl
        } catch (error: any) {
            console.error('Upload failed:', error)
            alert('Erro no upload de imagem')
            return null
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !docId) {
            if (!docId) alert('Salve o documento antes de usar anexos.')
            return
        }

        setIsUploading(true)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${docId}/${Math.random().toString(36).substr(2, 9)}.${fileExt}`

        try {
            const { error: uploadError } = await supabase.storage.from('arquivos').upload(fileName, file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('arquivos').getPublicUrl(fileName)

            const { error: dbError } = await supabase.from('doc_attachments').insert({
                page_id: docId,
                file_name: file.name,
                file_url: publicUrl,
                file_type: file.type,
                size_bytes: file.size
            })
            if (dbError) throw dbError

            fetchAttachments(docId)

        } catch (error: any) {
            console.error('Upload failed:', error)
        } finally {
            setIsUploading(false)
        }
    }

    if (!editor) return null

    return (
        <div className="flex flex-col h-screen bg-[#F0F2F5] overflow-hidden relative">

            {/* Status & Save Button */}
            <div className="absolute top-4 right-8 z-50 flex items-center gap-2">
                <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm border border-gray-100">
                    {isSaving ? 'Salvando...' : lastSaved ? `Salvo ${lastSaved.toLocaleTimeString()}` : 'Pronto'}
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-[#C2E7FF] text-[#001D35] px-4 py-2 rounded-full hover:bg-[#b3dfff] transition-colors font-medium text-sm shadow-sm"
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                </button>
            </div>


            {/* Toolbar (Enhanced) */}
            <div className="bg-[#EDF2FA] px-4 py-1.5 flex items-center gap-1.5 border-b border-gray-300 shrink-0 z-10 mx-4 my-2 rounded-full justify-center max-w-5xl self-center shadow-sm">
                <button onClick={() => editor.chain().focus().undo().run()} className="p-1.5 hover:bg-black/5 rounded text-gray-700"><ChevronLeft className="h-4 w-4" /></button>
                <div className="h-4 w-px bg-gray-300 mx-1" />

                {/* Text Style / Headings */}
                <button onClick={() => editor.chain().focus().setParagraph().run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive('paragraph') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} title="Normal Text"><Type className="h-4 w-4" /></button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} title="Heading 1"><Heading1 className="h-4 w-4" /></button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} title="Heading 2"><Heading2 className="h-4 w-4" /></button>

                <div className="h-4 w-px bg-gray-300 mx-1" />

                {/* Alignment */}
                <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} title="Align Left"><AlignLeft className="h-4 w-4" /></button>
                <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} title="Align Center"><AlignCenter className="h-4 w-4" /></button>
                <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} title="Align Right"><AlignRight className="h-4 w-4" /></button>

                <div className="h-4 w-px bg-gray-300 mx-1" />

                <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}><Bold className="h-4 w-4" /></button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}><Italic className="h-4 w-4" /></button>

                <div className="h-4 w-px bg-gray-300 mx-1" />

                {/* Lists */}
                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} title="Lista de Pontos"><List className="h-4 w-4" /></button>
                <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} title="Lista Numérica"><ListOrdered className="h-4 w-4" /></button>
                <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-1.5 rounded hover:bg-black/5 ${editor.isActive('taskList') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} title="Lista de Tarefas"><CheckSquare className="h-4 w-4" /></button>

                <div className="h-4 w-px bg-gray-300 mx-1" />
                <button onClick={handleAddImage} className="p-1.5 rounded hover:bg-black/5 text-gray-700" title="Inserir Imagem (Upload)"><ImageIcon className="h-4 w-4" /></button>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col items-center py-8 px-4" onClick={() => editor.chain().focus().run()}>
                <div className="w-full max-w-[850px] bg-white text-black shadow-md min-h-[1100px] p-12 sm:p-16 mb-8 cursor-text border border-gray-200 relative" onClick={(e) => e.stopPropagation()}>
                    <EditorContent editor={editor} />
                </div>
                {/* Attachments Section... */}
                {docId && (
                    <div className="w-full max-w-[850px] mb-20">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Anexos</h3>
                            <div className="relative">
                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploading} />
                                <button className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors font-medium">
                                    {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />} Adicionar
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center p-2 bg-white border border-gray-200 rounded hover:shadow-sm">
                                    <div className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded text-gray-500 mr-3"><FileText className="h-4 w-4" /></div>
                                    <span className="text-sm text-gray-700 flex-1 truncate">{att.file_name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
