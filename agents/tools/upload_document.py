"""
Tool for uploading documents to Cloud Storage and adding them to RAG corpus.
"""

from google.cloud import storage
from google.adk.tools.tool_context import ToolContext
from .add_data import add_data


def upload_document(
    gcs_path: str,
    corpus_name: str,
    tool_context: ToolContext,
) -> dict:
    """
    Add a document from Cloud Storage to the specified RAG corpus.
    This tool is used after a file has been uploaded to gs://graph-rag-bucket/data/
    
    Args:
        gcs_path (str): The GCS path of the uploaded file (e.g., "gs://graph-rag-bucket/data/document.pdf")
        corpus_name (str): The name of the corpus to add the document to (default: "data_v1")
        tool_context (ToolContext): The tool context for state management
    
    Returns:
        dict: Information about the corpus addition status
    """
    try:
        # Add the uploaded file to the RAG corpus using existing add_data tool
        add_result = add_data(
            corpus_name=corpus_name,
            paths=[gcs_path],
            tool_context=tool_context
        )
        
        if add_result.get("status") == "success":
            return {
                "status": "success",
                "message": f"Successfully added document to {corpus_name}",
                "gcs_path": gcs_path,
                "corpus_name": corpus_name,
                "files_added": add_result.get("files_added", 1)
            }
        else:
            return {
                "status": "error",
                "message": f"Failed to add document to corpus: {add_result.get('message')}",
                "gcs_path": gcs_path,
                "corpus_name": corpus_name,
                "error": add_result.get("message")
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error adding document to corpus: {str(e)}",
            "gcs_path": gcs_path,
            "corpus_name": corpus_name
        }
