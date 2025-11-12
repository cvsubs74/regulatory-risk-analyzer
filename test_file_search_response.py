"""
Test script to understand File Search API response structure.
Run this to see how citations are actually returned.
"""
import os
from google import genai
from google.genai import types

# Initialize client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options={'api_version': 'v1alpha'}
)

DATA_STORE = os.getenv("DATA_STORE", "data_v1")

def get_store_name():
    """Get the resource name of the File Search store."""
    for store in client.file_search_stores.list():
        if getattr(store, 'display_name', '') == DATA_STORE:
            print(f"[STORE] Found store {DATA_STORE}: {store.name}")
            return store.name
    raise Exception(f"Store {DATA_STORE} not found")

# Test search
store_name = get_store_name()
print(f"\n[TEST] Searching store: {store_name}\n")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="What are the core entity types?",
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

print("=" * 80)
print("FULL RESPONSE STRUCTURE")
print("=" * 80)
print(f"Response type: {type(response)}")
print(f"Response dir: {[x for x in dir(response) if not x.startswith('_')]}")
print()

# Check text
if hasattr(response, 'text'):
    print(f"✅ response.text exists: {response.text[:200]}...")
print()

# Check candidates
if hasattr(response, 'candidates'):
    print(f"✅ response.candidates exists: {len(response.candidates)} candidate(s)")
    for i, candidate in enumerate(response.candidates):
        print(f"\n  Candidate {i}:")
        print(f"    Type: {type(candidate)}")
        print(f"    Dir: {[x for x in dir(candidate) if not x.startswith('_')]}")
        
        # Check grounding_metadata
        if hasattr(candidate, 'grounding_metadata'):
            print(f"    ✅ grounding_metadata exists")
            metadata = candidate.grounding_metadata
            print(f"       Type: {type(metadata)}")
            print(f"       Dir: {[x for x in dir(metadata) if not x.startswith('_')]}")
            
            # Check grounding_chunks
            if hasattr(metadata, 'grounding_chunks'):
                print(f"       ✅ grounding_chunks exists: {len(metadata.grounding_chunks)} chunk(s)")
                for j, chunk in enumerate(metadata.grounding_chunks):
                    print(f"\n         Chunk {j}:")
                    print(f"           Type: {type(chunk)}")
                    print(f"           Dir: {[x for x in dir(chunk) if not x.startswith('_')]}")
                    
                    # Try to access different attributes
                    for attr in ['source', 'content', 'uri', 'title', 'text', 'retrieved_context']:
                        if hasattr(chunk, attr):
                            value = getattr(chunk, attr)
                            print(f"           ✅ {attr}: {str(value)[:100]}...")
                    
                    # If retrieved_context exists, explore it
                    if hasattr(chunk, 'retrieved_context'):
                        ctx = chunk.retrieved_context
                        print(f"\n           Retrieved Context:")
                        print(f"             Type: {type(ctx)}")
                        print(f"             Dir: {[x for x in dir(ctx) if not x.startswith('_')]}")
                        for attr in ['uri', 'title', 'text', 'source']:
                            if hasattr(ctx, attr):
                                value = getattr(ctx, attr)
                                print(f"             ✅ {attr}: {str(value)[:100]}...")
            else:
                print(f"       ❌ No grounding_chunks")
        else:
            print(f"    ❌ No grounding_metadata")
else:
    print("❌ No candidates")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

# Try to extract citations with different approaches
print("\nApproach 1: Using 'source' and 'content'")
citations1 = []
if hasattr(response, 'candidates') and response.candidates:
    for candidate in response.candidates:
        if hasattr(candidate, 'grounding_metadata'):
            metadata = candidate.grounding_metadata
            if hasattr(metadata, 'grounding_chunks'):
                for chunk in metadata.grounding_chunks:
                    citations1.append({
                        "source": getattr(chunk, 'source', 'Unknown'),
                        "content": getattr(chunk, 'content', '')
                    })
print(f"Citations found: {len(citations1)}")
for i, cit in enumerate(citations1):
    print(f"  {i+1}. Source: {cit['source']}, Content: {cit['content'][:50]}...")

print("\nApproach 2: Using 'retrieved_context'")
citations2 = []
if hasattr(response, 'candidates') and response.candidates:
    for candidate in response.candidates:
        if hasattr(candidate, 'grounding_metadata'):
            metadata = candidate.grounding_metadata
            if hasattr(metadata, 'grounding_chunks'):
                for chunk in metadata.grounding_chunks:
                    if hasattr(chunk, 'retrieved_context'):
                        ctx = chunk.retrieved_context
                        citations2.append({
                            "source": getattr(ctx, 'title', getattr(ctx, 'uri', 'Unknown')),
                            "content": getattr(ctx, 'text', '')[:200]
                        })
print(f"Citations found: {len(citations2)}")
for i, cit in enumerate(citations2):
    print(f"  {i+1}. Source: {cit['source']}, Content: {cit['content'][:50]}...")

print("\n" + "=" * 80)
