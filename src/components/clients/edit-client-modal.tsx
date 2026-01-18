'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { updateClientAction } from '@/app/(app)/clients/actions'
import { Loader2, AlertCircle } from 'lucide-react'

const PREDEFINED_SEGMENTS = [
    'Varejo',
    'Tecnologia',
    'Saúde',
    'Educação',
    'Indústria',
    'Serviços',
    'Imobiliário',
    'Financeiro',
    'Marketing'
]

export function EditClientModal({ isOpen, onClose, client }: { isOpen: boolean; onClose: () => void; client: any }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form States
    const [segmentMode, setSegmentMode] = useState<'select' | 'create'>('select')
    const [customSegment, setCustomSegment] = useState('')
    const [selectedSegment, setSelectedSegment] = useState('')
    const [ticketValue, setTicketValue] = useState('')

    // Initial values
    useEffect(() => {
        if (client) {
            setSelectedSegment(PREDEFINED_SEGMENTS.includes(client.segment) ? client.segment : '')
            if (client.segment && !PREDEFINED_SEGMENTS.includes(client.segment)) {
                setSegmentMode('create')
                setCustomSegment(client.segment)
            } else {
                setSegmentMode('select')
                setCustomSegment('')
            }

            if (client.ticket) {
                const formatted = (client.ticket / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                // Fix: check if ticket is stored as float or integer (cents). Usually float in DB? 
                // Plan assumed float. Let's check existing code. Actions used Number(). 
                // If saved as 1500.00 -> display "R$ 1.500,00".
                // If saved as float, no need to divide by 100.
                // Let's assume standard float input.
                const val = typeof client.ticket === 'number' ? client.ticket : parseFloat(client.ticket)
                setTicketValue(val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
            } else {
                setTicketValue('')
            }
        }
    }, [client])

    // Handles format currency
    const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '')
        const floatValue = parseFloat(value) / 100
        if (isNaN(floatValue)) {
            setTicketValue('')
            return
        }
        setTicketValue(floatValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)
        formData.append('id', client.id)

        const finalSegment = segmentMode === 'create' ? customSegment : selectedSegment
        formData.set('segment', finalSegment)

        const cleanTicket = ticketValue.replace(/[^\d,]/g, '').replace(',', '.')
        if (cleanTicket) {
            formData.set('ticket', cleanTicket)
        }

        // Preserve existing contract URL if not replaced? 
        // Backend handles file upload. If no file, it keeps existing if we don't send null.
        // We just send file if selected.

        const result = await updateClientAction(formData)

        setLoading(false)

        if (result?.error) {
            setError(result.error)
        } else {
            onClose()
            // Optional: trigger refresh parent? Actions revalidate path.
            window.location.reload() // Force reload to ensure everything updates if needed, though revalidatePath should handle it.
        }
    }

    if (!client) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Cliente">
            <form onSubmit={onSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                        <input type="text" name="name" id="name" required defaultValue={client.name}
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ</label>
                        <input type="text" name="cnpj" id="cnpj" defaultValue={client.cnpj} placeholder="00.000.000/0000-00"
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select name="type" id="type" defaultValue={client.type} className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2">
                            <option value="PJ">Pessoa Jurídica</option>
                            <option value="PF">Pessoa Física</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="payment_type" className="block text-sm font-medium text-gray-700">Periodicidade</label>
                        <select name="payment_type" id="payment_type" defaultValue={client.payment_type} className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2">
                            <option value="Recorrente">Recorrente (MRR)</option>
                            <option value="Pontual">Único (Pontual)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="segment" className="block text-sm font-medium text-gray-700">Segmento</label>
                    {segmentMode === 'select' ? (
                        <div className="flex gap-2">
                            <select name="segment_select" value={selectedSegment} onChange={(e) => {
                                if (e.target.value === 'NEW') setSegmentMode('create')
                                else setSelectedSegment(e.target.value)
                            }}
                                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                            >
                                <option value="">Selecione...</option>
                                {PREDEFINED_SEGMENTS.map(seg => <option key={seg} value={seg}>{seg}</option>)}
                                <option value="NEW" className="font-semibold text-indigo-600">+ Criar Novo Segmento</option>
                            </select>
                        </div>
                    ) : (
                        <div className="flex gap-2 mt-1">
                            <input type="text" value={customSegment} onChange={(e) => setCustomSegment(e.target.value)} placeholder="Digite o novo segmento..."
                                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2" autoFocus
                            />
                            <button type="button" onClick={() => setSegmentMode('select')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >Cancelar</button>
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="contract_file" className="block text-sm font-medium text-gray-700">Contrato (PDF)</label>
                    {client.contract_url && (
                        <div className="text-sm text-green-600 mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <a href={client.contract_url} target="_blank" className="underline hover:text-green-800">Contrato Atual (Clique para ver)</a>
                        </div>
                    )}
                    <input type="file" name="contract_file" id="contract_file" accept="application/pdf"
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Faça upload para substituir o contrato atual.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contract_start" className="block text-sm font-medium text-gray-700">Início do Contrato</label>
                        <input type="date" name="contract_start" id="contract_start" defaultValue={client.contract_start}
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="contract_end" className="block text-sm font-medium text-gray-700">Fim do Contrato</label>
                        <input type="date" name="contract_end" id="contract_end" defaultValue={client.contract_end}
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="ticket" className="block text-sm font-medium text-gray-700">Valor do Contrato</label>
                        <input type="text" name="ticket_display" id="ticket" value={ticketValue} onChange={handleTicketChange} placeholder="R$ 0,00"
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="status" defaultValue={client.status} className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2">
                            <option value="Ativo">Ativo</option>
                            <option value="Pausado">Pausado</option>
                            <option value="Inadimplente">Inadimplente</option>
                            <option value="Encerrado">Encerrado</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex"><div className="ml-3"><h3 className="text-sm font-medium text-red-800">Erro ao salvar</h3><div className="mt-2 text-sm text-red-700"><p>{error}</p></div></div></div>
                    </div>
                )}

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse border-t pt-4">
                    <button type="submit" disabled={loading}
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button type="button" onClick={onClose}
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </Modal>
    )
}
