import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { 
  FileText,
  Plus,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  X,
  User,
  Home,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  File,
  Trash2,
  Grid3X3,
  List
} from 'lucide-react';

const ContractManagement: React.FC = () => {
  const { user } = useAuth();
  const { contracts, clients, projects, addContract, deleteContract } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingContract, setDeletingContract] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    projectId: '',
    type: 'proposal' as const,
    value: '',
    fileUrl: '#',
    fileName: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Filter contracts based on user role
  const userContracts = user?.role === 'client' 
    ? contracts.filter(c => c.clientId === user.clientId)
    : contracts;

  const filteredContracts = userContracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'sent':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'viewed':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'draft':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-emerald-50 text-emerald-700';
      case 'sent':
        return 'bg-amber-50 text-amber-700';
      case 'viewed':
        return 'bg-blue-50 text-blue-700';
      case 'draft':
        return 'bg-gray-50 text-gray-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'proposal':
        return 'Proposal';
      case 'design_contract':
        return 'Design Contract';
      case 'amendment':
        return 'Amendment';
      case 'completion_certificate':
        return 'Completion Certificate';
      default:
        return 'Document';
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name || null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would upload the file to a server here
    // For demo purposes, we'll create a mock file URL
    let fileUrl = '#';
    let fileName = '';
    
    if (selectedFile) {
      // Create a mock URL for demo purposes
      fileUrl = URL.createObjectURL(selectedFile);
      fileName = selectedFile.name;
    }
    
    addContract({
      ...formData,
      fileUrl,
      fileName,
      value: parseFloat(formData.value) || undefined,
      status: 'draft',
      version: 1
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      clientId: '',
      projectId: '',
      type: 'proposal',
      value: '',
      fileUrl: '#',
      fileName: ''
    });
    setSelectedFile(null);
    setShowCreateForm(false);
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const clientProjects = selectedClient ? projects.filter(p => p.clientId === selectedClient.id) : [];

  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Please select a PDF or Word document');
        e.target.value = '';
      }
    }
  };

  const handleDownload = (contract: any) => {
    if (contract.fileUrl && contract.fileUrl !== '#') {
      // In a real app, this would download from your server
      const link = document.createElement('a');
      link.href = contract.fileUrl;
      link.download = contract.fileName || `${contract.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleView = (contract: any) => {
    if (contract.fileUrl && contract.fileUrl !== '#') {
      // In a real app, this would open the document viewer
      window.open(contract.fileUrl, '_blank');
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    setDeletingContract(contractId);
    try {
      deleteContract(contractId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete contract:', error);
      alert('Failed to delete contract. Please try again.');
    } finally {
      setDeletingContract(null);
    }
  };

  const stats = [
    {
      label: 'Total Contracts',
      value: userContracts.length,
      change: '+7%',
      changeType: 'positive' as const,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Pending Signature',
      value: userContracts.filter(c => c.status === 'sent' || c.status === 'viewed').length,
      change: '+15%',
      changeType: 'positive' as const,
      color: 'from-amber-500 to-amber-600',
      borderColor: 'border-amber-200'
    },
    {
      label: 'Signed',
      value: userContracts.filter(c => c.status === 'signed').length,
      change: '+22%',
      changeType: 'positive' as const,
      color: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'Total Value',
      value: formatCurrency(userContracts.reduce((sum, c) => sum + (c.value || 0), 0)),
      change: '+18%',
      changeType: 'positive' as const,
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
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
                      placeholder="Search contracts"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full sm:w-60 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-40 touch-manipulation"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="viewed">Viewed</option>
                    <option value="signed">Signed</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-40 touch-manipulation"
                  >
                    <option value="all">All Types</option>
                    <option value="proposal">Proposals</option>
                    <option value="design_contract">Design Contracts</option>
                    <option value="amendment">Amendments</option>
                    <option value="completion_certificate">Completion Certificates</option>
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
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 w-full sm:w-auto touch-manipulation"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contract
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Create Contract Form */}
            {showCreateForm && user?.role !== 'client' && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Create new contract</h3>
                    <p className="mt-1 text-sm text-gray-600">Generate a new contract or agreement</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contract Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      placeholder="e.g., Wilson Family Home - Design Contract"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      placeholder="Brief description of the contract scope and terms..."
                    />
                  </div>

                  {/* Client and Project Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client *
                      </label>
                      <select
                        required
                        value={formData.clientId}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value, projectId: '' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      >
                        <option value="">Select a client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        This contract will be visible to the selected client
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project (Optional)
                      </label>
                      <select
                        value={formData.projectId}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        disabled={!formData.clientId}
                      >
                        <option value="">Select a project</option>
                        {clientProjects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {!formData.clientId ? 'Select a client first to see their projects' : 'Optional: Link this contract to a specific project'}
                      </p>
                    </div>
                  </div>

                  {/* Contract Type and Value */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contract Type *
                      </label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      >
                        <option value="proposal">Proposal</option>
                        <option value="design_contract">Design Contract</option>
                        <option value="amendment">Amendment</option>
                        <option value="completion_certificate">Completion Certificate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contract Value
                      </label>
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Document
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="contract-file"
                      />
                      <label
                        htmlFor="contract-file"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="w-8 h-8 text-gray-400" />
                        <div>
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            Click to upload
                          </span>
                          <span className="text-gray-500"> or drag and drop</span>
                        </div>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                      </label>
                    </div>
                    {selectedFile && (
                      <div className="mt-3 flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                        <File className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-800 font-medium">{selectedFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
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
                      Create Contract
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contracts Display */}
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredContracts.map((contract) => {
                  const projectName = getProjectName(contract.projectId);
                  
                  return (
                    <div key={contract.id} className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                      {/* Header Section */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">{contract.title}</h3>
                            {contract.description && (
                              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{contract.description}</p>
                            )}
                          </div>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(contract.status)} whitespace-nowrap`}>
                            {getStatusIcon(contract.status)}
                            <span className="ml-1 capitalize">{contract.status}</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-3">
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-semibold">
                            {getTypeLabel(contract.type)}
                          </span>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="px-6 pb-4">
                        <div className="space-y-2 text-sm text-gray-600">
                          {user?.role !== 'client' && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium text-gray-700">{getClientName(contract.clientId)}</span>
                            </div>
                          )}
                          {projectName && (
                            <div className="flex items-center space-x-2">
                              <Home className="w-4 h-4" />
                              <span className="font-medium text-gray-700">{projectName}</span>
                            </div>
                          )}
                          {contract.value && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Value:</span>
                              <span className="font-bold text-gray-900">{formatCurrency(contract.value)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Version:</span>
                            <span className="font-bold text-gray-900">{contract.version}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {contract.signedAt ? 'Signed:' :
                               contract.sentAt ? 'Sent:' : 'Created:'}
                            </span>
                            <span className="font-bold text-gray-900">{formatDate(contract.signedAt || contract.sentAt || contract.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Section */}
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleView(contract)}
                            disabled={!contract.fileUrl || contract.fileUrl === '#'}
                            className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <Eye className="w-4 h-4 inline mr-2" />
                            View
                          </button>
                          <button 
                            onClick={() => handleDownload(contract)}
                            disabled={!contract.fileUrl || contract.fileUrl === '#'}
                            className="bg-gray-100 text-gray-700 py-2.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {user?.role !== 'client' && (
                            <button 
                              onClick={() => setShowDeleteConfirm(contract.id)}
                              disabled={deletingContract === contract.id}
                              className="bg-red-100 text-red-700 py-2.5 px-3 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold disabled:opacity-50 touch-manipulation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredContracts.map((contract) => {
                        const projectName = getProjectName(contract.projectId);
                        
                        return (
                          <tr 
                            key={contract.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{contract.title}</div>
                                <div className="text-sm text-gray-500 sm:hidden">
                                  {getClientName(contract.clientId)}
                                </div>
                                {contract.description && (
                                  <div className="text-sm text-gray-500 max-w-xs truncate">{contract.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-sm text-gray-900">{getClientName(contract.clientId)}</div>
                              {projectName && (
                                <div className="text-sm text-gray-500">{projectName}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(contract.status)}`}>
                                {getStatusIcon(contract.status)}
                                <span className="capitalize">{contract.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-semibold">
                                {getTypeLabel(contract.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                              {contract.value ? formatCurrency(contract.value) : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden xl:table-cell">
                              {formatDate(contract.signedAt || contract.sentAt || contract.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                <button 
                                  onClick={() => handleView(contract)}
                                  disabled={!contract.fileUrl || contract.fileUrl === '#'}
                                  className="text-blue-600 hover:text-blue-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                  title="View Document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDownload(contract)}
                                  disabled={!contract.fileUrl || contract.fileUrl === '#'}
                                  className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                  title="Download Document"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                {user?.role !== 'client' && (
                                  <button 
                                    onClick={() => setShowDeleteConfirm(contract.id)}
                                    disabled={deletingContract === contract.id}
                                    className="text-red-400 hover:text-red-600 p-1 disabled:opacity-50 touch-manipulation"
                                    title="Delete Contract"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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
            {filteredContracts.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : user?.role === 'client'
                      ? 'Your contracts will appear here once they\'re created'
                      : 'Create your first contract to get started'
                  }
                </p>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Delete Contract</h3>
                      <p className="text-sm text-gray-600">This action cannot be undone</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-700 mb-3">
                      Are you sure you want to delete this contract?
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">
                        <strong>"{contracts.find(c => c.id === showDeleteConfirm)?.title}"</strong> will be permanently removed from the system.
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
                      onClick={() => handleDeleteContract(showDeleteConfirm)}
                      disabled={deletingContract === showDeleteConfirm}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {deletingContract === showDeleteConfirm ? 'Deleting...' : 'Delete Contract'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContractManagement;