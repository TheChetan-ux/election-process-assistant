# VoteWise — Indian Election Intelligence Platform

![VoteWise Interface](Screenshot%202026-05-02%20202124.png)

VoteWise is a comprehensive, production-ready interactive assistant and educational platform for the Indian Election System. Powered by the latest **Gemini 2.5 Flash** model, the platform provides multilingual AI guidance, tamper-proof election schedules, and interactive civic education tools—all within a highly optimized footprint.

## 🚀 Key Innovations & Technology Stack

- **Core Engine:** Powered by **Gemini 2.5 Flash (v1 API)** for ultra-low latency, high-accuracy conversational AI.
- **Resilient Backend:** Flask-based architecture with a **Custom .env Loader** in `run.py` to ensure zero-dependency startup on restrictive environments.
- **Premium UI/UX:** A modern **Glassmorphism** interface built with Vanilla JS, featuring a dynamic responsive grid and state-of-the-art aesthetics.
- **Advanced Data Structures:** 
  - **Bloom Filter:** Memory-efficient voter ID verification (probabilistic checking for millions of records).
  - **Radix Trie:** Lightning-fast autocomplete for election queries.
  - **Merkle Tree:** Ensures data integrity for election schedules against tampering.
  - **JS Trie Hallucination Guard:** Frontend-level safety to redirect sensitive or misinformation-prone queries.

## ✨ Features

### 1. VOTY — AI Election Assistant
- **Gemini 2.5 Integration:** Utilizes the latest Flash model for real-time, context-aware answers.
- **Multilingual Support:** Seamlessly communicates in 11+ Indian languages (Hindi, Bengali, Marathi, Telugu, Tamil, etc.).
- **Smart Connectivity:** Robust error handling and logging ensure VOTY remains accessible even during high traffic or API rate limiting.
- **Action Chips:** Instant triggers for common tasks like "How to apply for Form 6?" or "Where is my polling station?".

### 2. Educational Hub
- **PM History Grid:** A premium, static informational grid detailing India's Prime Ministers from 1947 to 2024, complete with party badges and historical context.
- **Interactive Flashcards:** 3D-flip cards covering State CMs and Cabinet Ministers.
- **Dynamic Quiz Engine:** Procedurally generated civic readiness quizzes with real-time scoring.

### 3. Voter Action Center
- **Voter ID Verification:** Instant verification using Bloom Filters.
- **Official Portals:** Deep-linked access to ECI services (e-EPIC, Form 6, Candidate Affidavits).
- **Misinformation Guard:** Active monitoring for deepfake awareness and election-related fact-checking.

## 🛠️ Installation & Running Locally

### 1. Prerequisites
Ensure you have **Python 3.12** installed on your system.

### 2. Setup
Clone the repository and install dependencies:
```powershell
pip install -r requirements.txt
```

### 3. Configuration
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Launch the Server
Use the Python 3.12 launcher to start the application:
```powershell
py -3.12 run.py
```

Access the platform at `http://127.0.0.1:5000`.

## ⚖️ Ethical AI & Compliance
VoteWise adheres to the strict **ECI 2026 Directives**:
<<<<<<< HEAD
- **Silence Period Sentinel:** Automatically detects if the system clock is within 48 hours of polling days (e.g., April 14, 23, 29). If active, VOTY toggles into "Logistics Only Mode", strictly prohibiting political analysis and candidate information, defaulting to booth location and voter procedure guidance.
=======
- **Silence Period Sentinel:** Automatically toggles into "Logistics Mode" 48 hours before polling to prevent political bias.
>>>>>>> d667752 (Integrated Gemini 2.5 Flash, updated modern UI, and improved backend resilience)
- **Ethical Watermarking:** All AI responses are labeled as "AI-Assisted Educational Content" to maintain transparency.
- **Inclusive Design:** Optimized for low-literacy accessibility via clear iconography and vernacular persistence.

---
*Built for every Indian citizen. Empowering democracy through technology.*
