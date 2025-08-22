import React, { useState } from 'react';
import { Expense, Project } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Calendar, DollarSign, Receipt, X, Trash2, Edit } from 'lucide-react';

interface ExpensesTabProps {
  project: Project;
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({
  project,
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}) => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'materials' as const,
    expenseDate: '',
    items: [{ name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    notes: ''
  });

  const isAdmin = user?.role === 'business_owner' || user?.role === 'team_member';

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'materials': return 'bg-blue-50 text-blue-700';
      case 'labor': return 'bg-green-50 text-green-700';
      case 'transportation': return 'bg-yellow-50 text-yellow-700';
      case 'permits': return 'bg-purple-50 text-purple-700';
      case 'other': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const updateItemTotal = (index: number, quantity: number, unitPrice: number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice
    };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
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

  const handleDeleteExpense = async (expenseId: string) => {
    setShowDeleteConfirm(null);
    try {
      setDeletingExpense(expenseId);
      await onDeleteExpense(expenseId);
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setDeletingExpense(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = calculateTotalAmount();
    
    await onAddExpense({
      ...formData,
      projectId: project.id,
      clientId: project.clientId,
      totalAmount
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      category: 'materials',
      expenseDate: '',
      items: [{ name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
      notes: ''
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Project Expenses</h3>
          <p className="text-sm text-gray-600 mt-1">Track and manage project expenses</p>
        </div>
        {isAdmin && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors duration-200 w-full sm:w-auto touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        )}
      </div>

      {/* Add Expense Form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Add New Expense</h4>
              <p className="text-sm text-gray-600 mt-1">Record a new project expense</p>
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
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                  placeholder="e.g., Kitchen Cabinet Hardware"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expenseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
              >
                <option value="materials">Materials</option>
                <option value="labor">Labor</option>
                <option value="transportation">Transportation</option>
                <option value="permits">Permits</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                placeholder="Detailed description of the expense..."
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Expense Items *
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
                  <div key={index} className="space-y-3 sm:grid sm:grid-cols-1 md:grid-cols-5 sm:gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Item Name</label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...newItems[index], name: e.target.value };
                          setFormData(prev => ({ ...prev, items: newItems }));
                        }}
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
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value) || 1;
                          updateItemTotal(index, quantity, item.unitPrice);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        placeholder="Qty"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Unit Price</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const unitPrice = parseFloat(e.target.value) || 0;
                          updateItemTotal(index, item.quantity, unitPrice);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        placeholder="Unit price"
                      />
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Total</label>
                        <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                        </span>
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
              
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(calculateTotalAmount())}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                placeholder="Additional notes..."
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
                Add Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0 mb-4">
              <div className="flex-1 min-w-0 sm:pr-4">
                <h4 className="font-semibold text-gray-900 text-lg leading-tight mb-2">{expense.title}</h4>
                {expense.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{expense.description}</p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(expense.category)}`}>
                    {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                  </span>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(expense.expenseDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end space-x-3">
                <div className="text-left sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(expense.totalAmount)}</div>
                  <div className="text-xs text-gray-500">{expense.items.length} item{expense.items.length !== 1 ? 's' : ''}</div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setShowDeleteConfirm(expense.id)}
                    disabled={deletingExpense === expense.id}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Items breakdown */}
            <div className="border-t border-gray-100 pt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Items:</h5>
              <div className="space-y-2">
                {expense.items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm space-y-1 sm:space-y-0">
                    <span className="text-gray-600 font-medium">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {expense.notes && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Notes:</h5>
                <p className="text-sm text-gray-600">{expense.notes}</p>
              </div>
            )}
          </div>
        ))}

        {expenses.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h4>
            <p className="text-gray-600">
              {isAdmin ? 'Add your first expense to get started' : 'Expenses will appear here once they\'re recorded'}
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
                <h3 className="text-lg font-semibold text-gray-900">Delete Expense</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete this expense?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  <strong>"{expenses.find(e => e.id === showDeleteConfirm)?.title}"</strong> will be permanently removed from the project.
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
                onClick={() => handleDeleteExpense(showDeleteConfirm)}
                disabled={deletingExpense === showDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {deletingExpense === showDeleteConfirm ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesTab;