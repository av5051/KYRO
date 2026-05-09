# KYRO ✦
**The Sovereign Access Layer for India's Founders, MSMEs, and NGOs**

![KYRO Concept](https://img.shields.io/badge/Status-Hackathon_Prototype-brightgreen) ![Team](https://img.shields.io/badge/Team-TryHard-blueviolet)

Every year, billions of rupees in government funds allocated for MSMEs, Startups, and NGOs go unutilized. While the capital exists, there is a systemic **'Last-Mile Friction'** preventing access. 

KYRO is not just a search engine for grants; it is an end-to-end **Actionable Infrastructure**. We bridge the ₹1 Trillion funding gap by translating startup jargon into bureaucratic "Gov-Speak", auto-generating offline compliance checklists, and filling formal representations.

---

## 🛑 The Problem
1. **The Language Barrier:** 90% of founders fail because they pitch "tech innovations" instead of using specific government evaluators' keywords (e.g., "Indigenous Development", "Import Substitution").
2. **The Compliance Trap:** Minor document mismatches (e.g., PAN vs. Udyam mismatch) cause automated rejections.
3. **The Offline Void:** 70% of government schemes require physical submission. A digital "Submit" button is useless without a tactical roadmap to the local District Industries Centre (DIC).

## ⚡ The Solution: Core Modules

KYRO routes users through a strict **Identity Triage** (NGO, Startup, or MSME) to set the bureaucratic context, then unlocks four heavy-lifting engines:

### 1. 🎯 OPPORTUNITIES (The Strategy Engine)
A hyper-minimalist, context-aware chat interface. Tell KYRO your current resources (e.g., "I have an IoT hardware prototype and 3 engineers") and it will identify your strategic funding path (e.g., *Startup India Seed Fund* or *MSME Idea Hackathon*).

### 2. 🗺️ CHECKLIST (The Bureaucracy GPS)
Directly linked to the Opportunities chat, this auto-generates your offline marching orders.
* **Legal:** Auto-drafts the exact text needed for a ₹100 Notary Affidavit.
* **Materials:** Reminds you which specific annexures must be printed on **Green Ledger paper**.
* **Logistics:** Maps your route to the nearest physical submission office (e.g., DIC office, Bannerghatta) with specific submission hours.

### 3. 🔍 PARSE (The Rejection Killer)
A split-screen document analyzer. Upload a rejected application or draft. KYRO highlights "Red Zone" compliance errors and suggests precise "Gov-Speak" translations (e.g., changing "SaaS platform" to "Digital Public Infrastructure").

### 4. ✍️ FILLING (The Automation Beast & Liaison)
KYRO doesn't just fill grant forms—it drafts power. Using the data from your profile, the LLM auto-generates highly formal **Representation Letters** addressed to the relevant Ministry Secretary or DIC General Manager, ensuring your project arrives with professional bureaucratic gravitas.

---
## 🛠️ Technical Architecture & UI Flow

Frontend: Built with React/Next.js and Tailwind CSS for a high-performance, responsive interface.

Aesthetic: Ultra-minimalist, premium dark mode featuring glassmorphism (backdrop-blur-md), deep radial gradients, and a zero-friction UI.

Backend Orchestrator: Python (Flask/FastAPI) serving as the central nervous system. It manages user sessions, coordinates the RAG pipeline, and handles the logic for the auto-updating checklist.

Vector Database: PostgreSQL with the pgvector extension (hosted via Supabase). This stores high-dimensional embeddings of thousands of government policy documents, enabling sub-second semantic retrieval.

AI Engine: Powered by Groq LPU™ Inference running openai/gpt-120b. It uses a custom RAG (Retrieval-Augmented Generation) pipeline with local all-MiniLM-L6-v2 embeddings to enforce a strict Indian Bureaucratic "Gov-Speak" persona.

State Linking: Global state management seamlessly links the Chat interface to the auto-generating Checklist and form-filler modules, ensuring data persists as the user moves from "Discovery" to "Action."
---

## 🚀 Demo Scenario
**Target:** MSME Idea Hackathon
**Profile:** Tech Startup (Hardware/IoT)
1. User selects **Startup / DPIIT** on the landing page.
2. In **Opportunities**, user explains their project (e.g., *RouteSentry* - real-time road anomaly detection).
3. KYRO identifies the scheme match and instantly populates the **Checklist** with instructions for board resolutions and physical submissions.
4. User uploads a draft to **Parse**, where KYRO corrects "sensor data" to "Dynamic Structural Health Monitoring".
5. In **Filling**, KYRO drafts a flawless formal letter to the MSME Development Institute.

---
*Built with precision to make sovereign funding accessible to the innovators who need it most.*
