import React, { useState } from 'react';
import { Task, Project } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Calendar, AlertTriangle, Clock, CheckCircle, X, Trash2 } from 'lucide-react';

interface TasksTabProps {
  project: Project;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

const TasksTab: React.FC<TasksTabProps> = ({
  project,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}) => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'design' as const,
    dueDate: '',
    assignedTo: '',
    visibleToClient: false
  });

  const isAdmin = user?.role === 'business_owner' || user?.role === 'team_member';

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
    onUpdateTask(taskId, { status: newStatus as any });
  };

  const handleDeleteTask = async (taskId: string) => {
    setShowDeleteConfirm(null);
    try {
      setDeletingTask(taskId);
      await onDeleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setDeletingTask(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onAddTask({
      ...formData,
      projectId: project.id,
      clientId: project.clientId,
      status: 'pending'
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: 'design',
      dueDate: '',
      assignedTo: '',
      visibleToClient: false
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Project Tasks</h3>
          <p className="text-sm text-gray-600 mt-1">Manage and track project tasks</p>
        </div>
        {isAdmin && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Add Task Form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Add New Task</h4>
              <p className="text-sm text-gray-600 mt-1">Create a new task for this project</p>
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
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const overdueTask = isOverdue(task.dueDate) && task.status !== 'completed';
          
          return (
            <div 
              key={task.id} 
              className={`bg-white rounded-lg border p-6 hover:shadow-md transition-all duration-300 ${
                overdueTask ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-semibold text-gray-900 text-lg leading-tight mb-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-gray-600 text-sm leading-relaxed">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {(() => {
                    // Check if this is a return-related task
                    const isReturnTask = task.title.toLowerCase().includes('return') && task.description.includes('Return ID:');
                    
                    if (isReturnTask) {
                      // Extract return date from description
                      const returnDateMatch = task.description.match(/Return date: (\d{4}-\d{2}-\d{2})/);
                      if (returnDateMatch) {
                        const returnDate = new Date(returnDateMatch[1]);
                        const today = new Date();
                        const diffTime = returnDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let colorClass = '';
                        let displayText = '';
                        
                        if (diffDays < 0) {
                          colorClass = 'bg-red-50 text-red-700 border-red-200';
                          displayText = `${Math.abs(diffDays)} days overdue`;
                        } else if (diffDays === 0) {
                          colorClass = 'bg-red-50 text-red-700 border-red-200';
                          displayText = 'Due today';
                        } else if (diffDays === 1) {
                          colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
                          displayText = '1 day left';
                        } else if (diffDays <= 5) {
                          colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
                          displayText = `${diffDays} days left`;
                        } else if (diffDays <= 15) {
                          colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                          displayText = `${diffDays} days left`;
                        } else {
                          colorClass = 'bg-green-50 text-green-700 border-green-200';
                          displayText = `${diffDays} days left`;
                        }
                        
                        return (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${colorClass}`}>
                            {displayText}
                          </span>
                        );
                      }
                    }
                    
                    // Default status display for non-return tasks
                    return (
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(task.status)}`}>
                        {task.status === 'completed' ? 'Completed' : 
                         task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </span>
                    );
                  })()}
                  {isAdmin && (
                    <button 
                      onClick={() => setShowDeleteConfirm(task.id)}
                      disabled={deletingTask === task.id}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)} flex items-center space-x-1`}>
                  {getPriorityIcon(task.priority)}
                  <span className="capitalize">{task.priority}</span>
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(task.category)}`}>
                  {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                </span>
                {task.assignedTo && (
                  <span className="text-xs text-gray-600">
                    Assigned to: <span className="font-medium">{task.assignedTo}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-2 text-sm ${
                  overdueTask ? 'text-red-600 font-semibold' : 'text-gray-600'
                }`}>
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  {overdueTask && <span className="text-red-600 font-bold">(Overdue)</span>}
                </div>

                {isAdmin && (
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(task.status)} cursor-pointer border-0 focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                )}
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h4>
            <p className="text-gray-600">
              {isAdmin ? 'Create your first task to get started' : 'Tasks will appear here once they\'re created'}
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
                <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete this task?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  <strong>"{tasks.find(t => t.id === showDeleteConfirm)?.title}"</strong> will be permanently removed from the project.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(showDeleteConfirm)}
                disabled={deletingTask === showDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingTask === showDeleteConfirm ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksTab;