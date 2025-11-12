import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import riskAssessmentAPI from '../services/api';
import { useDemoMode } from '../contexts/DemoModeContext';
import { getMockResponse } from '../services/mockData';
import CitationViewer from '../components/CitationViewer';

// Initial sample queries for quick start - Business-focused questions only
const INITIAL_QUERIES = [
  // Compliance analysis questions
  'Analyze CCPA compliance for our customer analytics process',
  'What are the risks in our payment processing workflow?',
  'Identify gaps between our data handling and regulatory requirements',
  'What personal data are we collecting in our documented processes?',
  
  // Business process questions
  'What business processes involve third-party data sharing?',
  'Which vendors do we share customer data with?',
  'Compare data retention requirements across all regulations',
  'What are the most critical compliance risks in our operations?',
];

// Store chat history for AI Assistant to persist across tab switches
const aiAssistantChatHistory = { messages: [], suggestions: [] };

/**
 * Parse citations from markdown content
 * Looks for **Sources:** section with **filename** and > quoted content
 */
function parseCitations(content) {
  const citations = [];
  
  // Match the Sources section
  const sourcesMatch = content.match(/\*\*Sources:\*\*([\s\S]*?)(?=\n\n[^>]|$)/);
  if (!sourcesMatch) return citations;
  
  const sourcesSection = sourcesMatch[1];
  
  // Match each source: **filename** followed by > quoted lines
  const sourcePattern = /\*\*([^*]+)\*\*\s*\n((?:>\s*[^\n]*\n?)+)/g;
  let match;
  
  while ((match = sourcePattern.exec(sourcesSection)) !== null) {
    const source = match[1].trim();
    const content = match[2]
      .split('\n')
      .map(line => line.replace(/^>\s*/, '').trim())
      .filter(line => line)
      .join('\n');
    
    citations.push({ source, content });
  }
  
  return citations;
}

/**
 * Remove the Sources section from content to display it separately
 */
function removeCitationsFromContent(content) {
  // Remove everything from **Sources:** onwards
  return content.replace(/\*\*Sources:\*\*[\s\S]*$/, '').trim();
}

function Chat({ corpusFilter = null }) {
  const { isDemoMode } = useDemoMode();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true); // Start with loading state
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const isInitialMount = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Restore chat history on mount and generate initial suggestions
  useEffect(() => {
    if (isInitialMount.current) {
      console.log('[Chat] Restoring AI Assistant chat history');
      if (aiAssistantChatHistory.messages.length > 0) {
        setMessages(aiAssistantChatHistory.messages);
        console.log(`[Chat] Restored ${aiAssistantChatHistory.messages.length} messages`);
      }
      
      // Generate fresh suggestions on mount if no cached suggestions or no chat history
      if (aiAssistantChatHistory.suggestions.length > 0 && aiAssistantChatHistory.messages.length > 0) {
        setSuggestions(aiAssistantChatHistory.suggestions);
        console.log(`[Chat] Restored ${aiAssistantChatHistory.suggestions.length} suggestions`);
      } else {
        console.log('[Chat] Generating initial suggestions from agent...');
        generateInitialSuggestions();
      }
      
      isInitialMount.current = false;
    }
  }, []);

  // Save chat history whenever messages change
  useEffect(() => {
    if (!isInitialMount.current && messages.length > 0) {
      aiAssistantChatHistory.messages = messages;
      console.log(`[Chat] Saved ${messages.length} messages`);
    }
  }, [messages]);

  // Save suggestions whenever they change
  useEffect(() => {
    if (!isInitialMount.current && suggestions.length > 0) {
      aiAssistantChatHistory.suggestions = suggestions;
      console.log(`[Chat] Saved ${suggestions.length} suggestions`);
    }
  }, [suggestions]);

  // Listen for tour events to automatically ask questions
  useEffect(() => {
    const handleTourQuestion = (event) => {
      const { query } = event.detail;
      if (query) {
        // Simulate typing the question
        setInput(query);
        // Auto-submit after a short delay
        setTimeout(() => {
          handleSendMessage(query);
        }, 1500);
      }
    };

    window.addEventListener('tourAskQuestion', handleTourQuestion);
    return () => window.removeEventListener('tourAskQuestion', handleTourQuestion);
  }, [isDemoMode]);

  // Listen for clear all chats event
  useEffect(() => {
    const handleClearAll = () => {
      setMessages([]);
      
      // Clear stored history
      aiAssistantChatHistory.messages = [];
      aiAssistantChatHistory.suggestions = [];
      console.log('[Chat] Cleared AI Assistant chat history');
      
      // Regenerate suggestions
      generateInitialSuggestions();
    };

    window.addEventListener('clearAllChats', handleClearAll);
    return () => window.removeEventListener('clearAllChats', handleClearAll);
  }, []);

  // Generate initial suggestions when first opening the AI Assistant
  const generateInitialSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      
      const prompt = `Generate 8 relevant questions that users can ask about regulatory compliance and business processes.

CRITICAL: You MUST return your response as JSON with the questions in the "suggested_questions" array:

{
  "result": "Brief summary of available capabilities",
  "suggested_questions": [
    "Question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?",
    "Question 6?",
    "Question 7?",
    "Question 8?"
  ]
}

Focus on:
- Compliance analysis (CCPA, GDPR, HIPAA)
- Business process questions
- Risk assessment
- Data sharing and vendor relationships
- Operational procedures

IMPORTANT: Put ALL 8 questions in the "suggested_questions" array, not in the "result" field`;
      
      const response = await riskAssessmentAPI.sendMessage(prompt);
      
      // Try to use suggested_questions from structured output first
      if (response.suggested_questions && response.suggested_questions.length > 0) {
        const suggestions = response.suggested_questions.slice(0, 8);
        setSuggestions(suggestions);
        aiAssistantChatHistory.suggestions = suggestions;
        console.log(`[Chat] Generated ${suggestions.length} initial suggestions from agent`);
      } else if (response.content) {
        // Fallback: Parse from text content
        const suggestions = response.content
          .split('\n')
          .filter(line => line.trim() && !line.match(/^\d+[.)]/))
          .map(line => line.replace(/^[-*]\s*/, '').trim())
          .filter(line => line.length > 10)
          .slice(0, 8);
        
        if (suggestions.length > 0) {
          setSuggestions(suggestions);
          aiAssistantChatHistory.suggestions = suggestions;
          console.log(`[Chat] Generated ${suggestions.length} initial suggestions (fallback)`);
        } else {
          // Use hardcoded as last resort
          setSuggestions(INITIAL_QUERIES);
        }
      } else {
        // Use hardcoded as last resort
        setSuggestions(INITIAL_QUERIES);
      }
    } catch (err) {
      console.error('Error generating initial suggestions:', err);
      // Fall back to hardcoded suggestions
      setSuggestions(INITIAL_QUERIES);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const generateSuggestions = async (conversationHistory) => {
    try {
      setLoadingSuggestions(true);
      
      // Build context from last few messages
      const recentMessages = conversationHistory.slice(-4);
      const context = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const prompt = `Based on this conversation context, suggest 6 business-focused questions the user might want to ask next.

CRITICAL: You MUST return your response as JSON with the questions in the "suggested_questions" array:

{
  "result": "Brief context summary",
  "suggested_questions": [
    "Question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?",
    "Question 6?"
  ]
}

Mix:
- 3 contextual follow-up questions related to the current conversation
- 3 creative exploratory questions that start a completely new topic

Focus on business processes, compliance, risks, data sharing, and operational questions.

Conversation context:
${context}

IMPORTANT: Put ALL 6 questions in the "suggested_questions" array, not in the "result" field`;
      
      const response = await riskAssessmentAPI.sendMessage(prompt);
      
      // Try to use suggested_questions from structured output first
      if (response.suggested_questions && response.suggested_questions.length > 0) {
        const suggestions = response.suggested_questions.slice(0, 6);
        setSuggestions(suggestions);
        console.log(`[Chat] Generated ${suggestions.length} follow-up suggestions from agent`);
      } else if (response.content) {
        // Fallback: Parse from text content
        const newSuggestions = response.content
          .split('\n')
          .filter(line => line.trim() && !line.match(/^\d+[.)]/))
          .map(line => line.replace(/^[-*]\s*/, '').trim())
          .filter(line => line.length > 10)
          .slice(0, 6);
        
        if (newSuggestions.length > 0) {
          setSuggestions(newSuggestions);
          console.log(`[Chat] Generated ${newSuggestions.length} follow-up suggestions (fallback)`);
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
      let response;
      
      // Use mock data in demo mode
      if (isDemoMode) {
        const mockData = getMockResponse(messageText);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, mockData.duration || 2000));
        response = {
          content: mockData.response,
          role: 'assistant'
        };
      } else {
        response = await riskAssessmentAPI.sendMessage(messageText);
      }

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

      // Parse citations from the response
      const citations = parseCitations(responseText);
      const contentWithoutCitations = removeCitationsFromContent(responseText);

      const assistantMessage = {
        role: 'assistant',
        content: contentWithoutCitations,
        citations: citations,
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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress('Starting upload...');
      setError(null);

      const result = await riskAssessmentAPI.uploadDocument(selectedFile, 'data_v1');

      // Add immediate feedback message to chat
      const uploadMessage = {
        role: 'assistant',
        content: result.message || `✅ Upload started for **${selectedFile.name}**!\n\nThe document is being processed in the background. You'll receive a notification when it's ready.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, uploadMessage]);

      // Clear upload state immediately (async processing continues in background)
      setSelectedFile(null);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Failed to upload document: ${error.response?.data?.message || error.message}`);
      setUploadProgress(null);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)]" data-tour-id="chat-interface">
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
                {loadingSuggestions && suggestions.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin mr-3" />
                    <span className="text-gray-600">Generating personalized questions...</span>
                  </div>
                ) : (
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
                )}
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
                    <>
                      <div className="markdown-content prose prose-sm max-w-none break-words overflow-wrap-anywhere">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                      {message.citations && message.citations.length > 0 && (
                        <CitationViewer citations={message.citations} />
                      )}
                    </>
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
          {/* File Upload Section */}
          {selectedFile && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {uploadProgress ? (
                    <span className="text-sm text-blue-600">{uploadProgress}</span>
                  ) : (
                    <>
                      <button
                        onClick={handleFileUpload}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Upload
                      </button>
                      <button
                        onClick={handleCancelUpload}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.txt,.doc,.docx,.md"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadProgress}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              title="Upload document to knowledge base"
            >
              <DocumentArrowUpIcon className="h-5 w-5" />
            </button>
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
