import React, { useState, useRef, useEffect } from 'react';
import { 
  DocumentPlusIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import fileSearchAPI from '../services/fileSearchAPI';

function FileSearch() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const fileInputRef = useRef(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setListLoading(true);
      const result = await fileSearchAPI.listDocuments();
      setDocuments(result.documents || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setListLoading(false);
    }
  };

  const handleDeleteDocument = async (documentName, displayName) => {
    if (!window.confirm(`Are you sure you want to delete "${displayName}"?`)) {
      return;
    }

    try {
      setDeleteLoading(documentName);
      setError(null);
      await fileSearchAPI.deleteDocument(documentName);
      setSuccess(`Successfully deleted "${displayName}"`);
      // Reload documents and stay on current page if possible
      await loadDocuments();
      // Reset to last valid page if current page would be empty
      const newTotalPages = Math.ceil((documents.length - 1) / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err.message || 'Failed to delete document');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      setError(null);
      setSuccess(null);
      // Initialize progress tracking
      setUploadProgress(files.map(f => ({ name: f.name, status: 'pending', progress: 0 })));
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    try {
      setUploadLoading(true);
      setError(null);
      setSuccess(null);
      
      // Upload all files in parallel
      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          // Update progress: uploading
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[index] = { name: file.name, status: 'uploading', progress: 50 };
            return newProgress;
          });
          
          const result = await fileSearchAPI.uploadFile(file);
          
          // Update progress: success
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[index] = { name: file.name, status: 'success', progress: 100 };
            return newProgress;
          });
          
          return { success: true, file: file.name };
        } catch (err) {
          // Update progress: error
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[index] = { name: file.name, status: 'error', progress: 0, error: err.message };
            return newProgress;
          });
          
          return { success: false, file: file.name, error: err.message };
        }
      });
      
      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      
      // Count successes and failures
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (failureCount === 0) {
        setSuccess(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''} to File Search store. You can now search for their content.`);
      } else if (successCount === 0) {
        setError(`Failed to upload all ${failureCount} file${failureCount > 1 ? 's' : ''}. Check the status below.`);
      } else {
        setSuccess(`Uploaded ${successCount} file${successCount > 1 ? 's' : ''} successfully. ${failureCount} file${failureCount > 1 ? 's' : ''} failed.`);
      }
      
      // Reload documents and reset to first page
      await loadDocuments();
      setCurrentPage(1);
      
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
      
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledgebase</h1>
        <p className="text-gray-600">
          Upload documents to the Gemini File Search store for semantic search
        </p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-green-800">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <CloudArrowUpIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Files (multiple allowed)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".txt,.pdf,.doc,.docx,.md,.json,.csv,.xml,.html"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file, index) => (
                      <p key={index} className="text-xs text-gray-600 pl-2">
                        • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Upload Progress:</p>
                {uploadProgress.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    {item.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                    )}
                    {item.status === 'uploading' && (
                      <ArrowPathIcon className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    )}
                    {item.status === 'error' && (
                      <ExclamationCircleIcon className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`flex-1 truncate ${
                      item.status === 'success' ? 'text-green-700' : 
                      item.status === 'error' ? 'text-red-700' : 
                      item.status === 'uploading' ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {item.name}
                    </span>
                    {item.error && (
                      <span className="text-red-600 text-xs">({item.error})</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleFileUpload}
              disabled={selectedFiles.length === 0 || uploadLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent 
                text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {uploadLoading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Uploading {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <DocumentPlusIcon className="h-5 w-5 mr-2" />
                  Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}to File Search
                </>
              )}
            </button>
          </div>

          {/* Upload Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">About Knowledgebase</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Files are automatically indexed after upload</li>
              <li>• All uploaded files are searchable immediately</li>
              <li>• Use the <strong>Business Data</strong> tab to search and query your documents</li>
              <li>• Supports semantic search with AI-powered answers and citations</li>
            </ul>
          </div>
        </div>

        {/* Document List Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Uploaded Documents</h2>
            </div>
            <button
              onClick={loadDocuments}
              disabled={listLoading}
              className="flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${listLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No documents uploaded yet</p>
              <p className="text-sm mt-1">Upload files above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, documents.length)}-{Math.min(currentPage * itemsPerPage, documents.length)} of {documents.length} document{documents.length !== 1 ? 's' : ''}
                </p>
                {documents.length > itemsPerPage && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {Math.ceil(documents.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(documents.length / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(documents.length / itemsPerPage)}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-200">
                {documents
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((doc) => (
                  <div key={doc.name} className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.display_name || 'Untitled'}
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <span>{doc.mime_type || 'Unknown type'}</span>
                            <span>•</span>
                            <span>{(doc.size_bytes / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              doc.state === 'STATE_ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.state === 'STATE_ACTIVE' ? 'Active' : doc.state}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.name, doc.display_name)}
                      disabled={deleteLoading === doc.name}
                      className="ml-4 flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading === doc.name ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileSearch;
