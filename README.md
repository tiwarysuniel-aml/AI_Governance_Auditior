# 🛡️ AI Governance & Risk Auditor

> **An enterprise-grade AI safety monitoring dashboard** that scans LLM prompts and responses for compliance violations, PII exposure, prompt injection attacks, and security risks — generating scored audit reports and exportable compliance PDFs.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🎯 What Does This Project Do?

AI Governance & Risk Auditor is a **production-ready compliance and safety tool** for teams deploying Large Language Models (LLMs) in enterprise environments. It provides:

- **Real-time prompt/response scanning** across 7 governance categories
- **Compliance scoring** from 0–100 with severity breakdown
- **Audit trail logging** with persistent history and full-text search
- **Model comparison** (Gemini vs. Ollama) on the same prompt
- **PDF report export** for sign-off and regulatory review
- **Failover routing** with automatic fallback between AI providers

This tool demonstrates deep understanding of **AI governance frameworks**, **LLM safety engineering**, and **enterprise compliance automation**.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Prompt Testing Workspace** | Sandbox editor with pre-seeded risk scenarios (PII leaks, injection vectors, GDPR, health data, API key leaks) |
| **Governance Analysis Engine** | Static heuristic scanner applying safety lexicons and regulatory standards across 7 categories |
| **Compliance Scoring** | Calculates a 0–100 compliance score; charts `Low`, `Medium`, `High`, `Critical` severities using Recharts |
| **Failover Protocol Routing** | Configure Primary + Fallback AI nodes; automatically reroutes traffic on timeout or error |
| **Audit History Database** | Persistent log with full-text search; filter by AI provider, risk status, or score range |
| **Model Comparison Suite** | Side-by-side Gemini vs. Ollama output comparison with risk rule matrix |
| **Governance Checklist** | Real-time compliance checklist with PDF export (jsPDF + AutoTable) |
| **Demo Mode** | Full walkthrough without any API keys — simulated responses included |

---

## 🔍 Governance Scanning Rules — 7 Categories

| Category | What It Detects |
|---|---|
| **PII Exposure** | Email addresses, phone numbers, Aadhaar/PAN, passport numbers, employee records |
| **Secrets & Credentials** | Private IP blocks, cryptographic keys, DB connection strings, Stripe/Google API keys |
| **Prompt Injection** | `"ignore previous instructions"`, system-level extraction prompts, DAN/jailbreak commands |
| **Privacy Risk** | Payroll records, salary tables, customer PII lists, financial ledgers |
| **Compliance Risk** | GDPR right-to-erasure violations, data retention policy breaches |
| **Security Risk** | RSA private keys, `.env` files, `docker-compose.yml`, `kubeconfig` leaks |
| **Toxicity Risk** | Profanity, hate speech, and offensive expressions |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Browser Application                │
│          (100% client-side, no backend)         │
│                                                 │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Workspace  │  │ Dashboard  │  │ Audit Log │ │
│  │ (Sandbox)  │  │ (Charts)   │  │ (History) │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘ │
│        │               │               │        │
│  ┌─────▼───────────────▼───────────────▼──────┐ │
│  │           Governance Engine                │ │
│  │  governanceEngine.ts — RegEx + heuristics  │ │
│  │  Score: 0–100 | Severity: Low→Critical     │ │
│  └─────┬──────────────────────────────────────┘ │
│        │                                         │
│  ┌─────▼──────────────────────────────────────┐ │
│  │         AI Provider Layer                  │ │
│  │  aiProviders.ts — Gemini + Ollama + Mock   │ │
│  │  Automatic failover routing                │ │
│  └─────────────────────────────────────────────┘│
└───────────────────┬──────────────────┬──────────┘
                    │                  │
          ┌─────────▼──────┐  ┌────────▼──────────┐
          │ Google Gemini  │  │  Local Ollama API  │
          │   Cloud API    │  │  (localhost:11434) │
          └────────────────┘  └───────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19 + TypeScript 6 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Charts** | Recharts |
| **PDF Generation** | jsPDF + jsPDF-AutoTable |
| **AI (Cloud)** | Google Gemini API |
| **AI (Local)** | Ollama REST API |
| **Linting** | ESLint + TypeScript-ESLint |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Optional: A [Google Gemini API key](https://aistudio.google.com/app/apikey) or running [Ollama](https://ollama.com/) instance

### Installation

```bash
# Clone the repository
git clone https://github.com/tiwarysuniel-aml/AI_Governance_Auditior.git
cd AI_Governance_Auditior

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at **http://localhost:5173**

> **No API key needed to start** — the app launches in Demo Mode automatically.

### Environment Variables (Optional)

```bash
cp .env.example .env
```

```env
# Populate to enable live AI calls (optional — Demo Mode works without this)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Ollama Setup (for local/offline use)

```bash
# Windows
set OLLAMA_ORIGINS=*
ollama serve

# macOS / Linux
OLLAMA_ORIGINS="*" ollama serve
```

---

## 📁 Project Structure

```
AI_Governance_Auditior/
├── src/
│   ├── services/
│   │   ├── governanceEngine.ts  # Core scanner: RegEx rules + scoring
│   │   ├── aiProviders.ts       # Gemini + Ollama fetch adapters + failover + mock
│   │   └── pdfGenerator.ts      # jsPDF report formatter
│   ├── components/
│   │   ├── Workspace.tsx        # Prompt sandbox with live scorecard
│   │   ├── Dashboard.tsx        # Recharts aggregates and heatmaps
│   │   ├── Comparison.tsx       # Dual model execution interface
│   │   ├── AuditLogs.tsx        # Log browser with search and filters
│   │   ├── Checklist.tsx        # Compliance checklist with PDF export
│   │   └── Settings.tsx         # API config and failover settings
│   └── main.tsx
├── .env.example
├── index.html
└── package.json
```

---

## 💡 Skills Demonstrated

- **AI Safety Engineering** — heuristic governance scanning across 7 compliance domains
- **Regulatory Knowledge** — GDPR, PII/data privacy, prompt injection mitigations
- **Multi-Provider AI Architecture** — abstracted provider layer with automatic failover
- **TypeScript + React** — fully typed, component-driven architecture
- **Data Visualization** — real-time compliance scoring with Recharts
- **Report Generation** — sign-off-ready PDF exports for compliance workflows
- **Frontend-Only Architecture** — zero backend dependencies, entirely browser-based
- **Demo Mode Design** — showcase-ready without requiring external service credentials

---

## 🔒 Security & Data Privacy

- No credentials are hardcoded in the codebase.
- API keys are stored in browser state only during the session.
- `.env` files are git-ignored; only `.env.example` (with blank placeholders) is committed.
- `node_modules/` and build output (`dist/`) are excluded from version control.

---

## 📄 License

MIT License — feel free to use, fork, and extend.
