import os, json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from sentence_transformers import SentenceTransformer
import psycopg2
from pgvector.psycopg2 import register_vector
from dotenv import load_dotenv

# 1. Setup & Environment
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Load embedding model once on startup
print("⏳ Loading local embedding model...")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Kyro Engine Ready.")

app = FastAPI(title="Kyro Smart RAG Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# The checklist of things we want to know about the user
PROFILE_FIELDS = ["state", "sector", "turnover", "business_age", "ownership", "purpose"]

class ChatRequest(BaseModel):
    query: str
    profile: dict = {}

def get_db_connection():
    """Connects using the IPv4 Pooler string from your .env"""
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    register_vector(conn)
    return conn

@app.get("/")
def health():
    return {"status": "online"}

@app.post("/ask")
async def ask_kyro(request: ChatRequest):
    # DEBUG: See what the frontend (or Postman) sent in your terminal
    print(f"\n📥 RECEIVED QUERY: {request.query}")
    print(f"👤 CURRENT PROFILE: {json.dumps(request.profile, indent=2)}")

    conn = None
    cur = None
    
    try:
        # STEP A: Extract state for filtering (Default to National)
        user_state = request.profile.get("state", "National")

        # STEP B: Local Embedding
        query_vector = embed_model.encode(request.query).tolist()

        # STEP C: Vector Search + Metadata Filter
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT content, source_url, scheme_id 
            FROM policy_chunks 
            WHERE metadata->>'state' IN (%s, 'National')
            ORDER BY embedding <=> %s::vector 
            LIMIT 4
        """, (user_state, query_vector))
        
        rows = cur.fetchall()
        context_text = "\n\n".join([f"SOURCE [{r[2]}]: {r[0]}" for r in rows])
        sources = [r[1] for r in rows]

        # STEP D: The "Smart Agent" Prompt
        prompt = f"""
        You are Kyro, an expert funding consultant for Indian MSMEs.
        
        GOAL: Provide funding advice. To be 100% accurate, you need to eventually know: {', '.join(PROFILE_FIELDS)}.
        
        USER PROFILE:
        {json.dumps(request.profile, indent=2)}

        INSTRUCTIONS:
        1. Answer the question using the DATABASE CONTEXT provided.
        2. PERSONALIZATION: If the user's turnover, sector, or age makes them ineligible for a scheme in the context, EXPLAIN WHY.
        3. INTERVIEWER LOGIC: If a key field is missing from the profile, answer the question but ask for ONE missing detail in a friendly way.
        4. AUTO-UPDATE: If the user just told you a new detail (e.g., their state or sector), you MUST add this hidden tag at the very end: [[UPDATE: {{"field": "value"}}]]
        
        --- DATABASE CONTEXT ---
        {context_text}

        --- USER QUESTION ---
        {request.query}
        """

        # STEP E: AI Generation
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=prompt
        )

        print(f"📤 AI RESPONSE SENT.")
        return {
            "answer": response.text,
            "sources": list(set(sources))
        }

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)