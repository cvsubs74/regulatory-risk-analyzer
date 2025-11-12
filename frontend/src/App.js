import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ScaleIcon,
  CubeIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Chat from './pages/Chat';
import CorpusExplorer from './pages/CorpusExplorer';
import FileSearch from './pages/FileSearch';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { TourProvider } from './contexts/TourContext';
import { DemoModeProvider, useDemoMode } from './contexts/DemoModeContext';
import NotificationBell from './components/NotificationBell';
import TourButton from './components/TourButton';
import TourGuide from './components/TourGuide';

// Inner component that uses notifications and demo mode
function AppContent() {
  const [activeTab, setActiveTab] = useState('chat');
  const { addNotification } = useNotifications();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const tabs = [
    { id: 'chat', name: 'AI Assistant', icon: ChatBubbleLeftRightIcon, path: '/chat' },
    { id: 'documents', name: 'Documents', icon: MagnifyingGlassIcon, path: '/documents' },
    // Hidden tabs - keep routes but don't display in navigation
    // { id: 'data', name: 'Business Data', icon: DocumentTextIcon, path: '/corpus/data_v1' },
    // { id: 'regulations', name: 'Regulations', icon: ScaleIcon, path: '/corpus/regulations' },
    // { id: 'ontology', name: 'Ontology', icon: CubeIcon, path: '/corpus/ontology' },
  ];

  // Listen for upload completion events
  useEffect(() => {
    const handleUploadComplete = (event) => {
      const { filename, corpus, success, error } = event.detail;
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Upload Complete',
          message: `${filename} has been successfully added to ${corpus}`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message: `Failed to upload ${filename}: ${error || 'Unknown error'}`
        });
      }
    };

    window.addEventListener('uploadComplete', handleUploadComplete);
    return () => window.removeEventListener('uploadComplete', handleUploadComplete);
  }, [addNotification]);

  return (
    <Router>
      <RouterContent 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        tabs={tabs} 
        isDemoMode={isDemoMode} 
        toggleDemoMode={toggleDemoMode} 
      />
    </Router>
  );
}

// Component inside Router that can use useLocation
function RouterContent({ activeTab, setActiveTab, tabs, isDemoMode, toggleDemoMode }) {
  const location = useLocation();

  // Auto-select tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/chat') {
      setActiveTab('chat');
    } else if (path === '/documents') {
      setActiveTab('documents');
    } else if (path === '/corpus/data_v1') {
      setActiveTab('data');
    } else if (path === '/corpus/regulations') {
      setActiveTab('regulations');
    } else if (path === '/corpus/ontology') {
      setActiveTab('ontology');
    }
  }, [location.pathname, setActiveTab]);

  // Clear all chat messages across all tabs
  const handleClearAll = () => {
    if (window.confirm('Clear all chat history from all tabs?')) {
      // Dispatch event to clear all chats
      window.dispatchEvent(new CustomEvent('clearAllChats'));
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-lg">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    DocuMind AI
                  </h1>
                  <p className="text-sm text-slate-600">
                    Intelligent Document Analysis & Compliance Assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {/* Clear All Button */}
                <button
                  onClick={handleClearAll}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm transition-all border border-red-200"
                  title="Clear all chat history"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Clear All</span>
                </button>

                {/* Demo Mode Toggle */}
                <button
                  onClick={toggleDemoMode}
                  data-tour-id="demo-toggle"
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isDemoMode
                      ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                  }`}
                  title={isDemoMode ? 'Switch to Live Mode' : 'Switch to Demo Mode'}
                >
                  {isDemoMode ? '🎬 DEMO MODE' : '📡 LIVE MODE'}
                </button>
                
                {/* Tour Button */}
                <TourButton />
                
                {/* Notification Bell */}
                <NotificationBell />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-4 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<Chat corpusFilter={null} />} />
            <Route path="/documents" element={<FileSearch />} />
            <Route path="/corpus/data_v1" element={<CorpusExplorer corpusName="data_v1" />} />
            <Route path="/corpus/regulations" element={<CorpusExplorer corpusName="regulations" />} />
            <Route path="/corpus/ontology" element={<CorpusExplorer corpusName="ontology" />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-slate-600">
              Powered by Google ADK & Vertex AI RAG
            </p>
          </div>
        </footer>
        
        {/* Tour Guide */}
        <TourGuide />
      </div>
  );
}

// Main App component with all providers
function App() {
  return (
    <NotificationProvider>
      <DemoModeProvider>
        <TourProvider>
          <AppContent />
        </TourProvider>
      </DemoModeProvider>
    </NotificationProvider>
  );
}

export default App;
