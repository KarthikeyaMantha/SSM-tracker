# Quantira Content OS: Complete Audit & Feature Proposal List

This document lists architectural, functional, and user interface changes that can be added to complete, optimize, or enrich the Quantira Content OS.

---

## 🛠️ Category A: Core CRUD & Database Alignments

### 1. Implement Full Clients CRUD Operations
* **Goal**: Enable editing and deleting corporate client accounts.
* **Changes**:
  * Create `/api/clients/[id]/route.ts` supporting `PATCH` and `DELETE` requests.
  * Add a form-filled edit modal in `src/app/(dashboard)/clients/page.tsx` bound to the row's Edit icon.
  * Bind the Trash icon to trigger a modal confirming permanent deletion, cascading safely down to SQLite.
* **Value**: Makes the `/clients` dashboard fully functional rather than a read-only table.

### 2. Implement Full Campaigns CRUD Operations
* **Goal**: Allow users to edit, complete, or archive campaigns.
* **Changes**:
  * Create `/api/campaigns/[id]/route.ts` supporting `PATCH` and `DELETE`.
  * Add an "Actions" column to the campaigns table in `src/app/(dashboard)/campaigns/page.tsx`.
  * Create modals to edit campaign parameters (Budget, Goal, Dates, Status) and delete.
* **Value**: Gives the user full management controls over marketing budgets.

---

## 📊 Category B: Dashboard Overview & Workspace Connections

### 3. Connect Home Dashboard to Live Database Metrics
* **Goal**: Replace hardcoded values on the landing page (`/`) with live totals.
* **Changes**:
  * Create `/api/dashboard/route.ts` calculating:
    * **Total Account Value**: Sum of active client monthly retainers.
    * **Expected Revenue & Active Budgets**: Dynamic totals aggregated from Campaign rows.
    * **Active Content Queue**: Real-time count of non-published Content Master entries.
    * **Review Pipeline**: Live list of the last 3 pending Approvals.
  * Update `src/app/(dashboard)/page.tsx` to query this API.
  * Wire the "Review" buttons to redirect the user to `/approvals` with that specific item highlighted.
  * Wire "View All" to link to `/campaigns`.
* **Value**: The landing page becomes the primary, real-time operating center of the workspace.

### 4. Implement Global Workspace Search
* **Goal**: Connect the static header search bar to query all database tables.
* **Changes**:
  * Create `/api/search?q=...` searching content titles, campaigns, and client names.
  * Add a floating dropdown result panel below the header search bar in `layout.tsx` so users can instantly click and navigate to items.
* **Value**: Enhances navigation speed across large databases.

---

## 📅 Category C: Interactive UX & Calendar Upgrades

### 5. Interactive Drag-and-Drop Calendar Scheduling
* **Goal**: Reschedule content directly on the grid.
* **Changes**:
  * Use HTML5 Drag and Drop APIs on the custom calendar cells in `calendar/page.tsx`.
  * Allow dragging platform badges from one calendar date to another, instantly firing a `PATCH` request to update `publishDate` in the database.
* **Value**: Delivers an interactive, premium Google Calendar feel.

### 6. Content Scorecard Export Reports & Analytics
* **Goal**: Export performance sheets.
* **Changes**:
  * Add "Export CSV" and "Export PDF" buttons to the Scorecard page (`/scorecard`) and Performance page (`/performance`).
  * Add a simple leaderboard widget displaying the top-performing platform and highest-scoring client campaign.
* **Value**: Essential for agency account managers to send weekly reports directly to clients.

---

## 📥 Category D: Ideation & Brief proposals

### 7. Brainstorm -> Proposal -> Intake Request Pipeline
* **Goal**: Build a workflow for clients to review ideas before production starts.
* **Changes**:
  * Update `/strategy` so that "Promote" does not bypass approval; instead, it creates a `ContentRequest` in the intake board with status `Proposal`.
  * Once the client approves the request in the Intake board, it automatically scaffolds into the main queue.
* **Value**: Implements realistic agency-client review cycles.
