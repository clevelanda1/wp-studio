import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useData } from '../contexts/DataContext';
import type { Client, Project, Task, Message, Contract, Expense, Return } from '../contexts/DataContext';
import { 
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  TrendingUp
} from 'lucide-react';
import KanbanBoard from '../components/projects/KanbanBoard';
import RecentActivity, { Activity } from '../components/dashboard/RecentActivity';
import UpcomingTasks from '../components/dashboard/UpcomingTasks';
import ContractOverview from '../components/dashboard/ContractOverview';

const BusinessDashboard: React.FC = () => {
  const { clients, projects, tasks, contracts, messages, expenses, returns } = useData();
  const navigate = useNavigate();
  const [recentActivities, setRecentActivities] = React.useState<Activity[]>([]);

  // Generate recent activities from live data
  React.useEffect(() => {
    const activities: Activity[] = [];

    // Task completions (only recently completed tasks)
    tasks
      .filter(task => task.status === 'completed')
      .forEach(task => {
        const client = clients.find(c => c.id === task.clientId);
        const project = projects.find(p => p.id === task.projectId);
        
        activities.push({
          id: `task-${task.id}`,
          type: 'task_completed',
          title: 'Task Completed',
          description: task.title,
          timestamp: task.createdAt,
          clientName: client?.name,
          projectName: project?.name
        });
      });

    // Recent messages
    messages
      .slice(0, 10) // Limit to recent messages
      .forEach(message => {
        const client = clients.find(c => c.id === message.clientId);
        const project = projects.find(p => p.id === message.projectId);
        
        activities.push({
          id: `message-${message.id}`,
          type: 'message_received',
          title: 'New Message',
          description: message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
          timestamp: message.timestamp,
          clientName: client?.name,
          projectName: project?.name
        });
      });

    // Signed contracts
    contracts
      .filter(contract => contract.status === 'signed')
      .forEach(contract => {
        const client = clients.find(c => c.id === contract.clientId);
        const project = projects.find(p => p.id === contract.projectId);
        
        activities.push({
          id: `contract-${contract.id}`,
          type: 'contract_signed',
          title: 'Contract Signed',
          description: contract.title,
          timestamp: contract.signedAt || contract.createdAt,
          clientName: client?.name,
          projectName: project?.name
        });
      });

    // Recent projects
    projects
      .slice(0, 5) // Limit to recent projects
      .forEach(project => {
        const client = clients.find(c => c.id === project.clientId);
        
        activities.push({
          id: `project-${project.id}`,
          type: 'project_created',
          title: 'Project Created',
          description: project.name,
          timestamp: project.createdAt || new Date().toISOString(),
          clientName: client?.name
        });
      });

    // Recent clients
    clients
      .slice(0, 5) // Limit to recent clients
      .forEach(client => {
        activities.push({
          id: `client-${client.id}`,
          type: 'client_added',
          title: 'New Client Added',
          description: `${client.name} - ${client.status}`,
          timestamp: client.createdAt,
          clientName: client.name
        });
      });

    // Recent expenses
    expenses
      .slice(0, 8) // Limit to recent expenses
      .forEach(expense => {
        const client = clients.find(c => c.id === expense.clientId);
        const project = projects.find(p => p.id === expense.projectId);
        
        activities.push({
          id: `expense-${expense.id}`,
          type: 'expense_added',
          title: 'Expense Added',
          description: `${expense.title} - $${expense.totalAmount.toLocaleString()}`,
          timestamp: expense.createdAt,
          clientName: client?.name,
          projectName: project?.name
        });
      });

    // Recent returns
    returns
      .filter(returnItem => returnItem.status === 'processed' || returnItem.status === 'refunded')
      .forEach(returnItem => {
        const client = clients.find(c => c.id === returnItem.clientId);
        const project = projects.find(p => p.id === returnItem.projectId);
        
        activities.push({
          id: `return-${returnItem.id}`,
          type: 'return_processed',
          title: 'Return Processed',
          description: `${returnItem.reason} - ${returnItem.status}`,
          timestamp: returnItem.processedDate || returnItem.createdAt,
          clientName: client?.name,
          projectName: project?.name
        });
      });

    // Sort by timestamp (most recent first) and take top activities
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20); // Keep more activities for scrolling

    setRecentActivities(sortedActivities);
  }, [clients, projects, tasks, contracts, messages, expenses, returns]);

  const stats = [
    {
      label: 'Total Clients',
      value: clients.length,
      change: '+12%',
      changeType: 'positive' as const,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Active Projects',
      value: projects.filter(p => p.status !== 'complete').length,
      change: '+8%',
      changeType: 'positive' as const,
      color: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'Active Contracts',
      value: contracts.filter(c => c.status === 'signed' || c.status === 'sent').length,
      change: '+2',
      changeType: 'positive' as const,
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Completion Rate',
      value: `${Math.round(projects.length > 0 ? (projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0)}%`,
      change: '+5%',
      changeType: 'positive' as const,
      color: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-200'
    }
  ];

  const upcomingTasks = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

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
            {/* Project Pipeline - Full Width */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-gray-200 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Project Pipeline</h2>
                  <p className="mt-1 text-sm text-gray-600">Track progress across all active projects</p>
                </div>
                <button 
                  onClick={() => navigate('/projects')}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 w-full sm:w-auto touch-manipulation"
                >
                  {/*<Eye className="w-4 h-4 mr-2" />*/}
                  View Projects
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <div className="overflow-hidden">
                  <div style={{ 
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    WebkitOverflowScrolling: 'touch'
                  }}>
                    <KanbanBoard />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row - Three Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Upcoming Tasks */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Urgent Tasks</h3>
                      <p className="mt-1 text-sm text-gray-600">Requires immediate attention</p>
                    </div>
                    <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="p-4 sm:p-6 h-80 overflow-y-auto hide-scrollbar">
                  <UpcomingTasks tasks={upcomingTasks} />
                </div>
                <div className="p-2 sm:p-3"></div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                      <p className="mt-1 text-sm text-gray-600">Latest updates and changes</p>
                    </div>
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="p-4 sm:p-6 h-80 overflow-y-auto hide-scrollbar">
                  <RecentActivity activities={recentActivities} />
                </div>
                <div className="p-2 sm:p-3"></div>
              </div>

              {/* Contract Overview */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Recent Contracts</h3>
                      <p className="mt-1 text-sm text-gray-600">Latest contract activity</p>
                    </div>
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="p-4 sm:p-6 h-80 overflow-y-auto hide-scrollbar">
                  <ContractOverview contracts={contracts.slice(0, 10)} />
                </div>
                <div className="p-2 sm:p-3"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BusinessDashboard;