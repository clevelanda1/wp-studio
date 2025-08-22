import React, { useState } from 'react';
import { Contract, Project } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  X,
  Upload,
  File
} from 'lucide-react';

interface ContractsTabProps {
  project: Project;
  contracts: Contract[];
  onAddContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
}

const ContractsTab: React.FC<ContractsTabProps> = ({
  project,
  contracts,
  onAddContract,
  onUpdateContract
}) => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'proposal' as const,
    value: '',
    fileName: ''
  });

  const isAdmin = user?.role === 'business_owner' || user?.role === 'team_member';

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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'sent':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'viewed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'draft':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
        setFormData(prev => ({ ...prev, fileName: file.name }));
      } else {
        alert('Please select a PDF or Word document');
        e.target.value = '';
      }
    }
  };

  const handleDownload = (contract: Contract) => {
    if (contract.fileUrl && contract.fileUrl !== '#') {
      const link = document.createElement('a');
      link.href = contract.fileUrl;
      link.download = contract.fileName || `${contract.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleView = (contract: Contract) => {
    if (contract.fileUrl && contract.fileUrl !== '#') {
      window.open(contract.fileUrl, '_blank');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
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
    
    await onAddContract({
      title: formData.title,
      description: formData.description,
      clientId: project.clientId,
      projectId: project.id,
      type: formData.type,
      status: 'draft',
      fileUrl,
      fileName,
      value: parseFloat(formData.value) || undefined,
      version: 1
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      type: 'proposal',
      value: '',
      fileName: ''
    });
    setSelectedFile(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Project Contracts</h3>
          <p className="text-sm text-gray-600 mt-1">View and manage contract documents for this project</p>
        </div>
        {isAdmin && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contract</span>
          </button>
        )}
      </div>

      {/* Add Contract Form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Add New Contract</h4>
              <p className="text-sm text-gray-600 mt-1">Create a new contract for this project</p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="e.g., Design Contract - Phase 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Brief description of the contract scope and terms..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="50000"
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
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

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Contract
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contracts List */}
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div key={contract.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h4 className="font-semibold text-gray-900 text-lg">{contract.title}</h4>
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(contract.status)}`}>
                    {getStatusIcon(contract.status)}
                    <span className="capitalize">{contract.status}</span>
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {getTypeLabel(contract.type)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{contract.description}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  {contract.value && (
                    <div>
                      <span className="font-medium">Value:</span> <span className="font-bold text-gray-900">{formatCurrency(contract.value)}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Version:</span> <span className="font-bold text-gray-900">{contract.version}</span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {contract.signedAt ? 'Signed:' :
                       contract.sentAt ? 'Sent:' : 'Created:'}
                    </span>{' '}
                    <span className="font-bold text-gray-900">{formatDate(contract.signedAt || contract.sentAt || contract.createdAt)}</span>
                  </div>
                  {contract.fileName && (
                    <div className="flex items-center space-x-1">
                      <File className="w-4 h-4" />
                      <span className="font-medium text-gray-700">{contract.fileName}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button 
                  onClick={() => handleView(contract)}
                  disabled={!contract.fileUrl || contract.fileUrl === '#'}
                  className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="View Document"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDownload(contract)}
                  disabled={!contract.fileUrl || contract.fileUrl === '#'}
                  className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h4>
            <p className="text-gray-600">
              {isAdmin ? 'Add your first contract to get started' : 'Contracts will appear here once they\'re created. To delete contracts, use the main Contracts page.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractsTab;