'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getClients(query?: string, status?: string) {
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

    const { error } = await supabase.from('clients').insert({
        name,
        type,
        segment,
        ticket,
        status,
        owner_user_id: user.id
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
