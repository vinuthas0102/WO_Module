import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Clock, Database, Wifi, Grid3x3 as Grid3X3, Download, MessageSquare, FileDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getEnvironmentConfig } from '../../lib/environment';
import { exportCurrentScreen } from '../../lib/exportScreen';

import NotificationBadge from '../common/NotificationBadge';
import NotificationPanel from '../common/NotificationPanel';

interface HeaderProps {
  showWelcome?: boolean;
  moduleIcon?: string;
  welcomeMessage?: string;
  actionsMenu?: React.ReactNode;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'Wrench': '🔧',
    'AlertTriangle': '⚠️',
    'Users': '👥',
    'FileText': '📄',
    'Briefcase': '💼'
  };
  return iconMap[iconName] || '📋';
};

const Header: React.FC<HeaderProps> = ({ showWelcome = false, moduleIcon, welcomeMessage, actionsMenu }) => {
  const { user, logout, selectedModule, setSelectedModule } = useAuth();
  const { unreadCount } = useNotifications();
  const envConfig = getEnvironmentConfig();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };

    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen]);

  const handleDownloadOffline = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch('/offline/tracksphere-offline.txt');
      if (!response.ok) throw new Error('Offline file not found');
      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tracksphere-offline.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsDownloading(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download offline version. Please try again.');
      setIsDownloading(false);
    }
  };


  return (
    <>
      {(envConfig.isDemoMode || envConfig.isOfflineMode) && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Demo Mode</span>
              <span className="text-sm">- Data changes are temporary. Connect Supabase for persistence.</span>
            </div>
            <div className="flex items-center space-x-1 text-yellow-700">
              <Database className="w-3 h-3" />
              <span className="text-xs">Mock Data</span>
            </div>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">TS</span>
                </div>
                <h1 className="text-xl font-bold text-white">TrackSphere</h1>
              </div>
              {selectedModule && !showWelcome && (
                <div className="flex items-center space-x-2">
                  <span className="text-blue-200">|</span>
                  <span className="text-sm font-medium text-blue-100">{selectedModule.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleDownloadOffline}
              disabled={isDownloading}
              className="p-2 text-blue-200 hover:text-white transition-all duration-200 hover:bg-green-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              title="Download offline version (single HTML file)"
            >
              <Download className="w-4 h-4" />
              {isDownloading && <span className="text-xs">...</span>}
            </button>

            <button
              onClick={() => exportCurrentScreen({ screenName: selectedModule?.name || 'TrackSphere' })}
              className="p-2 text-blue-200 hover:text-white transition-all duration-200 hover:bg-teal-500 rounded-lg flex items-center"
              title="Export current screen as standalone HTML"
            >
              <FileDown className="w-4 h-4" />
            </button>

            {selectedModule && (
              <button
                onClick={() => {
                  setSelectedModule(null);
                  localStorage.removeItem('selectedModule');
                }}
                className="p-2 text-blue-200 hover:text-white transition-all duration-200 hover:bg-blue-500 rounded-lg"
                title="Change module"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            )}

            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsPanelOpen(prev => !prev)}
                className={`relative p-2 transition-all duration-200 rounded-lg ${
                  isPanelOpen
                    ? 'bg-white text-blue-600'
                    : 'text-blue-200 hover:text-white hover:bg-blue-500'
                }`}
                title={unreadCount > 0 ? `${unreadCount} unread chat${unreadCount !== 1 ? 's' : ''}` : 'Notifications'}
              >
                <MessageSquare className="w-4 h-4" />
                <NotificationBadge count={unreadCount} />
              </button>

              {isPanelOpen && (
                <NotificationPanel onClose={() => setIsPanelOpen(false)} />
              )}
            </div>

            <div className="flex items-center space-x-3 pl-4 border-l border-blue-400">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-200" />
                <div className="text-sm">
                  <div className="text-white font-medium">{user?.name}</div>
                  <div className="text-blue-200 text-xs">{user?.department}</div>
                </div>

                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-20 text-white border border-white border-opacity-30`}>
                  {user?.role === 'EO' ? 'EO' : user?.role === 'DO' ? 'DO' : 'EMP'}
                </span>
              </div>

              {user?.lastLogin && (
                <div className="hidden md:flex items-center space-x-1 text-xs text-blue-200">
                  <Clock className="w-3 h-3 text-blue-300" />
                  <span>Last: {new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(user.lastLogin)}</span>
                </div>
              )}

              <button
                onClick={logout}
                className="p-2 text-blue-200 hover:text-white transition-all duration-200 hover:bg-red-500 rounded-lg"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showWelcome && selectedModule && (
          <div className="border-t border-blue-500 border-opacity-30 pt-3 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">
                  {getIconComponent(moduleIcon || selectedModule.icon)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedModule.name}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {welcomeMessage || `Welcome back, ${user?.name}!`}
                  </p>
                </div>
              </div>
              {actionsMenu && (
                <div className="relative z-[100]">
                  {actionsMenu}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
};

export default Header;
