# GSoC Proposal Draft

## Title
Multi-Source Data Profiling, Transformation Pipelines, Visualization Engine, Data Quality Analysis, and Multi-Format Export for DataLoom

## Abstract
DataLoom currently provides CSV-based wrangling with a git-like checkpoint and revert workflow. Users can upload a CSV, run pandas-backed transformations, and persist named checkpoints. The current version is effective for basic wrangling, but has major limitations: single-format ingestion, no data profiling, no visual analytics, manual column typing in forms, and no data quality framework.

This project upgrades DataLoom into a complete data preparation platform through seven integrated feature pillars:

1. Multi-format ingestion and automated profiling
2. Profiling UI and column-selector refactor
3. Merge/join and concat across projects
4. Formula columns and reusable transformation pipelines
5. Visualization panel for common chart types
6. Automated data quality analysis and one-click fixes
7. Multi-format export and downloadable quality reports

The implementation will preserve DataLoom’s existing architecture (FastAPI + pandas backend, React frontend, checkpoint-based history) while adding new services, endpoints, schemas, UI panels, and test coverage.

---

## Problem Statement
Modern data preparation requires more than one-off row/column operations. Real datasets come from multiple file formats, require immediate profiling before transformation, need joins across sources, and demand quality validation before export.

DataLoom currently lacks:

1. Support for xlsx/json/parquet/tsv upload and export
2. Instant profiling insight (nulls, distincts, distributions, dtypes)
3. Guided column selection UI (forms still rely on free-text field names in several flows)
4. Multi-dataset merge/join/concat workflows
5. Reusable transformation pipelines
6. In-app charting for sanity checks and communication
7. Automated quality checks and report generation

This proposal addresses all seven gaps while keeping the checkpoint/revert experience intact.

---

## Project Goals

1. Support input formats: CSV, TSV, XLSX, JSON, Parquet
2. Generate automatic dataset profiles on upload and on demand
3. Replace manual column entry with dropdown selectors in all transformation forms
4. Add join/merge/concat operations across projects
5. Add formula column creation and reusable named pipelines
6. Add histogram/bar/scatter/time-series charts in workspace
7. Add quality analysis: duplicates, outliers, pattern violations, composite quality scores
8. Add one-click data quality fix actions
9. Support export formats: CSV, TSV, XLSX, JSON, Parquet
10. Generate downloadable HTML/PDF quality reports

---

## Expected Outcomes

1. Users can ingest and export across five tabular formats without leaving the platform.
2. Every uploaded project has a profile summary and per-column diagnostics.
3. Users no longer type column names manually in transformation forms.
4. Two projects can be joined or concatenated through UI + backend APIs.
5. Users can create formula columns and save/replay transformation pipelines.
6. Users can inspect distributions and correlations using built-in charts.
7. Quality issues are detected and scored automatically with guided fixes.
8. Users can download complete quality reports (HTML/PDF) alongside transformed data.

---

## Proposed Technical Design

### 1) Backend Architecture Changes (FastAPI + pandas)

#### 1.1 New service modules

1. `app/services/format_service.py`
2. `app/services/profiling_service.py`
3. `app/services/join_service.py`
4. `app/services/formula_service.py`
5. `app/services/pipeline_service.py`
6. `app/services/quality_service.py`
7. `app/services/report_service.py`

#### 1.2 Existing modules to update

1. `app/services/file_service.py` for extension-aware storage
2. `app/services/transformation_service.py` for join/formula/pipeline replay support
3. `app/api/endpoints/projects.py` for multi-format upload/export/report endpoints
4. `app/api/endpoints/transformations.py` for new operation types
5. `app/schemas.py` for new request/response models
6. `app/models.py` for profile/pipeline/quality metadata tables
7. `app/utils/pandas_helpers.py` for format-aware read/write wrappers

#### 1.3 New core entities

1. `ProjectProfile`
2. `TransformationPipeline`
3. `PipelineStep`
4. `QualityAssessment`
5. `QualityIssue`

These are metadata tables; primary dataset content remains file-based.

#### 1.4 API additions (proposed)

1. `GET /projects/{project_id}/profile`
2. `POST /projects/{project_id}/profile/recompute`
3. `POST /projects/{project_id}/transform` (extended ops: join/concat/formula)
4. `POST /projects/{project_id}/join`
5. `POST /projects/{project_id}/concat`
6. `POST /pipelines`
7. `GET /pipelines`
8. `GET /pipelines/{pipeline_id}`
9. `POST /pipelines/{pipeline_id}/apply/{project_id}`
10. `GET /projects/{project_id}/quality`
11. `POST /projects/{project_id}/quality/run`
12. `POST /projects/{project_id}/quality/fix`
13. `GET /projects/{project_id}/export?format=...`
14. `GET /projects/{project_id}/quality-report?format=html|pdf`

---

### 2) Frontend Architecture Changes (React)

#### 2.1 New UI panels/components

1. `src/Components/profile/DataProfilePanel.jsx`
2. `src/Components/quality/DataQualityPanel.jsx`
3. `src/Components/charts/VisualizationPanel.jsx`
4. `src/Components/pipeline/PipelineBuilder.jsx`
5. `src/Components/forms/JoinForm.jsx`
6. `src/Components/forms/ConcatForm.jsx`
7. `src/Components/forms/FormulaColumnForm.jsx`
8. `src/Components/forms/ExportOptionsDialog.jsx`

#### 2.2 Existing components to refactor

1. `FilterForm.jsx` column selector dropdown
2. `SortForm.jsx` column selector dropdown
3. `DropDuplicateForm.jsx` multi-column selector dropdown
4. `PivotTableForm.jsx` selector-driven index/column/value inputs
5. `CastDataTypeForm.jsx` keep selector pattern and improve consistency
6. `TrimWhitespaceForm.jsx` selector UX + all-string-columns option

#### 2.3 New API modules

1. `src/api/profile.js`
2. `src/api/pipelines.js`
3. `src/api/quality.js`
4. `src/api/charts.js` (if server-side aggregation endpoints are introduced)

#### 2.4 State integration

1. Extend `ProjectContext` to include `profile`, `qualitySummary`, `activePipeline`
2. Keep data grid as source-of-truth for current transformed dataset
3. Ensure charts and profile refresh after every mutating operation

---

## Feature-by-Feature Implementation Plan

### Pillar A: Multi-format upload and profiling

1. Add extension-aware loader:
   1. CSV/TSV: `pd.read_csv`
   2. XLSX: `pd.read_excel`
   3. JSON: `pd.read_json`
   4. Parquet: `pd.read_parquet`
2. Preserve original extension for round-trip export.
3. Trigger profile generation post-upload.
4. Profile includes:
   1. dataset shape
   2. column dtype inference
   3. null counts and percentages
   4. distinct counts
   5. top values/frequencies
   6. numeric summary stats and quantiles
5. Store profile metadata as JSON in DB for quick retrieval.

### Pillar B: Profiling panel and column selector refactor

1. Build `DataProfilePanel` with:
   1. dataset summary cards
   2. per-column stats table
   3. quick warnings (high null %, high cardinality)
2. Replace all free-text column fields in six forms with dropdowns bound to `ProjectContext.columns`.
3. Add searchable select for wide datasets.

### Pillar C: Merge/join and concat

1. Add join endpoint accepting:
   1. `left_project_id`
   2. `right_project_id`
   3. `join_type` (inner/left/right/outer/cross)
   4. `left_on`, `right_on`, `suffixes`
2. Add concat endpoint accepting:
   1. project IDs
   2. axis
   3. join mode
3. Persist joined result into active project working copy.
4. Log join/concat action in change-log for checkpoint replay compatibility.

### Pillar D: Formula columns and reusable pipelines

1. Add formula operation:
   1. new column name
   2. safe expression string
2. Implement safe expression evaluation:
   1. AST validation allowlist
   2. blocked imports/functions/dunder access
   3. controlled namespace with selected pandas/numpy-safe ops
3. Add pipeline persistence:
   1. pipeline name + description
   2. ordered transformation steps (JSON payloads)
4. Add pipeline replay endpoint to apply all steps to any compatible project.

### Pillar E: Visualization panel

1. Use `recharts` for:
   1. histogram (numeric)
   2. bar chart (categorical counts)
   3. scatter plot (numeric vs numeric)
   4. time-series line chart
2. Add chart configuration state:
   1. selected chart type
   2. x/y columns
   3. bin count / aggregation options
3. Perform lightweight preprocessing client-side for moderate sizes.
4. Add optional backend aggregation endpoint if row-count exceeds configured threshold.

### Pillar F: Data quality engine

1. Duplicate detection:
   1. exact duplicates (`duplicated`)
   2. fuzzy duplicates (`rapidfuzz`) for selected columns
2. Outlier detection:
   1. IQR
   2. z-score
   3. Isolation Forest (scikit-learn)
3. Pattern validation:
   1. regex rules per column
   2. type consistency checks
4. Composite quality score:
   1. weighted score model (configurable)
   2. issue breakdown by severity
5. One-click fixes:
   1. drop duplicates
   2. fill nulls by strategy
   3. clip/remove outliers
   4. trim whitespace/type coercion

### Pillar G: Multi-format export and quality reports

1. Extend export endpoint to support:
   1. csv
   2. tsv
   3. xlsx
   4. json
   5. parquet
2. Add export options:
   1. index inclusion
   2. delimiter choice
   3. json orient
   4. parquet compression
3. Quality report generation:
   1. HTML report via template engine
   2. PDF rendering from HTML
   3. includes profile summary, quality score, issue tables, chart snapshots

---

## Deliverables

1. Multi-format import/export for tabular data
2. Profile computation backend + profile UI panel
3. Dropdown-based column selectors across all targeted forms
4. Join/concat operations in backend + frontend
5. Formula column creation
6. Pipeline CRUD and replay
7. Visualization panel with four chart types
8. Quality analysis engine and fix actions
9. HTML/PDF quality report generation
10. Automated tests, API docs, and user documentation updates

---

## Non-Deliverables

1. Real-time collaborative editing
2. Distributed processing for multi-GB datasets
3. Full BI dashboard functionality
4. Arbitrary Python code execution in formulas
5. Streaming data source connectors

---

## Timeline (12 weeks coding + bonding)

### Community Bonding (pre-coding)

1. Align scope with mentors
2. Finalize DB schema and endpoint contracts
3. Prepare migration and testing strategy

### Week 1

1. Add format-aware IO service and dependencies
2. Implement upload support for xlsx/json/parquet/tsv
3. Add integration tests for upload matrix

### Week 2

1. Implement profiling service and profile schema
2. Add profile endpoints and persistence
3. Add frontend profile panel scaffold

### Week 3

1. Complete profile panel UX
2. Refactor 6 transformation forms to selector-driven inputs
3. Add frontend tests for selector behavior

### Week 4

1. Implement join/concat backend services and endpoints
2. Add join/concat forms in workspace
3. Add end-to-end tests for merge semantics

### Week 5

1. Implement formula column backend with safe evaluator
2. Add formula form and validation UX
3. Add security tests for formula sandbox

### Week 6 (Midterm Milestone)

1. Pipeline models + API (create/list/apply)
2. Pipeline builder UI and replay
3. Midterm documentation and demo

### Week 7

1. Add visualization panel with histogram + bar charts
2. Add scatter and time-series support
3. Optimize chart preprocessing paths

### Week 8

1. Build quality service: exact duplicates + null checks + pattern validation
2. Add quality summary panel
3. Add fix actions (dedupe/fill/trim)

### Week 9

1. Add outlier detection modes (IQR/z-score/Isolation Forest)
2. Add composite scoring and severity buckets
3. Extend quality panel drill-down views

### Week 10

1. Implement multi-format export options
2. Add HTML quality report generation
3. Add report download UI

### Week 11

1. Add PDF report generation pipeline
2. Add regression tests for profile/quality/report flows
3. Polish API documentation and user docs

### Week 12 (Final Milestone)

1. Bug fixing and performance hardening
2. Full demo walkthrough
3. Final report and handover

---

## Evaluation Plan

### Midterm Success Criteria

1. Multi-format upload functional with tests
2. Profiling API + profile panel merged
3. Column selector refactor completed for targeted forms
4. Join/concat features operational
5. Formula columns and pipeline MVP completed

### Final Success Criteria

1. Visualization panel ships with 4 chart types
2. Quality engine detects duplicates/outliers/pattern issues
3. Composite quality score and one-click fixes operational
4. Multi-format export + HTML/PDF reports completed
5. Documentation and tests meet contribution standards

---

## Risks and Mitigations

1. Risk: scope too large for one cycle
   1. Mitigation: strict milestone gating, prioritize core engine over advanced UI polish
2. Risk: parquet/pdf dependency complexity
   1. Mitigation: early dependency validation in week 1 and week 10
3. Risk: quality checks become slow on large data
   1. Mitigation: sampling, column-scoped checks, configurable limits
4. Risk: formula security surface
   1. Mitigation: AST allowlist + extensive negative tests

---

## Testing Strategy

1. Backend unit tests for each service
2. API integration tests for profile/join/pipeline/quality/export
3. Frontend component tests for new panels and selector forms
4. End-to-end flow tests:
   1. upload -> profile -> transform -> save -> quality -> report -> export
5. Performance checks on representative medium datasets

---

## Prerequisites and Skills Alignment

This project requires:

1. Strong Python and pandas skills
2. React/JavaScript proficiency
3. SQL join semantics and transformation pipeline understanding
4. Experience with charting libraries such as Recharts

These match the proposed implementation areas and testing demands.

---

## Why this proposal fits DataLoom

The design intentionally builds on the current architecture instead of replacing it:

1. Keeps FastAPI + pandas transformation core
2. Preserves checkpoint/revert workflow
3. Extends existing `transform` contract with additional operation types
4. Adds capabilities in modular services for maintainable long-term growth

