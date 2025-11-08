# Document Upload Implementation

## Overview
The document upload feature allows users to upload files directly through the chat interface. Files are sent to the agent using multimodal messages (following the same pattern as the hurricane analysis agent), saved to Cloud Storage, and automatically added to the specified RAG corpus.

## Architecture

### Frontend → Backend Flow

```
User selects file
    ↓
File converted to base64
    ↓
Multimodal message sent to agent (text + inlineData)
    ↓
Agent receives message with file data
    ↓
Agent calls save_file_to_gcs tool
    ↓
File saved to gs://graph-rag-bucket/data/[filename]
    ↓
Agent calls add_data tool with GCS path
    ↓
Document added to corpus and indexed
    ↓
Success confirmation sent to user
```

## Implementation Details

### 1. Frontend (React)

**File Upload UI Components:**
- Upload button (📤) in chat input area
- File preview with name and size
- Upload/Cancel controls
- Progress indicator during upload
- Success/error messages in chat

**Key Files:**
- `frontend/src/pages/Chat.jsx` - Main chat interface with upload
- `frontend/src/pages/CorpusExplorer.jsx` - Corpus-specific chat with upload
- `frontend/src/services/api.js` - API service with uploadDocument method

**Upload Flow (api.js):**
```javascript
async uploadDocument(file, corpusName = 'data_v1') {
  // 1. Convert file to base64
  const fileBase64 = await convertToBase64(file);
  
  // 2. Send multimodal message to agent
  const response = await axios.post(
    `${API_BASE_URL}/apps/risk_assessment_agent/users/user/sessions`,
    {
      new_message: {
        role: 'user',
        parts: [
          { text: 'Upload instructions...' },
          {
            inlineData: {
              mimeType: file.type,
              data: fileBase64  // Base64 without prefix
            }
          }
        ]
      },
      streaming: false
    }
  );
  
  // 3. Parse and return response
  return parseResponse(response);
}
```

**Key Pattern from Hurricane Agent:**
- Use `inlineData` with `mimeType` and `data` fields
- Remove `data:...;base64,` prefix from base64 string
- Send as part of multimodal message with text instructions
- Agent receives file data and can process it

### 2. Backend (ADK Agent)

**Agent Tools:**
1. **save_file_to_gcs** - Saves base64 file to Cloud Storage
2. **add_data** - Adds GCS file to RAG corpus

**Tool: save_file_to_gcs**
```python
def save_file_to_gcs(
    file_data: str,        # Base64-encoded content
    filename: str,         # File name
    mime_type: str,        # MIME type
    tool_context: ToolContext
) -> dict:
    # Decode base64
    file_bytes = base64.b64decode(file_data)
    
    # Upload to GCS
    storage_client = storage.Client()
    bucket = storage_client.bucket("graph-rag-bucket")
    blob = bucket.blob(f"data/{filename}")
    blob.upload_from_string(file_bytes, content_type=mime_type)
    
    # Return GCS path
    return {
        "status": "success",
        "gcs_path": f"gs://graph-rag-bucket/data/{filename}",
        "filename": filename,
        "size_bytes": len(file_bytes)
    }
```

**Agent Workflow:**
```
1. User message arrives with inlineData
2. Agent extracts file data from message parts
3. Agent calls save_file_to_gcs(data, filename, mime_type)
4. Tool saves file and returns GCS path
5. Agent calls add_data(corpus_name, [gcs_path])
6. Tool adds document to corpus
7. Agent confirms success to user
```

**Agent Instructions (agent.py):**
```python
## Document Upload Workflow

When a user uploads a document (you'll receive a message with both text and inlineData parts):
1. Extract the file data from the inlineData part (it contains mimeType and data fields)
2. Call `save_file_to_gcs` with the base64 data, filename, and MIME type
3. Get the GCS path from the save_file_to_gcs response
4. Call `add_data` with the GCS path to add the document to the specified corpus
5. Confirm to the user that the document has been successfully added
```

### 3. Cloud Storage

**Bucket Structure:**
```
gs://graph-rag-bucket/
└── data/
    ├── customer_analytics_process.md
    ├── employee_monitoring_process.md
    ├── vendor_data_sharing_process.md
    ├── ai_automated_decision_making.md
    └── [user-uploaded-files]
```

**Permissions Required:**
- Storage Object Creator (to upload files)
- Storage Object Viewer (to read files for RAG)

### 4. RAG Corpus Integration

**Corpus: data_v1**
- Contains business process documents
- Automatically indexes uploaded files
- Enables semantic search across all documents

**add_data Tool:**
- Accepts GCS paths: `gs://graph-rag-bucket/data/[filename]`
- Chunks documents for RAG
- Creates embeddings
- Indexes for semantic search

## User Experience

### Upload Flow:

1. **Select File**
   - Click upload button (📤)
   - Choose file from computer
   - Supported: .pdf, .txt, .doc, .docx, .md

2. **Preview**
   - File name displayed
   - File size shown
   - Upload/Cancel buttons appear

3. **Upload**
   - Click "Upload" button
   - Progress indicator shows "Uploading..."
   - File sent to agent

4. **Processing**
   - Agent saves to Cloud Storage
   - Agent adds to corpus
   - Indexing happens automatically

5. **Confirmation**
   - Success message in chat
   - "✅ Successfully uploaded [filename] to [corpus]!"
   - User can immediately ask questions about document

### Error Handling:

**Frontend:**
- File size validation
- File type validation
- Network error handling
- Timeout handling (5 min)

**Backend:**
- Base64 decode errors
- GCS upload failures
- Corpus addition failures
- Detailed error messages

## Testing

### Manual Testing:

1. **Upload Small Text File:**
   ```
   - Create test.txt with sample content
   - Upload via UI
   - Verify success message
   - Query: "What's in test.txt?"
   ```

2. **Upload PDF:**
   ```
   - Upload business process PDF
   - Wait for confirmation
   - Ask compliance questions
   ```

3. **Upload to Different Corpus:**
   ```
   - Navigate to specific corpus tab
   - Upload document
   - Verify added to correct corpus
   ```

### Verification:

1. **Check Cloud Storage:**
   ```bash
   gsutil ls gs://graph-rag-bucket/data/
   ```

2. **Check Corpus:**
   ```
   Use get_corpus_info tool to list documents
   ```

3. **Test RAG Query:**
   ```
   Ask questions about uploaded document
   ```

## Deployment

### Requirements:
- google-cloud-storage (added to requirements.txt)
- Cloud Storage bucket: graph-rag-bucket
- Service account with Storage permissions

### Deploy Backend:
```bash
cd risk_assessment_agent
adk deploy cloud_run \
  --project=graph-rag-app-20250811 \
  --region=us-east1 \
  --service_name=regulatory-risk-assessment-agent \
  --allow_origins="*"
```

### Deploy Frontend:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## Comparison with Hurricane Agent

**Similarities:**
- Both use multimodal messages with inlineData
- Both convert files to base64
- Both remove data URL prefix
- Both use mimeType and data fields
- Both handle large files with timeouts

**Differences:**
- Hurricane: Analyzes images directly with Gemini Vision
- Risk Analyzer: Saves files to GCS, then adds to RAG corpus
- Hurricane: Returns structured evacuation plan
- Risk Analyzer: Indexes documents for semantic search

**Pattern Reused:**
```javascript
// Hurricane pattern:
{
  inlineData: {
    mimeType: imageFile.type,
    data: base64ImageData
  }
}

// Risk Analyzer pattern (same!):
{
  inlineData: {
    mimeType: file.type,
    data: base64FileData
  }
}
```

## Benefits

1. **Seamless UX:** Upload directly in chat interface
2. **Automatic Indexing:** Files immediately available for RAG
3. **Multimodal Support:** Follows ADK best practices
4. **Scalable:** Cloud Storage handles any file size
5. **Persistent:** Files stored permanently in GCS
6. **Searchable:** RAG enables semantic search across all documents

## Future Enhancements

1. **Batch Upload:** Upload multiple files at once
2. **Drag & Drop:** Drag files directly into chat
3. **Progress Bar:** Show upload/indexing progress
4. **File Preview:** Preview documents before upload
5. **File Management:** List, delete, re-index uploaded files
6. **OCR Support:** Extract text from images/scanned PDFs
7. **Format Conversion:** Auto-convert to supported formats
