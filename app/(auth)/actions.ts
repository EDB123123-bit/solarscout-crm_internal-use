'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { error: 'Supabase is niet geconfigureerd. Voeg de omgevingsvariabelen toe aan .env.local.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: 'Ongeldig e-mailadres of wachtwoord.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function register(formData: FormData) {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { error: 'Supabase is niet geconfigureerd. Voeg de omgevingsvariabelen toe aan .env.local.' }
  }

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        first_name: (formData.get('first_name') as string)?.trim() ?? '',
        last_name: (formData.get('last_name') as string)?.trim() ?? '',
        company_name: (formData.get('company_name') as string)?.trim() ?? '',
        company_vat: (formData.get('company_vat') as string)?.trim() ?? '',
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Dit e-mailadres is al geregistreerd.' }
    }
    return { error: 'Registratie mislukt. Probeer het opnieuw.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function forgotPassword(formData: FormData) {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { success: true }
  }

  const email = (formData.get('email') as string)?.trim()
  if (!email) return { error: 'Vul je e-mailadres in.' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  })

  // Always return success to prevent email enumeration.
  return { success: true }
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // If Supabase is not configured, just redirect
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}
