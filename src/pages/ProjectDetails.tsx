import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  calculateProjectProgress,
  getAllStageProgress,
} from '../utils/progressCalculation';
import Sidebar from '../components/layout/Sidebar';
import OverviewTab from '../components/project/OverviewTab';
import TasksTab from '../components/project/TasksTab';
import ExpensesTab from '../components/project/ExpensesTab';
import ReturnsTab from '../components/project/ReturnsTab';
import FilesTab from '../components/project/FilesTab';
import ContractsTab from '../components/project/ContractsTab';
import { ArrowLeft } from 'lucide-react';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    projects,
    clients,
    tasks,
    expenses,
    returns,
    contracts,
    projectFiles,
    updateProject,
    addTask,
    updateTask,
    deleteTask,
    addExpense,
    updateExpense,
    deleteExpense,
    addReturn,
    updateReturn,
    addContract,
    updateContract,
    deleteContract,
    addProjectFile,
    updateProjectFile,
    deleteProjectFile,
    loading,
  } = useData();

  const [activeTab, setActiveTab] = useState('overview');

  const project = projects.find((p) => p.id === id);
  const client = clients.find((c) => c.id === project?.clientId);
  const projectTasks = tasks.filter((t) => t.projectId === id);
  const projectExpenses = expenses.filter((e) => e.projectId === id);
  const projectReturns = returns.filter(
    (r) => r.projectId === id && r.status !== 'deleted'
  );
  const projectContracts = contracts.filter((c) => c.projectId === id);
  const currentProjectFiles = projectFiles.filter((f) => f.projectId === id);

  // Calculate smart progress
  const smartProgress = project
    ? calculateProjectProgress(project.status as any, projectTasks)
    : 0;
  const stageProgress = project
    ? getAllStageProgress(project.status as any, projectTasks)
    : [];

  // Filter tasks based on user role
  const visibleTasks =
    user?.role === 'client'
      ? projectTasks.filter((task) => task.visibleToClient)
      : projectTasks;

  useEffect(() => {
    if (!loading && !project) {
      navigate('/projects');
    }
  }, [project, loading, navigate]);

  const handleUpdateProject = async (updates: Partial<typeof project>) => {
    if (!project) return;
    await updateProject(project.id, updates);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Project not found
            </h2>
            <p className="text-gray-600 mb-4">
              The project you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate('/projects')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: `Tasks (${visibleTasks.length})` },
    { id: 'contracts', label: `Contracts (${projectContracts.length})` },
    { id: 'expenses', label: `Expenses (${projectExpenses.length})` },
    { id: 'returns', label: `Returns (${projectReturns.length})` },
    { id: 'files', label: `Files (${currentProjectFiles.length})` },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center space-x-4 mb-4">
              {/*<button
                onClick={() => navigate('/projects')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>*/}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {project.name}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {client?.name} • {smartProgress}% Complete
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap touch-manipulation ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {activeTab === 'overview' && (
              <OverviewTab
                project={project}
                client={client}
                tasks={projectTasks}
                smartProgress={smartProgress}
                stageProgress={stageProgress}
                projectFiles={currentProjectFiles}
              />
            )}

            {activeTab === 'tasks' && (
              <TasksTab
                project={project}
                tasks={visibleTasks}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
              />
            )}

            {activeTab === 'contracts' && (
              <ContractsTab
                project={project}
                contracts={projectContracts}
                onAddContract={addContract}
                onUpdateContract={updateContract}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesTab
                project={project}
                expenses={projectExpenses}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
              />
            )}

            {activeTab === 'returns' && (
              <ReturnsTab
                project={project}
                returns={projectReturns}
                onAddReturn={addReturn}
                onUpdateReturn={updateReturn}
              />
            )}

            {activeTab === 'files' && (
              <FilesTab
                project={project}
                projectFiles={currentProjectFiles}
                onAddProjectFile={addProjectFile}
                onUpdateProjectFile={updateProjectFile}
                onDeleteProjectFile={deleteProjectFile}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetails;
