"""
Tool for listing all documents in a Vertex AI RAG corpus.
"""

from typing import Dict, List, Union

from vertexai import rag
from google.adk.tools.tool_context import ToolContext
from .utils import get_corpus_resource_name


def list_documents(
    corpus_name: str,
    tool_context: ToolContext,
) -> dict:
    """
    List all documents in a Vertex AI RAG corpus.

    Args:
        corpus_name (str): The name of the corpus to list documents from
        tool_context (ToolContext): The tool context

    Returns:
        dict: A list of documents in the corpus with their metadata
    """
    try:
        # Get the corpus resource name
        corpus_resource_name = get_corpus_resource_name(corpus_name)

        # List all files in the corpus
        files = rag.list_files(corpus_name=corpus_resource_name)

        # Process file information into a more usable format
        documents: List[Dict[str, Union[str, int]]] = []
        for file in files:
            doc_data: Dict[str, Union[str, int]] = {
                "name": file.name,  # Full resource name
                "display_name": (
                    file.display_name if hasattr(file, "display_name") else ""
                ),
                "create_time": (
                    str(file.create_time) if hasattr(file, "create_time") else ""
                ),
                "update_time": (
                    str(file.update_time) if hasattr(file, "update_time") else ""
                ),
                "size_bytes": (
                    file.size_bytes if hasattr(file, "size_bytes") else 0
                ),
            }

            documents.append(doc_data)

        return {
            "status": "success",
            "message": f"Found {len(documents)} documents in corpus '{corpus_name}'",
            "corpus_name": corpus_name,
            "documents": documents,
            "document_count": len(documents),
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error listing documents: {str(e)}",
            "corpus_name": corpus_name,
            "documents": [],
            "document_count": 0,
        }
