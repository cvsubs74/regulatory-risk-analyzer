"""
Test script to verify the correct API usage for listing documents
"""
import os
from google import genai

# Initialize client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
DATA_STORE = "data_v1"

def get_store_name():
    """Get the resource name of the File Search store."""
    for store in client.file_search_stores.list():
        if getattr(store, 'display_name', '') == DATA_STORE:
            print(f"Found store: {store.name}")
            return store.name
    return None

def test_list_documents():
    """Test listing documents with different parameter names."""
    store_name = get_store_name()
    if not store_name:
        print("Store not found!")
        return
    
    print(f"\nStore name: {store_name}")
    print("\nTesting document listing...")
    
    try:
        # Try with parent parameter
        print("\n1. Trying with parent parameter:")
        count = 0
        for doc in client.file_search_stores.documents.list(parent=store_name):
            count += 1
            print(f"  - {getattr(doc, 'display_name', 'Untitled')} ({doc.name})")
            if count >= 3:  # Show first 3
                break
        print(f"  Total documents found: {count}")
    except Exception as e:
        print(f"  Error with parent: {e}")
    
    try:
        # Try without any parameter (if it's a method on the store)
        print("\n2. Trying without parameter:")
        count = 0
        for doc in client.file_search_stores.documents.list():
            count += 1
            print(f"  - {getattr(doc, 'display_name', 'Untitled')}")
            if count >= 3:
                break
        print(f"  Total documents found: {count}")
    except Exception as e:
        print(f"  Error without parameter: {e}")

if __name__ == "__main__":
    test_list_documents()
