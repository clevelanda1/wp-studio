import React from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1 text-sm">{subtitle}</p>}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-60 lg:w-80 text-sm bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          
          {/* User Avatar */}
          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;