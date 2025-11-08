import React, { useState, useEffect, useRef } from 'react';
import {
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import riskAssessmentAPI from '../services/api';

const CORPUS_INFO = {
  data_v1: {
    title: 'Business Data & Processes',
    description: 'Business process documents, data flows, and operational procedures',
    icon: DocumentTextIcon,
    color: 'blue',
    suggestedQuestions: [
      'What business processes are documented?',
      'How do we handle customer data in our systems?',
      'What are the data flows for user registration?',
      'Summarize our payment processing workflow',
      'What third-party vendors do we share data with?',
      'How is personal data collected and stored?',
    ],
  },
  regulations: {
    title: 'Regulatory Knowledge Base',
    description: 'Privacy regulations, compliance requirements, and legal frameworks',
    icon: DocumentTextIcon,
    color: 'purple',
    suggestedQuestions: [
      'What regulations are available?',
      'What are the data retention requirements under CCPA?',
      'What does CCPA say about consumer rights?',
      'What are the requirements for data breach notification?',
      'What lawful bases are defined for data processing?',
      'What are the requirements for cross-border data transfers?',
    ],
  },
  ontology: {
    title: 'Data Ontology & Schema',
    description: 'Entity definitions, data classifications, and schema mappings',
    icon: DocumentTextIcon,
    color: 'green',
    suggestedQuestions: [
      'What entity types are defined?',
      'What are the attributes of the Customer entity?',
      'What data classifications are used?',
      'What relationship types exist between entities?',
      'How is personal data categorized?',
      'What are the properties of sensitive data entities?',
    ],
  },
};

function CorpusExplorer({ corpusName }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const corpusInfo = CORPUS_INFO[corpusName] || CORPUS_INFO.data_v1;
  const Icon = corpusInfo.icon;

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, chatLoading]);

  // Initialize suggestions when corpus changes
  useEffect(() => {
    setCurrentSuggestions(corpusInfo.suggestedQuestions);
    setChatMessages([]);
  }, [corpusName, corpusInfo.suggestedQuestions]);

  const handleChatSend = async (questionText = null) => {
    const messageText = questionText || chatInput;
    if (!messageText.trim() || chatLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Send message with corpus filter
      const response = await riskAssessmentAPI.sendMessage(
        `[CORPUS FILTER: ${corpusName} ONLY] ${messageText}\n\nIMPORTANT: Only query the ${corpusName} corpus. Do not query any other corpus.`
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Generate new suggestions based on the conversation
      await generateFollowUpSuggestions([...chatMessages, userMessage, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Error: ${err.message || 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const generateFollowUpSuggestions = async (conversationHistory) => {
    try {
      // Build context from last few messages
      const recentMessages = conversationHistory.slice(-4);
      const context = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const prompt = `Based on this conversation about ${corpusInfo.title}, suggest 4 relevant follow-up questions the user might want to ask. Return ONLY the questions, one per line, without numbering or bullets:\n\n${context}`;
      
      const response = await riskAssessmentAPI.sendMessage(prompt);
      
      // Parse the response into individual questions
      const suggestions = response.content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 4);
      
      if (suggestions.length > 0) {
        setCurrentSuggestions(suggestions);
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      // Keep existing suggestions on error
    }
  };

  return (
    <div className="h-[calc(100vh-16rem)]">
      <div className="bg-white rounded-lg shadow-lg h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`border-b border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50 p-6 flex-shrink-0`}>
          <div className="flex items-center space-x-4">
            <div className={`bg-${corpusInfo.color}-600 p-3 rounded-lg`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{corpusInfo.title}</h1>
              <p className="text-sm text-gray-600 mt-1">{corpusInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Chat Panel - Full Width */}
        <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <div className="bg-purple-50 border-b border-purple-100 p-4 flex-shrink-0">
                <h3 className="font-semibold text-gray-900">Ask Questions</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Questions will only search {corpusInfo.title}
                </p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0">
                {chatMessages.length === 0 ? (
                  <div className="py-6">
                    <div className="text-center mb-6">
                      <ChatBubbleLeftIcon className="h-12 w-12 text-purple-300 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Ask Questions About {corpusInfo.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Get answers from {corpusInfo.title} documents
                      </p>
                    </div>
                    
                    {/* Suggested Questions */}
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-3">Suggested Questions:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentSuggestions.map((question, index) => {
                          // Color code based on index for variety
                          const colors = [
                            'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400 text-blue-700',
                            'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-400 text-purple-700',
                            'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-400 text-green-700',
                            'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-400 text-orange-700',
                            'bg-pink-50 hover:bg-pink-100 border-pink-200 hover:border-pink-400 text-pink-700',
                            'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-400 text-indigo-700',
                          ];
                          const colorClass = colors[index % colors.length];
                          
                          return (
                          <button
                            key={index}
                            onClick={() => handleChatSend(question)}
                            className={`text-left px-4 py-3 text-sm rounded-xl transition-all border hover:shadow-sm ${colorClass}`}
                          >
                            <span className="block font-medium">{question}</span>
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl rounded-lg px-4 py-3 break-words ${
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
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
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <ArrowPathIcon className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-gray-700">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggested Follow-up Questions - Show after messages */}
                {chatMessages.length > 0 && !chatLoading && currentSuggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Suggested follow-up questions:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {currentSuggestions.slice(0, 4).map((question, index) => {
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
                            onClick={() => handleChatSend(question)}
                            className={`text-left px-3 py-2 text-sm rounded-lg transition-all border hover:shadow-sm ${colorClass}`}
                          >
                            <span className="block font-medium">{question}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4 flex-shrink-0">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}

export default CorpusExplorer;
