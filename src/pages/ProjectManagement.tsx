import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateProjectProgress } from '../utils/progressCalculation';
import { 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  DollarSign,
  User,
  Home,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Grid3X3,
  List
} from 'lucide-react';

const ProjectManagement: React.FC = () => {
  const { user } = useAuth();
  const { projects, clients, tasks, addProject, updateProject, deleteProject } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    budget: '',
    startDate: '',
    expectedCompletion: '',
    rooms: [] as string[],
    status: 'consultation' as const
  });
  const [roomInput, setRoomInput] = useState('');
  const navigate = useNavigate();

  // Filter projects based on user role
  const userProjects = user?.role === 'client' 
    ? projects.filter(p => p.clientId === user.clientId)
    : projects;

  const filteredProjects = userProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'consultation': return 'bg-blue-50 text-blue-700';
      case 'vision_board': return 'bg-purple-50 text-purple-700';
      case 'ordering': return 'bg-amber-50 text-amber-700';
      case 'installation': return 'bg-green-50 text-green-700';
      case 'styling': return 'bg-pink-50 text-pink-700';
      case 'complete': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'consultation': return 'Consultation';
      case 'vision_board': return 'Vision Board';
      case 'ordering': return 'Ordering';
      case 'installation': return 'Installation';
      case 'styling': return 'Styling';
      case 'complete': return 'Complete';
      default: return 'Unknown';
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleEditProject = (project: any) => {
    setEditingProject({ ...project });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      await updateProject(editingProject.id, editingProject);
      setEditingProject(null);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    setShowDeleteConfirm(null);
    try {
      setDeletingProject(projectId);
      await deleteProject(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeletingProject(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate initial progress based on status
    const initialProgress = calculateProjectProgress(formData.status, []);
    addProject({
      ...formData,
      budget: parseFloat(formData.budget) || 0,
      spent: 0,
      images: [],
      progress: initialProgress
    });

    // Reset form
    setFormData({
      name: '',
      description: '',
      clientId: '',
      budget: '',
      startDate: '',
      expectedCompletion: '',
      rooms: [],
      status: 'consultation'
    });
    setRoomInput('');
    setShowCreateForm(false);
  };

  const addRoom = () => {
    if (roomInput.trim() && !formData.rooms.includes(roomInput.trim())) {
      setFormData(prev => ({
        ...prev,
        rooms: [...prev.rooms, roomInput.trim()]
      }));
      setRoomInput('');
    }
  };

  const removeRoom = (room: string) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter(r => r !== room)
    }));
  };

  const addEditRoom = (room: string) => {
    if (editingProject) {
      if (room.trim() && !editingProject.rooms.includes(room.trim())) {
        setEditingProject(prev => prev ? ({
          ...prev,
          rooms: [...prev.rooms, room.trim()]
        }) : null);
      }
    }
  };

  const removeEditRoom = (room: string) => {
    if (editingProject) {
      setEditingProject(prev => prev ? ({
        ...prev,
        rooms: prev.rooms.filter(r => r !== room)
      }) : null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to get smart progress for a project
  const getSmartProgress = (project: any) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    return calculateProjectProgress(project.status, projectTasks);
  };

  const stats = [
    {
      label: 'Total Projects',
      value: userProjects.length,
      change: '+3%',
      changeType: 'positive' as const,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Active Projects',
      value: userProjects.filter(p => p.status !== 'complete').length,
      change: '+12%',
      changeType: 'positive' as const,
      color: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'Completed',
      value: userProjects.filter(p => p.status === 'complete').length,
      change: '+8%',
      changeType: 'positive' as const,
      color: 'from-gray-500 to-gray-600',
      borderColor: 'border-gray-200'
    },
    {
      label: 'Total Value',
      value: formatCurrency(userProjects.reduce((sum, p) => sum + p.budget, 0)),
      change: '+15%',
      changeType: 'positive' as const,
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <main className="flex-1 overflow-y-auto">
          {/* Hero Section with Stats */}
          <div className="bg-white border-b border-gray-100">
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

            {/* Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search projects"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-48 touch-manipulation"
                  >
                    <option value="all">All statuses</option>
                    <option value="consultation">Consultation</option>
                    <option value="vision_board">Vision Board</option>
                    <option value="ordering">Ordering</option>
                    <option value="installation">Installation</option>
                    <option value="styling">Styling</option>
                    <option value="complete">Complete</option>
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

                  {user?.role !== 'client' && !showCreateForm && (
                    <button 
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors duration-200 w-full sm:w-auto touch-manipulation"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Create Project Form */}
            {showCreateForm && user?.role !== 'client' && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Create new project</h3>
                    <p className="mt-1 text-sm text-gray-600">Add a new client project to your portfolio</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        placeholder="Wilson Family Home Renovation"
                      />
                    </div>

                    {/* Client Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client
                      </label>
                      <select
                        required
                        value={formData.clientId}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      >
                        <option value="">Select a client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name} - {client.email}
                          </option>
                        ))}
                      </select>
                      {clients.length === 0 && (
                        <p className="mt-1 text-sm text-red-600">
                          No clients available. Please add clients first.
                        </p>
                      )}
                    </div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      placeholder="Brief description of the project scope"
                    />
                  </div>

                  {/* Budget and Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.budget}
                        onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start date
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected completion
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.expectedCompletion}
                        onChange={(e) => setFormData(prev => ({ ...prev, expectedCompletion: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      />
                    </div>
                  </div>

                  {/* Rooms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rooms/Areas
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRoom())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        placeholder="Living Room, Kitchen, Master Bedroom"
                      />
                      <button
                        type="button"
                        onClick={addRoom}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium touch-manipulation"
                      >
                        Add
                      </button>
                    </div>
                    {formData.rooms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.rooms.map((room, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                          >
                            <span>{room}</span>
                            <button
                              type="button"
                              onClick={() => removeRoom(room)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 border border-gray-300 touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                    >
                      Create Project
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Projects Display */}
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                  const client = clients.find(c => c.id === project.clientId);
                  const smartProgress = getSmartProgress(project);
                  const projectTasks = tasks.filter(t => t.projectId === project.id);
                  const completedTasks = projectTasks.filter(t => t.status === 'completed');
                  
                  return (
                    <div key={project.id} className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                      {/* Header Section */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">{project.name}</h3>
                            {project.description && (
                              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{project.description}</p>
                            )}
                          </div>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(project.status)} whitespace-nowrap`}>
                            {getStatusText(project.status)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Progress</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-700 font-medium">{smartProgress}%</span>
                              {projectTasks.length > 0 && (
                                <span className="text-gray-500">({completedTasks.length}/{projectTasks.length})</span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${smartProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="px-6 pb-4">
                        <div className="space-y-2 text-sm text-gray-600">
                          {client && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium text-gray-700">{client.name}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium">Budget:</span>
                            </div>
                            <span className="font-bold text-gray-900">{formatCurrency(project.budget)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">Due:</span>
                            </div>
                            <span className="font-medium text-gray-700">{new Date(project.expectedCompletion).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {project.rooms && project.rooms.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {project.rooms.slice(0, 3).map((room, idx) => (
                              <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                {room}
                              </span>
                            ))}
                            {project.rooms.length > 3 && (
                              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                                +{project.rooms.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Section */}
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewProject(project.id)}
                            className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold touch-manipulation"
                          >
                            <Eye className="w-4 h-4 inline mr-2" />
                            View Project
                          </button>
                          {user?.role !== 'client' && (
                            <>
                              <button 
                                onClick={() => handleEditProject(project)}
                                className="bg-gray-100 text-gray-700 py-2.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold touch-manipulation"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(project.id)}
                                disabled={deletingProject === project.id}
                                className="bg-red-100 text-red-700 py-2.5 px-3 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold disabled:opacity-50 touch-manipulation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Budget</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Due Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProjects.map((project) => {
                        const client = clients.find(c => c.id === project.clientId);
                        const smartProgress = getSmartProgress(project);
                        const projectTasks = tasks.filter(t => t.projectId === project.id);
                        const completedTasks = projectTasks.filter(t => t.status === 'completed');
                        
                        return (
                          <tr 
                            key={project.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                <div className="text-sm text-gray-500 sm:hidden">
                                  {client?.name}
                                </div>
                                {project.description && (
                                  <div className="text-sm text-gray-500 max-w-xs truncate">{project.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-sm text-gray-900">{client?.name || 'Unknown Client'}</div>
                              <div className="text-sm text-gray-500">{client?.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                                {getStatusText(project.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                              <div>{formatCurrency(project.budget)}</div>
                              <div className="text-xs text-gray-500">Spent: {formatCurrency(project.spent)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="font-medium">{smartProgress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${smartProgress}%` }}
                                    />
                                  </div>
                                  {projectTasks.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {completedTasks.length}/{projectTasks.length} tasks
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden xl:table-cell">
                              {new Date(project.expectedCompletion).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                <button 
                                  onClick={() => handleViewProject(project.id)}
                                  className="text-blue-600 hover:text-blue-900 p-1 touch-manipulation"
                                  title="View Project"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {user?.role !== 'client' && (
                                  <>
                                    <button 
                                      onClick={() => handleEditProject(project)}
                                      className="text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                                      title="Edit Project"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => setShowDeleteConfirm(project.id)}
                                      disabled={deletingProject === project.id}
                                      className="text-red-400 hover:text-red-600 p-1 disabled:opacity-50 touch-manipulation"
                                      title="Delete Project"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
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
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : user?.role === 'client'
                      ? 'Your projects will appear here once they\'re created'
                      : 'Create your first project to get started'
                  }
                </p>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                      <p className="text-sm text-gray-600">This action cannot be undone</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-700 mb-3">
                      Are you sure you want to delete this project?
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">
                        <strong>"{filteredProjects.find(p => p.id === showDeleteConfirm)?.name}"</strong> and all associated data will be permanently removed.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteProject(showDeleteConfirm)}
                      disabled={deletingProject === showDeleteConfirm}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {deletingProject === showDeleteConfirm ? 'Deleting...' : 'Delete Project'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Project Form */}
            {editingProject && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Edit Project</h3>
                    <p className="mt-1 text-sm text-gray-600">Update project information</p>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectManagement;