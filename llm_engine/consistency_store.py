import chromadb
from chromadb.utils import embedding_functions

class ConsistencyStore:
    def __init__(self, persist_directory="./storage/chroma_db"):
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.embedding_fn = embedding_functions.OllamaEmbeddingFunction(
            url="http://127.0.0.1:11434/api/embeddings",
            model_name="nomic-embed-text"
        )
        self.collection = self.client.get_or_create_collection(
            name="phantomnet_context",
            embedding_function=self.embedding_fn
        )

    def save_context(self, session_id: str, text_chunk: str, metadata: dict):
        doc_id = f"{session_id}_{abs(hash(text_chunk))}"
        self.collection.upsert(
            documents=[text_chunk],
            metadatas=[{**metadata, "session_id": session_id}],
            ids=[doc_id]
        )

    def query_context(self, query_text: str, session_id: str, n_results=3):
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where={"session_id": session_id}
        )
        return results.get("documents", [[]])[0]
