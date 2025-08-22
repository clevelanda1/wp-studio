import React from 'react';
import { Contract } from '../../contexts/DataContext';
import { FileText, CheckCircle, Clock, Eye, AlertCircle } from 'lucide-react';

interface ContractOverviewProps {
  contracts: Contract[];
}

const ContractOverview: React.FC<ContractOverviewProps> = ({ contracts }) => {
  const getStatusIcon = (status: Contract['status']) => {
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

  const getStatusColor = (status: Contract['status']) => {
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

  const getTypeLabel = (type: Contract['type']) => {
    switch (type) {
      case 'proposal':
        return 'Proposal';
      case 'design_contract':
        return 'Design Contract';
      case 'amendment':
        return 'Amendment';
      case 'completion_certificate':
        return 'Completion';
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
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-3">
      {contracts.map((contract) => (
        <div key={contract.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate">{contract.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{getTypeLabel(contract.type)}</p>
            </div>
            <div className="flex items-center space-x-2 ml-3">
              {contract.value && (
                <span className="text-xs font-medium text-gray-700">
                  {formatCurrency(contract.value)}
                </span>
              )}
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(contract.status)}`}>
                {getStatusIcon(contract.status)}
                <span className="capitalize">{contract.status}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>v{contract.version}</span>
            <span>
              {contract.signedAt ? `Signed ${formatDate(contract.signedAt)}` :
               contract.sentAt ? `Sent ${formatDate(contract.sentAt)}` :
               `Created ${formatDate(contract.createdAt)}`}
            </span>
          </div>
        </div>
      ))}
      
      {contracts.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No contracts yet</p>
        </div>
      )}
      
      <button className="w-full mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
        View All Contracts
      </button>
    </div>
  );
};

export default ContractOverview;