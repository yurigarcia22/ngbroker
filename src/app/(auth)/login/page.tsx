'use client'

import { useActionState } from 'react'
import { login, signup } from './actions'
import { Loader2, LayoutDashboard } from 'lucide-react'

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
        <div className="flex min-h-screen">
            {/* Left Side - Visual & Branding */}
            <div className="hidden lg:flex w-1/2 bg-indigo-900 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 to-purple-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1574&q=80')] bg-cover bg-center mix-blend-overlay" />

                <div className="relative z-10 p-12 text-white max-w-lg">
                    <div className="mb-8 p-3 bg-white/10 w-fit rounded-lg backdrop-blur-sm">
                        <LayoutDashboard className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-6 leading-tight">
                        Gerencie seus clientes com excelência e precisão.
                    </h1>
                    <p className="text-indigo-200 text-lg mb-8">
                        A plataforma completa para gestão, acompanhamento e crescimento do seu negócio.
                    </p>

                    <div className="flex items-center gap-4 text-sm text-indigo-300">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-8 w-8 rounded-full border-2 border-indigo-900 bg-indigo-400 flex items-center justify-center text-xs font-bold text-white">
                                    NG
                                </div>
                            ))}
                        </div>
                        <span>Confiança de +100 corretores</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center lg:hidden mb-4">
                            <LayoutDashboard className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Bem-vindo de volta
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Acesse sua conta para continuar
                        </p>
                    </div>

                    <form className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email corporativo
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="seu@email.com"
                                        className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
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
                                        placeholder="••••••••"
                                        className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {(stateLogin?.error || stateSignup?.error) && (
                            <div className="rounded-lg bg-red-50 p-4 border border-red-100 animate-fade-in">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            {stateLogin?.error || stateSignup?.error}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 mt-8">
                            <button
                                formAction={formActionLogin}
                                disabled={isPendingLogin}
                                type="submit"
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                            >
                                {isPendingLogin ? <Loader2 className="animate-spin h-5 w-5" /> : 'Entrar na Plataforma'}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">ou</span>
                                </div>
                            </div>

                            <button
                                formAction={formActionSignup}
                                disabled={isPendingSignup}
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70"
                            >
                                {isPendingSignup ? <Loader2 className="animate-spin h-5 w-5" /> : 'Criar nova conta'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-400">
                        &copy; 2025 Grupo NG. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    )
}
