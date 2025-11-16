import { useState, useEffect } from 'react'
import ProcessoModal from './ProcessoModal.jsx'
import ProcessoDetailsModal from './ProcessoDetailsModal.jsx'
import ClienteModal from './ClienteModal.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'

import { 
  Scale, 
  Gavel, 
  Calendar, 
  Users, 
  DollarSign, 
  FolderOpen, 
  BarChart3, 
  Bell, 
  Plus, 
  Search, 
  FileText, 
  FileDown, 
  Edit, 
  Copy, 
  Trash2,
  Menu,
  X,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

// Configurações do aplicativo
const APP_CONFIG = {
  version: '2.0',
  storageKeys: {
    processos: 'juristech_processos',
    clientes: 'juristech_clientes',
    transacoes: 'juristech_transacoes',
    documentos: 'juristech_documentos',
    audit: 'juristech_audit'
  }
}

// Estado global da aplicação
const initialState = {
  processos: [],
  clientes: [],
  transacoes: [],
  documentos: [],
  auditLog: [],
  currentPage: 'dashboard',
  sidebarOpen: false,
  filters: {
    status: '',
    localidade: ''
  },
  sortField: null,
  sortDirection: 'asc',
  pagination: {
    currentPage: 1,
    itemsPerPage: 10
  }
}

// Utilitários
const Utils = {
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
  
  formatCurrency: (value) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.')))
  },
  
  formatDate: (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  },
  
  getProcessoStatus: (ultimoEvento) => {
    if (!ultimoEvento) return 'Em Andamento'
    const evento = ultimoEvento.toLowerCase()
    if (evento.includes('julgamento') || evento.includes('sentença')) return 'Julgamento'
    if (evento.includes('arquivado') || evento.includes('baixa')) return 'Arquivado'
    if (evento.includes('petição') || evento.includes('inicial')) return 'Petição'
    return 'Em Andamento'
  },
  
  getStatusColor: (status) => {
    const colors = {
      'Em Andamento': 'bg-blue-100 text-blue-800',
      'Julgamento': 'bg-yellow-100 text-yellow-800',
      'Arquivado': 'bg-gray-100 text-gray-800',
      'Petição': 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }
}

// Gerenciador de dados
const DataManager = {
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (e) {
      console.error('Erro ao salvar dados:', e)
      return false
    }
  },
  
  load: (key) => {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Erro ao carregar dados:', e)
      return []
    }
  }
}

function App() {
  const [appState, setAppState] = useState(initialState)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [selectedProcesso, setSelectedProcesso] = useState(null)
  const [showProcessoModal, setShowProcessoModal] = useState(false)
  const [showAddProcessoModal, setShowAddProcessoModal] = useState(false)
  const [showAddClienteModal, setShowAddClienteModal] = useState(false)
  const [editingProcesso, setEditingProcesso] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const loadedState = {
      ...initialState,
      processos: DataManager.load(APP_CONFIG.storageKeys.processos),
      clientes: DataManager.load(APP_CONFIG.storageKeys.clientes),
      transacoes: DataManager.load(APP_CONFIG.storageKeys.transacoes),
      documentos: DataManager.load(APP_CONFIG.storageKeys.documentos),
      auditLog: DataManager.load(APP_CONFIG.storageKeys.audit)
    }
    setAppState(loadedState)
  }, [])

  // Salvar dados sempre que o estado mudar
  useEffect(() => {
    DataManager.save(APP_CONFIG.storageKeys.processos, appState.processos)
    DataManager.save(APP_CONFIG.storageKeys.clientes, appState.clientes)
    DataManager.save(APP_CONFIG.storageKeys.transacoes, appState.transacoes)
    DataManager.save(APP_CONFIG.storageKeys.documentos, appState.documentos)
    DataManager.save(APP_CONFIG.storageKeys.audit, appState.auditLog)
  }, [appState.processos, appState.clientes, appState.transacoes, appState.documentos, appState.auditLog])

  // Sistema de notificações
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' })
    }, 4000)
  }

  // Adicionar processo
  const addProcesso = (processoData) => {
    const processo = {
      id: Utils.generateId(),
      ...processoData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setAppState(prev => ({
      ...prev,
      processos: [processo, ...prev.processos]
    }))
    
    showNotification('Processo cadastrado com sucesso!')
    setShowAddProcessoModal(false)
  }

  // Atualizar processo
  const updateProcesso = (id, processoData) => {
    setAppState(prev => ({
      ...prev,
      processos: prev.processos.map(p => 
        p.id === id 
          ? { ...p, ...processoData, updatedAt: new Date().toISOString() }
          : p
      )
    }))
    
    showNotification('Processo atualizado com sucesso!')
    setShowAddProcessoModal(false)
    setEditingProcesso(null)
  }

  // Excluir processo
  const deleteProcesso = (id) => {
    if (confirm('Tem certeza que deseja excluir este processo?')) {
      setAppState(prev => ({
        ...prev,
        processos: prev.processos.filter(p => p.id !== id)
      }))
      showNotification('Processo excluído com sucesso!')
      setShowProcessoModal(false)
    }
  }

  // Duplicar processo
  const duplicateProcesso = (processo) => {
    const duplicado = {
      ...processo,
      id: Utils.generateId(),
      numero: processo.numero + ' (CÓPIA)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setAppState(prev => ({
      ...prev,
      processos: [duplicado, ...prev.processos]
    }))
    
    showNotification('Processo duplicado com sucesso!')
  }

  // Adicionar cliente
  const addCliente = (clienteData) => {
    const cliente = {
      id: Utils.generateId(),
      ...clienteData,
      createdAt: new Date().toISOString()
    }
    
    setAppState(prev => ({
      ...prev,
      clientes: [cliente, ...prev.clientes]
    }))
    
    showNotification('Cliente cadastrado com sucesso!')
    setShowAddClienteModal(false)
  }

  // Exportar dados para CSV
  const exportToCSV = () => {
    if (appState.processos.length === 0) {
      showNotification('Nenhum processo para exportar.', 'warning')
      return
    }
    
    const headers = ['Número Processo', 'Classe', 'Autores', 'Réus', 'Localidade', 'Assunto', 
                    'Último Evento', 'Data/Hora Evento', 'Data Distribuição', 'Valor da Causa']
    
    const rows = appState.processos.map(p => [
      p.numero, p.classe, p.autores, p.reus, p.localidade, p.assunto,
      p.ultimoEvento, p.dataHoraEvento, p.dataDistribuicao, p.valorCausa
    ].map(field => `"${field || ''}"`))
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `processos-${new Date().getTime()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    showNotification('Processos exportados com sucesso!')
  }

  // Importar CSV
  const importCSV = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvText = e.target.result
        const lines = csvText.split('\n')
        let addedCount = 0
        
        // Pular cabeçalho
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          if (values.length >= 10) {
            const processoData = {
              numero: values[0],
              classe: values[1],
              autores: values[2],
              reus: values[3],
              localidade: values[4],
              assunto: values[5],
              ultimoEvento: values[6],
              dataHoraEvento: values[7],
              dataDistribuicao: values[8],
              valorCausa: values[9]
            }
            
            addProcesso(processoData)
            addedCount++
          }
        }
        
        showNotification(`${addedCount} processos importados com sucesso!`)
      } catch (error) {
        console.error('Erro ao importar CSV:', error)
        showNotification('Erro ao importar arquivo CSV.', 'error')
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Limpar input
  }

  // Fazer backup
  const exportBackup = () => {
    const backup = {
      version: APP_CONFIG.version,
      timestamp: new Date().toISOString(),
      data: {
        processos: appState.processos,
        clientes: appState.clientes,
        transacoes: appState.transacoes,
        documentos: appState.documentos,
        auditLog: appState.auditLog
      }
    }
    
    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `juristech-backup-${new Date().getTime()}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    showNotification('Backup realizado com sucesso!')
  }

  // Restaurar backup
  const importBackup = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result)
        
        if (!backup.version || !backup.data) {
          throw new Error('Formato de backup inválido')
        }
        
        if (confirm('Deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
          setAppState(prev => ({
            ...prev,
            processos: backup.data.processos || [],
            clientes: backup.data.clientes || [],
            transacoes: backup.data.transacoes || [],
            documentos: backup.data.documentos || [],
            auditLog: backup.data.auditLog || []
          }))
          
          showNotification('Backup restaurado com sucesso!')
        }
      } catch (error) {
        console.error('Erro ao restaurar backup:', error)
        showNotification('Erro ao restaurar backup. Arquivo inválido.', 'error')
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Limpar input
  }

  // Filtrar e pesquisar processos
  const getFilteredProcessos = () => {
    let filtered = [...appState.processos]
    
    // Aplicar pesquisa
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.autores?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.assunto?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Aplicar filtros
    if (appState.filters.status) {
      filtered = filtered.filter(p => 
        Utils.getProcessoStatus(p.ultimoEvento) === appState.filters.status
      )
    }
    
    if (appState.filters.localidade) {
      filtered = filtered.filter(p => 
        p.localidade === appState.filters.localidade
      )
    }
    
    return filtered
  }

  // Calcular estatísticas do dashboard
  const getDashboardStats = () => {
    const processos = appState.processos
    const totalProcessos = processos.length
    const totalClientes = appState.clientes.length
    
    // Prazos na semana (simulado)
    const prazosNaSemana = Math.floor(totalProcessos * 0.15)
    
    // Prazos vencidos (simulado)
    const prazosVencidos = Math.floor(totalProcessos * 0.05)
    
    // Processos por status
    const statusCount = {}
    processos.forEach(p => {
      const status = Utils.getProcessoStatus(p.ultimoEvento)
      statusCount[status] = (statusCount[status] || 0) + 1
    })
    
    const statusData = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      color: Utils.getStatusColor(status).includes('blue') ? '#3B82F6' :
             Utils.getStatusColor(status).includes('yellow') ? '#F59E0B' :
             Utils.getStatusColor(status).includes('gray') ? '#6B7280' : '#10B981'
    }))
    
    return {
      totalProcessos,
      totalClientes,
      prazosNaSemana,
      prazosVencidos,
      statusData
    }
  }

  const stats = getDashboardStats()
  const filteredProcessos = getFilteredProcessos()

  // Componente de navegação lateral
  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-800 text-white transform ${appState.sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between p-4 border-b border-blue-700">
        <div className="flex items-center">
          <Scale className="h-8 w-8 mr-2" />
          <span className="text-xl font-bold">JurisTech Pro</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-white hover:bg-blue-700"
          onClick={() => setAppState(prev => ({ ...prev, sidebarOpen: false }))}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4 bg-blue-900 mx-2 rounded-lg mb-4">
        <p className="text-sm text-blue-200">Usuário</p>
        <p className="font-semibold">Dr(a). Usuário</p>
      </div>
      
      <nav className="px-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'processos', label: 'Processos', icon: Gavel },
          { id: 'agenda', label: 'Agenda & Prazos', icon: Calendar },
          { id: 'clientes', label: 'Clientes', icon: Users },
          { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
          { id: 'documentos', label: 'Documentos', icon: FolderOpen }
        ].map(item => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={appState.currentPage === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start mb-1 text-white hover:bg-blue-700 ${
                appState.currentPage === item.id ? 'bg-blue-600' : ''
              }`}
              onClick={() => setAppState(prev => ({ ...prev, currentPage: item.id, sidebarOpen: false }))}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          )
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4 text-xs text-blue-300 text-center">
        <p>Versão {APP_CONFIG.version}</p>
        <p className="mt-1">© 2025 JurisTech</p>
      </div>
    </div>
  )

  // Componente de cabeçalho
  const Header = () => (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden mr-4"
          onClick={() => setAppState(prev => ({ ...prev, sidebarOpen: true }))}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">
          {appState.currentPage === 'dashboard' && 'Dashboard'}
          {appState.currentPage === 'processos' && 'Processos'}
          {appState.currentPage === 'agenda' && 'Agenda & Prazos'}
          {appState.currentPage === 'clientes' && 'Clientes'}
          {appState.currentPage === 'financeiro' && 'Financeiro'}
          {appState.currentPage === 'documentos' && 'Documentos'}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <input
          type="file"
          id="backup-restore"
          className="hidden"
          accept=".json"
          onChange={importBackup}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={exportBackup}
          title="Fazer Backup"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => document.getElementById('backup-restore').click()}
          title="Restaurar Backup"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 hidden md:inline">Olá, Dr(a). Usuário</span>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  )

  // Componente Dashboard
  const Dashboard = () => (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-6">
            <Gavel className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-gray-500 text-sm">Total de Processos</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalProcessos}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-gray-500 text-sm">Prazos na Semana</p>
              <p className="text-2xl font-bold text-gray-800">{stats.prazosNaSemana}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-4" />
            <div>
              <p className="text-gray-500 text-sm">Prazos Vencidos</p>
              <p className="text-2xl font-bold text-gray-800">{stats.prazosVencidos}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-purple-500 mr-4" />
            <div>
              <p className="text-gray-500 text-sm">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalClientes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Processos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum processo cadastrado ainda.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Últimas Atualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appState.processos.slice(0, 5).map(processo => (
              <div key={processo.id} className="mb-3 p-2 bg-gray-50 rounded">
                <p className="text-sm font-medium">{processo.numero}</p>
                <p className="text-xs text-gray-500">{processo.assunto}</p>
                <p className="text-xs text-gray-400">{Utils.formatDate(processo.updatedAt)}</p>
              </div>
            ))}
            {appState.processos.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhuma atualização recente.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Prazos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-yellow-500" />
            Alertas de Prazos Urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">Nenhum alerta no momento.</p>
        </CardContent>
      </Card>
    </div>
  )

  // Componente de Processos
  const Processos = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle>Lista de Processos</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => setShowAddProcessoModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Processo
              </Button>
              <input
                type="file"
                id="csv-import"
                className="hidden"
                accept=".csv"
                onChange={importCSV}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('csv-import').click()}
              >
                <FileText className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Select
              value={appState.filters.status}
              onValueChange={(value) => setAppState(prev => ({
                ...prev,
                filters: { ...prev.filters, status: value }
              }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Status</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Julgamento">Julgamento</SelectItem>
                <SelectItem value="Arquivado">Arquivado</SelectItem>
                <SelectItem value="Petição">Petição</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={appState.filters.localidade}
              onValueChange={(value) => setAppState(prev => ({
                ...prev,
                filters: { ...prev.filters, localidade: value }
              }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Localidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as Localidades</SelectItem>
                {[...new Set(appState.processos.map(p => p.localidade))].filter(Boolean).map(localidade => (
                  <SelectItem key={localidade} value={localidade}>{localidade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setAppState(prev => ({
                ...prev,
                filters: { status: '', localidade: '' }
              }))}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          </div>

          {/* Tabela de Processos */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Nº Processo</th>
                  <th className="px-4 py-3 text-left">Autor Principal</th>
                  <th className="px-4 py-3 text-left">Réu</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Data Evento</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcessos.map(processo => (
                  <tr key={processo.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{processo.numero}</td>
                    <td className="px-4 py-3">{processo.autores}</td>
                    <td className="px-4 py-3">{processo.reus}</td>
                    <td className="px-4 py-3">
                      <Badge className={Utils.getStatusColor(Utils.getProcessoStatus(processo.ultimoEvento))}>
                        {Utils.getProcessoStatus(processo.ultimoEvento)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{processo.dataHoraEvento}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProcesso(processo)
                            setShowProcessoModal(true)
                          }}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingProcesso(processo)
                            setShowAddProcessoModal(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateProcesso(processo)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProcesso(processo.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProcessos.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum processo encontrado.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Componente de Clientes
  const Clientes = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Clientes</CardTitle>
            <Button onClick={() => setShowAddClienteModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appState.clientes.map(cliente => (
              <Card key={cliente.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold">{cliente.nome}</h3>
                  <p className="text-sm text-gray-600">{cliente.cpf}</p>
                  <p className="text-sm text-gray-600">{cliente.telefone}</p>
                  <p className="text-sm text-gray-600">{cliente.email}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {appState.clientes.length === 0 && (
            <p className="text-gray-500 text-center py-8">Nenhum cliente cadastrado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // Componente genérico para páginas em desenvolvimento
  const EmptyPage = ({ title, icon: Icon }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">{title}</h2>
        <p className="text-gray-500 text-center">Esta funcionalidade está em desenvolvimento.</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          {appState.currentPage === 'dashboard' && <Dashboard />}
          {appState.currentPage === 'processos' && <Processos />}
          {appState.currentPage === 'agenda' && <EmptyPage title="Agenda & Prazos" icon={Calendar} />}
          {appState.currentPage === 'clientes' && <Clientes />}
          {appState.currentPage === 'financeiro' && <EmptyPage title="Financeiro" icon={DollarSign} />}
          {appState.currentPage === 'documentos' && <EmptyPage title="Documentos" icon={FolderOpen} />}
        </main>
      </div>

      {/* Notificação */}
      {notification.show && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' :
          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Modal Adicionar/Editar Processo */}
      <ProcessoModal
        open={showAddProcessoModal}
        onOpenChange={setShowAddProcessoModal}
        processo={editingProcesso}
        onSave={editingProcesso ? updateProcesso : addProcesso}
        onCancel={() => {
          setShowAddProcessoModal(false)
          setEditingProcesso(null)
        }}
      />

      {/* Modal Detalhes do Processo */}
      <ProcessoDetailsModal
        open={showProcessoModal}
        onOpenChange={setShowProcessoModal}
        processo={selectedProcesso}
        onEdit={(processo) => {
          setEditingProcesso(processo)
          setShowAddProcessoModal(true)
          setShowProcessoModal(false)
        }}
        onDuplicate={duplicateProcesso}
        onDelete={deleteProcesso}
      />

      {/* Modal Adicionar Cliente */}
      <ClienteModal
        open={showAddClienteModal}
        onOpenChange={setShowAddClienteModal}
        onSave={addCliente}
      />
    </div>
  )
}

// Componente Modal de Processo
const ProcessoModal = ({ open, onOpenChange, processo, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    numero: '',
    classe: '',
    autores: '',
    reus: '',
    localidade: '',
    valorCausa: '',
    assunto: '',
    dataDistribuicao: '',
    dataHoraEvento: '',
    ultimoEvento: ''
  })

  useEffect(() => {
    if (processo) {
      setFormData(processo)
    } else {
      setFormData({
        numero: '',
        classe: '',
        autores: '',
        reus: '',
        localidade: '',
        valorCausa: '',
        assunto: '',
        dataDistribuicao: '',
        dataHoraEvento: '',
        ultimoEvento: ''
      })
    }
  }, [processo, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (processo) {
      onSave(processo.id, formData)
    } else {
      onSave(formData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{processo ? 'Editar Processo' : 'Novo Processo'}</DialogTitle>
          <DialogDescription>
            {processo ? 'Edite as informações do processo.' : 'Preencha as informações do novo processo.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número do Processo *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                placeholder="0000000-00.0000.0.00.0000"
                required
              />
            </div>
            <div>
              <Label htmlFor="classe">Classe *</Label>
              <select
                id="classe"
                value={formData.classe}
                onChange={(e) => setFormData(prev => ({ ...prev, classe: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione a classe</option>
                <option value="Ação Civil Pública">Ação Civil Pública</option>
                <option value="Ação de Cobrança">Ação de Cobrança</option>
                <option value="Ação de Indenização">Ação de Indenização</option>
                <option value="Mandado de Segurança">Mandado de Segurança</option>
                <option value="Procedimento Comum">Procedimento Comum</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="autores">Autor(es) *</Label>
              <Textarea
                id="autores"
                value={formData.autores}
                onChange={(e) => setFormData(prev => ({ ...prev, autores: e.target.value }))}
                placeholder="Nome completo do(s) autor(es)"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="reus">Réu(s) *</Label>
              <Textarea
                id="reus"
                value={formData.reus}
                onChange={(e) => setFormData(prev => ({ ...prev, reus: e.target.value }))}
                placeholder="Nome completo do(s) réu(s)"
                required
              />
            </div>
            <div>
              <Label htmlFor="localidade">Localidade *</Label>
              <Input
                id="localidade"
                value={formData.localidade}
                onChange={(e) => setFormData(prev => ({ ...prev, localidade: e.target.value }))}
                placeholder="Ex: São Paulo/SP"
                required
              />
            </div>
            <div>
              <Label htmlFor="valorCausa">Valor da Causa</Label>
              <Input
                id="valorCausa"
                value={formData.valorCausa}
                onChange={(e) => setFormData(prev => ({ ...prev, valorCausa: e.target.value }))}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                value={formData.assunto}
                onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                placeholder="Assunto principal do processo"
                required
              />
            </div>
            <div>
              <Label htmlFor="dataDistribuicao">Data de Distribuição *</Label>
              <Input
                id="dataDistribuicao"
                type="date"
                value={formData.dataDistribuicao}
                onChange={(e) => setFormData(prev => ({ ...prev, dataDistribuicao: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="dataHoraEvento">Data do Próximo Evento</Label>
              <Input
                id="dataHoraEvento"
                value={formData.dataHoraEvento}
                onChange={(e) => setFormData(prev => ({ ...prev, dataHoraEvento: e.target.value }))}
                placeholder="DD/MM/AAAA HH:MM"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="ultimoEvento">Último Evento *</Label>
              <Textarea
                id="ultimoEvento"
                value={formData.ultimoEvento}
                onChange={(e) => setFormData(prev => ({ ...prev, ultimoEvento: e.target.value }))}
                placeholder="Descrição do último evento processual"
                rows={3}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              <CheckCircle className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Componente Modal de Detalhes do Processo
const ProcessoDetailsModal = ({ open, onOpenChange, processo, onEdit, onDuplicate, onDelete }) => {
  if (!processo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Processo</DialogTitle>
          <DialogDescription>{processo.numero}</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="detalhes">Gestão do Processo</TabsTrigger>
            <TabsTrigger value="prazos">Prazos e Agenda</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detalhes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="text-gray-700">Autor(es):</strong>
                <p className="text-gray-600">{processo.autores}</p>
              </div>
              <div>
                <strong className="text-gray-700">Réu(s):</strong>
                <p className="text-gray-600">{processo.reus}</p>
              </div>
              <div>
                <strong className="text-gray-700">Classe:</strong>
                <p className="text-gray-600">{processo.classe}</p>
              </div>
              <div>
                <strong className="text-gray-700">Assunto:</strong>
                <p className="text-gray-600">{processo.assunto}</p>
              </div>
              <div>
                <strong className="text-gray-700">Localidade:</strong>
                <p className="text-gray-600">{processo.localidade}</p>
              </div>
              <div>
                <strong className="text-gray-700">Valor da Causa:</strong>
                <p className="text-gray-600">{Utils.formatCurrency(processo.valorCausa)}</p>
              </div>
              <div>
                <strong className="text-gray-700">Data de Distribuição:</strong>
                <p className="text-gray-600">{processo.dataDistribuicao}</p>
              </div>
              <div>
                <strong className="text-gray-700">Status:</strong>
                <Badge className={Utils.getStatusColor(Utils.getProcessoStatus(processo.ultimoEvento))}>
                  {Utils.getProcessoStatus(processo.ultimoEvento)}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <strong className="text-gray-700">Último Evento:</strong>
                <p className="text-gray-600 mt-1">{processo.ultimoEvento}</p>
              </div>
              <div>
                <strong className="text-gray-700">Data/Hora do Evento:</strong>
                <p className="text-gray-600">{processo.dataHoraEvento}</p>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button onClick={() => onEdit(processo)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button onClick={() => onDuplicate(processo)} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>
              <Button onClick={() => onDelete(processo.id)} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="prazos">
            <p className="text-gray-500 text-center py-8">Nenhum prazo cadastrado para este processo.</p>
          </TabsContent>
          
          <TabsContent value="documentos">
            <p className="text-gray-500 text-center py-8">Nenhum documento anexado a este processo.</p>
          </TabsContent>
          
          <TabsContent value="financeiro">
            <p className="text-gray-500 text-center py-8">Nenhum lançamento financeiro para este processo.</p>
          </TabsContent>
          
          <TabsContent value="historico">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm text-gray-500">Sistema</p>
                <p className="text-gray-700">Processo criado</p>
                <p className="text-xs text-gray-400">{Utils.formatDate(processo.createdAt)}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Componente Modal de Cliente
const ClienteModal = ({ open, onOpenChange, onSave }) => {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    setFormData({
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      endereco: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>Preencha as informações do novo cliente.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF/CNPJ *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Endereço completo"
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <CheckCircle className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default App
