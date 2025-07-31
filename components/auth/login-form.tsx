'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, DollarSign, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { MagicCard } from '@/components/magicui/magic-card'
import { ShineBorder } from '@/components/magicui/shine-border'
import { InteractiveGridPattern } from '@/components/magicui/interactive-grid-pattern'
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text'
import { ShinyButton } from '@/components/magicui/shiny-button'
import { AuroraText } from '@/components/magicui/aurora-text'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  // Responsividade do grid interativo
  const [gridSize, setGridSize] = useState({ width: 1920, height: 1080 });
  useEffect(() => {
    function handleResize() {
      setGridSize({ width: window.innerWidth, height: window.innerHeight });
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError(null)
    
    const { error } = await signIn(email, password)
    
    if (error) {
      let errorMessage = 'Erro no login'
      let errorDescription = error.message

      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Credenciais inválidas'
        errorDescription = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
        setAuthError('Email ou senha incorretos. Verifique suas credenciais.')
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado'
        errorDescription = 'Verifique sua caixa de entrada e confirme seu email antes de fazer login.'
        setAuthError('Confirme seu email antes de fazer login.')
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Muitas tentativas'
        errorDescription = 'Aguarde alguns minutos antes de tentar novamente.'
        setAuthError('Muitas tentativas de login. Aguarde alguns minutos.')
      } else {
        setAuthError('Erro inesperado. Tente novamente.')
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo ao DesignOps',
      })
      setAuthError(null)
    }
    
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError(null)
    
    const { error } = await signUp(email, password)
    
    if (error) {
      let errorMessage = 'Erro no cadastro'
      let errorDescription = error.message

      if (error.message.includes('User already registered')) {
        errorMessage = 'Email já cadastrado'
        errorDescription = 'Este email já possui uma conta. Tente fazer login ou use outro email.'
        setAuthError('Este email já está cadastrado. Tente fazer login.')
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Senha muito fraca'
        errorDescription = 'A senha deve ter pelo menos 6 caracteres.'
        setAuthError('A senha deve ter pelo menos 6 caracteres.')
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Email inválido'
        errorDescription = 'Por favor, insira um email válido.'
        setAuthError('Por favor, insira um email válido.')
      } else {
        setAuthError('Erro inesperado. Tente novamente.')
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Verifique seu email para confirmar a conta',
      })
      setAuthError(null)
    }
    
    setLoading(false)
  }

  const clearError = () => {
    setAuthError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Fundo animado com grid interativo Magic UI */}
      <div className="fixed inset-0 z-0 w-full h-full min-h-screen min-w-screen overflow-hidden">
        <InteractiveGridPattern 
          className="w-full h-full"
          width={Math.max(32, Math.floor(gridSize.width / 32))}
          height={Math.max(32, Math.floor(gridSize.height / 32))}
          squares={[Math.ceil(gridSize.width / 32), Math.ceil(gridSize.height / 32)]}
          squaresClassName="hover:fill-blue-400/40 transition-all" 
        />
      </div>
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="relative rounded-2xl overflow-visible p-0">
          <div className="relative border border-blue-200 dark:border-blue-900 shadow-2xl shadow-blue-900/40 bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden p-8 flex flex-col gap-6">
            <div className="flex justify-center mb-8">
              <img 
                src="/logo-designops.png" 
                alt="Logo DesignOps" 
                className="w-29 h-20 object-contain drop-shadow-xl" 
                draggable="false"
              />
            </div>
            <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">E-mail</label>
                <input
                      id="email"
                      type="email"
                  autoComplete="email"
                  required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (authError) clearError()
                      }}
                  className="w-full h-11 px-4 rounded-lg border border-blue-300 dark:border-cyan-700 bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    />
                  </div>
                  <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Senha</label>
                <input
                        id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (authError) clearError()
                        }}
                  className="w-full h-11 px-4 rounded-lg border border-blue-300 dark:border-cyan-700 bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
                    </div>
              <button
                    type="submit" 
                className="w-full h-11 text-base font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    disabled={loading}
                  >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Entrar'}
              </button>
              {authError && (
                <Alert variant="destructive" className="animate-slide-up">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
                </form>
                    </div>
                  </div>
      </div>
    </div>
  )
}