import React from 'react';
import { Project, Task, Client, ProjectFile } from '../../contexts/DataContext';
import { Calendar, DollarSign, User, Home, MapPin, Palette, Clock, CheckCircle } from 'lucide-react';

interface OverviewTabProps {
  project: Project;
  client: Client | undefined;
  tasks: Task[];
  smartProgress: number;
  stageProgress: any[];
  projectFiles: ProjectFile[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  project,
  client,
  tasks,
  smartProgress,
  stageProgress,
  projectFiles
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

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

  // Filter project files to show only images that are not visionboards
  const designImages = projectFiles.filter(file => {
    const isImage = file.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName);
    return isImage && !file.isVisionboard;
  });
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Project Status */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-2">{project.name}</h2>
            <p className="opacity-90 text-base sm:text-lg">Currently in progress</p>
          </div>
          <div className="text-right ml-4">
            <div className="text-2xl sm:text-4xl font-bold">{smartProgress}%</div>
            <div className="text-sm opacity-90">Complete</div>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row sm:justify-between text-sm mb-3 opacity-90 space-y-1 sm:space-y-0">
            <span className="font-medium">Project Progress</span>
            <span>Expected completion: {new Date(project.expectedCompletion).toLocaleDateString()}</span>
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
          {designImages.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Design Gallery</h3>
                  <p className="text-sm text-gray-600 mt-1">Visual progress of your project</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Palette className="w-4 h-4" />
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
          )}
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
                  <span className="font-bold text-gray-900">{formatCurrency(project.spent)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Remaining</span>
                  <span className="font-bold text-gray-900">{formatCurrency(project.budget - project.spent)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3 mt-3">
                  <span className="text-gray-900">Total Budget</span>
                  <span className="text-gray-900">{formatCurrency(project.budget)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }}
                ></div>
              </div>
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
              {client && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium">Client</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900">{client.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{client.email}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Rooms</p>
                {project.rooms && project.rooms.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.rooms.map((room, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
                        {room}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-semibold text-gray-900 mt-1">Not specified</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Start Date</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-gray-900">{new Date(project.startDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Expected Completion</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-gray-900">{new Date(project.expectedCompletion).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;