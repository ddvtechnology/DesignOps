'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { formatDateUTC } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ScheduledTransaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  scheduled_date: string
  status: 'scheduled' | 'paid' | 'overdue'
}

interface UpcomingScheduleProps {
  scheduledTransactions: ScheduledTransaction[]
}

export function UpcomingSchedule({ scheduledTransactions }: UpcomingScheduleProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago'
      case 'overdue':
        return 'Atrasado'
      default:
        return 'Agendado'
    }
  }

  return (
    <Card className="border shadow-lg bg-background transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Agenda Financeira</span>
            </CardTitle>
            <CardDescription>Próximos pagamentos e recebimentos</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/schedule">Ver Agenda</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scheduledTransactions.length > 0 ? (
            scheduledTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 dark:bg-green-900' 
                      : 'bg-red-100 dark:bg-red-900'
                  }`}>
                    {getStatusIcon(transaction.status)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateUTC(transaction.scheduled_date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Math.abs(transaction.amount))}
                  </p>
                  <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                    {getStatusText(transaction.status)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Nenhum agendamento encontrado
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/schedule">Criar Agendamento</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}