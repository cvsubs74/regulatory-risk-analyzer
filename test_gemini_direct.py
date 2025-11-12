#!/usr/bin/env python3
"""
Direct test of Gemini File Search API to see actual response structure.
"""
import os
import json
from pathlib import Path
from google import genai
from google.genai import types

# Load environment variables from agents/.env
env_file = Path(__file__).parent / 'agents' / '.env'
if env_file.exists():
    print(f"Loading environment from: {env_file}")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

# Check API key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ GEMINI_API_KEY not set!")
    print("Please set it in agents/.env file")
    exit(1)

print(f"✅ API key found: {api_key[:10]}...")

# Initialize client
print("Initializing Gemini client...")
client = genai.Client(
    api_key=api_key,
    http_options={'api_version': 'v1alpha'}
)

DATA_STORE = os.getenv("DATA_STORE", "data_v1")

# Check what's available on client
print("\nClient attributes:")
print([x for x in dir(client) if not x.startswith('_')])

# Try to access file search stores
print(f"\nTrying to find store: {DATA_STORE}")
try:
    # Try different ways to access file search
    if hasattr(client, 'file_search_stores'):
        print("✅ client.file_search_stores exists")
        for store in client.file_search_stores.list():
            print(f"  Store: {getattr(store, 'display_name', 'Unknown')}")
    elif hasattr(client, 'files'):
        print("✅ client.files exists")
        print(f"  Files attributes: {[x for x in dir(client.files) if not x.startswith('_')]}")
    else:
        print("❌ No file search API found on client")
        print("Available attributes:", [x for x in dir(client) if not x.startswith('_')])
except Exception as e:
    print(f"❌ Error accessing stores: {e}")
    import traceback
    traceback.print_exc()

# For now, use a hardcoded store name for testing
# You'll need to replace this with your actual store resource name
store_name = f"fileSearchStores/{DATA_STORE}"
print(f"\nUsing store name: {store_name}")

# Check what's in types
print("\nChecking types module:")
print([x for x in dir(types) if not x.startswith('_') and 'File' in x or 'Search' in x or 'Tool' in x])

# Perform search - try without File Search first to see basic response
query = "What are the core entity types?"
print(f"\n{'='*80}")
print(f"QUERY: {query}")
print(f"{'='*80}\n")

try:
    print("Attempting search with File Search tool...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
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
except AttributeError as e:
    print(f"❌ FileSearch not available: {e}")
    print("\nTrying basic search without File Search tool...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=query
    )

print("RESPONSE RECEIVED\n")

# Print answer
print(f"{'='*80}")
print("ANSWER:")
print(f"{'='*80}")
if hasattr(response, 'text'):
    print(response.text)
else:
    print("No text attribute")

# Explore response structure
print(f"\n{'='*80}")
print("RESPONSE STRUCTURE:")
print(f"{'='*80}")
print(f"Type: {type(response)}")
print(f"Attributes: {[x for x in dir(response) if not x.startswith('_')]}\n")

# Check candidates
if hasattr(response, 'candidates'):
    print(f"✅ candidates: {len(response.candidates)} candidate(s)")
    
    for i, candidate in enumerate(response.candidates):
        print(f"\n  Candidate {i}:")
        print(f"    Attributes: {[x for x in dir(candidate) if not x.startswith('_')]}")
        
        # Check grounding_metadata
        if hasattr(candidate, 'grounding_metadata'):
            print(f"    ✅ grounding_metadata exists")
            metadata = candidate.grounding_metadata
            print(f"       Attributes: {[x for x in dir(metadata) if not x.startswith('_')]}")
            
            # Check grounding_chunks
            if hasattr(metadata, 'grounding_chunks'):
                chunks = metadata.grounding_chunks
                print(f"       ✅ grounding_chunks: {len(chunks)} chunk(s)")
                
                for j, chunk in enumerate(chunks):
                    print(f"\n       Chunk {j}:")
                    chunk_attrs = [x for x in dir(chunk) if not x.startswith('_')]
                    print(f"         Attributes: {chunk_attrs}")
                    
                    # Print all available attributes
                    for attr in chunk_attrs:
                        try:
                            value = getattr(chunk, attr)
                            if value and not callable(value):
                                value_str = str(value)[:100]
                                print(f"         - {attr}: {value_str}...")
                        except:
                            pass
                    
                    # Special check for retrieved_context
                    if hasattr(chunk, 'retrieved_context'):
                        print(f"\n         ✅ retrieved_context exists:")
                        ctx = chunk.retrieved_context
                        ctx_attrs = [x for x in dir(ctx) if not x.startswith('_')]
                        print(f"            Attributes: {ctx_attrs}")
                        
                        for attr in ctx_attrs:
                            try:
                                value = getattr(ctx, attr)
                                if value and not callable(value):
                                    value_str = str(value)[:100]
                                    print(f"            - {attr}: {value_str}...")
                            except:
                                pass

print(f"\n{'='*80}")
print("CITATION EXTRACTION TEST:")
print(f"{'='*80}\n")

# Test different extraction methods
citations = []

if hasattr(response, 'candidates') and response.candidates:
    for candidate in response.candidates:
        if hasattr(candidate, 'grounding_metadata'):
            metadata = candidate.grounding_metadata
            if hasattr(metadata, 'grounding_chunks'):
                for chunk in metadata.grounding_chunks:
                    citation = {}
                    
                    # Method 1: retrieved_context
                    if hasattr(chunk, 'retrieved_context'):
                        ctx = chunk.retrieved_context
                        citation['method'] = 'retrieved_context'
                        citation['source'] = getattr(ctx, 'title', getattr(ctx, 'uri', 'Unknown'))
                        citation['content'] = getattr(ctx, 'text', '')[:100]
                        citations.append(citation)
                        continue
                    
                    # Method 2: web
                    if hasattr(chunk, 'web'):
                        web = chunk.web
                        citation['method'] = 'web'
                        citation['source'] = getattr(web, 'title', getattr(web, 'uri', 'Unknown'))
                        citation['content'] = getattr(web, 'uri', '')
                        citations.append(citation)
                        continue
                    
                    # Method 3: direct attributes
                    citation['method'] = 'direct'
                    citation['source'] = getattr(chunk, 'source', 'Unknown')
                    citation['content'] = getattr(chunk, 'content', '')[:100]
                    citations.append(citation)

print(f"Found {len(citations)} citations:\n")
for i, cit in enumerate(citations):
    print(f"{i+1}. Method: {cit['method']}")
    print(f"   Source: {cit['source']}")
    print(f"   Content: {cit['content']}")
    print()

print(f"{'='*80}")
print("DONE")
print(f"{'='*80}")
