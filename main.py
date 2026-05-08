import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from sentence_transformers import SentenceTransformer
import psycopg2
from pgvector.psycopg2 import register_vector
from dotenv import load_dotenv

# 1. Load environment variables from .env file
load_dotenv()

# 2. Initialize Gemini Client (Using the 2026 SDK standard)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 3. Initialize Local Embedding Model (384-dimensions)
print("⏳ Loading local embedding model (all-MiniLM-L6-v2)...")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Model Ready.")

# 4. Setup FastAPI
app = FastAPI(title="Kyro RAG Engine")

# Enable CORS so any frontend UI can safely talk to this backend
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

def get_db_connection():
    """Establishes a connection to Supabase via the IPv4 Pooler."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL is missing from the .env file!")
        
    conn = psycopg2.connect(db_url)
    register_vector(conn) # Tells psycopg2 how to handle the pgvector array
    return conn

@app.get("/")
def health_check():
    """Simple endpoint to verify the server is running."""
    return {"status": "Kyro Backend is online and ready."}

@app.get("/ask")
async def ask_kyro(query: str, state: str = "National"):
    """
    Main RAG Endpoint:
    1. Converts query to vector locally.
    2. Searches Supabase for similar policy chunks.
    3. Sends context to Gemini 2.0 Flash.
    """
    conn = None
    cur = None
    
    try:
        # STEP A: Vectorize the user's query locally
        query_vector = embed_model.encode(query).tolist()

        # STEP B: Retrieve relevant context from Supabase
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Search using Cosine Distance (<=>) and filter by the state metadata
        cur.execute("""
            SELECT content, source_url, scheme_id 
            FROM policy_chunks 
            WHERE metadata->>'state' IN (%s, 'National')
            ORDER BY embedding <=> %s::vector 
            LIMIT 4
        """, (state, query_vector))
        
        rows = cur.fetchall()

        # If the database returns nothing matching the query
        if not rows:
            return {
                "answer": "I couldn't find any specific funding schemes in my database for that yet. Ask about something else!",
                "sources": []
            }

        # STEP C: Build the Context & Prompt for Gemini
        context_text = "\n\n".join([f"SOURCE [{r[2]}]: {r[0]}" for r in rows])
        sources = [r[1] for r in rows] # We'll return these so the frontend can display links

        prompt = f"""
        You are Kyro, an expert funding consultant for Indian MSMEs. 
        Answer the user's question using ONLY the provided data context.
        If the data doesn't contain the answer, politely say you don't have enough information.
        Always mention specific scheme names.

        CONTEXT FROM DATABASE:
        {context_text}

        USER QUESTION: {query}
        """

        # STEP D: Generate Answer with Gemini
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=prompt
        )

        # Return the AI's answer and a deduplicated list of source URLs
        return {
            "answer": response.text,
            "sources": list(set(sources)) 
        }

    except Exception as e:
        # If anything fails (e.g., Supabase timeout, API quota), return a clean 500 error
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # This guarantees the connection closes even if the code crashes halfway through
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    import uvicorn
    # Runs the server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)