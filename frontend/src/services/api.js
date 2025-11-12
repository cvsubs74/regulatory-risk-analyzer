import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const DEFAULT_CORPUS = process.env.REACT_APP_DEFAULT_CORPUS || 'data_v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for complex queries
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
        '/apps/agents/users/user/sessions',
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

      // Send message using /run endpoint (enabled with --with_ui flag)
      const response = await apiClient.post(
        '/run',
        {
          app_name: 'agents',
          user_id: 'user',
          session_id: currentSessionId,
          new_message: {
            parts: [{ text: message }]
          },
          streaming: false
        }
      );

      console.log('[API] Response received:', response.data);

      // Parse response - /run endpoint returns array of events
      // The orchestrator now returns structured OrchestratorOutput with:
      // - result: Markdown-formatted text
      // - suggested_questions: Array of questions
      
      let structuredOutput = null;
      let responseText = '';
      
      if (response.data && Array.isArray(response.data)) {
        console.log('[API] Processing', response.data.length, 'events');
        
        for (const event of response.data) {
          // Check if structured output is in the state (when using output_schema)
          if (event.actions?.stateDelta?.final_response) {
            console.log('[API] Found structured output in state:', event.actions.stateDelta.final_response);
            structuredOutput = event.actions.stateDelta.final_response;
            break;
          }
          
          // Also check output_key location
          if (event.actions?.stateDelta) {
            const stateKeys = Object.keys(event.actions.stateDelta);
            console.log('[API] State keys:', stateKeys);
            
            // Look for common output keys
            for (const key of ['final_response', 'result', 'output']) {
              if (event.actions.stateDelta[key]) {
                console.log(`[API] Found output in state key '${key}':`, event.actions.stateDelta[key]);
                structuredOutput = event.actions.stateDelta[key];
                break;
              }
            }
          }
          
          // Extract text from model responses (fallback)
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

      // If we found structured output in state, parse it
      if (structuredOutput) {
        // If it's a string (wrapped in markdown), extract the JSON
        if (typeof structuredOutput === 'string') {
          console.log('[API] Structured output is a string, extracting JSON...');
          // Remove markdown code fences if present
          const jsonMatch = structuredOutput.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            try {
              structuredOutput = JSON.parse(jsonMatch[1]);
              console.log('[API] Parsed JSON from markdown:', structuredOutput);
            } catch (e) {
              console.error('[API] Failed to parse JSON from markdown:', e);
            }
          } else {
            // Try to parse as plain JSON
            try {
              structuredOutput = JSON.parse(structuredOutput);
              console.log('[API] Parsed plain JSON:', structuredOutput);
            } catch (e) {
              console.error('[API] Failed to parse as JSON:', e);
            }
          }
        }
        
        // Now use the parsed object
        if (structuredOutput && typeof structuredOutput === 'object') {
          console.log('[API] Using structured output from state:', structuredOutput);
          return {
            content: structuredOutput.result || structuredOutput.content || JSON.stringify(structuredOutput),
            suggested_questions: structuredOutput.suggested_questions || [],
            raw: structuredOutput
          };
        }
      }

      if (!responseText) {
        console.warn('[API] No response text found in events');
        responseText = 'No response received from agent.';
      }

      console.log('[API] Final response text length:', responseText.length);
      
      // Try to parse as JSON (structured output)
      try {
        structuredOutput = JSON.parse(responseText);
        console.log('[API] Parsed structured output from text:', structuredOutput);
        
        // Return structured format
        return {
          content: structuredOutput.result || responseText,
          suggested_questions: structuredOutput.suggested_questions || [],
          raw: structuredOutput
        };
      } catch (e) {
        // If not JSON, return as plain text (fallback for backwards compatibility)
        console.log('[API] Response is not JSON, returning as plain text');
        return { 
          content: responseText,
          suggested_questions: [],
          raw: null
        };
      }
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
   * List all documents in a corpus
   * @param {string} corpusName - Name of the corpus
   * @returns {Promise} - List of documents
   */
  async listDocuments(corpusName) {
    return this.sendMessage(`Use the list_documents tool to list all documents in the ${corpusName} corpus. Return the document names and metadata in a clear format.`);
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

  /**
   * Upload a document to Cloud Storage and add it to a corpus
   * @param {File} file - The file to upload
   * @param {string} corpusName - Name of the corpus to add the document to (default: data_v1)
   * @returns {Promise} - Upload response
   */
  async uploadDocument(file, corpusName = 'data_v1') {
    try {
      console.log('[API] Uploading document:', file.name);
      
      // Convert file to base64
      const fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Extract base64 data (remove data:...;base64, prefix if present)
          const result = reader.result;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Determine MIME type - use supported types for Gemini
      // Gemini supports: text/plain, application/pdf, and specific document types
      let mimeType = file.type;
      
      // If no type or unsupported type, detect from file extension
      if (!mimeType || mimeType === 'application/octet-stream') {
        const ext = file.name.split('.').pop().toLowerCase();
        const mimeTypeMap = {
          'txt': 'text/plain',
          'md': 'text/plain',
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'csv': 'text/csv',
          'json': 'application/json',
          'xml': 'text/xml',
          'html': 'text/html'
        };
        mimeType = mimeTypeMap[ext] || 'text/plain'; // Default to text/plain
      }
      
      // Create session if we don't have one
      if (!currentSessionId) {
        await this.createSession();
      }
      
      // Send document with multimodal message using /run endpoint
      // Process upload in background and notify when complete
      
      // Return immediately to UI with pending status
      const uploadResult = {
        success: true,
        message: `✅ Upload started for ${file.name}! Processing in background...`,
        filename: file.name,
        async: true,
        pending: true
      };
      
      // Start the upload in the background (don't await in this function)
      // Use setTimeout to ensure the promise isn't garbage collected
      setTimeout(async () => {
        try {
          console.log('[API] Starting background upload for:', file.name);
          
          const response = await apiClient.post(
            `/apps/agents/users/user/sessions/${currentSessionId}`,
            {
              user_input: `I'm uploading a document "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Please:
1. Use the save_file_to_gcs tool to save this file to Cloud Storage at gs://graph-rag-bucket/data/${file.name}
2. Use the add_data tool to add it to the ${corpusName} corpus
3. Confirm when the document has been successfully added to the knowledge base.`,
              inline_data: {
                mime_type: mimeType,
                data: fileBase64
              }
            },
            { timeout: 300000 } // 5 minutes for large files
          );
          
          console.log('[API] Upload completed:', response.data);
          
          // Dispatch custom event for notification
          window.dispatchEvent(new CustomEvent('uploadComplete', {
            detail: {
              filename: file.name,
              corpus: corpusName,
              success: true
            }
          }));
        } catch (error) {
          console.error('[API] Upload failed:', error);
          
          // Dispatch custom event for error notification
          window.dispatchEvent(new CustomEvent('uploadComplete', {
            detail: {
              filename: file.name,
              corpus: corpusName,
              success: false,
              error: error.message
            }
          }));
        }
      }, 0);
      
      return uploadResult;
    } catch (error) {
      console.error('[API] Error uploading document:', error);
      throw error;
    }
  },
};

export default riskAssessmentAPI;
export { DEFAULT_CORPUS };
