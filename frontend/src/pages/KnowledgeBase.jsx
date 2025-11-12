import React, { useState, useRef, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  FolderIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import riskAssessmentAPI from '../services/api';

function KnowledgeBase() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreDescription, setNewStoreDescription] = useState('');
  
  const fileInputRef = useRef(null);

  // Load File Search stores on mount
  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await riskAssessmentAPI.sendMessage(
        'List all File Search stores available'
      );
      
      // Parse stores from response
      if (response.content) {
        // Try to extract store information from the response
        console.log('[KnowledgeBase] Stores response:', response);
        // For now, we'll need to parse the text response
        // In production, you'd want the agent to return structured data
      }
      
      setSuccess('Loaded File Search stores');
    } catch (err) {
      console.error('Error loading stores:', err);
      setError('Failed to load File Search stores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      setError('Please enter a store name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const message = `Create a new File Search store with name "${newStoreName}"${newStoreDescription ? ` and description "${newStoreDescription}"` : ''}`;
      
      const response = await riskAssessmentAPI.sendMessage(message);
      
      setSuccess(`Created File Search store: ${newStoreName}`);
      setNewStoreName('');
      setNewStoreDescription('');
      setShowCreateStore(false);
      
      // Reload stores
      await loadStores();
    } catch (err) {
      console.error('Error creating store:', err);
      setError('Failed to create File Search store');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploadLoading(true);
      setError(null);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(',')[1]; // Remove data:...;base64, prefix
        
        // Send upload request through the agent
        const message = `Upload file: ${selectedFile.name} (${selectedFile.type})`;
        
        const response = await riskAssessmentAPI.sendMessageWithFile(
          message,
          selectedFile
        );
        
        setSuccess(`Successfully uploaded ${selectedFile.name} to Knowledge Base`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setUploadLoading(false);
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      setSearchResults(null);
      
      const response = await riskAssessmentAPI.sendMessage(
        `Search the Knowledge Base for: ${searchQuery}`
      );
      
      setSearchResults({
        query: searchQuery,
        answer: response.content || 'No results found',
        citations: response.citations || []
      });
    } catch (err) {
      console.error('Error searching:', err);
      setError('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                📚 Knowledge Base
              </h1>
              <p className="text-lg text-gray-600">
                Upload documents and search using Gemini File Search
              </p>
            </div>
            <button
              onClick={() => setShowCreateStore(!showCreateStore)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Store
            </button>
          </div>

          {/* Create Store Form */}
          {showCreateStore && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Create New File Search Store</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="e.g., Regulatory Documents"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newStoreDescription}
                    onChange={(e) => setNewStoreDescription(e.target.value)}
                    placeholder="Purpose of this store..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateStore}
                    disabled={loading || !newStoreName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Store'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateStore(false);
                      setNewStoreName('');
                      setNewStoreDescription('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">{success}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <CloudArrowUpIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>
            </div>

            <div className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.txt,.doc,.docx,.md"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Supported: PDF, TXT, DOC, DOCX, MD
                </p>
              </div>

              {/* Selected File Display */}
              {selectedFile && (
                <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || uploadLoading}
                className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {uploadLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Uploading & Indexing...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    Upload to Knowledge Base
                  </>
                )}
              </button>

              {/* Info Box */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">1.</span>
                    Upload your document (PDF, TXT, DOC, etc.)
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">2.</span>
                    Document is automatically chunked and indexed
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">3.</span>
                    Semantic embeddings enable intelligent search
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">4.</span>
                    Search and get answers with citations
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <MagnifyingGlassIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Search Documents</h2>
            </div>

            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ask a Question
                </label>
                <textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="What are the key terms in the contract?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || searchLoading}
                className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {searchLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                    Search Knowledge Base
                  </>
                )}
              </button>

              {/* Search Results */}
              {searchResults && (
                <div className="mt-6 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Answer:</h3>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {searchResults.answer}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {searchResults.citations && searchResults.citations.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Sources:</h3>
                      <div className="space-y-3">
                        {searchResults.citations.map((citation, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start">
                              <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {citation.source || citation.title || citation.uri || 'Document'}
                                </p>
                                {citation.content && (
                                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                                    {citation.content.length > 200 
                                      ? `${citation.content.substring(0, 200)}...` 
                                      : citation.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sample Questions */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Sample Questions:</h3>
                <div className="space-y-2">
                  {[
                    'What are the main topics covered in these documents?',
                    'Summarize the key findings',
                    'What are the compliance requirements mentioned?',
                    'List all the parties involved',
                  ].map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(question)}
                      className="w-full text-left px-3 py-2 text-sm bg-white rounded-lg hover:bg-purple-50 border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeBase;
