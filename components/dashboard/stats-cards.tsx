'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet, Calendar, Target, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface StatsCardsProps {
  balance: number
  totalIncome: number
  totalExpenses: number
  scheduledCount: number
}

export function StatsCards({ balance, totalIncome, totalExpenses, scheduledCount }: StatsCardsProps) {
  const balanceChange = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0
  const expenseRatio = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100) : 0

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full -mr-10 -mt-10 opacity-20"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Saldo do Mês
          </CardTitle>
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(balance)}
          </div>
          <div className="flex items-center mt-2">
            <Badge 
              variant="secondary" 
              className={`text-xs ${balance >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}
            >
              {balance >= 0 ? 'Positivo' : 'Negativo'}
            </Badge>
          </div>

        </CardContent>
      </Card>
      
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full -mr-10 -mt-10 opacity-20"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
            Receitas do Mês
          </CardTitle>
          <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalIncome)}
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            <span className="text-xs text-green-600 font-medium">
              +{balanceChange.toFixed(1)}% vs despesas
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full -mr-10 -mt-10 opacity-20"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
            Despesas do Mês
          </CardTitle>
          <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg">
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalExpenses)}
          </div>
          <div className="flex items-center mt-2">
            <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            <span className="text-xs text-red-600 font-medium">
              {expenseRatio.toFixed(1)}% das receitas
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full -mr-10 -mt-10 opacity-20"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Agendamentos
          </CardTitle>
          <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {scheduledCount}
          </div>
          <div className="flex items-center mt-2">
            <Calendar className="h-3 w-3 text-purple-600 mr-1" />
            <span className="text-xs text-purple-600 font-medium">
              Próximos 30 dias
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}