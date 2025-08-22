import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateProjectProgress, getAllStageProgress } from '../utils/progressCalculation';
import { 
  Calendar, 
  DollarSign, 
  Image, 
  MessageSquare, 
  CheckCircle,
  Clock,
  Home,
  Palette,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown
} from 'lucide-react';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, clients, messages, tasks, contracts, projectFiles } = useData();
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('');

  // Get client data
  const client = clients.find(c => c.id === user?.clientId);
  const clientProjects = projects.filter(p => p.clientId === user?.clientId);
  
  // Set initial project selection
  React.useEffect(() => {
    if (clientProjects.length > 0 && !selectedProjectId) {
      const activeProject = clientProjects.find(p => p.status !== 'complete');
      setSelectedProjectId(activeProject?.id || clientProjects[0].id);
    }
  }, [clientProjects, selectedProjectId]);
  
  const currentProject = clientProjects.find(p => p.id === selectedProjectId) || clientProjects[0];
  const clientMessages = messages.filter(m => m.clientId === user?.clientId && !m.read);
  const projectTasks = tasks.filter(t => t.projectId === currentProject?.id);
  const currentProjectFiles = projectFiles.filter(f => f.projectId === currentProject?.id);
  const clientContracts = contracts.filter(c => c.clientId === user?.clientId);

  // Calculate smart progress for current project
  const smartProgress = currentProject ? calculateProjectProgress(currentProject.status as any, projectTasks) : 0;
  const stageProgress = currentProject ? getAllStageProgress(currentProject.status as any, projectTasks) : [];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'consultation': return 'bg-blue-600';
      case 'vision_board': return 'bg-purple-600';
      case 'ordering': return 'bg-amber-600';
      case 'installation': return 'bg-emerald-600';
      case 'styling': return 'bg-pink-600';
      case 'complete': return 'bg-gray-600';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'consultation': return 'Initial Consultation';
      case 'vision_board': return 'Vision Board Creation';
      case 'ordering': return 'Ordering & Procurement';
      case 'installation': return 'Installation Phase';
      case 'styling': return 'Final Styling';
      case 'complete': return 'Project Complete';
      default: return 'Unknown Status';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!client || !currentProject) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Projects</h3>
              <p className="text-gray-600">Your projects will appear here once they're created.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const totalTasks = projectTasks.length;
  const signedContracts = clientContracts.filter(c => c.status === 'signed').length;
  const totalContractValue = clientContracts.reduce((sum, c) => sum + (c.value || 0), 0);

  const stats = [
    {
      label: 'Project Progress',
      value: `${smartProgress}%`,
      change: '+8%',
      changeType: 'positive' as const,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Tasks Complete',
      value: `${completedTasks}/${totalTasks}`,
      change: totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%',
      changeType: 'positive' as const,
      color: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'Budget Spent',
      value: formatCurrency(currentProject.spent),
      change: `${Math.round((currentProject.spent / currentProject.budget) * 100)}%`,
      changeType: currentProject.spent > currentProject.budget * 0.9 ? 'negative' as const : 'positive' as const,
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Contracts Signed',
      value: signedContracts,
      change: totalContractValue > 0 ? formatCurrency(totalContractValue) : '$0',
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
          {/* Hero Section with Header and Stats */}
          <div className="bg-white border-b border-gray-100">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              {/* Header 
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {client.name.split(' ')[0]}!</h1>
                <p className="text-gray-600">Here's the latest on your interior design project</p>
              </div>*/}

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, index) => (
                  <div 
                    key={index} 
                    className={`group relative bg-white rounded-xl border ${stat.borderColor} p-4 sm:p-6 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                  >
                    {/* Gradient background accent */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-2xl`} />
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <p className="text-sm font-semibold text-gray-600 tracking-wide uppercase">{stat.label}</p>
                        <div className={`w-1 h-6 bg-gradient-to-b ${stat.color} rounded-full shadow-sm`} />
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
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
            {/* Project Status Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 sm:p-8 text-white mb-6 sm:mb-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-2 space-y-2 sm:space-y-0">
                    {clientProjects.length > 1 ? (
                      <div className="relative">
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="appearance-none bg-white/10 border border-white/20 rounded-lg px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-white text-xl sm:text-3xl font-bold tracking-tight cursor-pointer hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 w-full sm:w-auto"
                        >
                          {clientProjects.map(project => (
                            <option key={project.id} value={project.id} className="text-gray-900 bg-white">
                              {project.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" />
                      </div>
                    ) : (
                      <h2 className="text-xl sm:text-3xl font-bold tracking-tight">{currentProject.name}</h2>
                    )}
                  </div>
                  <p className="opacity-90 text-base sm:text-lg">We're currently in the {getStatusText(currentProject.status).toLowerCase()} phase</p>
                </div>
                <div className="text-right mt-4 sm:mt-0">
                  <div className="text-2xl sm:text-4xl font-bold">{smartProgress}%</div>
                  <div className="text-sm opacity-90">Complete</div>
                </div>
              </div>
              
              <div className="mt-6 sm:mt-8">
                <div className="flex flex-col sm:flex-row sm:justify-between text-sm mb-3 opacity-90 space-y-1 sm:space-y-0">
                  <span className="font-medium">Project Progress</span>
                  <span>Expected completion: {new Date(currentProject.expectedCompletion).toLocaleDateString()}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-4">
                  <div 
                    className="bg-white h-4 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${smartProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Content */}
              <div className="xl:col-span-2 space-y-6 sm:space-y-8">
                {/* Timeline */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
                      <p className="text-sm text-gray-600 mt-1">Track your project's journey from start to finish</p>
                    </div>
                    <div className="w-1 h-6 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full shadow-sm" />
                  </div>
                  <div className="space-y-6">
                    {stageProgress.map((phase, index) => (
                      <div key={phase.status} className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                          phase.isCompleted 
                            ? `${getStatusColor(phase.stage)} border-transparent`
                            : phase.isCurrent
                              ? `${getStatusColor(phase.stage)} border-transparent animate-pulse`
                              : 'bg-gray-100 border-gray-300'
                        }`}>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${
                            phase.isCompleted ? 'text-gray-900' : 
                            phase.isCurrent ? 'text-gray-900' : 
                            'text-gray-400'
                          }`}>
                            {phase.displayName}
                          </h4>
                          {phase.isCurrent && (
                            <div className="mt-1">
                              <p className="text-sm text-blue-600 font-medium">Currently in progress - {phase.progress}%</p>
                              {phase.taskCount > 0 && (
                                <p className="text-xs text-gray-500 mt-1">{phase.taskCount} tasks in this stage</p>
                              )}
                            </div>
                          )}
                          {phase.isCompleted && !phase.isCurrent && (
                            <p className="text-sm text-emerald-600 mt-1 font-medium">Completed</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Images */}
               {(() => {
                 const designImages = currentProjectFiles.filter(f => {
                   const isImage = f.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(f.fileName);
                   return isImage && !f.isVisionboard;
                 });
                 
                 return designImages.length > 0 ? (
                   <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                     <div className="flex items-center justify-between mb-6">
                       <div>
                         <h3 className="text-lg font-semibold text-gray-900">Design Gallery</h3>
                         <p className="text-sm text-gray-600 mt-1">Visual progress of your project</p>
                       </div>
                       <div className="flex items-center space-x-2 text-sm text-gray-600">
                         <Image className="w-4 h-4" />
                         <span className="font-medium">{designImages.length} images</span>
                       </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {designImages.map((file) => (
                         <div key={file.id} className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                           <img 
                             src={file.fileUrl} 
                             alt={file.fileName}
                             className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                             title={file.description || file.fileName}
                           />
                         </div>
                       ))}
                     </div>
                   </div>
                 ) : null;
               })()}
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-6">
                {/* Budget Overview */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Budget Overview</h3>
                      <p className="text-sm text-gray-600 mt-1">Track your project expenses</p>
                    </div>
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full shadow-sm" />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Spent</span>
                        <span className="font-bold text-gray-900">{formatCurrency(currentProject.spent)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Remaining</span>
                        <span className="font-bold text-gray-900">{formatCurrency(currentProject.budget - currentProject.spent)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3 mt-3">
                        <span className="text-gray-900">Total Budget</span>
                        <span className="text-gray-900">{formatCurrency(currentProject.budget)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((currentProject.spent / currentProject.budget) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                      <p className="text-sm text-gray-600 mt-1">Stay connected with your designer</p>
                    </div>
                    {clientMessages.length > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        {clientMessages.length} new
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate('/messages', { state: { selectedProjectId: currentProject?.id } })}
                    className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 transition-colors font-semibold text-sm touch-manipulation"
                  >
                    Open Messages
                  </button>
                  {clientMessages.length > 0 && (
                    <p className="text-sm text-gray-600 mt-3 text-center font-medium">
                      You have {clientMessages.length} unread message{clientMessages.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Next Steps */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">What's Next</h3>
                      <p className="text-sm text-gray-600 mt-1">Upcoming milestones</p>
                    </div>
                    <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full shadow-sm" />
                  </div>
                  <div className="space-y-4">
                    {projectTasks.filter(t => t.status !== 'completed' && t.visibleToClient).slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-600 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                    {projectTasks.filter(t => t.status !== 'completed' && t.visibleToClient).length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="font-medium text-gray-900 mb-2">No upcoming tasks</h4>
                        <p className="text-sm text-gray-600">We'll keep you updated!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
                      <p className="text-sm text-gray-600 mt-1">Key project information</p>
                    </div>
                    <div className="w-1 h-6 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full shadow-sm" />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-medium">Rooms</p>
                      <p className="font-semibold text-gray-900 mt-1">{currentProject.rooms?.join(', ') || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-medium">Start Date</p>
                      <p className="font-semibold text-gray-900 mt-1">{new Date(currentProject.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-medium">Expected Completion</p>
                      <p className="font-semibold text-gray-900 mt-1">{new Date(currentProject.expectedCompletion).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;