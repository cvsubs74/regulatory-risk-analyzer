import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ScaleIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import Chat from './pages/Chat';
import CorpusExplorer from './pages/CorpusExplorer';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  const tabs = [
    { id: 'chat', name: 'AI Assistant', icon: ChatBubbleLeftRightIcon, path: '/chat' },
    { id: 'data', name: 'Business Data', icon: DocumentTextIcon, path: '/corpus/data_v1' },
    { id: 'regulations', name: 'Regulations', icon: ScaleIcon, path: '/corpus/regulations' },
    { id: 'ontology', name: 'Ontology', icon: CubeIcon, path: '/corpus/ontology' },
  ];

  return (
    <Router>
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
      </div>
    </Router>
  );
}

export default App;
