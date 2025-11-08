import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import riskAssessmentAPI from '../services/api';

// Initial sample queries for quick start
const INITIAL_QUERIES = [
  'What business processes are documented?',
  'What regulations are available?',
  'Analyze CCPA compliance for our customer analytics process',
  'What entity types are defined in the ontology?',
  'Summarize the key points from available regulations',
  'How do we handle cross-border data transfers?',
  'What are the data retention requirements under CCPA?',
  'Explain our vendor data processing agreements',
];

function Chat({ corpusFilter = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(INITIAL_QUERIES);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateSuggestions = async (conversationHistory) => {
    try {
      setLoadingSuggestions(true);
      
      // Build context from last few messages
      const recentMessages = conversationHistory.slice(-4);
      const context = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const prompt = `Based on this conversation context, suggest 4 relevant follow-up questions the user might want to ask. Return ONLY the questions, one per line, without numbering or bullets:\n\n${context}`;
      
      const response = await riskAssessmentAPI.sendMessage(prompt);
      
      if (response.content) {
        const newSuggestions = response.content
          .split('\n')
          .filter(line => line.trim() && !line.match(/^\d+[.)]/)) // Remove numbered lines
          .map(line => line.replace(/^[-*]\s*/, '').trim()) // Remove bullet points
          .filter(line => line.length > 10) // Filter out short lines
          .slice(0, 4); // Take first 4
        
        if (newSuggestions.length > 0) {
          setSuggestions(newSuggestions);
        }
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      // Keep existing suggestions on error
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await riskAssessmentAPI.sendMessage(messageText);

      console.log('[Chat] Agent response:', response);

      // Extract text from ADK response format
      let responseText = '';
      if (response.content) {
        responseText = response.content;
      } else if (response.response) {
        responseText = response.response;
      } else if (response.message) {
        responseText = response.message;
      } else {
        responseText = 'No response received';
      }

      const assistantMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      
      // Generate new suggestions after each response
      generateSuggestions(updatedMessages);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || err.message || 'Failed to get response from agent');
      
      const errorMessage = {
        role: 'assistant',
        content: `❌ Error: ${err.response?.data?.message || err.message || 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSampleQuery = (query) => {
    // Don't populate text box, just send the question directly
    handleSendMessage(query);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-sm text-gray-600 mt-1">
                {corpusFilter 
                  ? `Ask questions about ${corpusFilter} only`
                  : 'Ask questions across all documents - regulations, business data, and ontology'
                }
              </p>
              {!corpusFilter && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    All Documents
                  </span>
                  <span className="text-xs text-gray-500">
                    Searches across all available knowledge bases
                  </span>
                </div>
              )}
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                New Chat
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Help
              </h3>
              <p className="text-gray-600 mb-6">
                Ask me anything about your documents, compliance, data processing, or entity types
              </p>
              <div className="max-w-4xl mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-4">Try these questions:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestions.map((query, index) => {
                    // Color code based on index for variety
                    const colors = [
                      'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400 text-blue-700',
                      'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-400 text-purple-700',
                      'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-400 text-green-700',
                      'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-400 text-orange-700',
                      'bg-pink-50 hover:bg-pink-100 border-pink-200 hover:border-pink-400 text-pink-700',
                      'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-400 text-indigo-700',
                      'bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-400 text-teal-700',
                      'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 hover:border-cyan-400 text-cyan-700',
                    ];
                    const colorClass = colors[index % colors.length];
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleSampleQuery(query)}
                        className={`text-left px-4 py-3 text-sm rounded-xl transition-all border hover:shadow-sm ${colorClass}`}
                      >
                        <span className="block font-medium">{query}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 break-words ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="markdown-content prose prose-sm max-w-none break-words overflow-wrap-anywhere">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                  <p className="text-xs mt-2 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-gray-700">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Suggestions after messages */}
          {messages.length > 0 && !loading && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Suggested follow-up questions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {loadingSuggestions ? (
                  <div className="col-span-2 flex items-center justify-center py-4">
                    <ArrowPathIcon className="h-5 w-5 animate-spin text-purple-600 mr-2" />
                    <span className="text-sm text-gray-600">Generating suggestions...</span>
                  </div>
                ) : (
                  suggestions.map((query, index) => {
                    const colors = [
                      'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400 text-blue-700',
                      'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-400 text-purple-700',
                      'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-400 text-green-700',
                      'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-400 text-orange-700',
                    ];
                    const colorClass = colors[index % colors.length];
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleSampleQuery(query)}
                        className={`text-left px-3 py-2 text-sm rounded-lg transition-all border hover:shadow-sm ${colorClass}`}
                      >
                        <span className="block font-medium">{query}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex-shrink-0">
            <div className="flex items-center text-red-800">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your documents, compliance, data processing, or entity types..."
              className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows="2"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
