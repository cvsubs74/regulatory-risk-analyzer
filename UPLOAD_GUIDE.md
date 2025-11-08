# Document Upload Guide

## Overview

Users can upload documents directly through the chat interface. The documents are automatically added to the `data_v1` corpus for RAG querying.

## Upload Flow

### 1. **Frontend Upload UI**
- Upload button (📤) in the chat input area
- Accepts: `.pdf`, `.txt`, `.doc`, `.docx`, `.md` files
- Shows file preview with size before upload
- Upload/Cancel buttons for confirmation

### 2. **Upload Process**

**Step 1: User selects file**
```javascript
// Frontend: Chat.jsx
- User clicks upload button
- File picker opens
- User selects document
- File preview appears
```

**Step 2: File upload to Cloud Storage**
```javascript
// Frontend: api.js -> uploadDocument()
- File is prepared for upload
- Sent to backend agent
- Agent receives upload request
```

**Step 3: Agent adds to corpus**
```python
// Backend: agent uses add_data tool
- File path: gs://graph-rag-bucket/data/{filename}
- Corpus: data_v1 (or specified corpus)
- Agent calls add_data tool
- Document is indexed for RAG
```

**Step 4: Confirmation**
```javascript
// Frontend: Success message in chat
- "✅ Successfully uploaded {filename} to the knowledge base!"
- User can immediately ask questions about the document
```

## Implementation Details

### Frontend Components

**Chat.jsx**
- `handleFileSelect()` - Handles file selection
- `handleFileUpload()` - Initiates upload process
- `handleCancelUpload()` - Cancels file selection
- Upload UI with file preview and progress

**api.js**
- `uploadDocument(file, corpusName)` - Sends upload request to agent
- `fileToBase64(file)` - Converts file for transmission

### Backend Components

**Agent (agent.py)**
- Receives upload requests through chat
- Uses `add_data` tool to add GCS files to corpus
- Returns success/failure status

**add_data tool (tools/add_data.py)**
- Accepts GCS paths: `gs://graph-rag-bucket/data/{filename}`
- Adds documents to specified corpus
- Handles chunking and embedding

## Cloud Storage Structure

```
gs://graph-rag-bucket/
└── data/
    ├── document1.pdf
    ├── report.txt
    ├── policy.docx
    └── ...
```

## Usage Example

### From Chat Interface:

1. **Click upload button** (📤 icon)
2. **Select file** from your computer
3. **Review file details** (name, size)
4. **Click "Upload"** button
5. **Wait for confirmation** message
6. **Ask questions** about the uploaded document

### Example Conversation:

```
User: [Uploads "gdpr_policy.pdf"]
