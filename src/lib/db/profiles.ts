'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('id, name, avatar_url, email').order('name')
    return data || []
}

export async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    return profile
}

export async function updateProfile(userId: string, data: { name: string }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({ name: data.name })
        .eq('id', userId)

    if (!error) {
        revalidatePath('/', 'layout') // Revalidate everything to update name everywhere
    }

    return { error }
}
