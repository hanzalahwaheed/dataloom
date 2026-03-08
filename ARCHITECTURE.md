# Architecture & Code Structure

This document explains how DataLoom is structured, how the backend and frontend interact, and how tabular data moves through the system.

It is intended for contributors who want a practical mental model before changing code.

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Repository Layout](#repository-layout)
3. [Backend (`dataloom-backend`)](#backend-dataloom-backend)
4. [Frontend (`dataloom-frontend`)](#frontend-dataloom-frontend)
5. [Core Data Flows](#core-data-flows)
6. [Testing & Quality](#testing--quality)
7. [Runtime & Deployment](#runtime--deployment)
8. [Environment Variables](#environment-variables)
9. [Extension Guide](#extension-guide)
10. [Tradeoffs & Constraints](#tradeoffs--constraints)

---

## High-Level Overview

DataLoom is a full-stack data-wrangling application for CSV files:

- **Frontend**: React 18 + Vite + Tailwind (`dataloom-frontend`)
- **Backend**: FastAPI + SQLModel + pandas (`dataloom-backend`)
- **Database**: PostgreSQL (with Alembic migrations)
- **File storage**: local filesystem (`uploads/`) for original and working CSV copies

At runtime, the backend stores:

- project metadata in PostgreSQL
- transformation history and checkpoints in PostgreSQL
- actual dataset rows in CSV files on disk

### Runtime Topology

```text
┌──────────────────────────────┐      HTTP/JSON       ┌──────────────────────────────┐
│ React SPA (Vite / serve)     │ ───────────────────► │ FastAPI backend              │
│ Port 3200                    │ ◄─────────────────── │ Port 4200                    │
└──────────────────────────────┘                      └──────────────┬───────────────┘
                                                                     │
                                                                     │ SQLAlchemy / SQLModel
                                                                     ▼
                                                         ┌──────────────────────────────┐
                                                         │ PostgreSQL                   │
                                                         │ projects, user_logs,         │
                                                         │ checkpoints                  │
                                                         └──────────────────────────────┘
                                                                     │
                                                                     │ CSV reads/writes
                                                                     ▼
                                                         ┌──────────────────────────────┐
                                                         │ Local file storage           │
                                                         │ uploads/*.csv                │
                                                         │ uploads/*_copy.csv           │
                                                         └──────────────────────────────┘
```

### Core Architectural Pattern

- **Backend**: Endpoint layer -> service layer -> utility/data layer
- **Frontend**: Route/screen layer -> form/table components -> API client layer

---

## Repository Layout

```text
dataloom/
├── dataloom-backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py
│   │   │   └── endpoints/
│   │   │       ├── projects.py
│   │   │       ├── transformations.py
│   │   │       └── user_logs.py
│   │   ├── services/
│   │   │   ├── file_service.py
│   │   │   ├── project_service.py
│   │   │   └── transformation_service.py
│   │   ├── utils/
│   │   │   ├── logging.py
│   │   │   ├── pandas_helpers.py
│   │   │   └── security.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── exceptions.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── dataloom-frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── Components/
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── history/
│   │   │   ├── layout/
│   │   │   ├── DataScreen.jsx
│   │   │   ├── Homescreen.jsx
│   │   │   ├── MenuNavbar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Table.jsx
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── constants/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Backend (`dataloom-backend`)

### Tech Stack

- FastAPI (web framework)
- SQLModel + SQLAlchemy (ORM and session management)
- pandas (dataset transformation engine)
- Alembic (schema migration)
- Pydantic Settings (env config)

### Startup Lifecycle

`app/main.py` defines a lifespan hook that:

1. runs `alembic upgrade head`
2. initializes logging
3. ensures the upload directory exists

This means schema migrations are automatically applied on backend startup.

### Backend Module Responsibilities

| Module | Responsibility |
|---|---|
| `app/main.py` | App bootstrapping, middleware, router registration, exception handlers |
| `app/config.py` | Env-driven settings (`database_url`, `cors_origins`, `upload_dir`, etc.) |
| `app/database.py` | SQLModel engine and `get_db()` dependency |
| `app/models.py` | ORM models for projects, logs, checkpoints |
| `app/schemas.py` | API request/response contracts and enums |
| `app/api/endpoints/*.py` | HTTP endpoints grouped by domain |
| `app/services/project_service.py` | DB operations (project CRUD, logs, checkpoints) |
| `app/services/file_service.py` | Upload persistence and file cleanup |
| `app/services/transformation_service.py` | Pure pandas transformation functions |
| `app/utils/security.py` | Upload/path/query safety checks |
| `app/utils/pandas_helpers.py` | CSV IO wrappers and API response shaping |

### API Surface

All project and transformation routes live under `/projects`; logs live under `/logs`.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/projects/upload` | Upload CSV and create project |
| `GET` | `/projects/get/{project_id}` | Fetch full project rows/columns |
| `GET` | `/projects/recent` | Get recently modified projects |
| `POST` | `/projects/{project_id}/transform` | Apply one transformation operation |
| `POST` | `/projects/{project_id}/save` | Save pending changes as checkpoint |
| `POST` | `/projects/{project_id}/revert` | Revert working copy to original or checkpoint |
| `GET` | `/projects/{project_id}/export` | Download current working CSV |
| `DELETE` | `/projects/{project_id}` | Delete project + associated files |
| `GET` | `/logs/{project_id}` | Fetch transformation logs |
| `GET` | `/logs/checkpoints/{project_id}` | Fetch latest checkpoint summary |

### Data Model

`app/models.py` defines three core entities:

| Table | Key fields | Notes |
|---|---|---|
| `projects` | `project_id (UUID)`, `name`, `description`, `file_path`, `upload_date`, `last_modified` | `file_path` points to current working copy (`*_copy.csv`) |
| `user_logs` | `change_log_id`, `project_id`, `action_type`, `action_details (JSON)`, `checkpoint_id`, `applied` | Stores each mutating transformation request |
| `checkpoints` | `id (UUID)`, `project_id`, `message`, `created_at` | Save points used for revert |

Relationships:

- one project -> many logs
- one project -> many checkpoints
- one checkpoint -> many logs (via `checkpoint_id`)

### Transformation Architecture

#### Single Endpoint, Multiple Operations

All transformations are routed through:

- `POST /projects/{project_id}/transform`

The endpoint inspects `operation_type` and dispatches to pure functions in `transformation_service.py`.

#### Operation Persistence Rules

Transformations are intentionally split into:

- **Mutating and persisted**: `addRow`, `delRow`, `addCol`, `delCol`, `changeCellValue`, `fillEmpty`, `dropDuplicate`, `renameCol`, `castDataType`, `trimWhitespace`
- **Read-only preview**: `filter`, `sort`, `advQueryFilter`, `pivotTables`

For mutating operations:

1. updated dataframe is written to working copy CSV
2. action is stored in `user_logs` (with `applied=false`)

### File Storage Strategy

On upload:

- backend stores a sanitized original file (`*.csv`)
- backend creates a working copy (`*_copy.csv`)
- project record points to the working copy path

This allows non-destructive editing while preserving the original baseline.

### Save/Revert Model

#### Save (`/projects/{id}/save`)

1. load original CSV (not working copy)
2. fetch all unapplied logs in timestamp order
3. replay each logged transformation on original
4. overwrite original CSV with result
5. create checkpoint
6. mark all replayed logs as `applied=true` and bind them to the checkpoint

#### Revert (`/projects/{id}/revert`)

- If no `checkpoint_id`: reset working copy from original
- If checkpoint provided:
  1. start from original CSV
  2. collect applied logs up to that checkpoint time
  3. replay them
  4. overwrite working copy

### Migration Strategy

- Alembic environment uses SQLModel metadata
- migrations are in `alembic/versions/`
- notable historical changes:
  - integer IDs -> UUIDs
  - table rename: `datasets` -> `projects`
  - seed migration that adds sample projects and sample CSV files

### Error Handling & Logging

- Domain errors use `TransformationError` and map to HTTP 400
- Standardized app-level `AppException` response shape is available
- API utilities raise `HTTPException` for IO/query failures
- Logging is centralized with configurable debug level

### Security Controls

Current controls in `app/utils/security.py`:

- filename sanitization (strip path components + unsafe chars + UUID prefix)
- upload path confinement (prevents traversal outside upload dir)
- extension whitelist (default `.csv`)
- dangerous expression detection for advanced query input (`df.query()`)

---

## Frontend (`dataloom-frontend`)

### Tech Stack

- React 18
- React Router v6
- Axios
- TailwindCSS
- Vite (build/dev server)
- Vitest + Testing Library

### App Composition

`src/App.jsx` wraps routes with:

1. `ErrorBoundary`
2. `ToastProvider`
3. `ProjectProvider`
4. `BrowserRouter`

Routes:

- `/` -> redirect to `/projects`
- `/projects` -> project home/upload screen
- `/workspace/:projectId` -> transformation workspace
- `*` -> 404 page

### State Management

#### `ProjectContext`

Holds active workspace state:

- `projectId`, `projectName`
- `columns`, `rows`, `dtypes`
- loading/error flags
- `refreshProject()` and `updateData()`

This is the central source for table render state.

#### `ToastContext`

Global toast queue with typed notifications (`success`, `error`, `info`, `warning`).

### UI Architecture

| Component | Role |
|---|---|
| `Navbar` | Global top nav; shows current project name in workspace mode |
| `Homescreen` | Project list, upload modal, delete flow |
| `DataScreen` | Workspace shell; composes transform toolbar + table |
| `MenuNavbar` | Command surface for save/export/logs/checkpoints/forms |
| `Table` | Grid rendering, inline cell edits, context menus for row/col ops |
| `forms/*` | Specialized transform forms (filter/sort/pivot/etc.) |
| `history/*` | Logs and checkpoint side panels |
| `common/*` | Reusable UI primitives (Modal, Button, Toast, dialogs, badges) |

### API Layer

- `src/api/client.js`: configured Axios instance with timeout and centralized error logging
- `src/api/projects.js`: upload/get/save/revert/export/delete
- `src/api/transforms.js`: transform endpoint wrapper
- `src/api/logs.js`: logs + checkpoint calls

Default backend base URL is `http://localhost:4200`, overridable via `VITE_API_BASE_URL`.

### Frontend Transformation Flow

- Table-triggered mutating operations update server and context immediately
- Some form-driven operations (`filter`, `sort`, `advQueryFilter`, `pivotTables`) currently show preview results without replacing global table state
- Save/revert/export/checkpoint actions are orchestrated from `MenuNavbar`

---

## Core Data Flows

### 1. Upload Project

1. User uploads CSV from `Homescreen`
2. Frontend sends multipart `POST /projects/upload`
3. Backend validates extension and stores original + working copy
4. Backend creates `projects` row and returns parsed rows/columns
5. Frontend navigates to `/workspace/{projectId}`

### 2. Mutating Transform (example: add row)

1. Workspace action sends `POST /projects/{id}/transform`
2. Backend applies pandas operation
3. Backend writes working copy CSV
4. Backend logs action in `user_logs (applied=false)`
5. Frontend updates table/context with returned rows/columns

### 3. Read-Only Transform (example: sort)

1. Frontend sends transform request
2. Backend computes result but does not persist CSV/log
3. Form component renders preview table from response

### 4. Save Checkpoint

1. User enters commit message
2. Frontend calls `POST /projects/{id}/save?commit_message=...`
3. Backend replays unapplied logs onto original CSV
4. Backend creates checkpoint and marks logs as applied

### 5. Revert to Checkpoint

1. Frontend calls `POST /projects/{id}/revert?checkpoint_id=...`
2. Backend reconstructs data from original + applied logs up to checkpoint
3. Backend overwrites working copy and returns current dataset

### 6. Export/Delete

- Export: `GET /projects/{id}/export` -> browser download blob
- Delete: `DELETE /projects/{id}` -> removes DB row and both CSV files

---

## Testing & Quality

### Backend Tests (`pytest`)

Test suite covers:

- transformation functions (filter/sort/add/delete/pivot/query)
- save/checkpoint behavior
- upload security checks
- dtype mapping response fields
- newer features (rename/cast/export/delete)

Backend tests use:

- SQLite test DB via dependency override
- temporary file fixtures for CSV uploads

### Frontend Tests (`vitest`)

Current coverage emphasizes:

- API client configuration
- reusable UI primitives (`Button`, `Modal`, `DtypeBadge`)
- utility functions (`logger`, table serial-number helper)

### Static Tooling

- Backend: Ruff (lint + format), pre-commit support
- Frontend: ESLint + Prettier

---

## Runtime & Deployment

### Local Development

- Backend dev server: Uvicorn on port `4200`
- Frontend dev server: Vite on port `3200`

### Docker

`docker-compose.yml` brings up:

1. `db` (PostgreSQL 16)
2. `backend` (Python 3.12 image with `uv`-managed dependencies)
3. `frontend` (Node 18 build, served via `serve`)

---

## Environment Variables

### Backend (`dataloom-backend/.env`)

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | SQL connection string | `postgresql://postgres:postgres@localhost:5432/dataloom` |
| `CORS_ORIGINS` | Allowed frontend origins | `["http://localhost:3200"]` |
| `UPLOAD_DIR` | CSV storage directory | `uploads` |
| `MAX_UPLOAD_SIZE_BYTES` | Intended upload cap setting | `10485760` |
| `DEBUG` | Backend debug logging flag | `false` |

### Frontend (`.env` / shell)

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:4200` |
| `VITE_API_TIMEOUT` | Axios timeout (ms) | `30000` |

---

## Extension Guide

### Add a New Transformation

1. Add enum in `app/schemas.py` (`OperationType`, maybe parameter schema)
2. Implement function in `app/services/transformation_service.py`
3. Wire operation in `app/api/endpoints/transformations.py`
4. Decide persistence behavior (`should_save` true/false)
5. Add frontend form/control and API payload shape
6. Add backend tests + frontend tests

### Add a New Endpoint

1. Create endpoint function in appropriate router under `app/api/endpoints/`
2. Add or reuse schema classes in `app/schemas.py`
3. Add service-layer function where business logic belongs
4. Update frontend API module and consuming UI

### Add a New Project-Level Feature in UI

1. Keep data shape compatible with `ProjectContext`
2. Centralize network calls in `src/api/*`
3. Reuse common components (`Modal`, `Button`, `Toast`) for consistent UX

---

## Tradeoffs & Constraints

1. **No auth/authorization layer yet**: APIs are currently open within trusted environments.
2. **CSV-on-filesystem storage**: simple and fast for local usage, but not ideal for distributed/multi-instance deployments.
3. **In-memory pandas transforms**: easy to reason about, but large files can increase memory/latency.
4. **Read-only transform previews**: `filter/sort/query/pivot` do not currently mutate workspace state by design.
5. **Checkpoint API returns latest checkpoint only**: UI currently reverts to last save point rather than arbitrary historical list selection.

