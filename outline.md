# Gundert Translation Editor - Project Outline

## 1. Project Overview

### Product Vision
A modern, multi-org translation platform for translating diverse Bible-related resources from multiple sources (UBS, unfoldingWord, SIL, Tyndale, Strong's Lexicon, etc.). The platform enables AI-assisted drafting, collaborative translation, built-in project management, and validation to produce round-trippable exports with full version traceability.

### Core Promise
Any supported source resource can move through:
1. AI-assisted drafting
2. Collaborative translation
3. Built-in project management
4. AI-assisted validation
5. Round-trippable export in same structure and format
6. Full version traceability and optional community feedback

### North-Star Metric (Phase 1)
Median time to validated export (from resource import to approved, round-trippable export for one resource version)

---

## 2. MVP Scope & Features

### MVP Goals
1. Reduce time to complete OBS translation workflows by at least 30% vs. manual baseline
2. Reduce reviewer-rejected segments by at least 20% through guided AI drafting and glossary consistency
3. Enable at least 3 pilot teams to run weekly through Draft → Review → Approval

### MVP Non-Goals
- Audio workflows
- Non-OBS resource support (Phase 1 focus: Open Bible Stories only)
- Advanced linguistic analytics beyond glossary consistency and core warnings
- Enterprise admin suite

### MVP Features
- OBS import and story rendering with stable segment order
- Story editor with source/target side-by-side view
- Gemini whole-story AI draft generation
- Optional chunk-level draft generation for selected segments
- Save states and unsaved-change safeguards
- Role-based status transitions: Draft → In Review → Approved
- Reviewer comments with unresolved-comment gating
- Glossary view and consistency warnings
- Activity log with AI/human provenance

---

## 3. Technical Stack

### Frontend
- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript
- **Styling**: PostCSS + CSS modules
- **Build**: Vite (for legacy components)
- **Testing**: Jest, Playwright (E2E)

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Auth.js v5 (credentials flow)
- **AI Integration**: Google Gemini API

### Data Processing
- UBS XML parser and importer pipeline
- SFM/USFM file support
- JSON, Markdown, CSV/TSV format support
- Validation and round-trip testing

---

## 4. Application Architecture

### Two Active Applications

#### 4.1 MVP Application (`nextjs-app/`)
- **Status**: Active, deployed to Vercel
- **Stack**: Next.js 16 + React 19 + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Auth.js v5 with credentials flow
- **Purpose**: Current product surface

**Key Routes:**
- `/` — Home page (authentication gateway)
- `/browser` — Redirect to `/lexicon` (compatibility)
- `/lexicon` — Resource browser and lexicon viewer
- `/translator` — Translation workbench
- `/auth/signin` — Sign-in page
- `/api/auth/[...nextauth]` — Authentication endpoints
- `/api/resources/entries` — Paginated entry list API
- `/api/import` — Resource import endpoint
- `/api/translate` — Translation endpoint (Gemini-assisted)
- `/api/seed` — Demo data endpoint

**Core Directories:**
- `app/` — Next.js App Router pages and layouts
- `lib/` — Shared utilities, auth, database, parsers, browser logic
- `api/` — Legacy Express-compatible endpoint wrapper
- `data/` — Sample data (XML, JSON, SFM files)
- `drizzle/` — Database migrations and schema
- `tests/` — Unit, contract, integration, and smoke tests
- `public/` — Static assets

#### 4.2 Legacy PoC Application (`legacy-poc/`)
- **Status**: Read-only reference
- **Stack**: Vanilla HTML + JavaScript
- **Purpose**: Original proof-of-concept for reference
- **Components**: Browser, Translator, API simulation

**Entry Points:**
- `legacy-poc/pages/browser.html` — Original browser UI
- `legacy-poc/pages/translator.html` — Original translator UI
- `legacy-poc/assets/js/browser.js` — Original browser logic
- `legacy-poc/assets/js/translator.js` — Original translator logic

### 4.3 Root Entry Point
- `index.html` — App selector page for end users (routes to MVP or legacy PoC)

---

## 5. Data & Resources

### Supported Data Formats
| Format | Purpose | Examples |
|--------|---------|----------|
| **XML** | UBS dictionaries (ThematicLexicon), OSIS Bibles | FAUNA_en.xml, FLORA_en.xml |
| **JSON** | Structured lexicons, metadata bundles | entries.json, stats.json |
| **Markdown** | Commentary entries, theology resources | Documentation files |
| **SFM** | USFM/USX Bible text, lexicons | .SFM files for language resources |
| **CSV/TSV** | Glossaries, term lists | Terminology tables |

### Phase 1 Data Sources
Located in `nextjs-app/data/`:
- `FAUNA_en.xml` — Fauna-related terminology
- `FLORA_en.xml` — Flora-related terminology
- `REALIA_en.xml` — Culture/realia-related terms
- Supporting translations (e.g., `FAUNA_fr.xml`)

### XML Schema
- `schemas/thematic_lexicon.xsd` — ThematicLexicon format specification

---

## 6. Database Schema

### Core Tables (Drizzle ORM)
Located in `nextjs-app/lib/db/schema.ts`

**User & Auth:**
- `users` — User accounts
- `sessions` — Auth sessions
- `verificationTokens` — Email verification

**Resources & Entries:**
- `resources` — Resource metadata
- `entries` — Dictionary/lexicon entries
- `synonyms` — Synonym relationships
- `see_also` — Cross-reference relationships

**Translation Workflow:**
- `translations` — Translation records
- `glossary_items` — Glossary terms and definitions
- `comments` — Reviewer comments
- `activity_log` — Change history with provenance

**Draft & Status:**
- `drafts` — Draft translations
- `status_transitions` — Status change history

### Migrations
- `drizzle/0000_wide_payback.sql` — Initial schema
- `drizzle/0001_comprehensive_schema.sql` — Extended schema
- `drizzle/meta/` — Migration metadata

---

## 7. Key Features & Workflows

### 7.1 Import Workflow
1. User uploads resource file (XML, JSON, SFM, etc.)
2. Parser validates format and schema
3. Importer contracts check business rules
4. Data inserted into PostgreSQL
5. Round-trip validation confirms export matches import
6. Resource available in browser/lexicon

**Implementation:**
- `lib/importer/ubs-xml-importer.ts` — UBS XML import logic
- `lib/xml-parser/parser.ts` — XML parsing utilities
- `lib/import-workflow/contracts.ts` — Import contracts

### 7.2 Browser/Lexicon Workflow
1. User views resource entries with filtering/sorting
2. Side-by-side source/target view
3. Pagination with infinite scroll
4. Entry detail pages show glossary, references, synonyms
5. Bible reference formatting and linking

**Implementation:**
- `lib/browser/entry-list.ts` — Entry filtering/sorting logic
- `lib/browser/lexicon-utils.ts` — Lexicon utilities
- `lib/browser/reference-formatter.ts` — Bible reference formatting
- `app/lexicon/LexiconInfiniteList.tsx` — Infinite scroll component
- `/api/resources/entries` — Backend API

### 7.3 Translation Workflow (Translator)
1. Translator opens story for translation
2. AI generates first draft using Gemini
3. Translator edits, saves, and submits for review
4. Glossary consistency warnings shown
5. Status tracked: Draft → In Review → Approved
6. Activity log shows all changes with provenance

**Implementation:**
- `app/translator/page.tsx` — Translator workbench
- `/api/translate` — Gemini translation endpoint
- `lib/auth.ts` — Auth/role-based access

### 7.4 Reviewer Workflow
1. Reviewer sees submitted translations
2. Can add comments on segments
3. Can request revisions
4. Cannot approve with unresolved comments
5. Activity log shows review history

### 7.5 Glossary & Consistency Checks
1. Glossary view shows approved terminology
2. Consistency warnings highlight deviations
3. Suggestions based on glossary entries
4. Reviewer gates approval on resolved issues

---

## 8. API Routes & Endpoints

### Authentication
- `POST /api/auth/signin` — Sign-in endpoint (credentials)
- `GET /api/auth/callback/[provider]` — OAuth callback
- `POST /api/auth/signout` — Sign-out

### Resources
- `GET /api/resources/entries` — List entries (paginated, filtered)
- `POST /api/import` — Upload and import resource
- `GET /api/resources/[resource_id]/[version]` — Resource metadata

### Translation
- `POST /api/translate` — Generate AI draft using Gemini
- `POST /api/translate/validate` — Validate translation

### Demo/Seeding
- `POST /api/seed` — Load demo data

---

## 9. User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Translator** | Draft, edit, submit for review, view glossary, see feedback |
| **Reviewer** | Comment, request revisions, see activity log, resolve issues |
| **Project Lead** | Approve ready stories, manage blocked stories, reassign |
| **Translation Facilitator** | Glossary governance, pilot quality oversight, rubric management |
| **Admin** | (Future) System-wide settings, user management |

---

## 10. Testing Strategy

### Test Types
- **Unit Tests**: Jest for functions and utilities
- **Contract Tests**: Import workflow validation
- **Integration Tests**: Database interactions with Drizzle
- **Smoke Tests**: Route-level behavior
- **E2E Tests**: Playwright for full workflows

### Test Suites
Located in `nextjs-app/tests/`:
- `api/` — API endpoint tests
- `lib/` — Library and utility tests
- `integration/` — DB integration tests
- `e2e/` — End-to-end browser tests

### Current Test Status (as of 2026-04-19)
- **13 passing suites, 2 skipped suites**
- **254 passing tests, 82 skipped tests**
- DB integration tests gated behind `RUN_DB_INTEGRATION_TESTS=true`

### Running Tests
```bash
cd nextjs-app
npm test                    # Run all tests
npm run test:db             # Run DB integration tests (requires env setup)
```

---

## 11. Development Workflow

### Setup
```bash
# Install dependencies
cd nextjs-app
npm install

# Set up environment
# Create .env.local with:
# - DATABASE_URL (PostgreSQL connection)
# - NEXTAUTH_SECRET (auth secret)
# - GEMINI_API_KEY (API key)
# - GEMINI_MODEL (model name)

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server on http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit/integration tests |
| `npm run db:push` | Sync DB schema |
| `npm run db:generate` | Generate migration files |
| `npm run import:ubs` | Import UBS XML files |
| `npm run validate:roundtrip` | Test import → DB → export roundtrip |

### Data Processing Scripts (from root)
```bash
# Parse XML dictionaries into JSON
node scripts/analyze_dictionaries.js

# Parse SFM/USFM files
node scripts/analyze_sfm.js
```

---

## 12. Deployment & CI/CD

- **Hosting**: Vercel (Next.js optimized)
- **Database**: Neon PostgreSQL (serverless)
- **CI/CD**: GitHub Actions (workflows in `.github/`)
- **Package**: Next.js production build

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Auth encryption secret
- `GEMINI_API_KEY` — Google Gemini API key
- `GEMINI_MODEL` — Gemini model name (e.g., `gemini-2.0-flash`)

---

## 13. Documentation Reference

| Document | Purpose |
|----------|---------|
| `AGENT-TECH-STACK.md` | Detailed technology documentation |
| `AGENT-PROJECT-STRUCTURE.md` | Full directory structure reference |
| `AGENT-WORKFLOWS.md` | Development workflow patterns |
| `AGENT-TROUBLESHOOTING.md` | Common issues and solutions |
| `AGENT-GEMINI-API.md` | Google Gemini API integration |
| `AGENT-TEMPLATES.md` | Reusable task templates |
| `BROWSER_UI_DESIGN.md` | UI design specifications |
| `TRANSLATION_PROGRESS_CHECKLIST.md` | Feature completion tracker |
| `README.md` | Project quick start |

---

## 14. Git & Development Guidelines

### Key Rules
1. **Never commit without explicit user instruction** — wait for "commit" or "push"
2. **Use `gh` CLI** for all GitHub operations (PRs, issues, releases)
3. **Never ask for passwords/private keys**
4. After commit: Don't auto-push — wait for explicit "push" instruction
5. **Follow TDD by default**: Red → Green → Refactor

### Branch Strategy
- Active work in `nextjs-app/` only (unless working on legacy PoC)
- Preserve `legacy-poc/` without approval
- No copying code between apps without approval

---

## 15. Project Timeline & Phases

### Phase 1 (Current MVP)
- OBS import and rendering
- AI-assisted drafting (Gemini)
- Review workflow
- Glossary consistency
- Pilot: 3 teams, weekly cycles

### Phase 2+ (Future)
- Multi-resource support beyond OBS
- Advanced analytics
- Community feedback loops
- Enhanced validation
- Export format diversity

---

## 16. Key Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Workflow time reduction | 30% vs. manual | MVP phase |
| Reviewer rejection rate | ≤20% improvement | MVP phase |
| Pilot team adoption | ≥3 teams | MVP phase |
| Weekly cycle completion | Weekly | MVP phase |
| Test coverage | >80% | In progress |
| Export roundtrip validation | 100% | In progress |

---

## 17. Contact & Governance

**Project Lead:** Benjamin Gundert  
**Repository:** gundert-translation-editor  
**Active App:** nextjs-app/  
**Documentation:** docs/ folder  
**Agent Guidelines:** AGENTS.md (root), AGENTS.md (nextjs-app/)

---

_Document generated: 2026-06-18_  
_Last updated: Sprint 2, MVP Implementation_
