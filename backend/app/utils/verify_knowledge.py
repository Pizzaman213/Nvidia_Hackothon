"""
Verify Knowledge Base Content
Check stats and sample content from the RAG knowledge base
"""
import asyncio
from app.services.rag_service import rag_service
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


async def verify_knowledge_base():
    """Verify and display knowledge base statistics"""
    print("\n" + "="*60)
    print("KNOWLEDGE BASE VERIFICATION")
    print("="*60 + "\n")

    # Get statistics
    stats = await rag_service.get_collection_stats()
    print(f"Total Documents: {stats['total_documents']}")
    print(f"Embedding Model: {stats['embedding_model']}")
    print(f"Collection Name: {stats['collection_name']}")
    print(f"Source Types: {', '.join(stats['source_types'])}\n")

    # Test retrieval with sample queries
    sample_queries = [
        "How do I help my child with homework?",
        "What are safe toys for young children?",
        "How can I improve my child's nutrition?",
        "What should I do if my child is being bullied?",
        "How much sleep does my child need?",
    ]

    print("="*60)
    print("SAMPLE RETRIEVAL TESTS")
    print("="*60 + "\n")

    for query in sample_queries:
        print(f"\nQuery: '{query}'")
        print("-" * 60)

        results = await rag_service.retrieve_relevant_context(query, n_results=2)

        if results:
            for i, result in enumerate(results, 1):
                print(f"\n  Result {i}:")
                print(f"  Source: {result['metadata'].get('source_title', 'Unknown')}")
                print(f"  Topic: {result['metadata'].get('topic', 'N/A')}")
                print(f"  Similarity: {result['similarity_score']:.1f}%")
                print(f"  Preview: {result['text'][:150]}...")
        else:
            print("  No results found")

    print("\n" + "="*60)
    print("VERIFICATION COMPLETE")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(verify_knowledge_base())
