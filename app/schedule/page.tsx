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
import { Plus, Calendar, AlertCircle, CheckCircle, Clock, Trash2, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getUserScheduleAlerts, formatDateUTC } from '@/lib/utils'

const categories = [
  { value: 'pagamento', label: 'Pagamento' },
  { value: 'recebimento', label: 'Recebimento' },
  { value: 'assinaturas', label: 'Assinaturas' },
  { value: 'impostos_taxas', label: 'Impostos/Taxas' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'outros', label: 'Outros' },
]

const typeOptions = [
  { value: 'income', label: 'Recebimento' },
  { value: 'expense', label: 'Pagamento' },
];

export default function SchedulePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [scheduledTransactions, setScheduledTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'income',
    category: '',
    customCategory: '',
    scheduled_date: new Date().toISOString().split('T')[0]
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      fetchScheduledTransactions()
    }
  }, [user])

  const fetchScheduledTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      setScheduledTransactions(data || [])
    } catch (error) {
      console.error('Error fetching scheduled transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Garantir que a data seja salva como UTC ISO
      const date = new Date(formData.scheduled_date + 'T00:00:00Z');
      const isoDate = date.toISOString(); // 'YYYY-MM-DDT00:00:00.000Z'

      const categoryToSave = formData.category === 'outros' ? formData.customCategory.toUpperCase() : formData.category.toUpperCase();

      const insertData: any = {
        user_id: user?.id,
        description: formData.description,
        type: formData.type,
        category: categoryToSave,
        scheduled_date: isoDate,
        status: 'scheduled',
        amount: parseFloat(formData.amount)
      };

      const { error } = await supabase
        .from('scheduled_transactions')
        .insert([insertData])

      if (error) throw error

      toast({
        title: 'Agendamento criado com sucesso!',
        description: 'O agendamento foi adicionado à sua agenda.',
      })

      setFormData({
        description: '',
        amount: '',
        type: 'income',
        category: '',
        customCategory: '',
        scheduled_date: new Date().toISOString().split('T')[0]
      })
      setIsDialogOpen(false)
      
      // Atualizar dados imediatamente
      await fetchScheduledTransactions()
      
      // Disparar evento para atualizar sidebar com delay para garantir que o banco foi atualizado
      setTimeout(() => {
        window.dispatchEvent(new Event('refreshSidebarStats'))
      }, 500)
    } catch (error) {
      toast({
        title: 'Erro ao criar agendamento',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_transactions')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      // Se foi marcado como pago, criar uma transação real
      if (newStatus === 'paid') {
        const scheduledTransaction = scheduledTransactions.find(t => t.id === id)
        if (scheduledTransaction) {
          await supabase
            .from('transactions')
            .insert([{
              user_id: user?.id,
              description: scheduledTransaction.description,
              amount: scheduledTransaction.amount,
              type: scheduledTransaction.type,
              category: scheduledTransaction.category.toUpperCase(),
              date: new Date().toISOString()
            }])
        }
      }

      toast({
        title: 'Status atualizado com sucesso!',
      })

      // Atualizar dados imediatamente
      await fetchScheduledTransactions()
      
      // Disparar evento para atualizar sidebar com delay para garantir que o banco foi atualizado
      setTimeout(() => {
        window.dispatchEvent(new Event('refreshSidebarStats'))
      }, 500)
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Agendamento excluído com sucesso!',
      })

      // Atualizar dados imediatamente
      await fetchScheduledTransactions()
      
      // Disparar evento para atualizar sidebar com delay para garantir que o banco foi atualizado
      setTimeout(() => {
        window.dispatchEvent(new Event('refreshSidebarStats'))
      }, 500)
    } catch (error) {
      toast({
        title: 'Erro ao excluir agendamento',
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      default:
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-background border rounded-xl shadow-sm mb-4 max-w-full flex-wrap">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm flex items-center justify-center">
          <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">Agenda</h1>
          <span className="text-sm text-muted-foreground">Gerencie seus agendamentos e pagamentos futuros</span>
        </div>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar agendamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-xl transition-all duration-200">
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl shadow-xl bg-background/95 border p-0 overflow-hidden">
            <DialogHeader className="flex flex-row items-center gap-3 px-6 pt-6 pb-2 border-b">
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <DialogTitle className="text-xl font-semibold">Novo Agendamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                <Input
                  id="description"
                    placeholder="Descrição do agendamento"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date" className="text-sm font-medium">Data</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="h-11"
                  required
                />
              </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="type" className="text-sm font-medium">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    required
                  >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value, customCategory: '' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.category === 'outros' && (
                <Input
                    id="customCategory"
                    placeholder="Digite a categoria"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value.toUpperCase() })}
                    className="h-11 mt-2"
                  required
                />
                )}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agendamentos</CardTitle>
          <CardDescription>Todos os seus pagamentos e recebimentos agendados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              const filteredTransactions = scheduledTransactions.filter((transaction) => {
                const searchLower = searchTerm.toLowerCase()
                return (
                  transaction.description.toLowerCase().includes(searchLower) ||
                  transaction.category.toLowerCase().includes(searchLower) ||
                  (transaction.type === 'income' ? 'recebimento' : 'pagamento').includes(searchLower)
                )
              })

              if (filteredTransactions.length === 0 && searchTerm && scheduledTransactions.length > 0) {
                return (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Nenhum agendamento encontrado
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
                        Não encontramos nenhum agendamento que corresponda a "{searchTerm}". Tente buscar por outro termo.
                      </p>
                    </CardContent>
                  </Card>
                )
              }

              return filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800">
                    {getStatusIcon(transaction.status)}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="text-sm text-muted-foreground">
                      {formatDateUTC(transaction.scheduled_date)}
                    </div>
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
                  <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                    {getStatusText(transaction.status)}
                  </Badge>
                </div>
                  <div className="flex flex-col space-y-1">
                    {transaction.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(transaction.id, 'paid')}
                      >
                        {transaction.type === 'income' ? 'Marcar como Recebido' : 'Marcar como Pago'}
                      </Button>
                    )}
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
              </div>
            ))})()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}