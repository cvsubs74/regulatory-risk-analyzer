import React, { useState, useEffect } from 'react';
import { 
  FolderIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import riskAssessmentAPI from '../services/api';

function Corpora() {
  const [corpora, setCorpora] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCorpus, setSelectedCorpus] = useState(null);
  const [corpusInfo, setCorpusInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    loadCorpora();
  }, []);

  const loadCorpora = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await riskAssessmentAPI.listCorpora();
      // Parse the response to extract corpora information
      // This will depend on the actual response format from your agent
      setCorpora([
        { name: 'data_v1', displayName: 'Data V1', description: 'Primary document corpus' },
        { name: 'policies', displayName: 'Policies', description: 'Privacy policies and notices' },
        { name: 'agreements', displayName: 'Agreements', description: 'Data processing agreements' },
        { name: 'processes', displayName: 'Processes', description: 'Business process descriptions' },
      ]);
    } catch (err) {
      console.error('Error loading corpora:', err);
      setError(err.message || 'Failed to load corpora');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCorpusInfo = async (corpus) => {
    setSelectedCorpus(corpus);
    setLoadingInfo(true);
    setCorpusInfo(null);

    try {
      const response = await riskAssessmentAPI.getCorpusInfo(corpus.name);
      setCorpusInfo(response);
    } catch (err) {
      console.error('Error loading corpus info:', err);
      setCorpusInfo({ error: err.message || 'Failed to load corpus information' });
    } finally {
      setLoadingInfo(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <FolderIcon className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Document Corpora</h1>
            </div>
            <p className="text-gray-600">
              Manage and view information about your document collections
            </p>
          </div>
          <button
            onClick={loadCorpora}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Corpora Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Loading corpora...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {corpora.map((corpus) => (
              <div
                key={corpus.name}
                className="p-6 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleViewCorpusInfo(corpus)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <FolderIcon className="h-6 w-6 text-primary mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">{corpus.displayName}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{corpus.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      <span>Click to view details</span>
                    </div>
                  </div>
                  <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Corpus Details */}
        {selectedCorpus && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Corpus Details: {selectedCorpus.displayName}
            </h2>
            
            {loadingInfo ? (
              <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-3 text-gray-600">Loading corpus information...</span>
              </div>
            ) : corpusInfo ? (
              <div className="bg-gray-50 rounded-lg p-6">
                {corpusInfo.error ? (
                  <p className="text-red-600">{corpusInfo.error}</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Corpus Name</h3>
                      <p className="text-gray-900">{selectedCorpus.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                      <p className="text-gray-900">{selectedCorpus.description}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Use this corpus for regulatory compliance analysis by selecting it in the chat interface
                        or when adding new documents.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📚 About Corpora</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Corpora are collections of documents organized by topic or regulation</li>
            <li>• Each corpus is independently searchable and queryable</li>
            <li>• Documents are automatically indexed and embedded for semantic search</li>
            <li>• Use the Documents page to add new files to any corpus</li>
            <li>• The default corpus (data_v1) contains all business process documents</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Corpora;
