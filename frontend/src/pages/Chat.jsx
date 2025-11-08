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
  'List all available corpora',
  'What documents are in the data_v1 corpus?',
  'Analyze GDPR compliance for our customer analytics process',
  'What entity types are defined in the ontology?',
  'Summarize the key points from the regulations corpus',
  'How do we handle cross-border data transfers?',
  'What are the data retention requirements under CCPA?',
  'Explain our vendor data processing agreements',
];

function Chat() {
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
      
      // TODO: Re-enable dynamic suggestions after fixing the loop issue
      // generateSuggestions(updatedMessages);
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
    setInput(query);
    // Automatically submit the selected question
    handleSendMessage(query);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chat with Your Documents</h1>
              <p className="text-sm text-gray-600 mt-1">
                Ask anything about your documents, compliance, or data processing
              </p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Help
              </h3>
              <p className="text-gray-600 mb-6">
                Ask me anything about your documents, compliance, data processing, or entity types
              </p>
              <div className="max-w-2xl mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-3">Try these questions:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestions.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQuery(query)}
                      className="px-4 py-2 text-sm text-left bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      {query}
                    </button>
                  ))}
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
                  className={`max-w-3xl rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="markdown-content prose prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
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
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Suggested follow-up questions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {loadingSuggestions ? (
                  <div className="col-span-2 flex items-center justify-center py-4">
                    <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">Generating suggestions...</span>
                  </div>
                ) : (
                  suggestions.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQuery(query)}
                      className="px-3 py-2 text-sm text-left bg-white text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-300"
                    >
                      {query}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-200">
            <div className="flex items-center text-red-800">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
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
