import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { calculateProjectProgress } from '../utils/progressCalculation';

export interface Client {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  status: 'inquiry' | 'consultation' | 'contract' | 'active' | 'completed';
  budget: number;
  moveInDate?: string;
  revealDate?: string;
  stylePreferences: string[];
  notes: string;
  leadSource: string;
  createdAt: string;
  avatar?: string;
  address?: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  status: 'consultation' | 'vision_board' | 'ordering' | 'installation' | 'styling' | 'complete';
  budget: number;
  spent: number;
  startDate: string;
  expectedCompletion: string;
  description: string;
  rooms: string[];
  images: string[];
  progress: number;
}

export interface Task {
  id: string;
  projectId?: string;
  clientId?: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo?: string;
  category: 'consultation' | 'design' | 'ordering' | 'installation' | 'communication' | 'administrative';
  createdAt: string;
  visibleToClient?: boolean;
}

export interface Message {
  id: string;
  projectId?: string;
  clientId: string;
  isProjectMessage?: boolean;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: string[];
  read: boolean;
}

export interface Contract {
  id: string;
  clientId: string;
  projectId?: string;
  title: string;
  type: 'proposal' | 'design_contract' | 'amendment' | 'completion_certificate';
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed';
  fileUrl: string;
  fileName?: string;
  createdAt: string;
  sentAt?: string;
  signedAt?: string;
  signedBy?: string;
  value?: number;
  description: string;
  version: number;
}

export interface Return {
  id: string;
  projectId: string;
  clientId: string;
  item: ReturnItem[];
  reason: string;
  status: 'pending' | 'processed' | 'refunded' | 'exchanged';
  amount?: number;
  returnDate: string;
  processedDate?: string;
  images?: string[];
  notes: string;
  createdAt: string;
}

export interface ReturnItem {
  name: string;
  quantity: number;
  unitPrice?: number;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  clientId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  room?: string;
  description: string;
  isVisionboard: boolean;
  createdAt: string;
}

export interface AppUser {
}
export interface Expense {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string;
  items: ExpenseItem[];
  totalAmount: number;
  expenseDate: string;
  category: 'materials' | 'labor' | 'transportation' | 'permits' | 'other';
  receiptImage?: string;
  notes: string;
  createdAt: string;
}

export interface ExpenseItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface DataContextType {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  messages: Message[];
  contracts: Contract[];
  returns: Return[];
  expenses: Expense[];
  projectFiles: ProjectFile[];
  users: AppUser[];
  loading: boolean;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  markMessageRead: (id: string) => Promise<void>;
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => Promise<void>;
  updateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
  addReturn: (returnItem: Omit<Return, 'id' | 'createdAt'>) => Promise<void>;
  updateReturn: (id: string, updates: Partial<Return>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addProjectFile: (file: Omit<ProjectFile, 'id' | 'createdAt'>) => Promise<void>;
  updateProjectFile: (id: string, updates: Partial<ProjectFile>) => Promise<void>;
  deleteProjectFile: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Transform database row to Client interface
  const transformClient = (row: any): Client => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    budget: row.budget,
    moveInDate: row.move_in_date,
    revealDate: row.reveal_date,
    stylePreferences: row.style_preferences || [],
    notes: row.notes || '',
    leadSource: row.lead_source || '',
    createdAt: row.created_at,
    avatar: row.avatar,
    address: row.address
  });

  // Transform database row to Project interface
  const transformProject = (row: any): Project => ({
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    status: row.status || 'consultation',
    budget: row.budget,
    spent: row.spent,
    startDate: row.start_date,
    expectedCompletion: row.expected_completion,
    description: row.description || '',
    rooms: row.rooms || [],
    images: row.images || [],
    progress: row.progress
  });

  // Transform database row to Task interface
  const transformTask = (row: any): Task => ({
    id: row.id,
    projectId: row.project_id,
    clientId: row.client_id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    category: row.category,
    createdAt: row.created_at,
    visibleToClient: row.visible_to_client || false
  });

  // Transform database row to Message interface
  const transformMessage = (row: any): Message => ({
    id: row.id,
    projectId: row.project_id,
    clientId: row.client_id,
    isProjectMessage: row.is_project_message,
    senderId: row.sender_id,
    senderName: row.sender_name,
    content: row.content,
    timestamp: row.timestamp,
    attachments: row.attachments || [],
    read: row.read
  });

  // Transform database row to Contract interface
  const transformContract = (row: any): Contract => ({
    id: row.id,
    clientId: row.client_id,
    projectId: row.project_id,
    title: row.title,
    type: row.type,
    status: row.status,
    fileUrl: row.file_url || '',
    fileName: row.file_name,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    signedAt: row.signed_at,
    signedBy: row.signed_by,
    value: row.value,
    description: row.description || '',
    version: row.version
  });

  // Transform database row to Return interface
  const transformReturn = (row: any): Return => ({
    id: row.id,
    projectId: row.project_id,
    clientId: row.client_id,
    item: Array.isArray(row.items) ? row.items : [],
    reason: row.reason,
    status: row.status,
    amount: row.amount,
    returnDate: row.return_date,
    processedDate: row.processed_date,
    images: row.images || [],
    notes: row.notes || '',
    createdAt: row.created_at
  });

  // Transform database row to Expense interface
  const transformExpense = (row: any): Expense => ({
    id: row.id,
    projectId: row.project_id,
    clientId: row.client_id,
    title: row.title,
    description: row.description || '',
    items: row.items || [],
    totalAmount: row.total_amount,
    expenseDate: row.expense_date,
    category: row.category,
    receiptImage: row.receipt_image,
    notes: row.notes || '',
    createdAt: row.created_at
  });

  // Transform database row to ProjectFile interface
  const transformProjectFile = (row: any): ProjectFile => ({
    id: row.id,
    projectId: row.project_id,
    clientId: row.client_id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileType: row.file_type,
    fileSize: row.file_size,
    room: row.room,
    description: row.description || '',
    isVisionboard: row.is_visionboard || false,
    createdAt: row.created_at
  });

  // Transform database row to AppUser interface
  const transformUser = (row: any): AppUser => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    permissions: row.permissions || [],
    clientId: row.client_id,
    createdAt: row.created_at
  });

  // Fetch all data
  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      console.log('🔍 Fetching data for user:', { 
        id: user.id, 
        role: user.role, 
        email: user.email,
        clientId: user.clientId
      });

      // Add specific logging for client users
      if (user.role === 'client') {
        console.log('🔍 Client user detected - will filter data by clientId:', user.clientId);
        if (!user.clientId) {
          console.warn('⚠️ Client user has no clientId - this will prevent data access!');
        }
      }

      // Fetch clients
      console.log('🔍 Starting clients query...');
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 Clients query result:', { 
        dataCount: clientsData?.length || 0, 
        data: clientsData, 
        error: clientsError,
        errorCode: clientsError?.code,
        errorMessage: clientsError?.message
      });

      if (clientsError) throw clientsError;
      const transformedClients = clientsData?.map(transformClient) || [];
      console.log('🔍 Transformed clients:', transformedClients.length, transformedClients);
      setClients(transformedClients);

      // Fetch projects
      console.log('🔍 Starting projects query...');
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 Projects query result:', { 
        dataCount: projectsData?.length || 0, 
        data: projectsData,
        error: projectsError 
      });

      // Additional logging for client users to see what projects they should have access to
      if (user.role === 'client' && user.clientId) {
        const clientProjects = projectsData?.filter(p => p.client_id === user.clientId) || [];
        console.log('🔍 Projects for client:', {
          userClientId: user.clientId,
          totalProjects: projectsData?.length || 0,
          clientProjects: clientProjects.length,
          clientProjectsData: clientProjects
        });
      }
      if (projectsError) throw projectsError;
      const transformedProjects = projectsData?.map(transformProject) || [];
      console.log('🔍 Transformed projects:', transformedProjects.length, transformedProjects);
      setProjects(transformedProjects);

      // Fetch tasks
      console.log('🔍 Starting tasks query...');
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 Tasks query result:', { 
        dataCount: tasksData?.length || 0, 
        error: tasksError 
      });

      if (tasksError) throw tasksError;
      setTasks(tasksData?.map(transformTask) || []);

      // Fetch messages
      console.log('🔍 Starting messages query...');
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('timestamp', { ascending: false });

      console.log('🔍 Messages query result:', { 
        dataCount: messagesData?.length || 0, 
        error: messagesError 
      });

      if (messagesError) throw messagesError;
      setMessages(messagesData?.map(transformMessage) || []);

      // Fetch contracts
      console.log('🔍 Starting contracts query...');
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 Contracts query result:', { 
        dataCount: contractsData?.length || 0, 
        error: contractsError 
      });

      if (contractsError) throw contractsError;
      setContracts(contractsData?.map(transformContract) || []);

      // Fetch returns
      console.log('🔍 Starting returns query...');
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 Returns query result:', { 
        dataCount: returnsData?.length || 0, 
        error: returnsError 
      });

      if (returnsError) throw returnsError;
      setReturns(returnsData?.map(transformReturn) || []);

      // Fetch expenses
      console.log('🔍 Starting expenses query...');
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 Expenses query result:', { 
        dataCount: expensesData?.length || 0, 
        error: expensesError 
      });

      if (expensesError) {
        console.warn('⚠️ Expenses table may not exist yet:', expensesError);
        setExpenses([]);
      } else {
        setExpenses(expensesData?.map(transformExpense) || []);
      }

      // Fetch project files
      console.log('🔍 Starting project files query...');
      const { data: projectFilesData, error: projectFilesError } = await supabase
        .from('project_files')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 Project files query result:', { 
        dataCount: projectFilesData?.length || 0, 
        error: projectFilesError 
      });

      if (projectFilesError) {
        console.warn('⚠️ Project files table may not exist yet:', projectFilesError);
        setProjectFiles([]);
      } else {
        setProjectFiles(projectFilesData?.map(transformProjectFile) || []);
      }

      // Fetch users
      console.log('🔍 Starting users query...');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 Users query result:', { 
        dataCount: usersData?.length || 0, 
        data: usersData, 
        error: usersError,
        errorCode: usersError?.code,
        errorMessage: usersError?.message
      });

      if (usersError) throw usersError;
      const transformedUsers = usersData?.map(transformUser) || [];
      console.log('🔍 Transformed users:', transformedUsers.length, transformedUsers);
      setUsers(transformedUsers);

      console.log('✅ Data fetching completed:', {
        clients: transformedClients.length,
        users: transformedUsers.length,
        projects: transformedProjects.length,
        tasks: tasksData?.length || 0,
        messages: messagesData?.length || 0,
        contracts: contractsData?.length || 0,
        returns: returnsData?.length || 0,
        projectFiles: projectFiles.length
      });

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      
      // If there's an RLS error, try a direct query to test permissions
      if (error && typeof error === 'object' && 'code' in error) {
        console.log('🔍 Error details:', {
          code: (error as any).code,
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint
        });
        
        // If it's an RLS error, provide more context
        if ((error as any).code === '42501' || (error as any).message?.includes('RLS')) {
          console.log('🔍 RLS Policy Issue - User context:', {
            userId: user.id,
            userRole: user.role,
            userClientId: user.clientId,
            userEmail: user.email
          });
          
          // Test a simple query to verify RLS is working
          console.log('🔍 Testing RLS with a simple clients query...');
          const { data: testData, error: testError } = await supabase
            .from('clients')
            .select('id, name, email')
            .limit(1);
          
          console.log('🔍 RLS test result:', { 
            testData: testData?.length || 0, 
            testError: testError?.message 
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    await fetchData();
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      console.log('🔍 DataContext: Loading data for user:', {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId
      });
      
      // Add a small delay to ensure auth is fully settled
      const timeoutId = setTimeout(() => {
        fetchData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      setClients([]);
      setProjects([]);
      setTasks([]);
      setMessages([]);
      setContracts([]);
      setReturns([]);
      setExpenses([]);
      setProjectFiles([]);
      setUsers([]);
      setLoading(false);
    }
  }, [user?.id]);

  // CRUD operations
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: clientData.userId,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        status: clientData.status,
        budget: clientData.budget,
        move_in_date: clientData.moveInDate,
        reveal_date: clientData.revealDate,
        style_preferences: clientData.stylePreferences,
        notes: clientData.notes,
        lead_source: clientData.leadSource,
        avatar: clientData.avatar,
        address: clientData.address
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setClients(prev => [transformClient(data), ...prev]);
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const dbUpdates: any = {};
    if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
    if (updates.moveInDate !== undefined) dbUpdates.move_in_date = updates.moveInDate;
    if (updates.revealDate !== undefined) dbUpdates.reveal_date = updates.revealDate;
    if (updates.stylePreferences !== undefined) dbUpdates.style_preferences = updates.stylePreferences;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.leadSource !== undefined) dbUpdates.lead_source = updates.leadSource;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.address !== undefined) dbUpdates.address = updates.address;

    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setClients(prev => prev.map(client => 
        client.id === id ? transformClient(data) : client
      ));
    }
  };

  const addProject = async (projectData: Omit<Project, 'id'>) => {
    // Ensure client_id is set for proper data sharing
    if (!projectData.clientId) {
      throw new Error('Project must be assigned to a client');
    }
    
    console.log('🔍 Adding project to database:', {
      projectData,
      clientId: projectData.clientId
    });
    
    // Calculate initial progress based on status and any existing tasks
    const initialProgress = calculateProjectProgress(projectData.status, []);
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        client_id: projectData.clientId,
        name: projectData.name,
        status: projectData.status,
        budget: projectData.budget,
        spent: projectData.spent,
        start_date: projectData.startDate,
        expected_completion: projectData.expectedCompletion,
        description: projectData.description,
        rooms: projectData.rooms,
        images: projectData.images,
        progress: initialProgress
      })
      .select()
      .single();

    console.log('🔍 Project creation result:', {
      data,
      error,
      errorCode: error?.code,
      errorMessage: error?.message
    });

    if (error) throw error;
    if (data) {
      const transformedProject = transformProject(data);
      console.log('🔍 Adding transformed project to state:', transformedProject);
      setProjects(prev => [transformProject(data), ...prev]);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    // Validate status before updating
    if (updates.status) {
      const validStatuses = ['consultation', 'vision_board', 'ordering', 'installation', 'styling', 'complete'];
      if (!validStatuses.includes(updates.status)) {
        console.warn(`Invalid project status: ${updates.status}, defaulting to consultation`);
        updates.status = 'consultation' as any;
      }
    }
    
    // If status is being updated, recalculate progress
    if (updates.status) {
      const project = projects.find(p => p.id === id);
      if (project) {
        const projectTasks = tasks.filter(t => t.projectId === id);
        updates.progress = calculateProjectProgress(updates.status as any, projectTasks);
      }
    }
    
    const dbUpdates: any = {};
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
    if (updates.spent !== undefined) dbUpdates.spent = updates.spent;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.expectedCompletion !== undefined) dbUpdates.expected_completion = updates.expectedCompletion;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.rooms !== undefined) dbUpdates.rooms = updates.rooms;
    if (updates.images !== undefined) dbUpdates.images = updates.images;
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress;

    const { data, error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setProjects(prev => prev.map(project => 
        project.id === id ? transformProject(data) : project
      ));
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    // The database trigger will automatically set client_id based on project_id
    // But we should ensure at least one is provided
    if (!taskData.projectId && !taskData.clientId) {
      throw new Error('Task must be assigned to either a project or a client');
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: taskData.projectId,
        client_id: taskData.clientId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.dueDate,
        assigned_to: taskData.assignedTo,
        category: taskData.category,
        visible_to_client: taskData.visibleToClient || false
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setTasks(prev => [transformTask(data), ...prev]);
      
      // Recalculate project progress if task is linked to a project
      if (data.project_id) {
        const project = projects.find(p => p.id === data.project_id);
        if (project) {
          const updatedTasks = [...tasks, transformTask(data)];
          const projectTasks = updatedTasks.filter(t => t.projectId === data.project_id);
          const newProgress = calculateProjectProgress(project.status as any, projectTasks);
          
          // Update project progress
          updateProject(data.project_id, { progress: newProgress });
        }
      }
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const dbUpdates: any = {};
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.visibleToClient !== undefined) dbUpdates.visible_to_client = updates.visibleToClient;

    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setTasks(prev => prev.map(task => 
        task.id === id ? transformTask(data) : task
      ));
      
      // Recalculate project progress if task status changed and is linked to a project
      if (updates.status && data.project_id) {
        const project = projects.find(p => p.id === data.project_id);
        if (project) {
          const updatedTasks = tasks.map(task => 
            task.id === id ? transformTask(data) : task
          );
          const projectTasks = updatedTasks.filter(t => t.projectId === data.project_id);
          const newProgress = calculateProjectProgress(project.status as any, projectTasks);
          
          // Update project progress
          updateProject(data.project_id, { progress: newProgress });
        }
      }
    }
  };

  const addMessage = async (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    // Ensure client_id is set for proper data sharing
    if (!messageData.clientId) {
      throw new Error('Message must be assigned to a client');
    }
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        project_id: messageData.projectId,
        client_id: messageData.clientId,
        is_project_message: messageData.isProjectMessage,
        sender_id: messageData.senderId,
        sender_name: messageData.senderName,
        content: messageData.content,
        attachments: messageData.attachments,
        read: messageData.read
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setMessages(prev => [transformMessage(data), ...prev]);
    }
  };

  const markMessageRead = async (id: string) => {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setMessages(prev => prev.map(message => 
        message.id === id ? transformMessage(data) : message
      ));
    }
  };

  const addContract = async (contractData: Omit<Contract, 'id' | 'createdAt'>) => {
    // Ensure client_id is set for proper data sharing
    if (!contractData.clientId) {
      throw new Error('Contract must be assigned to a client');
    }
    
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        client_id: contractData.clientId,
        project_id: contractData.projectId,
        title: contractData.title,
        type: contractData.type,
        status: contractData.status,
        file_url: contractData.fileUrl,
        file_name: contractData.fileName,
        sent_at: contractData.sentAt,
        signed_at: contractData.signedAt,
        signed_by: contractData.signedBy,
        value: contractData.value,
        description: contractData.description,
        version: contractData.version
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setContracts(prev => [transformContract(data), ...prev]);
    }
  };

  const updateContract = async (id: string, updates: Partial<Contract>) => {
    const dbUpdates: any = {};
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.fileUrl !== undefined) dbUpdates.file_url = updates.fileUrl;
    if (updates.fileName !== undefined) dbUpdates.file_name = updates.fileName;
    if (updates.sentAt !== undefined) dbUpdates.sent_at = updates.sentAt;
    if (updates.signedAt !== undefined) dbUpdates.signed_at = updates.signedAt;
    if (updates.signedBy !== undefined) dbUpdates.signed_by = updates.signedBy;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.version !== undefined) dbUpdates.version = updates.version;

    const { data, error } = await supabase
      .from('contracts')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setContracts(prev => prev.map(contract => 
        contract.id === id ? transformContract(data) : contract
      ));
    }
  };

  const addReturn = async (returnData: Omit<Return, 'id' | 'createdAt'>) => {
    // Ensure client_id is set for proper data sharing
    if (!returnData.clientId) {
      throw new Error('Return must be assigned to a client');
    }
    
    const { data, error } = await supabase
      .from('returns')
      .insert({
        project_id: returnData.projectId,
        client_id: returnData.clientId,
        item: returnData.item?.[0]?.name || 'Return Item',
        items: returnData.item || [],
        reason: returnData.reason,
        status: returnData.status,
        amount: returnData.amount,
        return_date: returnData.returnDate,
        processed_date: returnData.processedDate,
        images: returnData.images,
        notes: returnData.notes
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setReturns(prev => [transformReturn(data), ...prev]);
    }
  };

  const updateReturn = async (id: string, updates: Partial<Return>) => {
    const dbUpdates: any = {};
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.item !== undefined) dbUpdates.item = updates.item?.[0]?.name || 'Return Item';
    if (updates.item !== undefined) dbUpdates.items = updates.item;
    if (updates.reason !== undefined) dbUpdates.reason = updates.reason;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.returnDate !== undefined) dbUpdates.return_date = updates.returnDate;
    if (updates.processedDate !== undefined) dbUpdates.processed_date = updates.processedDate;
    if (updates.images !== undefined) dbUpdates.images = updates.images;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from('returns')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setReturns(prev => prev.map(returnItem => 
        returnItem.id === id ? transformReturn(data) : returnItem
      ));
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    // Ensure client_id is set for proper data sharing
    if (!expenseData.clientId) {
      throw new Error('Expense must be assigned to a client');
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        project_id: expenseData.projectId,
        client_id: expenseData.clientId,
        title: expenseData.title,
        description: expenseData.description,
        items: expenseData.items,
        total_amount: expenseData.totalAmount,
        expense_date: expenseData.expenseDate,
        category: expenseData.category,
        receipt_image: expenseData.receiptImage,
        notes: expenseData.notes
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      const newExpense = transformExpense(data);
      setExpenses(prev => [newExpense, ...prev]);
      
      // Update project spent amount
      const project = projects.find(p => p.id === expenseData.projectId);
      if (project) {
        const newSpent = project.spent + expenseData.totalAmount;
        await updateProject(expenseData.projectId, { spent: newSpent });
      }
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const dbUpdates: any = {};
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.items !== undefined) dbUpdates.items = updates.items;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.expenseDate !== undefined) dbUpdates.expense_date = updates.expenseDate;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.receiptImage !== undefined) dbUpdates.receipt_image = updates.receiptImage;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    // Get the old expense to calculate spent amount difference
    const oldExpense = expenses.find(e => e.id === id);
    
    const { data, error } = await supabase
      .from('expenses')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      const updatedExpense = transformExpense(data);
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? updatedExpense : expense
      ));
      
      // Update project spent amount if total amount changed
      if (oldExpense && updates.totalAmount !== undefined) {
        const project = projects.find(p => p.id === updatedExpense.projectId);
        if (project) {
          const spentDifference = updates.totalAmount - oldExpense.totalAmount;
          const newSpent = project.spent + spentDifference;
          await updateProject(updatedExpense.projectId, { spent: newSpent });
        }
      }
    }
  };

  const deleteExpense = async (id: string) => {
    // Get the expense to update project spent amount
    const expense = expenses.find(e => e.id === id);
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    
    // Update project spent amount
    if (expense) {
      const project = projects.find(p => p.id === expense.projectId);
      if (project) {
        const newSpent = project.spent - expense.totalAmount;
        await updateProject(expense.projectId, { spent: Math.max(0, newSpent) });
      }
    }
  };

  // Delete functions
  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const deleteContract = async (id: string) => {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setContracts(prev => prev.filter(contract => contract.id !== id));
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setMessages(prev => prev.filter(message => message.id !== id));
  };

  const addProjectFile = async (fileData: Omit<ProjectFile, 'id' | 'createdAt'>) => {
    // Ensure client_id is set for proper data sharing
    if (!fileData.clientId) {
      throw new Error('Project file must be assigned to a client');
    }
    
    const { data, error } = await supabase
      .from('project_files')
      .insert({
        project_id: fileData.projectId,
        client_id: fileData.clientId,
        file_name: fileData.fileName,
        file_url: fileData.fileUrl,
        file_type: fileData.fileType,
        file_size: fileData.fileSize,
        room: fileData.room,
        description: fileData.description,
        is_visionboard: fileData.isVisionboard
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setProjectFiles(prev => [transformProjectFile(data), ...prev]);
    }
  };

  const updateProjectFile = async (id: string, updates: Partial<ProjectFile>) => {
    const dbUpdates: any = {};
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.fileName !== undefined) dbUpdates.file_name = updates.fileName;
    if (updates.fileUrl !== undefined) dbUpdates.file_url = updates.fileUrl;
    if (updates.fileType !== undefined) dbUpdates.file_type = updates.fileType;
    if (updates.fileSize !== undefined) dbUpdates.file_size = updates.fileSize;
    if (updates.room !== undefined) dbUpdates.room = updates.room;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isVisionboard !== undefined) dbUpdates.is_visionboard = updates.isVisionboard;

    const { data, error } = await supabase
      .from('project_files')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setProjectFiles(prev => prev.map(file => 
        file.id === id ? transformProjectFile(data) : file
      ));
    }
  };

  const deleteProjectFile = async (id: string) => {
    const { error } = await supabase
      .from('project_files')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setProjectFiles(prev => prev.filter(file => file.id !== id));
  };
  return (
    <DataContext.Provider value={{
      clients,
      projects,
      tasks,
      messages,
      contracts,
      returns,
      expenses,
      projectFiles,
      users,
      loading,
      addClient,
      updateClient,
      addProject,
      updateProject,
      addTask,
      updateTask,
      addMessage,
      markMessageRead,
      addContract,
      updateContract,
      addReturn,
      updateReturn,
      addExpense,
      updateExpense,
      deleteExpense,
      addProjectFile,
      updateProjectFile,
      deleteProjectFile,
      refreshData,
      deleteProject,
      deleteTask,
      deleteContract,
      deleteMessage
    }}>
      {children}
    </DataContext.Provider>
  );
};