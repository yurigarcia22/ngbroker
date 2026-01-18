'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { getCurrentUser, updateProfile } from '@/lib/db/profiles'
import { Loader2, Save, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserSettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            setLoading(true)
            getCurrentUser().then((profile) => {
                if (profile) {
                    setName(profile.name || '')
                    setUserId(profile.id)
                }
                setLoading(false)
            })
        }
    }, [isOpen])

    const handleSave = async () => {
        if (!userId || !name.trim()) return
        setSaving(true)
        try {
            await updateProfile(userId, { name })
            router.refresh()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Erro ao atualizar perfil')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Configurações de Perfil</DialogTitle>
                    <DialogDescription>
                        Atualize suas informações pessoais aqui.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nome de Exibição
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <input
                                    id="name"
                                    className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading || !name.trim()}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
