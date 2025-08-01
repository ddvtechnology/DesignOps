'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts'
import React from 'react'

// @ts-ignore - Correção para problemas de tipagem do Recharts
const ResponsiveContainerFixed = ResponsiveContainer as any
const AreaChartFixed = AreaChart as any
const BarChartFixed = BarChart as any
const XAxisFixed = XAxis as any
const YAxisFixed = YAxis as any
const AreaFixed = Area as any
const BarFixed = Bar as any
const CartesianGridFixed = CartesianGrid as any
const TooltipFixed = Tooltip as any

interface FinancialChartProps {
  monthlyData: Array<{
    month: string
    income: number
    expenses: number
    balance: number
  }>
  currentMonthData: Array<{
    day: string
    income: number
    expenses: number
    balance: number
  }>
}

export function FinancialChart({ monthlyData, currentMonthData }: FinancialChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(entry.value)}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border shadow-lg bg-background transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <span>Fluxo de Caixa Mensal</span>
          </CardTitle>
          <CardDescription>Receitas vs Despesas do ano atual</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainerFixed width="100%" height={300}>
            <AreaChartFixed data={monthlyData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGridFixed strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxisFixed 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxisFixed 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value: any) => 
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(value)
                }
              />
              <TooltipFixed content={<CustomTooltip />} />
              <AreaFixed 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={3}
                fill="url(#incomeGradient)"
                name="Receitas"
              />
              <AreaFixed 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={3}
                fill="url(#expenseGradient)"
                name="Despesas"
              />
            </AreaChartFixed>
          </ResponsiveContainerFixed>
        </CardContent>
      </Card>
      
      <Card className="border shadow-lg bg-background transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
            <span>Fluxo do Mês Atual</span>
          </CardTitle>
          <CardDescription>Receitas vs Despesas por dia no mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainerFixed width="100%" height={300}>
            <BarChartFixed data={currentMonthData}>
              <defs>
                <linearGradient id="currentMonthIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.8}/>
                </linearGradient>
                <linearGradient id="currentMonthExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGridFixed strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxisFixed 
                dataKey="day" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxisFixed 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value: any) => 
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(value)
                }
              />
              <TooltipFixed content={<CustomTooltip />} />
              <BarFixed 
                dataKey="income" 
                fill="url(#currentMonthIncomeGradient)"
                name="Receitas"
                radius={[4, 4, 0, 0]}
              />
              <BarFixed 
                dataKey="expenses" 
                fill="url(#currentMonthExpenseGradient)"
                name="Despesas"
                radius={[4, 4, 0, 0]}
              />
            </BarChartFixed>
          </ResponsiveContainerFixed>
        </CardContent>
      </Card>
    </div>
  )
}