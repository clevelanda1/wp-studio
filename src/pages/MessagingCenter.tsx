import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { 
  Send,
  Paperclip,
  Search,
  MoreVertical,
  Phone,
  Video,
  Clock,
  Plus,
  MessageCircle,
  Trash2
} from 'lucide-react';

const MessagingCenter: React.FC = () => {
  const { user } = useAuth();
  const { messages, clients, projects, addMessage, markMessageRead, deleteMessage } = useData();
  const location = useLocation();
  const initialClientId = location.state?.selectedClientId || '';
  const initialProjectId = location.state?.selectedProjectId || '';
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [messageType, setMessageType] = useState<'general' | 'project'>('general');
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessageClientId, setNewMessageClientId] = useState('');
  const [newMessageProjectId, setNewMessageProjectId] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const [showDeleteConversationConfirm, setShowDeleteConversationConfirm] = useState<string | null>(null);

  // Set initial selections if coming from other pages
  React.useEffect(() => {
    if (initialClientId && !selectedClientId) {
      setSelectedClientId(initialClientId);
    }
    if (initialProjectId && !selectedProjectId) {
      setSelectedProjectId(`project-${initialProjectId}`);
      setMessageType('project');
    }
  }, [initialClientId, selectedClientId]);

  // Get conversations grouped by client
  const getConversations = () => {
    if (user?.role === 'client') {
      // For clients, show general admin conversation and project conversations
      const conversations = [];
      
      // General admin conversation
      const generalMessages = messages.filter(m => 
        m.clientId === user.clientId && !m.isProjectMessage
      );
      if (generalMessages.length > 0) {
        const lastMessage = generalMessages.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        const unreadCount = generalMessages.filter(m => !m.read && m.senderId !== user.id).length;
        
        conversations.push({
          id: 'admin-general',
          type: 'admin',
          title: 'Admin Support',
          subtitle: 'General inquiries and support',
          messages: generalMessages,
          lastMessage,
          unreadCount
        });
      }
      
      // Project conversations
      const clientProjects = projects.filter(p => p.clientId === user.clientId);
      clientProjects.forEach(project => {
        const projectMessages = messages.filter(m => 
          m.projectId === project.id && m.isProjectMessage
        );
        if (projectMessages.length > 0) {
          const lastMessage = projectMessages.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          const unreadCount = projectMessages.filter(m => !m.read && m.senderId !== user.id).length;
          
          conversations.push({
            id: `project-${project.id}`,
            type: 'project',
            title: project.name,
            subtitle: 'Project discussion',
            messages: projectMessages,
            lastMessage,
            unreadCount,
            project
          });
        }
      });
      
      return conversations;
    } else {
      // For admins, show client conversations (existing logic)
      return clients.map(client => {
        const clientMessages = messages.filter(m => m.clientId === client.id);
        const lastMessage = clientMessages.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        const unreadCount = clientMessages.filter(m => !m.read && m.senderId !== user?.id).length;
        
        return {
          id: `client-${client.id}`,
          type: 'client',
          title: client.name,
          subtitle: client.email,
          messages: clientMessages,
          lastMessage,
          unreadCount,
          client
        };
      }).filter(conv => conv.messages.length > 0);
    }
  };

  const existingConversations = getConversations();

  const selectedConversation = existingConversations.find(conv => 
    (messageType === 'general' && conv.id === selectedClientId) ||
    (messageType === 'project' && conv.id === selectedProjectId)
  );
  
  const selectedMessages = selectedConversation ? 
    selectedConversation.messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ) : [];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    let messageData;
    if (messageType === 'project' && selectedProjectId.startsWith('project-')) {
      const projectId = selectedProjectId.replace('project-', '');
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      messageData = {
        clientId: user?.role === 'client' ? user.clientId! : project.clientId,
        projectId: projectId,
        isProjectMessage: true,
        senderId: user?.id || '',
        senderName: user?.name || '',
        content: newMessage,
        read: false
      };
    } else {
      messageData = {
        clientId: user?.role === 'client' ? user.clientId! : selectedClientId,
        senderId: user?.id || '',
        senderName: user?.name || '',
        content: newMessage,
        read: false
      };
    }

    addMessage(messageData);

    setNewMessage('');
  };

  const handleStartNewConversation = () => {
    if (!newMessageContent.trim()) return;
    
    let messageData;
    if (messageType === 'project' && newMessageProjectId) {
      const project = projects.find(p => p.id === newMessageProjectId);
      if (!project) return;
      
      messageData = {
        clientId: user?.role === 'client' ? user.clientId! : project.clientId,
        projectId: newMessageProjectId,
        isProjectMessage: true,
        senderId: user?.id || '',
        senderName: user?.name || '',
        content: newMessageContent,
        read: false
      };
      
      setSelectedProjectId(`project-${newMessageProjectId}`);
      setMessageType('project');
    } else {
      if (user?.role === 'client') {
        messageData = {
          clientId: user.clientId!,
          senderId: user.id,
          senderName: user.name,
          content: newMessageContent,
          read: false
        };
        setSelectedClientId('admin-general');
        setMessageType('general');
      } else {
        if (!newMessageClientId) return;
        messageData = {
          clientId: newMessageClientId,
          senderId: user?.id || '',
          senderName: user?.name || '',
          content: newMessageContent,
          read: false
        };
        setSelectedClientId(`client-${newMessageClientId}`);
        setMessageType('general');
      }
    }

    addMessage(messageData);

    setShowNewMessageForm(false);
    setNewMessageClientId('');
    setNewMessageProjectId('');
    setNewMessageContent('');
  };

  const handleConversationSelect = (conversationId: string, type: 'general' | 'project') => {
    if (type === 'project') {
      setSelectedProjectId(conversationId);
      setSelectedClientId('');
      setMessageType('project');
    } else {
      setSelectedClientId(conversationId);
      setSelectedProjectId('');
      setMessageType('general');
    }
    setShowNewMessageForm(false);
    
    // Mark messages as read when conversation is selected
    const conversation = existingConversations.find(c => c.id === conversationId);
    if (conversation) {
      const unreadMessages = conversation.messages.filter(m => !m.read && m.senderId !== user?.id);
      unreadMessages.forEach(message => markMessageRead(message.id));
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const handleDeleteConversation = async (conversationId: string) => {
    setShowDeleteConversationConfirm(null);
    try {
      setDeletingConversation(conversationId);
      
      // Find the conversation to get all messages
      const conversation = existingConversations.find(c => c.id === conversationId);
      if (!conversation) return;
      
      // Delete all messages in the conversation
      for (const message of conversation.messages) {
        await deleteMessage(message.id);
      }
      
      // Clear selected conversation if it was the one being deleted
      if ((messageType === 'general' && selectedClientId === conversationId) ||
          (messageType === 'project' && selectedProjectId === conversationId)) {
        setSelectedClientId('');
        setSelectedProjectId('');
      }
      
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setDeletingConversation(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row bg-white border border-gray-200 shadow-sm overflow-hidden">
            {/* Conversations List */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-80 lg:max-h-none">
              {/* Search */}
              <div className="p-4 sm:p-6 border-b border-gray-200 space-y-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                  />
                </div>
                
                {user?.role !== 'client' && (
                  <button
                    onClick={() => {
                      setShowNewMessageForm(!showNewMessageForm);
                      setSelectedClientId('');
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 touch-manipulation"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {showNewMessageForm ? 'Cancel' : 'New Message'}
                  </button>
                )}
              </div>

              {/* New Message Form */}
              {showNewMessageForm && (
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Start New Conversation</h3>
                  <div className="space-y-4">
                    {user?.role === 'client' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMessageType('general')}
                            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation ${
                              messageType === 'general'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Admin Support
                          </button>
                          <button
                            type="button"
                            onClick={() => setMessageType('project')}
                            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation ${
                              messageType === 'project'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Project Chat
                          </button>
                        </div>
                        
                        {messageType === 'project' && (
                          <select
                            value={newMessageProjectId}
                            onChange={(e) => setNewMessageProjectId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                          >
                            <option value="">Select a project</option>
                            {projects.filter(p => p.clientId === user.clientId).map(project => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMessageType('general')}
                            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation ${
                              messageType === 'general'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Client Chat
                          </button>
                          <button
                            type="button"
                            onClick={() => setMessageType('project')}
                            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation ${
                              messageType === 'project'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Project Chat
                          </button>
                        </div>
                        
                        {messageType === 'general' ? (
                          <select
                            value={newMessageClientId}
                            onChange={(e) => setNewMessageClientId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                          >
                            <option value="">Select a client</option>
                            {clients.map(client => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={newMessageProjectId}
                            onChange={(e) => setNewMessageProjectId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                          >
                            <option value="">Select a project</option>
                            {projects.map(project => (
                              <option key={project.id} value={project.id}>
                                {project.name} - {clients.find(c => c.id === project.clientId)?.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                    
                    <textarea
                      value={newMessageContent}
                      onChange={(e) => setNewMessageContent(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none touch-manipulation"
                    />
                    <button
                      onClick={handleStartNewConversation}
                      disabled={
                        !newMessageContent.trim() || 
                        (user?.role !== 'client' && messageType === 'general' && !newMessageClientId) ||
                        (messageType === 'project' && !newMessageProjectId)
                      }
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              )}

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {existingConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id, conversation.type)}
                    className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors touch-manipulation ${
                      (messageType === 'general' && selectedClientId === conversation.id) ||
                      (messageType === 'project' && selectedProjectId === conversation.id)
                        ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {conversation.client?.avatar ? (
                          <img 
                            src={conversation.client.avatar} 
                            alt={conversation.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                            {conversation.title.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conversation.title}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.subtitle}
                        </p>
                        {conversation.lastMessage && (
                          <>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                              {conversation.lastMessage.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {existingConversations.length === 0 && !showNewMessageForm && (
                  <div className="p-6 sm:p-8 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-600 mb-4">Start your first conversation to begin messaging</p>
                    {user?.role !== 'client' && (
                      <button
                        onClick={() => setShowNewMessageForm(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm touch-manipulation"
                      >
                        Start your first conversation
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation && !showNewMessageForm ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 sm:p-6 bg-white border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden">
                        {selectedConversation.client?.avatar ? (
                          <img 
                            src={selectedConversation.client.avatar} 
                            alt={selectedConversation.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                            {selectedConversation.title.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {selectedConversation.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/*<button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                        <Video className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>*/}
                      {user?.role !== 'client' && (
                        <button 
                          onClick={() => setShowDeleteConversationConfirm(selectedConversation.id)}
                          disabled={deletingConversation === selectedConversation.id}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="Delete Conversation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50">
                    {selectedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-xs sm:max-w-sm lg:max-w-md">
                          <div className={`px-4 py-3 rounded-lg ${
                            message.senderId === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs ${
                                message.senderId === user?.id ? 'text-blue-100' : 'text-gray-400'
                              }`}>
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors touch-manipulation hidden sm:block">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type your message..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : !showNewMessageForm ? (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600">
                      Choose a conversation from the left to start messaging
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start a New Conversation
                    </h3>
                    <p className="text-gray-600">
                      Select a client and compose your message in the sidebar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delete Conversation Confirmation Modal */}
          {showDeleteConversationConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Conversation</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-3">
                    Are you sure you want to delete this entire conversation?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      <strong>All messages</strong> in this conversation will be permanently removed from the system.
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConversationConfirm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(showDeleteConversationConfirm)}
                    disabled={deletingConversation === showDeleteConversationConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingConversation === showDeleteConversationConfirm ? 'Deleting...' : 'Delete Conversation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MessagingCenter;