import React from 'react';
import { CheckCircle, MessageCircle, DollarSign, FileText, FolderPlus, UserPlus, Package, RotateCcw } from 'lucide-react';

export interface Activity {
  id: string;
  type: 'task_completed' | 'message_received' | 'payment_received' | 'contract_signed' | 'project_created' | 'client_added' | 'expense_added' | 'return_processed';
  title: string;
  description: string;
  timestamp: string;
  clientName?: string;
  projectName?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'message_received':
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'contract_signed':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'project_created':
        return <FolderPlus className="w-4 h-4 text-indigo-600" />;
      case 'client_added':
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'expense_added':
        return <DollarSign className="w-4 h-4 text-red-600" />;
      case 'return_processed':
        return <RotateCcw className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatTimeAgo(activity.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
              <div className="flex items-center space-x-2 mt-1">
                {activity.clientName && (
                  <span className="text-xs text-gray-500">Client: {activity.clientName}</span>
                )}
                {activity.projectName && (
                  <span className="text-xs text-gray-500">Project: {activity.projectName}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {activities.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
    </div>
  );
};

export default RecentActivity;