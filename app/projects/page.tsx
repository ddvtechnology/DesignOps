'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, FolderOpen, User, Calendar, Trash2, Edit, Target, Clock, CheckCircle, XCircle, Search, Check, ChevronsUpDown } from 'lucide-react'
import { formatDateUTC } from '@/lib/utils'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    status: 'in_progress',
    deadline: '',
    client_id: ''
  })
  const [search, setSearch] = useState('')
  const [openClientCombo, setOpenClientCombo] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProjects()
      fetchClients()
    }
  }, [user])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            id,
            name,
            email
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('name', { ascending: true })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const projectData = {
        ...formData,
        value: parseFloat(formData.value),
        user_id: user?.id
      }

      let projectId = editingProject ? editingProject.id : undefined;
      let projectTitle = formData.title;
      let projectValue = parseFloat(formData.value);
      let projectDeadline = formData.deadline;
      let projectStatus = formData.status;

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id)

        if (error) throw error

        toast({
          title: 'Projeto atualizado com sucesso!',
        })
        window.dispatchEvent(new Event('refreshSidebarStats'))
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert([projectData])
          .select('id')

        if (error) throw error
        if (data && data[0]) projectId = data[0].id;

        toast({
          title: 'Projeto adicionado com sucesso!',
        })
        window.dispatchEvent(new Event('refreshSidebarStats'))
      }

      // Se status for concluído, insere transação
      if (projectStatus === 'completed') {
        const { error: txError } = await supabase
          .from('transactions')
          .insert([
            {
              user_id: user?.id,
              description: projectTitle,
              amount: projectValue,
              type: 'income',
              category: 'Projetos',
              date: new Date().toISOString().split('T')[0],
            }
          ])
        if (txError) {
          toast({
            title: 'Projeto salvo, mas houve erro ao registrar a transação',
            description: 'Verifique o histórico de transações.',
            variant: 'destructive',
          })
        }
        window.dispatchEvent(new Event('refreshSidebarStats'))
      }

      // Se status for cancelado, exclui transação de conclusão
      if (projectStatus === 'cancelled') {
        await supabase
          .from('transactions')
          .delete()
          .match({
            user_id: user?.id,
            description: projectTitle,
            amount: projectValue,
            type: 'income',
            category: 'Projetos',
          })
        window.dispatchEvent(new Event('refreshSidebarStats'))
      }

      setFormData({
        title: '',
        description: '',
        value: '',
        status: 'in_progress',
        deadline: '',
        client_id: ''
      })
      setEditingProject(null)
      setIsDialogOpen(false)
      fetchProjects()
    } catch (error) {
      toast({
        title: 'Erro ao salvar projeto',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (project: any) => {
    setEditingProject(project)
    setFormData({
      title: project.title,
      description: project.description,
      value: project.value.toString(),
      status: project.status,
      deadline: project.deadline,
      client_id: project.client_id
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Projeto excluído com sucesso!',
      })

      fetchProjects()
      window.dispatchEvent(new Event('refreshSidebarStats'))
    } catch (error) {
      toast({
        title: 'Erro ao excluir projeto',
        variant: 'destructive',
      })
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
          icon: CheckCircle,
          text: 'Concluído'
        }
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
          icon: XCircle,
          text: 'Cancelado'
        }
      default:
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
          icon: Clock,
          text: 'Em Andamento'
        }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      value: '',
      status: 'in_progress',
      deadline: '',
      client_id: ''
    })
    setEditingProject(null)
    setOpenClientCombo(false)
  }

  const projectStats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalValue: projects.reduce((sum, p) => sum + p.value, 0)
  }

  const filteredProjects = projects.filter(project => {
    const q = search.toLowerCase()
    return (
      project.title.toLowerCase().includes(q) ||
      (project.clients?.name && project.clients.name.toLowerCase().includes(q)) ||
      getStatusConfig(project.status).text.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center gap-3 p-4 bg-background border rounded-xl shadow-sm mb-4 max-w-full flex-wrap">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm flex items-center justify-center">
          <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">Projetos</h1>
          <span className="text-sm text-muted-foreground">Gerencie seus projetos e acompanhe o progresso</span>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-xl transition-all duration-200">
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] rounded-2xl shadow-xl bg-background/95 border p-0 overflow-hidden">
          <DialogHeader className="flex flex-row items-center gap-3 px-6 pt-6 pb-2 border-b">
            {editingProject ? <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              <DialogTitle className="text-xl font-semibold">
                {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
              </DialogTitle>
            </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Título</Label>
                  <Input
                    id="title"
                  placeholder="Título do projeto"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                <Label htmlFor="value" className="text-sm font-medium">Valor</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="0.00"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-medium">Prazo</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição do projeto"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_id" className="text-sm font-medium">Cliente</Label>
              <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                <PopoverTrigger asChild>
              <Button 
                    variant="outline"
                    role="combobox"
                    aria-expanded={openClientCombo}
                    className="h-11 w-full justify-between"
                    disabled={!clients || clients.length === 0}
                  >
                    {formData.client_id && clients
                      ? clients.find((client) => client.id === formData.client_id)?.name
                      : !clients || clients.length === 0 
                        ? "Cadastre um cliente primeiro"
                        : "Selecione um cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-48 overflow-auto">
                      {clients && clients.length > 0 ? clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={`${client.name} ${client.email || ''} ${client.phone || ''}`}
                          onSelect={() => {
                            setFormData({ ...formData, client_id: client.id })
                            setOpenClientCombo(false)
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.client_id === client.id ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{client.name}</span>
                            <div className="text-xs text-muted-foreground space-x-2">
                              {client.email && <span>{client.email}</span>}
                              {client.phone && <span>{client.phone}</span>}
                            </div>
                          </div>
                        </CommandItem>
                      )) : null}
                                                                                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {(!clients || clients.length === 0) && (
                <p className="text-xs text-red-500 mt-1">
                  Nenhum cliente cadastrado. <br />
                  <a href="/clients" className="underline text-blue-600">Cadastre um cliente</a> para criar projetos.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status do Projeto</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                required
              >
                <SelectTrigger id="status" className="h-11">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-lg">Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-xl rounded-lg transition-all duration-200" disabled={!clients || clients.length === 0}>
                {editingProject ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total de Projetos</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{projectStats.total}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <FolderOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Em Andamento</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{projectStats.inProgress}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Concluídos</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{projectStats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Valor Total</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(projectStats.totalValue)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="flex flex-col md:flex-row md:items-end gap-2 mb-4 w-full">
        <div className="relative flex-1 min-w-[160px]">
          <Input
            placeholder="Buscar projeto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))
          : filteredProjects.map((project) => {
          const statusConfig = getStatusConfig(project.status)
          const StatusIcon = statusConfig.icon
          
          return (
                <Card key={project.id} className="border-0 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-1">{project.title}</CardTitle>
                      <Badge className={`mt-1 text-xs ${statusConfig.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.text}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(project)}
                      className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-900"
                    >
                          <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(project.id)}
                      className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900"
                    >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Valor do Projeto</span>
                  <span className="text-lg font-bold text-green-800 dark:text-green-200">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(project.value)}
                  </span>
                </div>
                
                {project.clients && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{project.clients.name}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Prazo: </span>
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                          {formatDateUTC(project.deadline)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {projects.length === 0 && !loading && (
        <Card className="border-0 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <FolderOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhum projeto cadastrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
              Comece criando seu primeiro projeto para organizar melhor seu trabalho e acompanhar o progresso.
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-xl transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Projeto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}