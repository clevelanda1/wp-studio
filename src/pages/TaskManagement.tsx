import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useData } from '../contexts/DataContext';
import { 
  Plus,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  Clock,
  CheckCircle,
  MoreVertical,
  X,
  CheckSquare,
  Home,
  ArrowUpRight,
  ArrowDownRight,
  Grid3X3,
  List,
  Search,
  Trash2
} from 'lucide-react';

const TaskManagement: React.FC = () => {
  const { tasks, projects, clients, updateTask, addTask, deleteTask } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    clientId: '',
    priority: 'medium' as const,
    category: 'design' as const,
    dueDate: '',
    assignedTo: '',
    visibleToClient: false
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getTaskProject = (projectId?: string) => {
    return projectId ? projects.find(p => p.id === projectId) : null;
  };

  const getTaskClient = (clientId?: string) => {
    return clientId ? clients.find(c => c.id === clientId) : null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700';
      case 'medium': return 'bg-orange-50 text-orange-700';
      case 'low': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700';
      case 'in_progress': return 'bg-blue-50 text-blue-700';
      case 'pending': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'design': return 'bg-purple-50 text-purple-700';
      case 'ordering': return 'bg-orange-50 text-orange-700';
      case 'consultation': return 'bg-blue-50 text-blue-700';
      case 'installation': return 'bg-emerald-50 text-emerald-700';
      case 'communication': return 'bg-pink-50 text-pink-700';
      case 'administrative': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask(taskId, { status: newStatus as any });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingTask(taskId);
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setDeletingTask(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addTask({
      ...formData,
      status: 'pending'
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      projectId: '',
      clientId: '',
      priority: 'medium',
      category: 'design',
      dueDate: '',
      assignedTo: '',
      visibleToClient: false
    });
    setShowCreateForm(false);
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);

  const stats = [
    {
      label: 'Total Tasks',
      value: tasks.length,
      change: '+5%',
      changeType: 'positive' as const,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'In Progress',
      value: tasks.filter(t => t.status === 'in_progress').length,
      change: '+12%',
      changeType: 'positive' as const,
      color: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      label: 'Completed',
      value: tasks.filter(t => t.status === 'completed').length,
      change: '+8%',
      changeType: 'positive' as const,
      color: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'Overdue',
      value: tasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate)).length,
      change: '-15%',
      changeType: 'negative' as const,
      color: 'from-red-500 to-red-600',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <main className="flex-1 overflow-y-auto">
          {/* Hero Section with Stats */}
          <div className="bg-white border-b border-gray-100">
            <div className="px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div 
                    key={index} 
                    className={`group relative bg-white rounded-xl border ${stat.borderColor} p-6 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                  >
                    {/* Gradient background accent */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-2xl`} />
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <p className="text-sm font-semibold text-gray-600 tracking-wide uppercase">{stat.label}</p>
                        <div className={`w-1 h-6 bg-gradient-to-b ${stat.color} rounded-full shadow-sm`} />
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-4xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                        <div className="flex items-center space-x-2">
                          {stat.changeType === 'positive' ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-bold ${
                            stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {stat.change}
                          </span>
                          <span className="text-sm text-gray-500 font-medium">vs last month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tasks"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full sm:w-60 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-40"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-40"
                  >
                    <option value="all">All priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-40"
                  >
                    <option value="all">All categories</option>
                    <option value="consultation">Consultation</option>
                    <option value="design">Design</option>
                    <option value="ordering">Ordering</option>
                    <option value="installation">Installation</option>
                    <option value="communication">Communication</option>
                    <option value="administrative">Administrative</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {!showCreateForm && (
                    <button 
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Create Task Form */}
            {showCreateForm && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Create new task</h3>
                    <p className="mt-1 text-sm text-gray-600">Add a new task to track project progress</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Task Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="e.g., Finalize kitchen cabinet selection"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Detailed description of the task..."
                    />
                  </div>

                  {/* Project and Client Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project
                      </label>
                      <select
                        value={formData.projectId}
                        onChange={(e) => {
                          const project = projects.find(p => p.id === e.target.value);
                          setFormData(prev => ({ 
                            ...prev, 
                            projectId: e.target.value,
                            clientId: project?.clientId || prev.clientId
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select a project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name} - {clients.find(c => c.id === project.clientId)?.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Selecting a project will automatically assign the task to that project's client
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client
                      </label>
                      <select
                        value={formData.clientId}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        disabled={!!formData.projectId}
                      >
                        <option value="">Select a client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.projectId ? 'Client is automatically set from selected project' : 'Select a client for this task'}
                      </p>
                    </div>
                  </div>

                  {/* Priority, Category, and Due Date */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority *
                      </label>
                      <select
                        required
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="consultation">Consultation</option>
                        <option value="design">Design</option>
                        <option value="ordering">Ordering</option>
                        <option value="installation">Installation</option>
                        <option value="communication">Communication</option>
                        <option value="administrative">Administrative</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Team member name or email"
                    />
                  </div>

                  {/* Client Visibility Toggle */}
                  <div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="visibleToClient"
                        checked={formData.visibleToClient}
                        onChange={(e) => setFormData(prev => ({ ...prev, visibleToClient: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="visibleToClient" className="text-sm font-medium text-gray-700">
                        Visible to Client
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      When enabled, this task will be visible to the client in their portal
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors duration-200"
                    >
                      {/*<Plus className="w-4 h-4 mr-2" />*/}
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tasks Display */}
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTasks.map((task) => {
                  const project = getTaskProject(task.projectId);
                  const client = getTaskClient(task.clientId);
                  const overdueTask = isOverdue(task.dueDate) && task.status !== 'completed';
                  
                  return (
                    <div key={task.id} className={`group bg-white rounded-xl border ${overdueTask ? 'border-red-200 bg-red-50' : 'border-gray-200'} hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden`}>
                      {/* Header Section */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">{task.title}</h3>
                            {task.description && (
                              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(task.status)} whitespace-nowrap`}>
                            {getStatusText(task.status)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)} flex items-center space-x-1`}>
                            {getPriorityIcon(task.priority)}
                            <span className="capitalize">{task.priority}</span>
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(task.category)}`}>
                            {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="px-6 pb-4">
                        <div className="space-y-2 text-sm text-gray-600">
                          {project && (
                            <div className="flex items-center space-x-2">
                              <Home className="w-4 h-4" />
                              <span className="font-medium text-gray-700">{project.name}</span>
                            </div>
                          )}
                          {client && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{client.name}</span>
                            </div>
                          )}
                          <div className={`flex items-center space-x-2 ${overdueTask ? 'text-red-600 font-semibold' : ''}`}>
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            {overdueTask && <span className="text-red-600 font-bold">(Overdue)</span>}
                          </div>
                        </div>
                      </div>

                      {/* Footer Section */}
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${getStatusColor(task.status)} cursor-pointer border-0 focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={deletingTask === task.id}
                            className="bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project/Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTasks.map((task) => {
                        const project = getTaskProject(task.projectId);
                        const client = getTaskClient(task.clientId);
                        const overdueTask = isOverdue(task.dueDate) && task.status !== 'completed';
                        
                        return (
                          <tr 
                            key={task.id}
                            className={`hover:bg-gray-50 transition-colors ${overdueTask ? 'bg-red-50' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                {task.description && (
                                  <div className="text-sm text-gray-500 max-w-xs truncate">{task.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                {project && <div className="text-gray-900 font-medium">{project.name}</div>}
                                {client && <div className="text-gray-500">{client.name}</div>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)} flex items-center space-x-1 w-fit`}>
                                {getPriorityIcon(task.priority)}
                                <span className="capitalize">{task.priority}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(task.category)}`}>
                                {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className={overdueTask ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                                {new Date(task.dueDate).toLocaleDateString()}
                                {overdueTask && <div className="text-red-600 font-bold text-xs">(Overdue)</div>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <select
                                  value={task.status}
                                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)} cursor-pointer border-0 focus:ring-2 focus:ring-blue-500`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                </select>
                                <button 
                                  onClick={() => handleDeleteTask(task.id)}
                                  disabled={deletingTask === task.id}
                                  className="text-red-400 hover:text-red-600 p-1 disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first task to get started'
                  }
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TaskManagement;