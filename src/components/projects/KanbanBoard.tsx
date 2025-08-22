import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { calculateProjectProgress } from '../../utils/progressCalculation';
import { Calendar, DollarSign, ArrowRight } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DroppableStageColumnProps {
  stage: { id: string; title: string; color: string };
  stageProjects: Project[];
  getClientName: (clientId: string) => string;
  navigate: (path: string) => void;
  handleMoveToNextStage: (projectId: string, currentStatus: string) => void;
  formatCurrency: (amount: number) => string;
  isAdmin: boolean;
  getSmartProgress: (project: Project) => number;
  getTaskCounts: (project: Project) => { total: number; completed: number };
}

const DroppableStageColumn: React.FC<DroppableStageColumnProps> = ({
  stage,
  stageProjects,
  getClientName,
  navigate,
  handleMoveToNextStage,
  formatCurrency,
  isAdmin,
  getSmartProgress,
  getTaskCounts
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
  });

  // Get stage-specific colors for drag feedback
  const getDragColors = (stageColor: string) => {
    switch (stageColor) {
      case 'bg-blue-600': return 'bg-blue-500/20 ring-3 ring-blue-500';
      case 'bg-purple-600': return 'bg-purple-500/20 ring-3 ring-purple-500';
      case 'bg-amber-600': return 'bg-amber-500/20 ring-3 ring-amber-500';
      case 'bg-emerald-600': return 'bg-emerald-500/20 ring-3 ring-emerald-500';
      case 'bg-pink-600': return 'bg-pink-500/20 ring-3 ring-pink-500';
      case 'bg-gray-600': return 'bg-gray-500/20 ring-3 ring-gray-500';
      default: return 'bg-blue-500/20 ring-3 ring-blue-500';
    }
  };
  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 sm:w-80 bg-gray-50 rounded-lg p-3 sm:p-4 m-1 sm:m-2 transition-all duration-200 ${
        isOver ? getDragColors(stage.color) : ''
      }`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
        <h3 className="font-semibold text-gray-900">{stage.title}</h3>
        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
          {stageProjects.length}
        </span>
      </div>
      
      <SortableContext items={stageProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {stageProjects.map((project) => {
            const smartProgress = getSmartProgress(project);
            const taskCounts = getTaskCounts(project);
            
            return (
              <DraggableProjectCard
                key={project.id}
                project={project}
                clientName={getClientName(project.clientId)}
                onViewProject={(id) => navigate(`/projects/${id}`)}
                onMoveToNextStage={handleMoveToNextStage}
                formatCurrency={formatCurrency}
                isAdmin={isAdmin}
                smartProgress={smartProgress}
                taskCount={taskCounts.total}
                completedTaskCount={taskCounts.completed}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
};

interface Project {
  id: string;
  name: string;
  status: string;
  clientId: string;
  budget: number;
  progress: number;
  expectedCompletion: string;
  rooms: string[];
}

interface DraggableProjectCardProps {
  project: Project;
  clientName: string;
  onViewProject: (id: string) => void;
  onMoveToNextStage: (projectId: string, currentStatus: string) => void;
  formatCurrency: (amount: number) => string;
  isAdmin: boolean;
  smartProgress: number;
  taskCount: number;
  completedTaskCount: number;
}

const DraggableProjectCard: React.FC<DraggableProjectCardProps> = ({
  project,
  clientName,
  onViewProject,
  onMoveToNextStage,
  formatCurrency,
  isAdmin,
  smartProgress,
  taskCount,
  completedTaskCount
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const getNextStage = (currentStatus: string) => {
    const stages = ['consultation', 'vision_board', 'ordering', 'installation', 'styling', 'complete'];
    const currentIndex = stages.indexOf(currentStatus);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  };

  const getNextStageLabel = (currentStatus: string) => {
    const nextStage = getNextStage(currentStatus);
    switch (nextStage) {
      case 'vision_board': return 'Vision Board';
      case 'ordering': return 'Ordering';
      case 'installation': return 'Installation';
      case 'styling': return 'Styling';
      case 'complete': return 'Complete';
      default: return null;
    }
  };

  const getStageColor = (status: string) => {
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

  const nextStage = getNextStage(project.status);
  const nextStageLabel = getNextStageLabel(project.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
        isDragging ? 'shadow-lg rotate-3 scale-105' : ''
      }`}
    >
      {/* Drag handle - only show for admins */}
      {isAdmin && (
        <div
          {...listeners}
          className={`w-24 mx-auto h-2 ${getStageColor(project.status)} rounded-full mb-3 cursor-grab active:cursor-grabbing hover:opacity-80 transition-all duration-200 flex items-center justify-center`}
          title="Drag to move between stages"
        >
          <div className="w-8 h-0.5 bg-white/30 rounded-full" />
        </div>
      )}

      <div onClick={() => onViewProject(project.id)}>
        <h4 className="font-semibold text-gray-900 text-sm mb-2">{project.name}</h4>
        
        <p className="text-gray-600 text-xs mb-3">{clientName}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <div className="flex items-center space-x-1">
              <span className="text-gray-700 font-medium">{smartProgress}%</span>
              {taskCount > 0 && (
                <span className="text-gray-500">({completedTaskCount}/{taskCount})</span>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${smartProgress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{new Date(project.expectedCompletion).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-700 font-medium">
            <DollarSign className="w-3 h-3" />
            <span>{formatCurrency(project.budget)}</span>
          </div>
        </div>
        
        {project.rooms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {project.rooms.slice(0, 2).map((room, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                {room}
              </span>
            ))}
            {project.rooms.length > 2 && (
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                +{project.rooms.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Move to Next Stage Button - only show for admins and if there's a next stage */}
      {isAdmin && nextStage && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveToNextStage(project.id, project.status);
          }}
          className="w-full mt-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-1"
        >
          <span>Move to {nextStageLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

const KanbanBoard: React.FC = () => {
  const { projects, clients, tasks, updateProject } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeProject, setActiveProject] = React.useState<Project | null>(null);

  const isAdmin = user?.role === 'business_owner' || user?.role === 'team_member';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const stages = [
    { id: 'consultation', title: 'Consultation', color: 'bg-blue-600' },
    { id: 'vision_board', title: 'Vision Board', color: 'bg-purple-600' },
    { id: 'ordering', title: 'Ordering', color: 'bg-amber-600' },
    { id: 'installation', title: 'Installation', color: 'bg-emerald-600' },
    { id: 'styling', title: 'Styling', color: 'bg-pink-600' },
    { id: 'complete', title: 'Complete', color: 'bg-gray-600' }
  ];

  const getProjectsByStage = (stageId: string) => {
    return projects.filter(project => {
      const status = project.status || 'consultation';
      return status === stageId;
    });
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSmartProgress = (project: Project) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    return calculateProjectProgress(project.status as any, projectTasks);
  };

  const getTaskCounts = (project: Project) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const completedTasks = projectTasks.filter(t => t.status === 'completed');
    return {
      total: projectTasks.length,
      completed: completedTasks.length
    };
  };
  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find(p => p.id === event.active.id);
    setActiveProject(project || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProject(null);

    if (!over || !isAdmin) return;

    const projectId = active.id as string;
    
    // Check if we're dropping over a stage column or another project
    let newStatus: string;
    if (stages.some(stage => stage.id === over.id)) {
      // Dropped directly on a stage column
      newStatus = over.id as string;
    } else {
      // Dropped on another project, find which stage that project belongs to
      const targetProject = projects.find(p => p.id === over.id);
      if (targetProject) {
        newStatus = targetProject.status;
      } else {
        return; // Invalid drop target
      }
    }

    // Find the project and check if status actually changed
    const project = projects.find(p => p.id === projectId);
    if (!project || project.status === newStatus) return;

    try {
      console.log(`🔄 Moving project "${project.name}" from ${project.status} to ${newStatus}`);
      
      // Update project status
      await updateProject(projectId, { status: newStatus as any });
      
      console.log(`✅ Successfully moved project to ${newStatus}`);
    } catch (error) {
      console.error('❌ Failed to update project status:', error);
      // You might want to show a toast notification here
    }
  };

  const handleMoveToNextStage = async (projectId: string, currentStatus: string) => {
    if (!isAdmin) return;

    const stages = ['consultation', 'vision_board', 'ordering', 'installation', 'styling', 'complete'];
    const currentIndex = stages.indexOf(currentStatus);
    
    if (currentIndex < stages.length - 1) {
      const nextStatus = stages[currentIndex + 1];
      const project = projects.find(p => p.id === projectId);
      
      try {
        console.log(`🔄 Moving project "${project?.name}" to next stage: ${nextStatus}`);
        await updateProject(projectId, { status: nextStatus as any });
        console.log(`✅ Successfully moved project to ${nextStatus}`);
      } catch (error) {
        console.error('❌ Failed to move project to next stage:', error);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        <div className="flex space-x-1 sm:space-x-2 min-w-max px-2 sm:px-4 pb-4">
          {stages.map((stage) => {
            const stageProjects = getProjectsByStage(stage.id);
            
            return (
              <DroppableStageColumn
                key={stage.id}
                stage={stage}
                stageProjects={stageProjects}
                getClientName={getClientName}
                navigate={navigate}
                handleMoveToNextStage={handleMoveToNextStage}
                formatCurrency={formatCurrency}
                isAdmin={isAdmin}
                getSmartProgress={getSmartProgress}
                getTaskCounts={getTaskCounts}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeProject ? (
          <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 opacity-90 rotate-3 transform scale-105">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">{activeProject.name}</h4>
            <p className="text-gray-600 text-xs">{getClientName(activeProject.clientId)}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;