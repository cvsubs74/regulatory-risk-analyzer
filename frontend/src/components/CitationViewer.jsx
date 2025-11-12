import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

/**
 * CitationViewer - Interactive component to display citations
 * Shows filenames by default, expands to show content on click
 */
const CitationViewer = ({ citations }) => {
  const [expandedCitations, setExpandedCitations] = useState(new Set());

  if (!citations || citations.length === 0) {
    return null;
  }

  const toggleCitation = (index) => {
    const newExpanded = new Set(expandedCitations);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCitations(newExpanded);
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <DocumentTextIcon className="h-4 w-4 mr-2" />
        Sources ({citations.length})
      </h3>
      <div className="space-y-2">
        {citations.map((citation, index) => {
          const isExpanded = expandedCitations.has(index);
          return (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
            >
              <button
                onClick={() => toggleCitation(index)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {citation.source}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {isExpanded && citation.content && (
                <div className="px-4 py-3 bg-white border-t border-gray-200">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {citation.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CitationViewer;
