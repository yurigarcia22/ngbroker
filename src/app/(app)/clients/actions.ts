'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getClients(query?: string, status?: string, monthFilter?: string) {
    const supabase = await createClient()

    let request = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

    if (query) {
        request = request.ilike('name', `%${query}%`)
    }

    if (status) {
        request = request.eq('status', status)
    }

    if (monthFilter) {
        // monthFilter format: "YYYY-MM"
        // We want clients where [contract_start, contract_end] overlaps with [month_start, month_end]
        // Overlap logic: Start <= EndOfTarget AND (End >= StartOfTarget OR End IS NULL)

        const startOfMonth = `${monthFilter}-01`
        // Calculate end of month roughly or use next month starts logic, 
        // simplified: users usually filter by start date mostly, but let's try to be precise if possible or simple.
        // Supabase/Postgres logic:

        // Let's filter: Client Start <= End of Selected Month AND (Client End >= Start of Selected Month OR Client End is NULL)
        // Since we don't calculate "End of Selected Month" easily in simple string builder without library here,
        // We can just check: contract_start <= last day of month.

        // Actually, easiest way: 
        // contract_start <= 'YYYY-MM-31' roughly? No.

        // Let's use simple string comparison for start for now or just trust Postgres date types.
        // Or better: Filter clients that started BEFORE next month and Ended AFTER this month start.

        const [year, month] = monthFilter.split('-').map(Number)
        const nextMonth = month === 12 ? 1 : month + 1
        const nextMonthYear = month === 12 ? year + 1 : year
        const startOfNextMonth = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`

        request = request.lte('contract_start', startOfNextMonth) // Actually should be strictly less than startOfNextMonth to be in this month? No, start date could be anytime.
        // Wait, "Active in Month M":
        // Started before or during M (start < M+1)
        // Ended after or during M (end >= M) OR End is NULL

        request = request.lt('contract_start', startOfNextMonth)
        request = request.or(`contract_end.gte.${startOfMonth},contract_end.is.null`)
    }

    const { data, error } = await request

    if (error) {
        console.error('Error fetching clients:', error)
        return []
    }

    return data
}

export async function getClient(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching client:', error)
        return null
    }

    return data
}

export async function createClientAction(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const segment = formData.get('segment') as string
    const ticket = formData.get('ticket') ? Number(formData.get('ticket')) : null
    const status = formData.get('status') as string
    const payment_type = formData.get('payment_type') as string
    const cnpj = formData.get('cnpj') as string || null

    // Dates
    const contract_start = formData.get('contract_start') as string || null
    const contract_end = formData.get('contract_end') as string || null

    // File Upload
    let contract_url = null
    const contractFile = formData.get('contract_file') as File

    if (contractFile && contractFile.size > 0) {
        const filename = `${Date.now()}-${contractFile.name}`
        // Assuming 'documents-files' bucket exists as per migration check
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents-files')
            .upload(`contracts/${user.id}/${filename}`, contractFile)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            // We continue without file or return error? Let's return error to be safe
            return { error: 'Erro ao fazer upload do contrato: ' + uploadError.message }
        }

        // Get public URL or just store path. 
        // If bucket is public (which we forced in migration), we can get publicUrl.
        const { data: { publicUrl } } = supabase.storage
            .from('documents-files')
            .getPublicUrl(`contracts/${user.id}/${filename}`)

        contract_url = publicUrl
    }

    const { error } = await supabase.from('clients').insert({
        name,
        type,
        segment,
        ticket,
        status,
        payment_type,
        contract_start,
        contract_end,
        owner_user_id: user.id,
        cnpj,
        contract_url
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/clients')
    return { success: true }
}

export async function updateClientStatus(id: string, status: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('clients')
        .update({ status })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/clients/${id}`)
    revalidatePath('/clients')
    return { success: true }
}

export async function deleteClientAction(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/clients')
    return { success: true }
}

export async function updateClientAction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    const id = formData.get('id') as string
    if (!id) return { error: 'ID do cliente não fornecido' }

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const segment = formData.get('segment') as string
    const ticket = formData.get('ticket') ? Number(formData.get('ticket')) : null
    const status = formData.get('status') as string
    const payment_type = formData.get('payment_type') as string
    const cnpj = formData.get('cnpj') as string || null
    const contract_start = formData.get('contract_start') as string || null
    const contract_end = formData.get('contract_end') as string || null

    const changes: any = {
        name, type, segment, ticket, status, payment_type, cnpj, contract_start, contract_end
    }

    // Handle File Replacement
    const contractFile = formData.get('contract_file') as File
    if (contractFile && contractFile.size > 0) {
        const filename = `${Date.now()}-${contractFile.name}`
        const { error: uploadError } = await supabase.storage
            .from('documents-files')
            .upload(`contracts/${user.id}/${filename}`, contractFile)

        if (uploadError) {
            return { error: 'Erro ao fazer upload do novo contrato: ' + uploadError.message }
        }

        const { data: { publicUrl } } = supabase.storage
            .from('documents-files')
            .getPublicUrl(`contracts/${user.id}/${filename}`)

        changes.contract_url = publicUrl
    }

    const { error } = await supabase
        .from('clients')
        .update(changes)
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/clients/${id}`)
    revalidatePath('/clients')
    return { success: true }
}
