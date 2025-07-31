'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Download, FileText, File, Filter, Calendar, DollarSign, Users, FolderOpen } from 'lucide-react'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ReportsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [filters, setFilters] = useState({
    dateRange: 'all', // all, month, last3months, year, custom
    startDate: '',
    endDate: '',
    transactionType: 'all', // all, income, expense
    includeClients: true,
    includeProjects: true,
    includeTransactions: true
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [transactionsResult, clientsResult, projectsResult] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user?.id).order('date', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user?.id).order('name', { ascending: true }),
        supabase.from('projects').select('*, clients(name)').eq('user_id', user?.id).order('created_at', { ascending: false })
      ])

      setTransactions(transactionsResult.data || [])
      setClients(clientsResult.data || [])
      setProjects(projectsResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    switch (filters.dateRange) {
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'last3months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) }
      case 'custom':
        return { 
          start: filters.startDate ? new Date(filters.startDate) : null,
          end: filters.endDate ? new Date(filters.endDate) : null
        }
      default:
        return { start: null, end: null }
    }
  }

  const getFilteredData = () => {
    const { start, end } = getDateRange()
    
    let filteredTransactions = transactions
    
    // Filtrar por período
    if (start && end) {
      filteredTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= start && transactionDate <= end
      })
    }
    
    // Filtrar por tipo
    if (filters.transactionType !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.type === filters.transactionType)
    }
    
    return {
      transactions: filteredTransactions,
      clients: filters.includeClients ? clients : [],
      projects: filters.includeProjects ? projects : []
    }
  }

  const exportToPDF = async () => {
    setLoading(true)
    try {
      const filteredData = getFilteredData()
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Header com logo/marca
      pdf.setFillColor(37, 99, 235)
      pdf.rect(0, 0, 210, 25, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('DesignOps - Relatorio Financeiro', 20, 16)
      
      // Data de geração
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 35)
      
      // Período do relatório
      const { start, end } = getDateRange()
      if (start && end) {
        pdf.text(`Periodo: ${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}`, 20, 42)
      } else {
        pdf.text('Periodo: Todos os registros', 20, 42)
      }
      
      let yPos = 55
      
      // Resumo financeiro melhorado
      const totalIncome = filteredData.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = filteredData.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      const balance = totalIncome - totalExpenses
      
      // Box do resumo financeiro
      pdf.setFillColor(248, 250, 252)
      pdf.rect(15, yPos - 5, 180, 35, 'F')
      pdf.setDrawColor(226, 232, 240)
      pdf.rect(15, yPos - 5, 180, 35, 'S')
      
      pdf.setFontSize(14)
      pdf.setTextColor(37, 99, 235)
      pdf.setFont('helvetica', 'bold')
      pdf.text('RESUMO FINANCEIRO', 20, yPos + 5)
      
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(71, 85, 105)
      pdf.text('Receitas:', 25, yPos + 15)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(34, 197, 94)
      pdf.text(`R$ ${totalIncome.toFixed(2)}`, 70, yPos + 15)
      
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(71, 85, 105)
      pdf.text('Despesas:', 25, yPos + 22)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(239, 68, 68)
      pdf.text(`R$ ${totalExpenses.toFixed(2)}`, 70, yPos + 22)
      
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(71, 85, 105)
      pdf.text('Saldo:', 110, yPos + 15)
      pdf.setTextColor(balance >= 0 ? 34 : 239, balance >= 0 ? 197 : 68, balance >= 0 ? 94 : 68)
      pdf.text(`R$ ${balance.toFixed(2)}`, 140, yPos + 15)
      
      yPos += 50
      
      // Transações detalhadas
      if (filters.includeTransactions && filteredData.transactions.length > 0) {
      pdf.setFontSize(14)
        pdf.setTextColor(37, 99, 235)
        pdf.setFont('helvetica', 'bold')
        pdf.text('TRANSACOES', 20, yPos)
        
        yPos += 15
        
        // Cabeçalho da tabela
        pdf.setFillColor(37, 99, 235)
        pdf.rect(15, yPos - 8, 180, 12, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Data', 20, yPos - 2)
        pdf.text('Descricao', 45, yPos - 2)
        pdf.text('Categoria', 110, yPos - 2)
        pdf.text('Tipo', 140, yPos - 2)
        pdf.text('Valor', 165, yPos - 2)
        
        yPos += 10
        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'normal')
        
        filteredData.transactions.slice(0, 20).forEach((transaction, index) => {
          if (yPos > 250) {
            pdf.addPage()
            yPos = 30
          }
          
          // Linha zebrada
          if (index % 2 === 0) {
            pdf.setFillColor(248, 250, 252)
            pdf.rect(15, yPos - 6, 180, 10, 'F')
          }
          
          pdf.setFontSize(8)
          pdf.text(format(new Date(transaction.date), 'dd/MM/yy'), 20, yPos)
          
          // Limpar texto de caracteres especiais
          const cleanDescription = transaction.description
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .substring(0, 25) + (transaction.description.length > 25 ? '...' : '')
          
          const cleanCategory = transaction.category
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .substring(0, 15)
          
          pdf.text(cleanDescription, 45, yPos)
          pdf.text(cleanCategory, 110, yPos)
          pdf.setTextColor(transaction.type === 'income' ? 34 : 239, transaction.type === 'income' ? 197 : 68, transaction.type === 'income' ? 94 : 68)
          pdf.text(transaction.type === 'income' ? 'Receita' : 'Despesa', 140, yPos)
          pdf.text(`R$ ${transaction.amount.toFixed(2)}`, 165, yPos)
          pdf.setTextColor(0, 0, 0)
          
          yPos += 10
        })
      }
      
      // Estatísticas por categoria
      if (filteredData.transactions.length > 0) {
        yPos += 15
        if (yPos > 220) {
          pdf.addPage()
          yPos = 30
        }
        
        pdf.setFontSize(14)
        pdf.setTextColor(37, 99, 235)
        pdf.setFont('helvetica', 'bold')
        pdf.text('TOP CATEGORIAS', 20, yPos)
        
        const categoryStats = filteredData.transactions.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount
          return acc
        }, {} as Record<string, number>)
        
        const topCategories = Object.entries(categoryStats)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
        
        yPos += 10
        topCategories.forEach(([category, amount], index) => {
          const cleanCategory = category
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
          
        pdf.setFontSize(10)
          pdf.setTextColor(71, 85, 105)
          pdf.text(`${index + 1}. ${cleanCategory}`, 25, yPos + (index * 8))
          pdf.setTextColor(37, 99, 235)
          pdf.text(`R$ ${(amount as number).toFixed(2)}`, 140, yPos + (index * 8))
        })
      }

      // Seção de Clientes
      if (filters.includeClients && filteredData.clients.length > 0) {
        yPos += 20
        if (yPos > 200) {
          pdf.addPage()
          yPos = 30
        }
        
        pdf.setFontSize(14)
        pdf.setTextColor(37, 99, 235)
        pdf.setFont('helvetica', 'bold')
        pdf.text('CLIENTES', 20, yPos)
        
        yPos += 15
        
        // Cabeçalho da tabela de clientes
        pdf.setFillColor(37, 99, 235)
        pdf.rect(15, yPos - 8, 180, 12, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Nome', 20, yPos - 2)
        pdf.text('Email', 80, yPos - 2)
        pdf.text('Telefone', 140, yPos - 2)
        
        yPos += 10
        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'normal')
        
        filteredData.clients.slice(0, 15).forEach((client, index) => {
          if (yPos > 250) {
            pdf.addPage()
            yPos = 30
          }
          
          // Linha zebrada
          if (index % 2 === 0) {
            pdf.setFillColor(248, 250, 252)
            pdf.rect(15, yPos - 6, 180, 10, 'F')
          }
          
          pdf.setFontSize(8)
          
          // Limpar texto de caracteres especiais
          const cleanName = client.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .substring(0, 25) + (client.name.length > 25 ? '...' : '')
          
          const cleanEmail = (client.email || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .substring(0, 20) + ((client.email || '').length > 20 ? '...' : '')
          
          const cleanPhone = (client.phone || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .substring(0, 15) + ((client.phone || '').length > 15 ? '...' : '')
          
          pdf.text(cleanName, 20, yPos)
          pdf.text(cleanEmail, 80, yPos)
          pdf.text(cleanPhone, 140, yPos)
          
          yPos += 10
        })
      }

      // Seção de Projetos
      if (filters.includeProjects && filteredData.projects.length > 0) {
        yPos += 20
        if (yPos > 200) {
          pdf.addPage()
          yPos = 30
        }
        
        pdf.setFontSize(14)
        pdf.setTextColor(37, 99, 235)
        pdf.setFont('helvetica', 'bold')
        pdf.text('PROJETOS', 20, yPos)
        
        yPos += 15
        
        // Cabeçalho da tabela de projetos
        pdf.setFillColor(37, 99, 235)
        pdf.rect(15, yPos - 8, 180, 12, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Titulo', 20, yPos - 2)
        pdf.text('Cliente', 80, yPos - 2)
        pdf.text('Status', 130, yPos - 2)
        pdf.text('Valor', 160, yPos - 2)
        
        yPos += 10
        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'normal')
        
        filteredData.projects.slice(0, 15).forEach((project, index) => {
          if (yPos > 250) {
            pdf.addPage()
            yPos = 30
          }
          
          // Linha zebrada
          if (index % 2 === 0) {
            pdf.setFillColor(248, 250, 252)
            pdf.rect(15, yPos - 6, 180, 10, 'F')
          }
          
          pdf.setFontSize(8)
          
          // Limpar texto de caracteres especiais
          const cleanTitle = project.title
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .substring(0, 25) + (project.title.length > 25 ? '...' : '')
          
          const cleanClientName = (project.clients?.name || 'N/A')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .substring(0, 20) + ((project.clients?.name || 'N/A').length > 20 ? '...' : '')
          
          const cleanStatus = project.status === 'in_progress' ? 'EM ANDAMENTO' :
                             project.status === 'completed' ? 'CONCLUIDO' :
                             project.status === 'cancelled' ? 'CANCELADO' :
                             project.status.toUpperCase().substring(0, 10)
          
          pdf.text(cleanTitle, 20, yPos)
          pdf.text(cleanClientName, 80, yPos)
          pdf.text(cleanStatus, 130, yPos)
          pdf.text(`R$ ${project.value.toFixed(2)}`, 160, yPos)
          
          yPos += 10
        })
      }
      
      // Rodapé
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(156, 163, 175)
        pdf.text(`Pagina ${i} de ${pageCount} | DesignOps - Sistema de Gestao Financeira`, 20, 285)
      }
      
      const fileName = `relatorio-designops-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      pdf.save(fileName)
      
      toast({
        title: 'Relatório PDF exportado!',
        description: `Arquivo ${fileName} foi baixado com sucesso.`,
      })
    } catch (error) {
      toast({
        title: 'Erro ao exportar relatório',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async () => {
    setLoading(true)
    try {
      const filteredData = getFilteredData()
      const workbook = XLSX.utils.book_new()
      
      // Aba de resumo
      const { start, end } = getDateRange()
      const totalIncome = filteredData.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = filteredData.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      const balance = totalIncome - totalExpenses
      
      const summaryData = [
        { Métrica: 'Período do Relatório', Valor: start && end ? `${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}` : 'Todos os registros' },
        { Métrica: 'Data de Geração', Valor: format(new Date(), 'dd/MM/yyyy HH:mm') },
        { Métrica: '', Valor: '' },
        { Métrica: 'RESUMO FINANCEIRO', Valor: '' },
        { Métrica: 'Total de Receitas', Valor: totalIncome },
        { Métrica: 'Total de Despesas', Valor: totalExpenses },
        { Métrica: 'Saldo Final', Valor: balance },
        { Métrica: '', Valor: '' },
        { Métrica: 'ESTATÍSTICAS', Valor: '' },
        { Métrica: 'Total de Transações', Valor: filteredData.transactions.length },
        { Métrica: 'Total de Clientes', Valor: filteredData.clients.length },
        { Métrica: 'Total de Projetos', Valor: filteredData.projects.length }
      ]
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      summarySheet['!cols'] = [{ width: 25 }, { width: 20 }]
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')
      
      // Aba de transações (se incluída)
      if (filters.includeTransactions && filteredData.transactions.length > 0) {
        const transactionsData = filteredData.transactions.map(t => ({
        Data: format(new Date(t.date), 'dd/MM/yyyy'),
        Descrição: t.description,
          Categoria: t.category,
          Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
        Valor: t.amount,
          'Criado em': format(new Date(t.created_at), 'dd/MM/yyyy HH:mm')
      }))
      
      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData)
        transactionsSheet['!cols'] = [
          { width: 12 }, // Data
          { width: 35 }, // Descrição
          { width: 20 }, // Categoria
          { width: 12 }, // Tipo
          { width: 15 }, // Valor
          { width: 18 }  // Criado em
        ]
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transações')
      }
      
      // Aba de análise por categoria
      if (filters.includeTransactions && filteredData.transactions.length > 0) {
        const categoryStats = filteredData.transactions.reduce((acc, t) => {
          if (!acc[t.category]) {
            acc[t.category] = { receitas: 0, despesas: 0, total: 0, quantidade: 0 }
          }
          if (t.type === 'income') {
            acc[t.category].receitas += t.amount
          } else {
            acc[t.category].despesas += t.amount
          }
          acc[t.category].quantidade += 1
          acc[t.category].total = acc[t.category].receitas - acc[t.category].despesas
          return acc
        }, {} as Record<string, any>)
        
        const categoryData = Object.entries(categoryStats).map(([category, stats]) => ({
          Categoria: category,
          Receitas: (stats as any).receitas,
          Despesas: (stats as any).despesas,
          'Saldo da Categoria': (stats as any).total,
          'Qtd Transações': (stats as any).quantidade,
          'Valor Médio': ((stats as any).receitas + (stats as any).despesas) / (stats as any).quantidade
        }))
        
        const categorySheet = XLSX.utils.json_to_sheet(categoryData)
        categorySheet['!cols'] = [{ width: 20 }, { width: 15 }, { width: 15 }, { width: 18 }, { width: 15 }, { width: 15 }]
        XLSX.utils.book_append_sheet(workbook, categorySheet, 'Análise por Categoria')
      }
      
      // Aba de clientes (se incluída)
      if (filters.includeClients && filteredData.clients.length > 0) {
        const clientsData = filteredData.clients.map(c => ({
        Nome: c.name,
          Email: c.email || 'Não informado',
          Telefone: c.phone || 'Não informado',
          Observações: c.notes || 'Sem observações',
          'Cadastrado em': format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')
      }))
      
      const clientsSheet = XLSX.utils.json_to_sheet(clientsData)
        clientsSheet['!cols'] = [{ width: 25 }, { width: 30 }, { width: 18 }, { width: 40 }, { width: 18 }]
      XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clientes')
      }
      
      // Aba de projetos (se incluída)
      if (filters.includeProjects && filteredData.projects.length > 0) {
        const projectsData = filteredData.projects.map(p => ({
        Título: p.title,
          Descrição: p.description || 'Sem descrição',
          Cliente: p.clients?.name || 'Cliente não vinculado',
        Valor: p.value,
        Status: p.status === 'in_progress' ? 'Em Andamento' : 
                p.status === 'completed' ? 'Concluído' : 'Cancelado',
          Prazo: p.deadline ? format(new Date(p.deadline), 'dd/MM/yyyy') : 'Não definido',
          'Criado em': format(new Date(p.created_at), 'dd/MM/yyyy HH:mm')
      }))
      
      const projectsSheet = XLSX.utils.json_to_sheet(projectsData)
        projectsSheet['!cols'] = [{ width: 30 }, { width: 40 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 18 }]
      XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projetos')
      }
      
      const fileName = `relatorio-designops-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
      toast({
        title: 'Relatório Excel exportado!',
        description: `Arquivo ${fileName} foi baixado com sucesso.`,
      })
    } catch (error) {
      toast({
        title: 'Erro ao exportar relatório',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredData = getFilteredData()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-background border rounded-xl shadow-sm mb-4 max-w-full flex-wrap">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm flex items-center justify-center">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">Relatórios</h1>
          <span className="text-sm text-muted-foreground">Exporte seus dados financeiros e de clientes com filtros avançados</span>
        </div>
      </div>

      {/* Filtros Avançados */}
      <Card className="relative border shadow-lg bg-background/85 backdrop-blur-sm border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Filtros de Exportação
          </CardTitle>
          <CardDescription>
            Configure os filtros para personalizar seus relatórios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Período */}
            <div className="space-y-2">
              <Label htmlFor="dateRange">Período</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os registros</SelectItem>
                  <SelectItem value="month">Mês atual</SelectItem>
                  <SelectItem value="last3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="year">Ano atual</SelectItem>
                  <SelectItem value="custom">Período personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Transação */}
            <div className="space-y-2">
              <Label htmlFor="transactionType">Tipo de Transação</Label>
              <Select
                value={filters.transactionType}
                onValueChange={(value) => setFilters({ ...filters, transactionType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="income">Apenas Receitas</SelectItem>
                  <SelectItem value="expense">Apenas Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Placeholder para alinhamento */}
            <div className="space-y-2">
              <Label>Incluir nos Relatórios</Label>
              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.includeTransactions}
                    onChange={(e) => setFilters({ ...filters, includeTransactions: e.target.checked })}
                    className="rounded"
                  />
                  <span>Transações</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.includeClients}
                    onChange={(e) => setFilters({ ...filters, includeClients: e.target.checked })}
                    className="rounded"
                  />
                  <span>Clientes</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.includeProjects}
                    onChange={(e) => setFilters({ ...filters, includeProjects: e.target.checked })}
                    className="rounded"
                  />
                  <span>Projetos</span>
                </label>
              </div>
            </div>
          </div>

          {/* Datas personalizadas */}
          {filters.dateRange === 'custom' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview dos Dados */}
      <Card className="relative border shadow-lg bg-background/85 backdrop-blur-sm border-border/30">
        <CardHeader>
          <CardTitle>Preview dos Dados Filtrados</CardTitle>
          <CardDescription>Visualize os dados que serão incluídos no relatório</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredData.transactions.length}</p>
              <p className="text-sm text-muted-foreground">Transações</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{filteredData.clients.length}</p>
              <p className="text-sm text-muted-foreground">Clientes</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-center mb-2">
                <FolderOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredData.projects.length}</p>
              <p className="text-sm text-muted-foreground">Projetos</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/50 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {(() => {
                  const { start, end } = getDateRange()
                  if (start && end) {
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                    return days
                  }
                  return '∞'
                })()}
              </p>
              <p className="text-sm text-muted-foreground">Dias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Exportação */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="relative border shadow-lg hover:shadow-xl transition-all duration-300 group bg-background/85 backdrop-blur-sm border-border/30 hover:border-border/60 hover:bg-background/95">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Relatório PDF</span>
            </CardTitle>
            <CardDescription>
              Relatório profissional em PDF com resumo financeiro, tabelas formatadas e gráficos de categorias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transações incluídas:</span>
                <span className="font-medium">{filteredData.transactions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Formato:</span>
                <span className="font-medium">PDF Profissional</span>
              </div>
            </div>
            <Button 
              onClick={exportToPDF} 
              disabled={loading || filteredData.transactions.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-xl transition-all duration-200"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Gerando PDF...' : 'Exportar PDF'}
            </Button>
          </CardContent>
        </Card>

        <Card className="relative border shadow-lg hover:shadow-xl transition-all duration-300 group bg-background/85 backdrop-blur-sm border-border/30 hover:border-border/60 hover:bg-background/95">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <File className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span>Relatório Excel</span>
            </CardTitle>
            <CardDescription>
              Planilha completa com múltiplas abas: resumo, transações, análise por categoria, clientes e projetos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Abas incluídas:</span>
                <span className="font-medium">
                  {[
                    'Resumo',
                    filters.includeTransactions && filteredData.transactions.length > 0 ? 'Transações' : null,
                    filters.includeTransactions && filteredData.transactions.length > 0 ? 'Análise' : null,
                    filters.includeClients && filteredData.clients.length > 0 ? 'Clientes' : null,
                    filters.includeProjects && filteredData.projects.length > 0 ? 'Projetos' : null
                  ].filter(Boolean).length} abas
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Formato:</span>
                <span className="font-medium">Excel (.xlsx)</span>
              </div>
            </div>
            <Button 
              onClick={exportToExcel} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-xl transition-all duration-200"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Gerando Excel...' : 'Exportar Excel'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      {filteredData.transactions.length > 0 && (
        <Card className="relative border shadow-lg bg-background/85 backdrop-blur-sm border-border/30">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              Resumo Financeiro dos Dados Filtrados
            </CardTitle>
            <CardDescription>Análise financeira baseada nos filtros aplicados</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(() => {
                const totalIncome = filteredData.transactions
                  .filter(t => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0)
                const totalExpenses = filteredData.transactions
                  .filter(t => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0)
                const balance = totalIncome - totalExpenses

                return (
                  <>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-muted-foreground mb-1">Total Receitas</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(totalIncome)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-muted-foreground mb-1">Total Despesas</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(totalExpenses)}
                      </p>
            </div>
                    <div className={`text-center p-4 rounded-lg border ${
                      balance >= 0 
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' 
                        : 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800'
                    }`}>
                      <p className="text-sm text-muted-foreground mb-1">Saldo</p>
                      <p className={`text-xl font-bold ${
                        balance >= 0 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(balance)}
                      </p>
            </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-muted-foreground mb-1">Média por Transação</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format((totalIncome + totalExpenses) / filteredData.transactions.length || 0)}
                      </p>
            </div>
                  </>
                )
              })()}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}