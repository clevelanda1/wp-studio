import React, { useState } from 'react';
import { Return, Project } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Calendar, DollarSign, Package, X, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ReturnsTabProps {
  project: Project;
  returns: Return[];
  onAddReturn: (returnItem: Omit<Return, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateReturn: (id: string, updates: Partial<Return>) => Promise<void>;
}

const ReturnsTab: React.FC<ReturnsTabProps> = ({
  project,
  returns,
  onAddReturn,
  onUpdateReturn
}) => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingReturn, setDeletingReturn] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reason: '',
    returnDate: '',
    items: [{ name: '', quantity: 1, unitPrice: 0 }],
    notes: ''
  });

  const isAdmin = user?.role === 'business_owner' || user?.role === 'team_member';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'refunded': return 'bg-green-50 text-green-700 border-green-200';
      case 'exchanged': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return <CheckCircle className="w-4 h-4" />;
      case 'refunded': return <CheckCircle className="w-4 h-4" />;
      case 'exchanged': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleStatusChange = (returnId: string, newStatus: string) => {
    if (newStatus === 'delete') {
      setShowDeleteConfirm(returnId);
      return;
    }
    
    const updates: Partial<Return> = { status: newStatus as any };
    if (newStatus !== 'pending' && !returns.find(r => r.id === returnId)?.processedDate) {
      updates.processedDate = new Date().toISOString().split('T')[0];
    }
    onUpdateReturn(returnId, updates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = calculateTotalAmount();
    
    await onAddReturn({
      projectId: project.id,
      clientId: project.clientId,
      item: formData.items,
      reason: formData.reason,
      status: 'pending',
      amount: totalAmount > 0 ? totalAmount : undefined,
      returnDate: formData.returnDate,
      notes: formData.notes,
      images: []
    });

    // Reset form
    setFormData({
      reason: '',
      returnDate: '',
      items: [{ name: '', quantity: 1, unitPrice: 0 }],
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleDeleteReturn = async (returnId: string) => {
    setShowDeleteConfirm(null);
    try {
      setDeletingReturn(returnId);
      await onUpdateReturn(returnId, { status: 'deleted' as any });
    } catch (error) {
      console.error('Failed to delete return:', error);
      alert('Failed to delete return. Please try again.');
    } finally {
      setDeletingReturn(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Project Returns</h3>
          <p className="text-sm text-gray-600 mt-1">Manage product returns and exchanges</p>
        </div>
        {isAdmin && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors duration-200 w-full sm:w-auto touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span>Add Return</span>
          </button>
        )}
      </div>

      {/* Add Return Form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Add New Return</h4>
              <p className="text-sm text-gray-600 mt-1">Record a new product return</p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.returnDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Return *
                </label>
                <select
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                >
                  <option value="">Select reason</option>
                  <option value="Defective">Defective</option>
                  <option value="Wrong Size">Wrong Size</option>
                  <option value="Wrong Color">Wrong Color</option>
                  <option value="Damaged in Transit">Damaged in Transit</option>
                  <option value="Client Changed Mind">Client Changed Mind</option>
                  <option value="Quality Issues">Quality Issues</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Return Items *
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="space-y-3 sm:grid sm:grid-cols-1 md:grid-cols-4 sm:gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Item Name</label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        placeholder="Item name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Quantity</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        placeholder="Quantity"
                      />
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                          placeholder="Unit price"
                        />
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-600 p-2 touch-manipulation"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {calculateTotalAmount() > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Return Value:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(calculateTotalAmount())}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                placeholder="Additional notes about the return..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 border border-gray-300 touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              >
                Add Return
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Returns List */}
      <div className="space-y-4">
        {returns.filter(returnItem => returnItem.status !== 'deleted').map((returnItem) => (
          <div key={returnItem.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0 mb-4">
              <div className="flex-1 min-w-0 sm:pr-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">Return #{returnItem.id.slice(-8)}</h4>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                    (() => {
                      const returnDate = new Date(returnItem.returnDate);
                      const today = new Date();
                      const diffTime = returnDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < 0) return 'bg-red-50 text-red-700 border-red-200';
                      if (diffDays <= 5) return 'bg-orange-50 text-orange-700 border-orange-200';
                      if (diffDays <= 15) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                      return 'bg-green-50 text-green-700 border-green-200';
                    })()
                  } w-fit`}>
                    <Calendar className="w-4 h-4" />
                    <span>
                      {(() => {
                        const returnDate = new Date(returnItem.returnDate);
                        const today = new Date();
                        const diffTime = returnDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
                        if (diffDays === 0) return 'Due today';
                        if (diffDays === 1) return '1 day left';
                        return `${diffDays} days left`;
                      })()}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  <strong>Reason:</strong> {returnItem.reason}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Return Date: {new Date(returnItem.returnDate).toLocaleDateString()}</span>
                  </div>
                  {returnItem.processedDate && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Processed: {new Date(returnItem.processedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end space-x-3">
                {returnItem.amount && (
                  <div className="text-left sm:text-right">
                    <div className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrency(returnItem.amount)}</div>
                    <div className="text-xs text-gray-500">Return Value</div>
                  </div>
                )}
                {isAdmin && (
                  <select
                    value={returnItem.status}
                    onChange={(e) => {
                      // Reset to current status if user cancels delete
                      if (e.target.value === 'delete') {
                        handleStatusChange(returnItem.id, e.target.value);
                        // Reset dropdown to current status
                        e.target.value = returnItem.status;
                      } else {
                        handleStatusChange(returnItem.id, e.target.value);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:ring-2 focus:ring-blue-500 touch-manipulation ${getStatusColor(returnItem.status)}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="processed">Processed</option>
                    <option value="refunded">Refunded</option>
                    <option value="exchanged">Exchanged</option>
                    <option value="delete">Remove Return</option>
                  </select>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-gray-100 pt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Returned Items:</h5>
              <div className="space-y-2">
                {returnItem.item?.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm bg-gray-50 p-3 rounded-lg space-y-1 sm:space-y-0">
                    <span className="text-gray-700 font-medium">
                      <strong>{item.name}</strong> × {item.quantity}
                    </span>
                    {item.unitPrice && (
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    )}
                  </div>
                )) || []}
              </div>
            </div>

            {returnItem.notes && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Notes:</h5>
                <p className="text-sm text-gray-600">{returnItem.notes}</p>
              </div>
            )}
          </div>
        ))}

        {returns.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No returns yet</h4>
            <p className="text-gray-600">
              {isAdmin ? 'Add your first return to get started' : 'Returns will appear here once they\'re processed'}
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
                <h3 className="text-lg font-semibold text-gray-900">Remove Return</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to remove this return?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  <strong>Return #{showDeleteConfirm.slice(-8)}</strong> will be permanently removed from the project.
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
                onClick={() => handleDeleteReturn(showDeleteConfirm)}
                disabled={deletingReturn === showDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {deletingReturn === showDeleteConfirm ? 'Removing...' : 'Remove Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsTab;