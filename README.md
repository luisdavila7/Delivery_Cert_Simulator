# Delivery Cert Simulator

**Live app:** https://deliverycertificationsimulator.vercel.app/
**Repo:** https://github.com/luisdavila7/Delivery_Cert_Simulator

A practice/exam simulator for Agile, project, and product delivery certifications, with questions
generated live by AI and grounded in a personal knowledge base built from Gemini NotebookLM and
official source material. The candidate picks which certification to practice; each is driven by a
single shared exam registry ([`shared/exams.mjs`](shared/exams.mjs)) so adding a new certification
(e.g. SAFe) means adding one config entry, not touching the whole pipeline.

## Supported exams

| Exam | Org | Domains | Full simulation |
| --- | --- | --- | --- |
| **PSPO I** (Professional Scrum Product Owner I) | Scrum.org | Scrum Framework, Developing People and Teams, Managing Products with Agility | 80 questions, 60 min, 85% (68/80) to pass |
| **PMP** (Project Management Professional) | PMI | People, Process, Business Environment | 180 questions, 230 min, ~61% to pass (see note below) |

Domain content and blueprint numbers for both exams live in `shared/exams.mjs`.

> **Note on the PMP passing score:** PMI does not publish an official numeric passing score for
> the PMP exam — it reports results as proficiency bands (Above Target / Target / Below Target /
> Needs Improvement) per domain instead. The ~61% threshold used here is a commonly-cited estimate
> from prep providers, not an official cutoff, and the app labels it as such.

The PMP simulation splits its 180 questions across domains using PMI's official Examination
Content Outline weighting (People 42% / Process 50% / Business Environment 8%) rather than an
even split.

## Modes

- **Practice mode** — untimed, instant feedback and explanations per question, filterable by domain.
- **Full Simulation mode** — timed, scored, pass/fail vs. the exam's threshold, domain breakdown,
  review of missed questions.

## Architecture

- **Frontend**: React + Vite
- **Question generation**: live calls to OpenAI (GPT-4o-mini tier) per session — not a static pre-built bank
- **Grounding (RAG)**: each exam's knowledge-base content is chunked and embedded once into its own
  bundled static vector index (`data/vector-index.<examId>.json`); the backend retrieves the most
  relevant chunks per request and includes them in the prompt
- **Backend**: serverless function(s) deployed on Vercel, holding the OpenAI API key and performing retrieval + generation
- **Session history**: saved in browser localStorage (no backend database), tagged per exam

## Knowledge base

Each exam gets its own subfolder in both top-level directories (see `kbDirs` in
`shared/exams.mjs`) — nothing is shared or duplicated between exams:

- [`knowledge-base/notebooklm-exports/pspo/`](knowledge-base/notebooklm-exports/pspo/) and [`.../pmp/`](knowledge-base/notebooklm-exports/pmp/) — Study Guide, FAQ, Briefing Doc, Mind Map text, etc. exported from NotebookLM, one subfolder per exam
- [`knowledge-base/raw-sources/pspo/`](knowledge-base/raw-sources/pspo/) — original PSPO I / CSPO source materials (PDFs, the Scrum Guide, etc.)
- [`knowledge-base/raw-sources/pmp/`](knowledge-base/raw-sources/pmp/) — original PMP source materials (PMBOK 7 Guide)

Run `npm run build-index` after adding/changing files in any exam's directories to (re-)generate
that exam's vector index. This calls the OpenAI embeddings + classification APIs for every chunk
(real API cost) and requires `OPENAI_API_KEY` in `.env`.

## Versioning

This project uses [semantic versioning](https://semver.org/) (tracked in `package.json` and as git tags). The current version is displayed in the app's footer.

## Status

Phases 1-4 complete: knowledge base, RAG indexing pipeline, live question-generation backend, and
Practice/Full Simulation frontend UI are all implemented and working, now generalized to support
multiple exams (PSPO I and PMP) selectable from the home screen.
