'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useTheme } from 'next-themes'
import { Bell, Sun, Moon, User, LogOut, RefreshCw } from 'lucide-react'
import { getUserScheduleAlerts, formatDateUTC } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ProfileModal } from '@/components/auth/profile-modal'

export function Navbar() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<{ overdue: any[]; upcoming: any[] }>({ overdue: [], upcoming: [] })
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    if (user) {
      setNotifications(await getUserScheduleAlerts(user.id))
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: 'Logout realizado com sucesso!',
        description: 'Você foi desconectado do sistema.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao fazer logout',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  // Função para atualizar notificações manualmente
  const handleRefreshNotifications = async () => {
    if (user) {
      setNotifications(await getUserScheduleAlerts(user.id))
      toast({ title: 'Notificações atualizadas!' })
    }
  }

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between px-2 sm:px-6 w-full">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center">
            <img src="/logo-designops.png" alt="Logo" className="h-9 w-auto drop-shadow-md" />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-10 w-10 flex items-center justify-center"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 flex items-center justify-center"
                aria-label="Notificações"
                title="Notificações"
              >
                <Bell className="h-5 w-5 text-blue-500" />
                {(notifications.overdue.length > 0 || notifications.upcoming.length > 0) && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" aria-label="Novas notificações"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 w-96 max-w-xs sm:max-w-sm" align="end" forceMount>
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" /> Notificações
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8"
                      onClick={handleRefreshNotifications}
                      title="Atualizar notificações"
                      aria-label="Atualizar notificações"
                    >
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="max-h-80">
                    {notifications.overdue.length === 0 && notifications.upcoming.length === 0 && (
                      <Alert className="mt-2" variant="default">
                        <AlertTitle>Nenhuma notificação</AlertTitle>
                        <AlertDescription>Você está em dia com sua agenda financeira.</AlertDescription>
                      </Alert>
                    )}
                    {notifications.upcoming.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Próximos 7 dias</div>
                        {notifications.upcoming.map((item, idx) => {
                          const tipo = item.type === 'income' ? 'Recebimento' : 'Pagamento';
                          const categoria = item.category.toUpperCase();
                          const categoriaPadrao = ['recebimento', 'pagamento'];
                          const mostrarCategoria = !categoriaPadrao.includes(categoria.toLowerCase());
                          return (
                            <Link href="/schedule" key={item.id || idx} legacyBehavior>
                              <a className="block">
                                <div className="flex items-center gap-3 rounded-md bg-blue-50 dark:bg-blue-950/40 p-3 mb-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition">
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{tipo}</span>
                                      {mostrarCategoria && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${item.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>{categoria}</span>
                                      )}
                                    </div>
                                    <div className="font-medium truncate text-sm mt-1">{item.description}</div>
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">{formatDateUTC(item.scheduled_date)}</div>
                                  </div>
                                  <span className="text-xs font-semibold text-blue-600">Próximo</span>
                                </div>
                              </a>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    {notifications.overdue.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Atrasados</div>
                        {notifications.overdue.map((item, idx) => {
                          const tipo = item.type === 'income' ? 'Recebimento' : 'Pagamento';
                          const categoria = item.category.toUpperCase();
                          const categoriaPadrao = ['recebimento', 'pagamento'];
                          const mostrarCategoria = !categoriaPadrao.includes(categoria.toLowerCase());
                          return (
                            <Link href="/schedule" key={item.id || idx} legacyBehavior>
                              <a className="block">
                                <div className="flex items-center gap-3 rounded-md bg-red-50 dark:bg-red-950/40 p-3 mb-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 transition">
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{tipo}</span>
                                      {mostrarCategoria && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${item.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>{categoria}</span>
                                      )}
                                    </div>
                                    <div className="font-medium truncate text-sm mt-1">{item.description}</div>
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">{formatDateUTC(item.scheduled_date)}</div>
                                  </div>
                                  <span className="text-xs font-semibold text-red-600">Atrasado</span>
                                </div>
                              </a>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 flex items-center justify-center">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                    {user?.email ? getUserInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Minha Conta</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modais */}
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </nav>
  )
}