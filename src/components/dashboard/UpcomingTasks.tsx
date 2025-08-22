import React from 'react';
import { Task } from '../../contexts/DataContext';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';

interface UpcomingTasksProps {
  tasks: Task[];
}

const UpcomingTasks: React.FC<UpcomingTasksProps> = ({ tasks }) => {
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-3 h-3" />;
      case 'medium':
        return <Clock className="w-3 h-3" />;
      case 'low':
        return <Clock className="w-3 h-3" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays < 7) return `${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className={`p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
            isOverdue(task.dueDate) ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h4>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
              {getPriorityIcon(task.priority)}
              <span className="capitalize">{task.priority}</span>
            </div>
          </div>
          
          {task.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${
              task.category === 'design' ? 'bg-purple-100 text-purple-600' :
              task.category === 'ordering' ? 'bg-amber-100 text-amber-600' :
              task.category === 'consultation' ? 'bg-blue-100 text-blue-700' :
              task.category === 'installation' ? 'bg-emerald-100 text-emerald-600' :
              'bg-gray-100 text-gray-700'
            }`}>
              {task.category}
            </span>
            
            <div className={`flex items-center space-x-1 text-xs ${
              isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          </div>
        </div>
      ))}
      
      {tasks.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No urgent tasks</p>
        </div>
      )}
    </div>
  );
};

export default UpcomingTasks;