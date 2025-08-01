'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { FinancialChart } from '@/components/dashboard/financial-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { UpcomingSchedule } from '@/components/dashboard/upcoming-schedule'
import { Loader2, BarChart3, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getUserScheduleAlerts } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    scheduledCount: 0
  })
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([])
  const [currentMonthDailyData, setCurrentMonthDailyData] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [scheduledTransactions, setScheduledTransactions] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })

      // Fetch scheduled transactions
      const { data: scheduled } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('scheduled_date', { ascending: true })

      // Calculate stats
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const currentMonthTransactions = transactions?.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }) || []

      const totalIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const balance = totalIncome - totalExpenses

      // Prepare monthly chart data (current year - all 12 months)
      const monthsData = []
      for (let month = 0; month < 12; month++) {
        const date = new Date(currentYear, month, 1)
        const monthName = date.toLocaleString('pt-BR', { month: 'short' })
        
        const monthTransactions = transactions?.filter(t => {
          const tDate = new Date(t.date)
          return tDate.getMonth() === month && tDate.getFullYear() === currentYear
        }) || []

        const monthIncome = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const monthExpenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        monthsData.push({
          month: monthName,
          income: monthIncome,
          expenses: monthExpenses,
          balance: monthIncome - monthExpenses
        })
      }

      // Prepare current month daily chart data
      const currentMonthDailyData: Array<{day: string, income: number, expenses: number, balance: number}> = []
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayTransactions = currentMonthTransactions.filter(t => {
          const tDate = new Date(t.date)
          return tDate.getDate() === day
        })

        const dayIncome = dayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const dayExpenses = dayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        currentMonthDailyData.push({
          day: day.toString(),
          income: dayIncome,
          expenses: dayExpenses,
          balance: dayIncome - dayExpenses
        })
      }

      setStats({
        balance,
        totalIncome,
        totalExpenses,
        scheduledCount: scheduled?.length || 0
      })

      setMonthlyChartData(monthsData)
      setCurrentMonthDailyData(currentMonthDailyData)
      setRecentTransactions(transactions?.slice(0, 5) || [])
      setScheduledTransactions(scheduled?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center gap-3 p-4 bg-background border rounded-xl shadow-sm mb-4 max-w-full flex-wrap">
        <div className="p-2 bg-blue-50 dark:bg-blue-950 border rounded-lg shadow-sm flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">Dashboard</h1>
          <span className="text-sm text-muted-foreground">Visão geral completa das suas finanças e projetos</span>
        </div>
      </div>

      <StatsCards
        balance={stats.balance}
        totalIncome={stats.totalIncome}
        totalExpenses={stats.totalExpenses}
        scheduledCount={stats.scheduledCount}
      />

      <FinancialChart monthlyData={monthlyChartData} currentMonthData={currentMonthDailyData} />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentTransactions transactions={recentTransactions} />
        <UpcomingSchedule scheduledTransactions={scheduledTransactions} />
      </div>
    </div>
  )
}