"""
Google Cloud Function for Gemini File Search API operations.
Handles direct file uploads, searches, and document management.
"""

import os
import base64
import tempfile
import requests
import functions_framework
from flask import jsonify
from google import genai
from google.genai import types

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Get the data store name from environment variable
DATA_STORE = os.getenv("DATA_STORE", "data_v1")


def get_store_name():
    """Get the resource name of the File Search store, creating it if it doesn't exist."""
    try:
        # List all stores to find ours
        for store in client.file_search_stores.list():
            if getattr(store, 'display_name', '') == DATA_STORE:
                print(f"[STORE] Found store {DATA_STORE}: {store.name}")
                return store.name
        
        # Store doesn't exist, create it
        print(f"[STORE] Store {DATA_STORE} not found, creating...")
        store = client.file_search_stores.create(
            config={'display_name': DATA_STORE}
        )
        print(f"[STORE] Created store: {store.name}")
        return store.name
    except Exception as e:
        print(f"[STORE ERROR] Failed to get/create store: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def ensure_store_exists():
    """Ensure the File Search store exists."""
    get_store_name()


@functions_framework.http
def file_search_api(request):
    """
    HTTP Cloud Function for Gemini File Search operations.
    
    Supported operations (based on official Gemini File Search API):
    - POST /upload - Upload a file to File Search store
    - POST /search - Search the File Search store
    - POST /list - List all documents in the store
    - POST /delete - Delete a document from the store
    """
    
    # Enable CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get the operation from query parameter or request body
        operation = request.args.get('operation') or request.get_json().get('operation')
        
        if operation == 'upload':
            return handle_upload(request, headers)
        elif operation == 'search':
            return handle_search(request, headers)
        elif operation == 'list':
            return handle_list(request, headers)
        elif operation == 'delete':
            return handle_delete(request, headers)
        else:
            return jsonify({
                'success': False,
                'error': f'Unknown operation: {operation}. Valid operations: upload, search, list, delete'
            }), 400, headers
            
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500, headers


def handle_upload(request, headers):
    """Handle file upload to Gemini File Search store."""
    try:
        data = request.get_json()
        
        # Extract parameters
        file_data = data.get('file_data')  # base64 encoded
        filename = data.get('filename')
        mime_type = data.get('mime_type', 'application/octet-stream')
        display_name = data.get('display_name') or filename
        
        if not file_data or not filename:
            return jsonify({
                'success': False,
                'error': 'Missing required parameters: file_data and filename'
            }), 400, headers
        
        print(f"[UPLOAD] Uploading {filename} ({mime_type}) to {DATA_STORE}")
        
        # Get the store resource name
        store_name = get_store_name()
        
        # Decode base64 data
        file_bytes = base64.b64decode(file_data)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}", mode='wb') as tmp_file:
            tmp_file.write(file_bytes)
            tmp_path = tmp_file.name
        
        try:
            # Upload to File Search store
            config = {'display_name': display_name}
            
            operation = client.file_search_stores.upload_to_file_search_store(
                file=tmp_path,
                file_search_store_name=store_name,
                config=config
            )
            
            # Wait for import to complete
            import time
            while not operation.done:
                time.sleep(2)
                operation = client.operations.get(operation)
            
            print(f"[UPLOAD] Successfully uploaded {filename}")
            
            return jsonify({
                'success': True,
                'message': f'Successfully uploaded {filename} to File Search store',
                'filename': filename,
                'display_name': display_name,
                'store_name': DATA_STORE,
                'operation_name': operation.name,
                'size_bytes': len(file_bytes)
            }), 200, headers
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        print(f"[UPLOAD ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }), 500, headers


def handle_search(request, headers):
    """Handle semantic search in Gemini File Search store."""
    try:
        data = request.get_json()
        query = data.get('query')
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'Missing required parameter: query'
            }), 400, headers
        
        print(f"[SEARCH] Searching for: {query}")
        
        # Get the store resource name
        store_name = get_store_name()
        
        # Perform semantic search using File Search tool
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=query,
            config=types.GenerateContentConfig(
                tools=[
                    types.Tool(
                        file_search=types.FileSearch(
                            file_search_store_names=[store_name]
                        )
                    )
                ]
            )
        )
        
        # Extract answer and citations
        answer = response.text if hasattr(response, 'text') else str(response)
        
        # Extract citations from grounding metadata
        citations = []
        if hasattr(response, 'candidates') and response.candidates:
            for candidate in response.candidates:
                if hasattr(candidate, 'grounding_metadata'):
                    metadata = candidate.grounding_metadata
                    if hasattr(metadata, 'grounding_chunks'):
                        for chunk in metadata.grounding_chunks:
                            # Try to get citation from retrieved_context first
                            if hasattr(chunk, 'retrieved_context'):
                                ctx = chunk.retrieved_context
                                source = getattr(ctx, 'title', getattr(ctx, 'uri', 'Unknown'))
                                content = getattr(ctx, 'text', '')
                                citations.append({
                                    'source': source,
                                    'content': content[:500] if content else ''  # Limit content length
                                })
                            # Fallback to web citations
                            elif hasattr(chunk, 'web') and hasattr(chunk.web, 'uri'):
                                citations.append({
                                    'source': getattr(chunk.web, 'title', chunk.web.uri),
                                    'content': getattr(chunk.web, 'uri', '')
                                })
        
        print(f"[SEARCH] Found answer with {len(citations)} citations")
        if citations:
            print(f"[SEARCH] Sample citation: {citations[0]['source']}")
        
        return jsonify({
            'success': True,
            'query': query,
            'answer': answer,
            'citations': citations,
            'store_name': DATA_STORE
        }), 200, headers
        
    except Exception as e:
        print(f"[SEARCH ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Search failed: {str(e)}'
        }), 500, headers


def handle_list(request, headers):
    """List all documents in the File Search store using REST API with pagination."""
    try:
        print(f"[LIST] Listing documents in {DATA_STORE}")
        
        # Get the store resource name
        store_name = get_store_name()
        print(f"[LIST] Store name: {store_name}")
        
        # Use REST API directly as workaround for SDK issue
        # SDK has a bug where parent parameter isn't passed correctly to _list()
        api_key = os.getenv("GEMINI_API_KEY")
        base_url = f"https://generativelanguage.googleapis.com/v1beta/{store_name}/documents"
        
        # Collect all documents across pages
        all_documents = []
        page_token = None
        page_count = 0
        
        while True:
            page_count += 1
            # Build URL with pagination parameters
            url = base_url
            params = {'pageSize': 20}  # Max page size allowed by API
            if page_token:
                params['pageToken'] = page_token
            
            print(f"[LIST] Fetching page {page_count} from REST API")
            response = requests.get(
                url,
                headers={"X-Goog-Api-Key": api_key},
                params=params,
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"[LIST ERROR] API returned status {response.status_code}: {response.text}")
                return jsonify({
                    'success': False,
                    'error': f'API error: {response.status_code} - {response.text}'
                }), 500, headers
            
            data = response.json()
            
            # Parse documents from current page
            page_documents = data.get('documents', [])
            print(f"[LIST] Page {page_count}: Found {len(page_documents)} documents")
            
            for doc in page_documents:
                all_documents.append({
                    'name': doc.get('name', ''),
                    'display_name': doc.get('displayName', ''),
                    'create_time': doc.get('createTime', ''),
                    'update_time': doc.get('updateTime', ''),
                    'state': doc.get('state', ''),
                    'size_bytes': int(doc.get('sizeBytes', 0)),
                    'mime_type': doc.get('mimeType', '')
                })
            
            # Check if there are more pages
            page_token = data.get('nextPageToken')
            if not page_token:
                print(f"[LIST] No more pages, stopping pagination")
                break
            
            print(f"[LIST] More pages available, continuing...")
        
        print(f"[LIST] Total: Found {len(all_documents)} documents across {page_count} page(s) in {DATA_STORE}")
        
        return jsonify({
            'success': True,
            'store_name': DATA_STORE,
            'documents': all_documents,
            'count': len(all_documents),
            'pages_fetched': page_count
        }), 200, headers
        
    except Exception as e:
        print(f"[LIST ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'List failed: {str(e)}'
        }), 500, headers


def handle_delete(request, headers):
    """Delete a document from the File Search store."""
    try:
        data = request.get_json()
        document_name = data.get('document_name')
        
        if not document_name:
            return jsonify({
                'success': False,
                'error': 'Missing required parameter: document_name'
            }), 400, headers
        
        print(f"[DELETE] Deleting document: {document_name}")
        
        # Delete the document
        client.file_search_stores.documents.delete(name=document_name)
        
        print(f"[DELETE] Successfully deleted {document_name}")
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted document',
            'document_name': document_name
        }), 200, headers
        
    except Exception as e:
        print(f"[DELETE ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Delete failed: {str(e)}'
        }), 500, headers
