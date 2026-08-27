# PO Certification Simulator

A practice/exam simulator for the **PSPO I (Professional Scrum Product Owner I)** certification from Scrum.org, with questions generated live by AI and grounded in a personal knowledge base built from Gemini NotebookLM.

## Exam blueprint being simulated

- 80 questions (multiple-choice / multiple-answer / true-false)
- 60-minute timer
- 85% passing score (68/80)
- 3 content domains: *Scrum Framework*, *Developing People and Teams*, *Managing Products with Agility*

## Modes

- **Practice mode** — untimed, instant feedback and explanations per question, filterable by domain.
- **Full Simulation mode** — timed, scored, pass/fail vs. the 85% threshold, domain breakdown, review of missed questions.

## Architecture

- **Frontend**: React + Vite
- **Question generation**: live calls to OpenAI (GPT-4o-mini tier) per session — not a static pre-built bank
- **Grounding (RAG)**: knowledge-base content is chunked and embedded once into a bundled static vector index; the backend retrieves the most relevant chunks per request and includes them in the prompt
- **Backend**: serverless function(s) deployed on Vercel, holding the OpenAI API key and performing retrieval + generation
- **Session history**: saved in browser localStorage (no backend database)

## Knowledge base

- [`knowledge-base/notebooklm-exports/`](knowledge-base/notebooklm-exports/) — Study Guide, FAQ, Briefing Doc, Mind Map text, etc. exported from NotebookLM
- [`knowledge-base/raw-sources/`](knowledge-base/raw-sources/) — original source materials (PDFs, articles, the Scrum Guide, etc.)

## Versioning

This project uses [semantic versioning](https://semver.org/) (tracked in `package.json` and as git tags). The current version is displayed in the app's footer.

## Status

🚧 Early scaffold — question generation and simulation logic not yet implemented.
