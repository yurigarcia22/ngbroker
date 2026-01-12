'use client'

import { useActionState } from 'react'
import { login, signup } from './actions'
import { Loader2 } from 'lucide-react'

// Initial state for the form
const initialState = {
    error: '',
}

export default function LoginPage() {
    const [stateLogin, formActionLogin, isPendingLogin] = useActionState(async (prevState: any, formData: FormData) => {
        const res = await login(formData)
        if (res?.error) return { error: res.error }
        return { error: '' }
    }, initialState)

    const [stateSignup, formActionSignup, isPendingSignup] = useActionState(async (prevState: any, formData: FormData) => {
        const res = await signup(formData)
        if (res?.error) return { error: res.error }
        return { error: '' }
    }, initialState)

    return (
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        NGBroker
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Faça login para acessar sua conta
                    </p>
                </div>

                <form className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Endereço de e-mail
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Senha
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {(stateLogin?.error || stateSignup?.error) && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {stateLogin?.error || stateSignup?.error}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            formAction={formActionLogin}
                            disabled={isPendingLogin}
                            type="submit"
                            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isPendingLogin ? <Loader2 className="animate-spin h-5 w-5" /> : 'Entrar'}
                        </button>
                        <button
                            formAction={formActionSignup}
                            disabled={isPendingSignup}
                            type="submit"
                            className="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isPendingSignup ? <Loader2 className="animate-spin h-5 w-5" /> : 'Criar conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
