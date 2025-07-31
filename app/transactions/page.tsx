'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, TrendingUp, TrendingDown, Trash2, Calendar as CalendarIcon, Search } from 'lucide-react'
import { formatDateUTC } from '@/lib/utils'

const categories = [
  'Projeto', 'Freelance', 'Venda', 'Aluguel', 'Alimentação', 
  'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'
]

export default function TransactionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'income',
    category: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          description: formData.description,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category.toUpperCase(),
          date: formData.date
        }])

      if (error) throw error

      toast({
        title: 'Transação adicionada com sucesso!',
        description: 'A transação foi registrada no seu histórico.',
      })

      setFormData({
        description: '',
        amount: '',
        type: 'income',
        category: '',
        date: new Date().toISOString().split('T')[0]
      })
      setIsDialogOpen(false)
      fetchTransactions()
      window.dispatchEvent(new Event('refreshSidebarStats'))
    } catch (error) {
      toast({
        title: 'Erro ao adicionar transação',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Transação excluída com sucesso!',
      })

      fetchTransactions()
      window.dispatchEvent(new Event('refreshSidebarStats'))
    } catch (error) {
      toast({
        title: 'Erro ao excluir transação',
        variant: 'destructive',
      })
    }
  }

  // Filtro das transações
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesStartDate = !filterStartDate || transaction.date >= filterStartDate
    const matchesEndDate = !filterEndDate || transaction.date <= filterEndDate
    return matchesSearch && matchesType && matchesStartDate && matchesEndDate
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-background border rounded-xl shadow-sm mb-4 max-w-full flex-wrap">
        <div className="p-2 bg-blue-50 dark:bg-blue-950 border rounded-lg shadow-sm flex items-center justify-center">
          <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">Transações</h1>
          <span className="text-sm text-muted-foreground">Gerencie suas receitas e despesas</span>
        </div>
      </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-xl transition-all duration-200 flex items-center">
            <Plus className="mr-2 h-5 w-5 text-white align-middle" />
              Nova Transação
            </Button>
          </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] rounded-2xl shadow-xl bg-background/95 border p-0 overflow-hidden">
          <DialogHeader className="flex flex-row items-center gap-3 px-6 pt-6 pb-2 border-b">
            <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <DialogTitle className="text-xl font-semibold">Nova Transação</DialogTitle>
            </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Ex: Pagamento projeto cliente X"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === 'income' ? 'default' : 'outline'}
                  className={formData.type === 'income' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                >
                  Entrada
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'expense' ? 'default' : 'outline'}
                  className={formData.type === 'expense' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                >
                  Saída
                </Button>
              </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Digite a categoria"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                required
              />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-lg">Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-xl rounded-lg transition-all duration-200">
                Adicionar
              </Button>
            </div>
            </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>Todas as suas movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Busca e Filtros */}
          <div className="flex flex-col md:flex-row md:items-end gap-2 mb-6 w-full">
            <div className="relative flex-1 min-w-[160px]">
              <Input
                placeholder="Buscar por descrição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="w-full md:w-32">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="flex flex-col w-full md:w-40">
                <label htmlFor="filterStartDate" className="text-xs text-muted-foreground mb-1 md:mb-0 md:pb-1">De</label>
                <Input
                  id="filterStartDate"
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col w-full md:w-40">
                <label htmlFor="filterEndDate" className="text-xs text-muted-foreground mb-1 md:mb-0 md:pb-1">Até</label>
                <Input
                  id="filterEndDate"
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <div className="w-full md:w-auto flex-shrink-0">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-xl transition-all duration-200 w-full md:w-auto h-11"
                onClick={() => {
                  setSearch('')
                  setFilterType('all')
                  setFilterStartDate('')
                  setFilterEndDate('')
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 dark:bg-green-900' 
                      : 'bg-red-100 dark:bg-red-900'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateUTC(transaction.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Math.abs(transaction.amount))}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.category.toUpperCase()}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(transaction.id)}
                    className="hover:bg-red-100 dark:hover:bg-red-900"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}