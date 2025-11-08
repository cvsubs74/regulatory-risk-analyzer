"""
Tool for saving uploaded files to Google Cloud Storage.
"""

import base64
import os
from google.cloud import storage
from google.adk.tools import ToolContext
from .tool_logger import log_tool_call


@log_tool_call
def save_file_to_gcs(
    file_data: str,
    filename: str,
    mime_type: str = "application/octet-stream",
    tool_context: ToolContext = None,
) -> dict:
    """
    Save a base64-encoded file to Google Cloud Storage.
    
    This tool is used when a user uploads a document through the UI. The file is provided
    as base64-encoded data and needs to be saved to gs://graph-rag-bucket/data/[filename].
    
    Args:
        file_data (str): Base64-encoded file content
        filename (str): Name of the file to save
        mime_type (str): MIME type of the file (e.g., "application/pdf", "text/plain")
        tool_context (ToolContext): The tool context for state management
    
    Returns:
        dict: Information about the saved file including GCS path
    
    Example:
        >>> result = save_file_to_gcs(
        ...     file_data="base64_encoded_content...",
        ...     filename="document.pdf",
        ...     mime_type="application/pdf"
        ... )
        >>> print(result)
        {
            "status": "success",
            "message": "File saved to Cloud Storage",
            "gcs_path": "gs://graph-rag-bucket/data/document.pdf",
            "filename": "document.pdf",
            "size_bytes": 12345
        }
    """
    print(f"[SAVE_FILE] Tool called with filename={filename}, mime_type={mime_type}")
    print(f"[SAVE_FILE] file_data length: {len(file_data) if file_data else 0} characters")
    print(f"[SAVE_FILE] file_data type: {type(file_data)}")
    
    try:
        # Decode base64 file data
        try:
            file_bytes = base64.b64decode(file_data)
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to decode file data: {str(e)}",
                "filename": filename
            }
        
        # Initialize Cloud Storage client
        storage_client = storage.Client()
        bucket_name = "graph-rag-bucket"
        bucket = storage_client.bucket(bucket_name)
        
        # Create blob path: data/{filename}
        blob_path = f"data/{filename}"
        blob = bucket.blob(blob_path)
        
        # Upload file to Cloud Storage
        blob.upload_from_string(file_bytes, content_type=mime_type)
        
        # Get the GCS path
        gcs_path = f"gs://{bucket_name}/{blob_path}"
        
        print(f"[SAVE_FILE] Successfully saved {filename} to {gcs_path} ({len(file_bytes)} bytes)")
        
        return {
            "status": "success",
            "message": f"Successfully saved '{filename}' to Cloud Storage",
            "gcs_path": gcs_path,
            "filename": filename,
            "size_bytes": len(file_bytes),
            "mime_type": mime_type
        }
        
    except Exception as e:
        print(f"[SAVE_FILE] Error saving file: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Error saving file to Cloud Storage: {str(e)}",
            "filename": filename
        }
