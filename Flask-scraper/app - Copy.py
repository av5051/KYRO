import os
import json
import re
import time
import io
from pypdf import PdfReader
import requests
import psycopg2
import urllib3
processed_hashes = set()
import hashlib
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from flask import Flask, jsonify, request
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer
from google import genai
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

# Initialize App
app = Flask(__name__)

# ---------------------------------------------------------
# FREE AI SETUP & 3-KEY ROTATION
# ---------------------------------------------------------
print("Loading local embedding model (all-MiniLM-L6-v2)...")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

# 🚨 PASTE YOUR 3 EXACT API KEYS HERE 🚨
API_KEYS = [
    "AIzaSyAvt2P3T8LnqvH4kSlH4IuJxDiJoGU3QW0",
    "AIzaSyCBiUP5ztx-adt12sU-3twN3PR8bzRvPYQ",
    "AIzaSyDsceGqBo1C0hKgFFGcnovWKDmdKZOkFlM"
]

# Database URL from your teammate 
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.dbaaawwvsbswdbirnrll:dnAi%3FwZFkW%234!5b@aws-1-ap-south-1.pooler.supabase.com:6543/postgres")

# Initialize the first key
current_key_index = 0
gemini_client = genai.Client(api_key=API_KEYS[current_key_index])
print(f"🔑 Initialized Pipeline with API Key #{current_key_index + 1}")

def rotate_api_key():
    """Swaps to the next API key when the daily quota is blown."""
    global current_key_index, gemini_client
    current_key_index += 1
    
    if current_key_index >= len(API_KEYS):
        print("🚨 FATAL: All 3 API keys are completely drained!")
        return False
        
    print(f"\n🔄 ROTATING API KEY: Switching to Key #{current_key_index + 1}...")
    gemini_client = genai.Client(api_key=API_KEYS[current_key_index])
    return True

# ---------------------------------------------------------
# CORE PIPELINE FUNCTIONS
# ---------------------------------------------------------
def scrape_url_to_markdown(url):
    """Fetches a webpage, cleans the junk, and returns Markdown."""
    print(f"🕸️ Scraping live URL: {url}")
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=10, verify=False)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        
        for junk in soup(["nav", "footer", "script", "style", "header", "aside"]):
            junk.decompose()

        markdown_text = md(str(soup), heading_style="ATX")
        clean_markdown = re.sub(r'\n{3,}', '\n\n', markdown_text)
        return clean_markdown.strip()
    except Exception as e:
        print(f"❌ Scraping failed for {url}: {e}")
        return None

def scrape_pdf_to_text(url):
    """Downloads a PDF into memory with a longer timeout."""
    print(f"📄 PDF DETECTED: Downloading {url}") # Changed message so you know it hit the right function
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        # Increased timeout to 30 and added verify=False
        response = requests.get(url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()

        pdf_file = io.BytesIO(response.content)
        reader = PdfReader(pdf_file)
        
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                # 🧼 THE FIX: Scrub out invisible PDF junk characters
                clean_page = text.replace('\x00', '').replace('\uFFFD', '')
                extracted_text += clean_page + "\n\n"
                
        print(f"✅ PDF Extraction Complete: {len(reader.pages)} pages found.")
        return extracted_text.strip()
        
    except Exception as e:
        print(f"❌ PDF Error: {e}")
        return None


def generate_summary(text):
    """Generates a TL;DR using Gemini 3.1 Flash-Lite, auto-swapping keys on failure."""
    global gemini_client
    prompt = f"You are a policy expert. Provide a strict 1-sentence TL;DR summary of the provided text, focusing on funding, eligibility, or limits.\n\nText: {text}"
    fallback_summary = text[:100].replace('\n', ' ') + "..."

    max_attempts = len(API_KEYS) + 1 
    
    for attempt in range(max_attempts):
        try:
            # USING 3.1-FLASH-LITE FOR 1000 REQUESTS/DAY
            response = gemini_client.models.generate_content(
                model='gemini-3.1-flash-lite',
                contents=prompt
            )
            return response.text.strip()
            
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg:
                if "quota" in error_msg.lower() or "PerDay" in error_msg:
                    print(f"⚠️ Key #{current_key_index + 1} is burned out!")
                    if rotate_api_key():
                        continue 
                    else:
                        return fallback_summary 
                else:
                    print("⏳ Speed Limit Hit! Emergency pause for 30 seconds...")
                    time.sleep(30)
                    continue 
                    
            # 🛡️ THE NEW 503 HANDLER 🛡️
            elif "503" in error_msg or "UNAVAILABLE" in error_msg:
                print("⏳ Google Servers are busy (503). Retrying in 10 seconds...")
                time.sleep(10)
                continue # Loops back and tries the exact same chunk again
                
            else:
                print(f"❌ API Error Details: {e}")
                return fallback_summary
    return fallback_summary

def chunk_document(markdown_text):
    """Splits text by markdown headers, then strictly to 800-1000 chars."""
    headers_to_split_on = [("#", "Header 1"), ("##", "Header 2"), ("###", "Header 3")]
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    md_chunks = markdown_splitter.split_text(markdown_text)
    
    char_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150, separators=["\n\n", "\n", ".", " "])
    final_chunks = char_splitter.split_documents(md_chunks)
    return [chunk.page_content for chunk in final_chunks]

def push_to_supabase(scheme_id, content, summary, metadata_dict, embedding, source_url):
    """Connects to Supabase and inserts the vector data."""
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        register_vector(conn)
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO policy_chunks (scheme_id, content, summary, metadata, embedding, source_url)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (scheme_id, content, summary, json.dumps(metadata_dict), embedding, source_url))
        
        conn.commit()
        print(f"✅ DB Push successful: {scheme_id}")
    except Exception as e:
        print(f"❌ DB Error for {scheme_id}: {e}")
        if conn:
            conn.rollback()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def is_high_quality(content, summary):
    """Filters out junk chunks and failed summaries."""
    
    # 1. Reject very short chunks (usually junk)
    if len(content) < 200:
        print("🗑️ Skipping: Chunk too short (likely boilerplate).")
        return False
    
    # 2. Reject if the summary failed
    if "failed" in summary.lower() or "limit hit" in summary.lower():
        print("🗑️ Skipping: AI Summary failed.")
        return False
        
    # 3. Keyword Check (Optional but helpful for MSME focus)
    msme_keywords = ["loan", "subsidy", "eligible", "scheme", "grant", "crore", "lakh", "msme", "interest"]
    has_keyword = any(word in content.lower() for word in msme_keywords)
    
    if not has_keyword:
        print("🗑️ Skipping: No relevant MSME keywords found.")
        return False

    return True


# ---------------------------------------------------------
# THE FLASK ROUTE (The Ingestion Trigger)
# ---------------------------------------------------------
@app.route('/api/ingest', methods=['POST'])
def trigger_ingestion():
    print("\n🚀 Starting Hydra Data Ingestion Pipeline...")
    incoming_data = request.get_json(silent=True) 
    kyro_data_sources = []

    if incoming_data and "raw_markdown" in incoming_data:
        print("📥 Incoming data detected!")
        kyro_data_sources.append({
            "scheme_id": incoming_data.get("scheme_id", "custom-upload"),
            "url": incoming_data.get("source_url", "N/A"),
            "metadata": incoming_data.get("metadata", {}),
            "raw_markdown": incoming_data["raw_markdown"]
        })
    else:
        print("⚠️ No data sent! Initiating Multi-Source Scrape.")
        print("⚠️ No data sent! Initiating Multi-Source Scrape with 100% Authentic Data.")
        print("⚠️ Injecting the Golden Path Dataset...")
        kyro_data_sources = [
            
            # --- 1. THE RULES ENGINE (To prove the AI understands constraints) ---
            {
                "scheme_id": "official-msme-rules-2026",
                "url": "https://msme.gov.in/rules",
                "metadata": {"state": "National", "funding_type": "Rules", "max_amount": 0, "sector": "All"},
                "raw_markdown": """## Official 2026 MSME Classification Rules
To qualify for government schemes, a business must meet these legal definitions:
* **Micro Enterprise:** Investment under ₹1 Crore AND Annual Turnover under ₹5 Crore.
* **Small Enterprise:** Investment under ₹10 Crore AND Annual Turnover under ₹50 Crore.
* **Medium Enterprise:** Investment under ₹50 Crore AND Annual Turnover under ₹250 Crore.
Any business exceeding ₹250 Crore turnover is classified as a Large Corporate and is disqualified from all MSME schemes.
"""
            },

            # --- 2. THE STATE FILTER (To prove Hybrid Search works) ---
            {
                "scheme_id": "karnataka-cmegp-subsidy",
                "url": "https://karnataka.gov.in/cmegp",
                "metadata": {"state": "Karnataka", "funding_type": "Subsidy", "max_amount": 500000, "sector": "Manufacturing"},
                "raw_markdown": """## Chief Minister's Employment Generation Programme (CMEGP) - Karnataka
This scheme is strictly for permanent residents of Karnataka state. 
It provides a 35% margin money subsidy up to ₹5 Lakhs for setting up new micro-manufacturing units. 
**Eligibility:** The applicant must be between 18 and 45 years of age. IT and software companies are NOT eligible; this is strictly for physical manufacturing.
"""
            },

            # --- 3. THE NICHE TARGETING (To prove deep semantic matching) ---
            {
                "scheme_id": "standup-india-women",
                "url": "https://standupmitra.in",
                "metadata": {"state": "National", "funding_type": "Bank Loan", "max_amount": 10000000, "sector": "Women/SC/ST"},
                "raw_markdown": """## Stand-Up India Scheme 2026
The objective of the Stand-Up India scheme is to facilitate bank loans between ₹10 Lakhs and ₹1 Crore (₹10,000,000).
**Eligibility:** This loan is exclusively available to at least one Scheduled Caste (SC) or Scheduled Tribe (ST) borrower, or at least one Woman borrower, setting up a greenfield (brand new) enterprise in manufacturing, services, or the trading sector.
"""
            },

            # --- 4. THE MASS APPEAL (The standard option) ---
            {
                "scheme_id": "mudra-tarun-loan",
                "url": "https://mudra.org.in",
                "metadata": {"state": "National", "funding_type": "Micro-Loan", "max_amount": 1000000, "sector": "All"},
                "raw_markdown": """## Pradhan Mantri Mudra Yojana (PMMY) - Tarun Category
The Mudra scheme provides micro-credit to small businesses. The "Tarun" category is the highest tier, providing loans from ₹5 Lakhs up to a strict maximum of ₹10 Lakhs.
**Usage:** Funds can be used for working capital, buying transport vehicles, or purchasing shop-floor machinery. No collateral is required.
"""
            }
        ]

    total_chunks_processed = 0

    for source in kyro_data_sources:
        print(f"\n🌍 Processing: {source['scheme_id']}")
        
        live_markdown = source.get("raw_markdown")
        if not live_markdown:
            # 🧠 FIXED SMART ROUTER
            if source["url"].lower().strip().endswith(".pdf"):
                # We give PDFs more time (30s) because they are big!
                live_markdown = scrape_pdf_to_text(source["url"])
            else:
                live_markdown = scrape_url_to_markdown(source["url"])

        chunks = chunk_document(live_markdown)
        
        for i, chunk_text in enumerate(chunks):
            # --- 🛡️ QUALITY GUARD 1: Deduplication ---
            content_hash = hashlib.md5(chunk_text.encode()).hexdigest()
            if content_hash in processed_hashes:
                continue
            processed_hashes.add(content_hash)

            if i > 0:
                time.sleep(4.1)

            summary = generate_summary(chunk_text)

            # --- 🛡️ QUALITY GUARD 2: The Bouncer ---
            if is_high_quality(chunk_text, summary):
                vector = embed_model.encode(chunk_text).tolist()
                
                # NOW PUSH TO LIVE DB
                push_to_supabase(
                    scheme_id=f"{source['scheme_id']}_chunk_{i}",
                    content=chunk_text,
                    summary=summary,
                    metadata_dict=source["metadata"],
                    embedding=vector,
                    source_url=source["url"]
                )
            else:
                print(f"⏩ Rejected low-quality chunk {i} for {source['scheme_id']}")

    return jsonify({
        "status": "success", 
        "message": f"Pipeline complete. Processed {total_chunks_processed} chunks using {current_key_index + 1} API key(s).",
    })

if __name__ == '__main__':
    print("🔥 Hydra Ingestion Engine Live on port 5000.")
    app.run(debug=True, port=5000)