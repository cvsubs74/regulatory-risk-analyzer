import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Custom Markdown renderer that converts citation blockquotes into tooltips
 * 
 * Expected format:
 * **Sources:**
 * 
 * **filename.txt**
 * > Citation content here...
 */
function CitationMarkdown({ content }) {
  const [hoveredCitation, setHoveredCitation] = useState(null);

  // Parse the markdown to extract citations and convert them to tooltip format
  const processContent = (markdownContent) => {
    // Find the Sources section
    const sourcesMatch = markdownContent.match(/\*\*Sources:\*\*/i);
    if (!sourcesMatch) {
      // No citations, return original content
      return { mainContent: markdownContent, citations: [] };
    }

    const sourcesIndex = sourcesMatch.index;
    const mainContent = markdownContent.substring(0, sourcesIndex).trim();
    const sourcesSection = markdownContent.substring(sourcesIndex);

    // Extract citations: **filename** followed by > blockquote
    const citationRegex = /\*\*([^*]+)\*\*\s*\n((?:>\s*[^\n]*\n?)+)/g;
    const citations = [];
    let match;

    while ((match = citationRegex.exec(sourcesSection)) !== null) {
      const filename = match[1].trim();
      const content = match[2]
        .split('\n')
        .map(line => line.replace(/^>\s*/, '').trim())
        .filter(line => line)
        .join(' ');
      
      citations.push({ filename, content });
    }

    return { mainContent, citations };
  };

  const { mainContent, citations } = processContent(content);

  return (
    <div className="markdown-content prose prose-sm max-w-none break-words overflow-wrap-anywhere">
      {/* Main content */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({node, ...props}) => (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse text-sm" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => (
            <thead className="bg-gray-50" {...props} />
          ),
          th: ({node, ...props}) => (
            <th className="px-3 py-2 border text-left font-semibold" {...props} />
          ),
          td: ({node, ...props}) => (
            <td className="px-3 py-2 border align-top" {...props} />
          ),
          tr: ({node, ...props}) => (
            <tr className="odd:bg-white even:bg-gray-50" {...props} />
          )
        }}
      >
        {mainContent}
      </ReactMarkdown>

      {/* Citations with tooltips */}
      {citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Sources:</p>
          <div className="flex flex-wrap gap-2">
            {citations.map((citation, index) => (
              <div
                key={index}
                className="relative inline-block"
                onMouseEnter={() => setHoveredCitation(index)}
                onMouseLeave={() => setHoveredCitation(null)}
              >
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-help transition-colors">
                  📄 {citation.filename}
                </span>
                
                {/* Tooltip */}
                {hoveredCitation === index && (
                  <div className="absolute z-50 w-80 p-3 mt-2 text-sm bg-gray-900 text-white rounded-lg shadow-xl left-0 transform">
                    <div className="relative">
                      {/* Arrow */}
                      <div className="absolute -top-5 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-900"></div>
                      
                      {/* Content */}
                      <p className="font-semibold mb-1 text-blue-300">{citation.filename}</p>
                      <p className="text-gray-200 leading-relaxed">{citation.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CitationMarkdown;
