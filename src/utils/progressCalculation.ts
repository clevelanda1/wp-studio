/**
 * Smart Progress Calculation System
 * Calculates project progress based on stage completion and task ratios
 */

import { Task } from '../contexts/DataContext';

export type ProjectStatus = 'consultation' | 'vision_board' | 'ordering' | 'installation' | 'styling' | 'complete';

// Stage configuration with progress ranges
const STAGE_CONFIG = {
  consultation: { baseProgress: 0, stageWeight: 20 },
  vision_board: { baseProgress: 20, stageWeight: 20 },
  ordering: { baseProgress: 40, stageWeight: 20 },
  installation: { baseProgress: 60, stageWeight: 20 },
  styling: { baseProgress: 80, stageWeight: 20 },
  complete: { baseProgress: 100, stageWeight: 0 }
};

// Map task categories to project stages
const TASK_CATEGORY_TO_STAGE: Record<string, ProjectStatus> = {
  consultation: 'consultation',
  design: 'vision_board',
  ordering: 'ordering',
  installation: 'installation',
  communication: 'styling', // Communication tasks often happen during styling phase
  administrative: 'consultation' // Admin tasks typically happen early
};

/**
 * Calculate project progress based on current stage and task completion
 * @param projectStatus Current project stage
 * @param projectTasks All tasks for the project
 * @returns Progress percentage (0-100)
 */
export function calculateProjectProgress(
  projectStatus: ProjectStatus,
  projectTasks: Task[]
): number {
  // Handle completed projects
  if (projectStatus === 'complete') {
    return 100;
  }

  const stageConfig = STAGE_CONFIG[projectStatus];
  if (!stageConfig) {
    console.warn(`Unknown project status: ${projectStatus}`);
    return 0;
  }

  // Get base progress from completed stages
  const baseProgress = stageConfig.baseProgress;

  // Filter tasks for the current stage
  const currentStageTasks = projectTasks.filter(task => {
    const taskStage = TASK_CATEGORY_TO_STAGE[task.category] || 'consultation';
    return taskStage === projectStatus;
  });

  // Calculate current stage progress based on task completion
  let currentStageProgress = 0;
  if (currentStageTasks.length > 0) {
    const completedTasks = currentStageTasks.filter(task => task.status === 'completed');
    const completionRatio = completedTasks.length / currentStageTasks.length;
    // Task completion ratio × stage weight (20%)
    currentStageProgress = completionRatio * stageConfig.stageWeight;
  } else {
    // If no tasks for current stage, current stage progress is 0%
    currentStageProgress = 0;
  }

  const totalProgress = baseProgress + currentStageProgress;

  // Ensure progress doesn't exceed 100%
  return Math.min(100, Math.round(totalProgress));
}

/**
 * Get progress breakdown for detailed display
 * @param projectStatus Current project stage
 * @param projectTasks All tasks for the project
 * @returns Detailed progress information
 */
export function getProgressBreakdown(
  projectStatus: ProjectStatus,
  projectTasks: Task[]
) {
  const totalProgress = calculateProjectProgress(projectStatus, projectTasks);
  const stageConfig = STAGE_CONFIG[projectStatus];
  
  // Get current stage tasks
  const currentStageTasks = projectTasks.filter(task => {
    const taskStage = TASK_CATEGORY_TO_STAGE[task.category] || 'consultation';
    return taskStage === projectStatus;
  });

  const completedCurrentStageTasks = currentStageTasks.filter(task => task.status === 'completed');
  
  return {
    totalProgress,
    baseProgress: stageConfig.baseProgress,
    currentStage: projectStatus,
    currentStageProgress: totalProgress - stageConfig.baseProgress,
    currentStageTasks: currentStageTasks.length,
    completedCurrentStageTasks: completedCurrentStageTasks.length,
    taskCompletionRatio: currentStageTasks.length > 0 
      ? completedCurrentStageTasks.length / currentStageTasks.length 
      : 0.5
  };
}

/**
 * Get stage display name
 * @param status Project status
 * @returns Human-readable stage name
 */
export function getStageDisplayName(status: ProjectStatus): string {
  switch (status) {
    case 'consultation':
      return 'Initial Consultation';
    case 'vision_board':
      return 'Vision Board Creation';
    case 'ordering':
      return 'Ordering & Procurement';
    case 'installation':
      return 'Installation Phase';
    case 'styling':
      return 'Final Styling';
    case 'complete':
      return 'Project Complete';
    default:
      return 'Unknown Stage';
  }
}

/**
 * Get all stage progress for timeline display
 * @param projectStatus Current project stage
 * @param projectTasks All tasks for the project
 * @returns Array of stage progress information
 */
export function getAllStageProgress(
  projectStatus: ProjectStatus,
  projectTasks: Task[]
) {
  const stages: ProjectStatus[] = ['consultation', 'vision_board', 'ordering', 'installation', 'styling'];
  const currentStageIndex = stages.indexOf(projectStatus);
  
  return stages.map((stage, index) => {
    const isCompleted = index < currentStageIndex || projectStatus === 'complete';
    const isCurrent = stage === projectStatus && projectStatus !== 'complete';
    
    let progress = 0;
    if (isCompleted) {
      progress = 100;
    } else if (isCurrent) {
      // Calculate progress within current stage
      const stageTasks = projectTasks.filter(task => {
        const taskStage = TASK_CATEGORY_TO_STAGE[task.category] || 'consultation';
        return taskStage === stage;
      });
      
      if (stageTasks.length > 0) {
        const completedTasks = stageTasks.filter(task => task.status === 'completed');
        progress = Math.round((completedTasks.length / stageTasks.length) * 100);
      } else {
        progress = 50; // Default progress if no tasks
      }
    }
    
    return {
      stage,
      displayName: getStageDisplayName(stage),
      progress,
      isCompleted,
      isCurrent,
      taskCount: projectTasks.filter(task => {
        const taskStage = TASK_CATEGORY_TO_STAGE[task.category] || 'consultation';
        return taskStage === stage;
      }).length
    };
  });
}