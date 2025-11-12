/**
 * API client for Gemini File Search Cloud Function
 * Handles direct communication with the File Search API
 */

import axios from 'axios';

// Cloud Function URL - update this after deployment
const CLOUD_FUNCTION_URL = process.env.REACT_APP_FILE_SEARCH_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: CLOUD_FUNCTION_URL,
  timeout: 120000, // 2 minutes for large file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

const fileSearchAPI = {
  /**
   * Upload a file to Gemini File Search store
   * @param {File} file - File object to upload
   * @returns {Promise} - Upload response
   */
  async uploadFile(file) {
    try {
      console.log('[FileSearchAPI] Uploading file:', file.name);
      
      // Convert file to base64
      const fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Determine MIME type
      let mimeType = file.type;
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
        mimeType = mimeTypeMap[ext] || 'text/plain';
      }
      
      // Upload to Cloud Function
      const response = await apiClient.post('', {
        operation: 'upload',
        file_data: fileBase64,
        filename: file.name,
        mime_type: mimeType,
        display_name: file.name
      });
      
      console.log('[FileSearchAPI] Upload successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('[FileSearchAPI] Upload error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Upload failed');
    }
  },

  /**
   * Search documents in the File Search store
   * @param {string} query - Search query
   * @returns {Promise} - Search results
   */
  async search(query) {
    try {
      console.log('[FileSearchAPI] Searching for:', query);
      
      const response = await apiClient.post('', {
        operation: 'search',
        query: query
      });
      
      console.log('[FileSearchAPI] Search results:', response.data);
      return response.data;
    } catch (error) {
      console.error('[FileSearchAPI] Search error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Search failed');
    }
  },

  /**
   * List all documents in the File Search store
   * @returns {Promise} - List of documents
   */
  async listDocuments() {
    try {
      console.log('[FileSearchAPI] Listing documents');
      
      const response = await apiClient.post('', {
        operation: 'list'
      });
      
      console.log('[FileSearchAPI] Documents:', response.data);
      return response.data;
    } catch (error) {
      console.error('[FileSearchAPI] List error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to list documents');
    }
  },

  /**
   * Delete a document from the File Search store
   * @param {string} documentName - Resource name of the document to delete
   * @returns {Promise} - Delete response
   */
  async deleteDocument(documentName) {
    try {
      console.log('[FileSearchAPI] Deleting document:', documentName);
      
      const response = await apiClient.post('', {
        operation: 'delete',
        document_name: documentName
      });
      
      console.log('[FileSearchAPI] Delete successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('[FileSearchAPI] Delete error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Delete failed');
    }
  }
};

export default fileSearchAPI;
