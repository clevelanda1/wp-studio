import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChangePasswordModal from '../common/ChangePasswordModal';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  CheckSquare, 
  FileText, 
  MessageSquare,
  Home,
  LogOut
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  const businessNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderOpen },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/contracts', label: 'Contracts', icon: FileText },
    { to: '/messages', label: 'Messages', icon: MessageSquare }
  ];
  
  const clientNavItems = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/projects', label: 'Projects', icon: FolderOpen },
    { to: '/contracts', label: 'Contracts', icon: FileText },
    { to: '/messages', label: 'Messages', icon: MessageSquare }
  ];
  
  const navItems = user?.role === 'client' ? clientNavItems : businessNavItems;

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-zinc-900 text-white rounded-lg shadow-lg hover:bg-zinc-800 transition-colors touch-manipulation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-16 lg:hover:w-64 bg-zinc-900 flex flex-col h-screen border-r border-zinc-700 shadow-xl overflow-hidden
        transform transition-all duration-300 ease-in-out lg:transform-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        group
      `}>

        {/* Header */}
        <div className="px-3 py-6 border-b border-zinc-700/70 lg:group-hover:px-6 transition-all duration-300">
          <style>{`
            @keyframes colorCycle {
              0% { background-color: #2563eb; }
              20% { background-color: #7c3aed; }
              40% { background-color: #d97706; }
              60% { background-color: #059669; }
              80% { background-color: #dc2626; }
              100% { background-color: #2563eb; }
            }
          `}</style>
          <div className="flex items-center justify-center lg:group-hover:justify-start lg:group-hover:space-x-3">
            <div className="w-10 h-10 p-1.5 flex items-center justify-center flex-shrink-0 relative">
              <div className="w-full h-full rounded" style={{
                animation: 'colorCycle 4s ease-in-out infinite'
              }}></div>
              {/* Mobile Close Button - centered in the color square */}
              <button
                onClick={closeMobileMenu}
                className="lg:hidden absolute inset-0 flex items-center justify-center text-white hover:bg-black/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden lg:block lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 lg:w-0 lg:group-hover:w-auto overflow-hidden">
              <h1 className="text-xl font-semibold text-white font-['Montserrat'] tracking-tight leading-tight whitespace-nowrap">
                Wall Play Studio
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5 font-thin whitespace-nowrap">
                {user?.role === 'client' ? 'Client Portal' : 'Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 lg:group-hover:px-4 py-6 overflow-y-auto hide-scrollbar transition-all duration-300">
          <div className="space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `group/item flex items-center justify-center lg:group-hover:justify-start px-3 lg:group-hover:px-4 py-3 rounded-lg transition-all duration-200 touch-manipulation relative ${
                      isActive
                        ? 'bg-zinc-800 text-white shadow-lg'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white active:bg-zinc-800/80 active:scale-95'
                    }`
                  }
                  title={item.label}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0 lg:group-hover:hidden" />
                  <span className="hidden lg:block lg:opacity-0 lg:group-hover:opacity-100 lg:group-hover:ml-0 font-small text-sm tracking-wide transition-all duration-300 lg:w-0 lg:group-hover:w-auto overflow-hidden whitespace-nowrap text-gray-200">
                    {item.label}
                  </span>
                  
                  {/* Tooltip for collapsed state */}
                  <div className="hidden lg:block lg:group-hover:hidden lg:group/item-hover:block absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded-md whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="px-2 lg:group-hover:px-4 pb-24 sm:pb-32 lg:pb-6 border-t border-zinc-700/50 pt-4 transition-all duration-300">
          {/* Collapsed state - show avatar and sign out icon */}
          <div className="block lg:group-hover:hidden space-y-3">
            {/* User Avatar */}
            <div className="flex justify-center">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-zinc-600/50 shadow-lg">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/5 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.split(' ').map(n => n[0].toUpperCase()).join('') || 'U'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Sign Out Icon */}
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
                className="p-2.5 text-zinc-300 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30 rounded-lg transition-all duration-300 border border-transparent group/logout"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
                
                {/* Tooltip for collapsed state */}
                <div className="hidden lg:block lg:group/logout-hover:block absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded-md whitespace-nowrap z-50 pointer-events-none">
                  Sign Out
                </div>
              </button>
            </div>
          </div>

          {/* Expanded state - show full user section */}
          <div className="hidden lg:group-hover:block">
            <div 
              onClick={() => setShowChangePasswordModal(true)}
              className="flex items-center space-x-3 p-4 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 transition-all duration-300 border border-zinc-700/30 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-zinc-600/50 shadow-lg flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/5 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.split(' ').map(n => n[0].toUpperCase()).join('') || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate whitespace-nowrap">{user?.name || 'User'}</p>
                <p className="text-xs font-thin text-zinc-400 truncate mt-0.5 whitespace-nowrap">{user?.email}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <button 
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
                className="w-full flex items-center justify-center px-4 py-3 text-zinc-300 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30 rounded-lg transition-all duration-300 border border-transparent text-sm touch-manipulation active:bg-red-600/30"
              >
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};

export default Sidebar;