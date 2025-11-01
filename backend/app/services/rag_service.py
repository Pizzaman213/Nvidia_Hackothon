"""
RAG (Retrieval-Augmented Generation) Service
Handles document retrieval from vector database for contextual responses
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional, Any
import os
from pathlib import Path
import json

from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class RAGService:
    """Service for managing document retrieval and embeddings"""

    def __init__(self):
        self.embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.embedding_model = None
        self.chroma_client = None
        self.collection = None
        self.data_dir = Path(__file__).parent.parent.parent / "data" / "knowledge_base"
        self.chroma_dir = Path(__file__).parent.parent.parent / "data" / "chroma_db"

        # Ensure directories exist
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.chroma_dir.mkdir(parents=True, exist_ok=True)

        self._initialize()

    def _initialize(self):
        """Initialize embedding model and vector database"""
        try:
            logger.info("Initializing RAG service...")

            # Load embedding model
            logger.info(f"Loading embedding model: {self.embedding_model_name}")
            self.embedding_model = SentenceTransformer(self.embedding_model_name)
            logger.info("Embedding model loaded successfully")

            # Initialize ChromaDB
            logger.info(f"Initializing ChromaDB at {self.chroma_dir}")
            self.chroma_client = chromadb.PersistentClient(
                path=str(self.chroma_dir),
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )

            # Get or create collection
            try:
                self.collection = self.chroma_client.get_or_create_collection(
                    name="child_care_knowledge",
                    metadata={
                        "description": "Public domain child care and safety information",
                        "sources": "CDC, CPSC, NIH"
                    }
                )
                logger.info(f"Collection ready with {self.collection.count()} documents")
            except Exception as e:
                logger.error(f"Failed to create collection: {e}")
                raise

        except Exception as e:
            logger.error(f"Failed to initialize RAG service: {e}", exc_info=True)
            raise

    async def add_document(
        self,
        text: str,
        metadata: Dict[str, Any],
        doc_id: Optional[str] = None
    ) -> str:
        """
        Add a document to the knowledge base

        Args:
            text: Document text content
            metadata: Metadata including source_type, source_title, source_url, etc.
            doc_id: Optional document ID (generated if not provided)

        Returns:
            Document ID
        """
        try:
            if doc_id is None:
                import uuid
                doc_id = str(uuid.uuid4())

            # Generate embedding
            embedding = self.embedding_model.encode(text).tolist()

            # Add to collection
            self.collection.add(
                embeddings=[embedding],
                documents=[text],
                metadatas=[metadata],
                ids=[doc_id]
            )

            logger.info(f"Added document {doc_id} to knowledge base")
            return doc_id

        except Exception as e:
            logger.error(f"Failed to add document: {e}", exc_info=True)
            raise

    async def add_documents_batch(
        self,
        texts: List[str],
        metadatas: List[Dict[str, Any]],
        doc_ids: Optional[List[str]] = None
    ) -> List[str]:
        """
        Add multiple documents in batch

        Args:
            texts: List of document texts
            metadatas: List of metadata dicts
            doc_ids: Optional list of document IDs

        Returns:
            List of document IDs
        """
        try:
            if doc_ids is None:
                import uuid
                doc_ids = [str(uuid.uuid4()) for _ in range(len(texts))]

            # Generate embeddings in batch
            logger.info(f"Generating embeddings for {len(texts)} documents...")
            embeddings = self.embedding_model.encode(texts).tolist()

            # Add to collection
            self.collection.add(
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                ids=doc_ids
            )

            logger.info(f"Added {len(doc_ids)} documents to knowledge base")
            return doc_ids

        except Exception as e:
            logger.error(f"Failed to add documents in batch: {e}", exc_info=True)
            raise

    async def retrieve_relevant_context(
        self,
        query: str,
        n_results: int = 3,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents for a query

        Args:
            query: User query or message
            n_results: Number of results to return
            filter_metadata: Optional metadata filters (e.g., {"source_type": "cdc"})

        Returns:
            List of relevant documents with metadata
        """
        try:
            if self.collection.count() == 0:
                logger.warning("Knowledge base is empty, no context to retrieve")
                return []

            # Generate query embedding
            query_embedding = self.embedding_model.encode(query).tolist()

            # Query collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(n_results, self.collection.count()),
                where=filter_metadata,
                include=["documents", "metadatas", "distances"]
            )

            # Format results
            relevant_docs = []
            if results and results['documents'] and len(results['documents']) > 0:
                for i, (doc, metadata, distance) in enumerate(zip(
                    results['documents'][0],
                    results['metadatas'][0],
                    results['distances'][0]
                )):
                    # Convert distance to similarity score (0-100)
                    similarity = max(0, min(100, int((1 - distance) * 100)))

                    relevant_docs.append({
                        'text': doc,
                        'metadata': metadata,
                        'similarity_score': similarity,
                        'rank': i + 1
                    })

            logger.info(f"Retrieved {len(relevant_docs)} relevant documents for query")
            return relevant_docs

        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}", exc_info=True)
            return []

    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge base"""
        try:
            count = self.collection.count()

            # Get sample metadata to understand sources
            if count > 0:
                sample = self.collection.get(limit=min(10, count), include=["metadatas"])
                source_types = set()
                for metadata in sample['metadatas']:
                    if 'source_type' in metadata:
                        source_types.add(metadata['source_type'])
            else:
                source_types = set()

            return {
                'total_documents': count,
                'source_types': list(source_types),
                'embedding_model': self.embedding_model_name,
                'collection_name': self.collection.name
            }
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {'total_documents': 0, 'source_types': [], 'error': str(e)}

    def reset_collection(self):
        """Reset the collection (use with caution!)"""
        try:
            logger.warning("Resetting knowledge base collection...")
            self.chroma_client.delete_collection(name="child_care_knowledge")
            self.collection = self.chroma_client.create_collection(
                name="child_care_knowledge",
                metadata={
                    "description": "Public domain child care and safety information",
                    "sources": "CDC, CPSC, NIH"
                }
            )
            logger.info("Collection reset successfully")
        except Exception as e:
            logger.error(f"Failed to reset collection: {e}")
            raise


# Global RAG service instance
rag_service = RAGService()


# Predefined knowledge base sources (public domain)
KNOWLEDGE_SOURCES = {
    "cdc_child_care": {
        "source_type": "cdc",
        "source_title": "CDC - Caring for Children",
        "source_url": "https://www.cdc.gov/parents/essentials/index.html",
        "license_type": "public_domain",
        "is_public_domain": True
    },
    "cdc_safety": {
        "source_type": "cdc",
        "source_title": "CDC - Child Safety and Injury Prevention",
        "source_url": "https://www.cdc.gov/parents/infants/safety.html",
        "license_type": "public_domain",
        "is_public_domain": True
    },
    "cpsc_safety": {
        "source_type": "cpsc",
        "source_title": "CPSC - Child Product Safety",
        "source_url": "https://www.cpsc.gov",
        "license_type": "public_domain",
        "is_public_domain": True
    },
    "nih_health": {
        "source_type": "nih",
        "source_title": "NIH - Children's Health",
        "source_url": "https://www.nichd.nih.gov/health/topics/children",
        "license_type": "public_domain",
        "is_public_domain": True
    }
}