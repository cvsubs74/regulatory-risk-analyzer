"""
Gemini File Search Tools - Manage File Search stores and documents.

Based on: https://ai.google.dev/gemini-api/docs/file-search
"""
import os
import re
import time
import base64
from typing import Optional, Dict, Any, List
from google import genai
from google.genai import types
from .tool_logger import log_tool_call


# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Get the data store name from environment variable
DATA_STORE = os.getenv("DATA_STORE", "data_v1")


@log_tool_call
def create_file_search_store(display_name: str, description: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a new File Search store for organizing documents.
    
    Args:
        display_name: Human-readable name for the store
        description: Optional description of the store's purpose
        
    Returns:
        Dictionary with store information including name and ID
        
    Example:
        create_file_search_store(
            display_name="Regulatory Documents",
            description="Store for GDPR, CCPA, and other regulatory texts"
        )
    """
    try:
        config = {'display_name': display_name}
        if description:
            config['description'] = description
            
        file_search_store = client.file_search_stores.create(config=config)
        
        return {
            "success": True,
            "store_name": file_search_store.name,
            "display_name": display_name,
            "message": f"✅ Created File Search store: {display_name}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ Failed to create File Search store: {str(e)}"
        }


@log_tool_call
def list_file_search_stores() -> Dict[str, Any]:
    """
    List all File Search stores in the account.
    
    Returns:
        Dictionary with list of stores and their metadata
        
    Example:
        list_file_search_stores()
    """
    try:
        stores = []
        for store in client.file_search_stores.list():
            stores.append({
                "name": store.name,
                "display_name": getattr(store, 'display_name', 'Unnamed'),
                "create_time": getattr(store, 'create_time', None),
            })
        
        return {
            "success": True,
            "stores": stores,
            "count": len(stores),
            "message": f"✅ Found {len(stores)} File Search store(s)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "stores": [],
            "message": f"❌ Failed to list File Search stores: {str(e)}"
        }


@log_tool_call
def get_file_search_store(store_name: str) -> Dict[str, Any]:
    """
    Get details about a specific File Search store.
    
    Args:
        store_name: The name/ID of the File Search store
        
    Returns:
        Dictionary with store details
        
    Example:
        get_file_search_store("fileSearchStores/abc123")
    """
    try:
        store = client.file_search_stores.get(name=store_name)
        
        return {
            "success": True,
            "store": {
                "name": store.name,
                "display_name": getattr(store, 'display_name', 'Unnamed'),
                "create_time": getattr(store, 'create_time', None),
            },
            "message": f"✅ Retrieved File Search store details"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ Failed to get File Search store: {str(e)}"
        }


@log_tool_call
def delete_file_search_store(store_name: str, confirm: bool = False) -> Dict[str, Any]:
    """
    Delete a File Search store and all its documents.
    
    Args:
        store_name: The name/ID of the File Search store to delete
        confirm: Must be True to actually delete (safety check)
        
    Returns:
        Dictionary with deletion status
        
    Example:
        delete_file_search_store("fileSearchStores/abc123", confirm=True)
    """
    if not confirm:
        return {
            "success": False,
            "message": "⚠️ Deletion not confirmed. Set confirm=True to delete the store."
        }
    
    try:
        client.file_search_stores.delete(name=store_name)
        
        return {
            "success": True,
            "message": f"✅ Deleted File Search store: {store_name}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ Failed to delete File Search store: {str(e)}"
        }


@log_tool_call
def upload_to_file_search_store(
    file_path: str,
    display_name: Optional[str] = None,
    wait_for_completion: bool = True
) -> Dict[str, Any]:
    """
    Upload a file directly to the DATA_STORE File Search store.
    
    This function uploads a file from the local filesystem and imports it into
    the File Search store for semantic search. The file is chunked, embedded,
    and indexed automatically. Uses the DATA_STORE environment variable.
    
    Args:
        file_path: Path to the file to upload
        display_name: Optional display name for the file (used in citations)
        wait_for_completion: Whether to wait for import to complete (default: True)
        
    Returns:
        Dictionary with upload status and operation details
        
    Example:
        upload_to_file_search_store(
            file_path="/tmp/document.pdf",
            display_name="GDPR Regulation Text"
        )
    """
    try:
        config = {}
        if display_name:
            config['display_name'] = display_name
        
        # Get store name from environment
        store_name = DATA_STORE
        
        # Upload and import the file
        operation = client.file_search_stores.upload_to_file_search_store(
            file=file_path,
            file_search_store_name=store_name,
            config=config if config else None
        )
        
        # Wait for import to complete if requested
        if wait_for_completion:
            while not operation.done:
                time.sleep(2)
                operation = client.operations.get(operation)
        
        return {
            "success": True,
            "operation_name": operation.name,
            "operation_done": operation.done,
            "file_path": file_path,
            "store_name": store_name,
            "message": f"✅ {'Uploaded and indexed' if operation.done else 'Upload started for'} {display_name or file_path}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ Failed to upload file: {str(e)}"
        }


@log_tool_call
def upload_base64_to_file_search_store(
    filename: str,
    mime_type: Optional[str] = None,
    file_data: Optional[str] = None,
    display_name: Optional[str] = None,
    wait_for_completion: bool = True
) -> Dict[str, Any]:
    """
    Upload a base64-encoded file to the DATA_STORE File Search store.
    
    This function handles base64 file data (e.g., from web uploads), saves it
    temporarily, uploads to File Search store, then cleans up. Uses the DATA_STORE
    environment variable.
    
    NOTE: When called from an agent with inline_data in the request, the file_data
    parameter can be omitted - the function will extract it from the inline_data context.
    
    Args:
        filename: Original filename (REQUIRED)
        mime_type: MIME type of the file (will be inferred from filename if not provided)
        file_data: Base64-encoded file content (optional if inline_data is present in context)
        display_name: Optional display name for the file
        wait_for_completion: Whether to wait for import to complete
        
    Returns:
        Dictionary with upload status
        
    Example:
        upload_base64_to_file_search_store(
            filename="contract.pdf",
            mime_type="application/pdf",
            file_data="JVBERi0xLjQK..."
        )
    """
    import tempfile
    import inspect
    
    try:
        # If file_data not provided, try to get it from inline_data in the calling context
        if not file_data:
            # Try to access inline_data from the agent context
            # This is a workaround for ADK's inline_data handling
            frame = inspect.currentframe()
            if frame and frame.f_back:
                caller_locals = frame.f_back.f_locals
                if 'inline_data' in caller_locals:
                    inline_data = caller_locals['inline_data']
                    if hasattr(inline_data, 'data'):
                        file_data = inline_data.data
                        if not mime_type and hasattr(inline_data, 'mime_type'):
                            mime_type = inline_data.mime_type
                        print(f"[upload_base64] Extracted file_data from inline_data context")
        
        if not file_data:
            return {
                "success": False,
                "error": "No file data provided",
                "message": "❌ No file data provided. Please ensure the file is attached to the request."
            }
        
        # Infer mime_type from filename if not provided
        if not mime_type or mime_type.strip() == "":
            ext = filename.lower().split('.')[-1] if '.' in filename else ''
            mime_type_map = {
                'txt': 'text/plain',
                'pdf': 'application/pdf',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'md': 'text/markdown',
                'json': 'application/json',
                'csv': 'text/csv',
                'xml': 'application/xml',
                'html': 'text/html',
                'htm': 'text/html'
            }
            mime_type = mime_type_map.get(ext, 'application/octet-stream')
            print(f"[upload_base64] Inferred mime_type '{mime_type}' from filename '{filename}'")
        else:
            print(f"[upload_base64] Using provided mime_type: '{mime_type}'")
        
        # Clean the base64 string - remove any whitespace or newlines
        file_data_clean = file_data.strip().replace('\n', '').replace('\r', '').replace(' ', '')
        
        # Decode base64 data
        try:
            file_bytes = base64.b64decode(file_data_clean)
        except Exception as decode_error:
            # Try adding padding if needed
            padding = 4 - (len(file_data_clean) % 4)
            if padding != 4:
                file_data_clean += '=' * padding
            file_bytes = base64.b64decode(file_data_clean)
        
        # Create temporary file with binary mode
        # Use only ASCII-safe filename for temp file suffix
        safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{safe_filename}", mode='wb') as tmp_file:
            tmp_file.write(file_bytes)
            tmp_path = tmp_file.name
        
        try:
            # Upload to File Search store (uses DATA_STORE env var)
            result = upload_to_file_search_store(
                file_path=tmp_path,
                display_name=display_name or filename,
                wait_for_completion=wait_for_completion
            )
            
            return result
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ Failed to process and upload file: {str(e)}. Error details: {type(e).__name__}"
        }


@log_tool_call
def search_file_search_store(
    query: str,
    model: str = "gemini-2.5-flash"
) -> Dict[str, Any]:
    """
    Search the DATA_STORE File Search store using semantic search.
    
    This function queries the File Search store and returns relevant information
    with citations from the indexed documents. Uses the DATA_STORE environment variable.
    
    Args:
        query: The search query
        model: Gemini model to use (default: gemini-2.5-flash)
        
    Returns:
        Dictionary with search results and citations
        
    Example:
        search_file_search_store(
            query="What are the data retention requirements under GDPR?"
        )
    """
    try:
        # Get store name from environment
        store_name = DATA_STORE
        
        response = client.models.generate_content(
            model=model,
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
        
        # Extract citations if available
        citations = []
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata'):
                grounding = candidate.grounding_metadata
                if hasattr(grounding, 'grounding_chunks'):
                    for chunk in grounding.grounding_chunks:
                        if hasattr(chunk, 'retrieved_context'):
                            citations.append({
                                "title": getattr(chunk.retrieved_context, 'title', 'Unknown'),
                                "uri": getattr(chunk.retrieved_context, 'uri', None)
                            })
        
        return {
            "success": True,
            "answer": response.text,
            "citations": citations,
            "message": "✅ Search completed successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ Search failed: {str(e)}"
        }
