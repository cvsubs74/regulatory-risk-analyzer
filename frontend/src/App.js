import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Chat from './pages/Chat';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Document Intelligence Agent
                  </h1>
                  <p className="text-sm text-slate-600">
                    AI-Powered Document Analysis & Compliance
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>Ask me anything about your documents</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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
