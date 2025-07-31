'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  FolderOpen, 
  Calendar,
  FileText,
  TrendingUp,
  Wallet,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral'
  },
  {
    title: 'Transações',
    href: '/transactions',
    icon: CreditCard,
    description: 'Receitas e despesas'
  },
  {
    title: 'Clientes',
    href: '/clients',
    icon: Users,
    description: 'Carteira de clientes'
  },
  {
    title: 'Projetos',
    href: '/projects',
    icon: FolderOpen,
    description: 'Gestão de projetos'
  },
  {
    title: 'Agenda',
    href: '/schedule',
    icon: Calendar,
    description: 'Pagamentos agendados'
  },
  {
    title: 'Relatórios',
    href: '/reports',
    icon: FileText,
    description: 'Exportar dados'
  },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    pendingScheduled: 0,
    activeProjects: 0,
    monthlyBalance: 0
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const cacheRef = useRef<{ data: any; timestamp: number } | null>(null)

  const fetchQuickStats = useCallback(async (force = false) => {
    try {
      // Verificar cache (500ms de cache para ser mais dinâmico)
      const now = Date.now()
      if (!force && cacheRef.current && (now - cacheRef.current.timestamp) < 500) {
        return
      }

      setIsRefreshing(true)
      
      // Queries otimizadas em paralelo
      const [scheduledResult, projectsResult, transactionsResult] = await Promise.all([
        // Fetch pending scheduled transactions
        supabase
          .from('scheduled_transactions')
          .select('id') // Apenas ID para contar
          .eq('user_id', user?.id)
          .eq('status', 'scheduled'),
        
        // Fetch active projects
        supabase
          .from('projects')
          .select('id') // Apenas ID para contar
          .eq('user_id', user?.id)
          .eq('status', 'in_progress'),
        
        // Fetch current month transactions com filtro otimizado
        supabase
          .from('transactions')
          .select('amount, type, date')
          .eq('user_id', user?.id)
      ])

      // Processar resultados
      const pendingScheduled = scheduledResult.data?.length || 0
      const activeProjects = projectsResult.data?.length || 0
      
      // Filtrar transações do mês atual (mesma lógica do dashboard)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const currentMonthTransactions = transactionsResult.data?.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }) || []
      
      const income = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const newStats = {
        pendingScheduled,
        activeProjects,
        monthlyBalance: income - expenses
      }

      // Atualizar estado e cache
      setStats(newStats)
      
      cacheRef.current = {
        data: newStats,
        timestamp: now
      }
      
    } catch (error) {
      console.error('Error fetching quick stats:', error)
      // Em caso de erro, usar cache se disponível
      if (cacheRef.current) {
        setStats(cacheRef.current.data)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.id])

  // Atualização automática otimizada
  useEffect(() => {
    if (user) {
      fetchQuickStats()
      
      // Atualização a cada 5 segundos para ser mais dinâmico
      intervalRef.current = setInterval(() => {
        fetchQuickStats()
      }, 5000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [user, fetchQuickStats])

  // Atualização manual via evento customizado com debounce
  useEffect(() => {
    const handler = () => {
      // Debounce para evitar múltiplas requisições
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      
      debounceRef.current = setTimeout(() => {
        fetchQuickStats(true) // Força atualização
      }, 100) // Reduzido para 100ms para ser mais responsivo
    }
    
    window.addEventListener('refreshSidebarStats', handler)
    return () => {
      window.removeEventListener('refreshSidebarStats', handler)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [fetchQuickStats])

  const handleRefreshStats = async () => {
    await fetchQuickStats(true) // Força atualização
    toast({
      title: 'Estatísticas atualizadas!',
      description: 'Os dados foram atualizados com sucesso.',
    })
  }

  return (
    <nav className={cn('pb-8 w-64 border-r border-border bg-transparent/0 backdrop-blur-md', className)} aria-label="Menu lateral">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <ScrollArea className="h-[calc(100vh-8rem)] px-1 custom-scrollbar">
            <ul className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={isActive ? 'page' : undefined} tabIndex={0}>
                      <div
                    className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150',
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200 shadow-sm'
                            : 'hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-sm text-muted-foreground',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                        )}
                      >
                        <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-600 dark:text-blue-300' : 'text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-300')}/>
                        <div className="flex-1 text-left">
                          <span className="font-medium text-sm leading-tight">{item.title}</span>
                          <span className="block text-xs text-muted-foreground leading-tight">{item.description}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Quick Stats */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold text-muted-foreground">Estatísticas</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleRefreshStats}
                  disabled={isRefreshing}
                  title="Atualizar estatísticas"
                >
                  <RefreshCw className={cn(
                    "h-3 w-3 text-muted-foreground hover:text-blue-600",
                    isRefreshing && "animate-spin"
                  )} />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-1">
              {/* Saldo Mensal */}
              <div className="flex items-center justify-between rounded-xl bg-white/90 dark:bg-muted/60 border border-blue-100 dark:border-none px-3 py-2 shadow-md dark:shadow-sm transition-all duration-150 hover:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-950 group cursor-pointer">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-semibold text-muted-foreground group-hover:text-blue-700 dark:group-hover:text-blue-200">Saldo Mensal</span>
                </div>
                <span className={cn(
                  'text-xs font-bold',
                  stats.monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(stats.monthlyBalance)}
                </span>
              </div>
              {/* Projetos Ativos */}
              <div className="flex items-center justify-between rounded-xl bg-white/90 dark:bg-muted/60 border border-blue-100 dark:border-none px-3 py-2 shadow-md dark:shadow-sm transition-all duration-150 hover:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-950 group cursor-pointer">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-semibold text-muted-foreground group-hover:text-blue-700 dark:group-hover:text-blue-200">Projetos Ativos</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs px-2 py-0.5">
                  {stats.activeProjects}
                </Badge>
              </div>
              {/* Agendados */}
              <div className="flex items-center justify-between rounded-xl bg-white/90 dark:bg-muted/60 border border-blue-100 dark:border-none px-3 py-2 shadow-md dark:shadow-sm transition-all duration-150 hover:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-950 group cursor-pointer">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <span className="text-xs font-semibold text-muted-foreground group-hover:text-blue-700 dark:group-hover:text-blue-200">Agendados</span>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 text-xs px-2 py-0.5">
                  {stats.pendingScheduled}
                </Badge>
              </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </nav>
  )
}