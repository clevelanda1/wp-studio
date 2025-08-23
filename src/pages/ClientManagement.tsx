import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Search, User, Mail, Phone, MapPin, Calendar, ArrowUpRight, ArrowDownRight, X, Plus, Grid3X3, List, Trash2, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const ClientManagement = () => {
  const { user } = useAuth();
  const { clients, projects, users, loading, updateClient, addClient, deleteClient } = useData();
  const navigate = useNavigate();
  
  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [editingClient, setEditingClient] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingClient, setDeletingClient] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [debugMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    budget: '',
    moveInDate: '',
    status: 'inquiry' as const,
    stylePreferences: [] as string[],
    notes: '',
    leadSource: ''
  });
  const [styleInput, setStyleInput] = useState('');

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inquiry':
        return 'bg-yellow-50 text-yellow-700';
      case 'consultation':
        return 'bg-blue-50 text-blue-700';
      case 'contract':
        return 'bg-purple-50 text-purple-700';
      case 'active':
        return 'bg-green-50 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'inquiry': return 'Inquiry';
      case 'consultation': return 'Consultation';
      case 'contract': return 'Contract';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getClientProjects = (clientId: string) => {
    return projects.filter(p => p.clientId === clientId);
  };

  const handleEditClient = (client: any) => {
    setEditingClient({ ...client });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      await updateClient(editingClient.id, editingClient);
      setEditingClient(null);
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
  };

  const addStylePreference = (style: string) => {
    if (editingClient) {
      if (style.trim() && !editingClient.stylePreferences.includes(style.trim())) {
        setEditingClient(prev => prev ? ({
          ...prev,
          stylePreferences: [...prev.stylePreferences, style.trim()]
        }) : null);
      }
    } else {
      if (style.trim() && !formData.stylePreferences.includes(style.trim())) {
        setFormData(prev => ({
          ...prev,
          stylePreferences: [...prev.stylePreferences, style.trim()]
        }));
        setStyleInput('');
      }
    }
  };

  const removeStylePreference = (style: string) => {
    if (editingClient) {
      setEditingClient(prev => prev ? ({
        ...prev,
        stylePreferences: prev.stylePreferences.filter(s => s !== style)
      }) : null);
    } else {
      setFormData(prev => ({
        ...prev,
        stylePreferences: prev.stylePreferences.filter(s => s !== style)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addClient({
      ...formData,
      budget: parseFloat(formData.budget) || 0,
      organizationId: 'd6e612bb-da10-461e-bcf9-d5af1c4134e5'
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      budget: '',
      moveInDate: '',
      status: 'inquiry',
      stylePreferences: [],
      notes: '',
      leadSource: ''
    });
    setStyleInput('');
    setShowCreateForm(false);
  };

  const handleMessageClient = (clientId: string) => {
    navigate('/messages', { state: { selectedClientId: clientId } });
  };

  const handleDeleteClient = async (clientId: string) => {
    setShowDeleteConfirm(null);
    try {
      setDeletingClient(clientId);
      await deleteClient(clientId);
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('Failed to delete client. Please try again.');
    } finally {
      setDeletingClient(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const stats = [
    {
      label: 'Total Clients',
      value: clients.length,
      change: '+8%',
      changeType: 'positive' as const,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Active Clients',
      value: clients.filter(c => c.status === 'active').length,
      change: '+12%',
      changeType: 'positive' as const,
      color: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'New Inquiries',
      value: clients.filter(c => c.status === 'inquiry').length,
      change: '+25%',
      changeType: 'positive' as const,
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(projects.reduce((sum, p) => sum + p.budget, 0)),
      change: '+18%',
      changeType: 'positive' as const,
      color: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-200'
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
                      placeholder="Search clients"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-48"
                  >
                    <option value="all">All statuses</option>
                    <option value="inquiry">Inquiry</option>
                    <option value="consultation">Consultation</option>
                    <option value="contract">Contract</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
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
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Create Client Form */}
            {showCreateForm && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Add new client</h3>
                    <p className="mt-1 text-sm text-gray-600">Create a new client profile</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 text-gray-300 hover:text-gray-500 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Emma Wilson"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="emma@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget
                      </label>
                      <input
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="123 Main Street, City, State"
                    />
                  </div>

                  {/* Status and Start Date */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="inquiry">Inquiry</option>
                        <option value="consultation">Consultation</option>
                        <option value="contract">Contract</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.moveInDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, moveInDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lead Source
                      </label>
                      <select
                        value={formData.leadSource}
                        onChange={(e) => setFormData(prev => ({ ...prev, leadSource: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select source</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Referral">Referral</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Website">Website</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Style Preferences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Style Preferences
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={styleInput}
                        onChange={(e) => setStyleInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addStylePreference(styleInput);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g., Modern, Minimalist, Bohemian"
                      />
                      <button
                        type="button"
                        onClick={() => addStylePreference(styleInput)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {formData.stylePreferences.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.stylePreferences.map((style, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                          >
                            <span>{style}</span>
                            <button
                              type="button"
                              onClick={() => removeStylePreference(style)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Any additional notes about the client..."
                    />
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
                      Create Client
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Client Form */}
            {editingClient && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Edit Client</h3>
                    <p className="mt-1 text-sm text-gray-600">Update client information</p>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-200 hover:text-gray-400 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingClient.name}
                        onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Emma Wilson"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={editingClient.email}
                        onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="emma@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={editingClient.phone}
                        onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget
                      </label>
                      <input
                        type="number"
                        value={editingClient.budget}
                        onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, budget: parseFloat(e.target.value) || 0 }) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editingClient.address || ''}
                      onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="123 Main Street, City, State"
                    />
                  </div>

                  {/* Status and Start Date */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editingClient.status}
                        onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="inquiry">Inquiry</option>
                        <option value="consultation">Consultation</option>
                        <option value="contract">Contract</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editingClient.moveInDate || ''}
                        onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, moveInDate: e.target.value }) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lead Source
                      </label>
                      <select
                        value={editingClient.leadSource}
                        onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, leadSource: e.target.value }) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select source</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Referral">Referral</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Website">Website</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Style Preferences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Style Preferences
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addStylePreference((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g., Modern, Minimalist, Bohemian"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addStylePreference(input.value);
                          input.value = '';
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {editingClient.stylePreferences.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editingClient.stylePreferences.map((style, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                          >
                            <span>{style}</span>
                            <button
                              type="button"
                              onClick={() => removeStylePreference(style)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editingClient.notes}
                      onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Any additional notes about the client..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Clients Display */}
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClients.map((client) => {
                  const clientProjects = getClientProjects(client.id);
                  const totalValue = clientProjects.reduce((sum, project) => sum + project.budget, 0);
                  
                  return (
                    <div key={client.id} className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                      {/* Header Section */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden ring-2 ring-gray-100">
                              {client.avatar ? (
                                <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                                  {client.name.split(' ').map(n => n[0]).join('')}
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg leading-tight">{client.name}</h3>
                              <p className="text-sm text-gray-600">Client since {new Date(client.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(client.status)} whitespace-nowrap`}>
                            {getStatusText(client.status)}
                          </span>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">{client.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span className="font-medium">{client.phone}</span>
                          </div>
                          {client.address && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">{client.address}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Financial Section */}
                      <div className="px-6 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Budget</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(client.budget)}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Projects</p>
                            <p className="text-lg font-bold text-gray-900">{clientProjects.length}</p>
                          </div>
                        </div>
                      </div>

                      {client.moveInDate && (
                        <div className="px-6 pb-4">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="text-gray-600 font-medium">Move-in: {new Date(client.moveInDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}

                      {client.stylePreferences.length > 0 && (
                        <div className="px-6 pb-4">
                          <p className="text-xs text-gray-500 mb-2 font-medium">Style Preferences</p>
                          <div className="flex flex-wrap gap-1">
                            {client.stylePreferences.slice(0, 3).map((style, idx) => (
                              <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
                                {style}
                              </span>
                            ))}
                            {client.stylePreferences.length > 3 && (
                              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md font-medium">
                                +{client.stylePreferences.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {client.notes && (
                        <div className="px-6 pb-4">
                          <p className="text-xs text-gray-500 mb-1 font-medium">Notes</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{client.notes}</p>
                        </div>
                      )}

                      {/* Footer Section */}
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditClient(client)}
                            className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                          >
                            <Edit className="w-4 h-4 inline mr-2" />
                            Edit Client
                          </button>
                          <button 
                            onClick={() => handleMessageClient(client.id)}
                            className="bg-gray-100 text-gray-700 py-2.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                          >
                            Message
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(client.id)}
                            disabled={deletingClient === client.id}
                            className="bg-red-100 text-red-700 py-2.5 px-3 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold disabled:opacity-50 touch-manipulation"
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClients.map((client) => {
                        const clientProjects = getClientProjects(client.id);
                        
                        return (
                          <tr 
                            key={client.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-9 h-9 rounded-lg overflow-hidden ring-2 ring-gray-100 mr-3">
                                  {client.avatar ? (
                                    <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                                      {client.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                  <div className="text-sm text-gray-500">Since {new Date(client.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{client.email}</div>
                              <div className="text-sm text-gray-500">{client.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                                {getStatusText(client.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(client.budget)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {clientProjects.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {client.moveInDate ? new Date(client.moveInDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => handleEditClient(client)}
                                className="text-blue-600 hover:text-blue-900 p-1 mr-2"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => navigate('/messages', { state: { selectedClientId: client.id } })}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Send Message"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(client.id)}
                                disabled={deletingClient === client.id}
                                className="text-red-400 hover:text-red-600 p-1 disabled:opacity-50 touch-manipulation"
                                title="Delete Client"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first client to get started'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Client</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-3">
                    Are you sure you want to delete this client?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      <strong>"{clients.find(c => c.id === showDeleteConfirm)?.name}"</strong> and all associated data (projects, tasks, messages, contracts) will be permanently removed.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteClient(showDeleteConfirm)}
                    disabled={deletingClient === showDeleteConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {deletingClient === showDeleteConfirm ? 'Deleting...' : 'Delete Client'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientManagement;