import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const DEFAULT_CORPUS = process.env.REACT_APP_DEFAULT_CORPUS || 'data_v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for complex queries
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session management
let currentSessionId = null;

// API service for the Risk Assessment Agent
const riskAssessmentAPI = {
  /**
   * Create a new session
   */
  async createSession() {
    try {
      console.log('[API] Creating new session...');
      const response = await apiClient.post(
        '/apps/risk_assessment_agent/users/user/sessions',
        {}
      );
      currentSessionId = response.data.id;
      console.log('[API] Session created:', currentSessionId);
      return currentSessionId;
    } catch (error) {
      console.error('[API] Error creating session:', error);
      throw error;
    }
  },

  /**
   * Send a chat message to the agent
   * @param {string} message - User message
   * @returns {Promise} - Agent response
   */
  async sendMessage(message) {
    try {
      // Create session if we don't have one
      if (!currentSessionId) {
        await this.createSession();
      }

      console.log('[API] Sending message to session:', currentSessionId);

      // Send message to existing session using /run endpoint
      const response = await apiClient.post(
        '/run',
        {
          app_name: 'risk_assessment_agent',
          user_id: 'user',
          session_id: currentSessionId,
          new_message: {
            parts: [{ text: message }]
          },
        }
      );

      console.log('[API] Response received:', response.data);

      // Parse response - ADK returns events array
      let responseText = '';
      
      if (response.data && Array.isArray(response.data)) {
        console.log('[API] Processing', response.data.length, 'events');
        
        for (const event of response.data) {
          // Extract text from model responses
          if (event.content?.parts) {
            for (const part of event.content.parts) {
              if (part.text) {
                responseText += part.text;
                console.log('[API] Found text:', part.text.substring(0, 100));
              }
            }
          }
        }
      }

      if (!responseText) {
        console.warn('[API] No response text found in events');
        responseText = 'No response received from agent.';
      }

      console.log('[API] Final response text length:', responseText.length);
      return { content: responseText };
    } catch (error) {
      console.error('[API] Error sending message:', error);
      console.error('[API] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // If session error, clear session and retry once
      if (error.response?.status === 404 || error.response?.status === 409) {
        console.log('[API] Session error, clearing session and retrying...');
        currentSessionId = null;
        // Don't retry automatically to avoid infinite loop
      }
      
      throw error;
    }
  },

  /**
   * Clear the current session
   */
  clearSession() {
    console.log('[API] Clearing session');
    currentSessionId = null;
  },

  /**
   * List all available corpora
   * @returns {Promise} - List of corpora
   */
  async listCorpora() {
    return this.sendMessage('List all available corpora');
  },

  /**
   * Add a document to a corpus
   * @param {string} corpusName - Name of the corpus
   * @param {string[]} paths - Array of GCS paths or URLs
   * @returns {Promise} - Add data response
   */
  async addDocument(corpusName, paths) {
    const pathsStr = Array.isArray(paths) ? paths.join(', ') : paths;
    return this.sendMessage(`Add the following documents to the ${corpusName} corpus: ${pathsStr}`);
  },

  /**
   * Get corpus information
   * @param {string} corpusName - Name of the corpus
   * @returns {Promise} - Corpus info
   */
  async getCorpusInfo(corpusName) {
    return this.sendMessage(`Get information about the ${corpusName} corpus`);
  },

  /**
   * Analyze risk against specific regulations
   * @param {string} query - Risk analysis query
   * @param {string[]} regulations - Array of regulations to check against
   * @param {string} corpusName - Corpus to query (defaults to data_v1)
   * @returns {Promise} - Risk analysis response
   */
  async analyzeRisk(query, regulations = [], corpusName = DEFAULT_CORPUS) {
    let fullQuery = query;
    if (regulations.length > 0) {
      fullQuery = `Analyze the following for compliance with ${regulations.join(', ')}: ${query}`;
    }
    return this.sendMessage(fullQuery);
  },
};

export default riskAssessmentAPI;
export { DEFAULT_CORPUS };
