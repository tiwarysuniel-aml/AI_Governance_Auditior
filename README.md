# AI Governance & Risk Auditor 🛡️

AI Governance & Risk Auditor is a production-ready enterprise dashboard designed to monitor, score, log, and audit safety risks in LLM prompts and completions. 

The application runs entirely on the client side, storing user logs, configurations, and checklist states locally in the browser (`LocalStorage`). It supports connection endpoints for **Google Gemini API** and local **Ollama** services, featuring automatic routing failovers and a dedicated, out-of-the-box **Demo Mode** for presentations.

---

## 🚀 Core Features

1. **Prompt Testing Workspace**:
   - Sandbox editor allowing input of custom prompts.
   - Pre-seeded buttons load standard demonstration scenarios (Safe, PII leaks, Injection vectors, GDPR warnings, Health privacy, API key leaks).
   - Audits both user input prompts and generated responses across 7 scan domains.
2. **Governance Analysis Engine**:
   - static heuristic scanner applying regulatory standards and safety lexicons.
   - Calculates a compliance score from `0` to `100` and charts severities (`Low`, `Medium`, `High`, `Critical`).
   - Recommends actionable shielding guidelines (e.g. masking personal credentials, de-identifying clinical charts).
3. **Failover Protocol Routing**:
   - Configure Primary and Fallback nodes (e.g. Gemini primary, Ollama backup).
   - If the primary provider triggers connection errors or times out, the system automatically redirects traffic to the backup and prompts a toast alert.
4. **Audit History Log database**:
   - Persistent store displaying full telemetry logs.
   - Search across prompt/completion text. Filters by AI node, risk status, or score hierarchies.
5. **Model Comparison Suite**:
   - Compare outputs of Gemini and Ollama side-by-side.
   - Matrix grid showing which risk rules were tripped by each provider on the same prompt.
6. **Governance Checklist & PDF Exporter**:
   - Check compliance rules and checklist generators in real-time.
   - Exports high-fidelity, sign-off ready PDF sheets (checklist) and detailed report PDFs.

---

## 🛠️ Heuristic Scanning Rules (7 Categories)

- **PII Exposure**: Flags Email accounts, Phone contact sheets, Aadhaar digits, PAN identifiers, Passport structures, and Employee records.
- **Sensitive Info / Secrets**: Detects private IP blocks, cryptographic keys, databases connection URIs, Stripe, and Google API keys.
- **Prompt Injection**: Checks overrides like `"ignore previous instructions"`, system extraction prompts, and DAN/jailbreak commands.
- **Privacy Risk**: Identifies payroll records, employee salary tables, customer lists, and financial books.
- **Compliance Risk**: Evaluates GDPR right-to-be-forgotten rules and retention policies.
- **Security Risk**: Scrapes private RSA keys and environment configuration leaks (`.env`, `docker-compose.yml`, `kubeconfig`).
- **Toxicity Risk**: Filters profanities and offensive expressions.

---

## ⚙️ Quick Setup & Installation

### 1. Installation
Clone or navigate to the workspace, install package files, and run the hot-reload Vite server:
```bash
# Install dependencies
npm install

# Start Vite developer server
npm run dev
```

### 2. Local Ollama Node CORS Policy Setup
To allow the browser application (`http://localhost:5173`) to query your local Ollama port (`11434`), you must start Ollama with CORS origins allowed.

- **Windows (Command Prompt)**:
  ```cmd
  set OLLAMA_ORIGINS="*"
  ollama serve
  ```
- **macOS / Linux**:
  ```bash
  OLLAMA_ORIGINS="*" ollama serve
  ```

### 3. Environment Configurations (Optional)
Create a `.env` file in the root directory using the template provided:
```bash
cp .env.example .env
```
Populate your Google Gemini API key to enable direct live queries. If no keys are provided, the application defaults to **Demo Mode**, generating simulated completions for review.

---

## 📦 Project Architecture & Component Map

- `src/services/governanceEngine.ts`: Core scanner utilizing regular expressions and deductive rules.
- `src/services/aiProviders.ts`: Fetch adapters for Gemini and Ollama, fallback router, and mock simulator.
- `src/services/pdfGenerator.ts`: jsPDF and AutoTable formatter for PDF downloads.
- `src/components/Workspace.tsx`: Prompt sandbox workspace with scorecard.
- `src/components/Dashboard.tsx`: Chart aggregates utilizing Recharts and heatmaps.
- `src/components/Comparison.tsx`: Dual execution interface.
- `src/components/AuditLogs.tsx`: Log history browser.
- `src/components/Checklist.tsx`: Compliance checklist generator.
- `src/components/Settings.tsx`: API config panel.
