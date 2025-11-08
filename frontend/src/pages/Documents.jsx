import React, { useState } from 'react';
import { 
  DocumentPlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import riskAssessmentAPI, { DEFAULT_CORPUS } from '../services/api';

function Documents() {
  const [gcsPath, setGcsPath] = useState('');
  const [corpusName, setCorpusName] = useState(DEFAULT_CORPUS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [addedDocuments, setAddedDocuments] = useState([]);

  const handleAddDocument = async (e) => {
    e.preventDefault();
    
    if (!gcsPath.trim()) {
      setError('Please enter a GCS path');
      return;
    }

    if (!gcsPath.startsWith('gs://')) {
      setError('GCS path must start with gs://');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await riskAssessmentAPI.addDocument(corpusName, [gcsPath]);
      
      setSuccess(`Successfully added document to ${corpusName} corpus`);
      setAddedDocuments(prev => [{
        path: gcsPath,
        corpus: corpusName,
        timestamp: new Date().toISOString(),
      }, ...prev]);
      setGcsPath('');
    } catch (err) {
      console.error('Error adding document:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <DocumentPlusIcon className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Add Documents</h1>
          </div>
          <p className="text-gray-600">
            Add business process documents, policies, and agreements to the knowledge base for compliance analysis
          </p>
        </div>

        {/* Add Document Form */}
        <form onSubmit={handleAddDocument} className="mb-8">
          <div className="space-y-4">
            {/* Corpus Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Corpus
              </label>
              <select
                value={corpusName}
                onChange={(e) => setCorpusName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="data_v1">data_v1 (Default)</option>
                <option value="policies">policies</option>
                <option value="agreements">agreements</option>
                <option value="processes">processes</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select the corpus where the document should be added
              </p>
            </div>

            {/* GCS Path Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Cloud Storage Path
              </label>
              <input
                type="text"
                value={gcsPath}
                onChange={(e) => setGcsPath(e.target.value)}
                placeholder="gs://your-bucket/path/to/document.txt"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the full GCS path (e.g., gs://my-bucket/documents/privacy_policy.txt)
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !gcsPath.trim()}
              className="w-full flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Adding Document...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Add Document to Corpus
                </>
              )}
            </button>
          </div>
        </form>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Recently Added Documents */}
        {addedDocuments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recently Added Documents</h2>
            <div className="space-y-3">
              {addedDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 break-all">{doc.path}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Corpus: <span className="font-medium">{doc.corpus}</span>
                      </p>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 ml-4" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Added {new Date(doc.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Document Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Documents should be in text format (.txt, .md, .pdf)</li>
            <li>• Ensure the GCS bucket is accessible by the service account</li>
            <li>• Documents are automatically chunked and indexed for retrieval</li>
            <li>• Use descriptive filenames for better searchability</li>
            <li>• Supported document types: business processes, policies, DPAs, privacy notices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Documents;
