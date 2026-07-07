# Marketing Campaign and Content Management Database

This project contains the SQL schema, seed data, and verification scripts for the marketing database using SQLite.

## Files Created

- **`schema.sql`**: The original SQL schema suitable for PostgreSQL, MySQL, or SQLite (uses standard types).
- **`schema_sqlite.sql`**: A SQLite-optimized version of the schema that converts `SERIAL PRIMARY KEY` fields to SQLite's native `INTEGER PRIMARY KEY AUTOINCREMENT` syntax and enables foreign key constraints.
- **`seed_data.sql`**: A dataset containing mock records for clients, campaigns, content master list, content production status, and performance tracking.
- **`verify_queries.sql`**: A suite of SQL queries that runs diagnostic checks, joins the tables to report campaign performance, and verifies that foreign key constraints are correctly enforced.
- **`marketing.db`**: The fully initialized and populated SQLite database.
- **`sqlite3.exe`**: The SQLite command-line tool downloaded directly from the official SQLite repository.
- **`setup_sqlite.ps1`**: The PowerShell script used to fetch the official SQLite CLI tool.

---

## How to Interact with the Database

You can interact with the SQLite database (`marketing.db`) directly using the provided `sqlite3.exe` utility.

### 1. Start the SQLite Command Line Interface
Run this command in your terminal:
```powershell
.\sqlite3.exe marketing.db
```

### 2. Run the Verification Queries
To run the diagnostic reports and check database integrity, execute:
```powershell
Get-Content verify_queries.sql | .\sqlite3.exe marketing.db
```

### 3. Basic SQL Queries

Open the database and try running these queries:

*   **View all tables:**
    ```sql
    .tables
    ```
*   **Toggle pretty column output:**
    ```sql
    .headers on
    .mode column
    ```
*   **Check client records:**
    ```sql
    SELECT * FROM clients;
    ```
*   **Show Campaign Budgets and Goals:**
    ```sql
    SELECT campaign_name, budget, goal FROM campaigns;
    ```

---

## Schema Overview

The database has 5 tables with the following relationships:

```mermaid
erDiagram
    clients ||--o{ campaigns : "manages"
    clients ||--o{ content_master : "owns"
    campaigns ||--o{ content_master : "contains"
    content_master ||--|| content_production : "tracks production"
    content_master ||--|| performance_tracker : "tracks performance"
    
    clients {
        varchar(10) client_id PK
        varchar(100) client_name
        varchar(50) industry
        varchar(100) account_manager
        decimal monthly_retainer
        date start_date
        varchar(20) status
    }
    campaigns {
        varchar(10) campaign_id PK
        varchar(10) client_id FK
        varchar(100) campaign_name
        text goal
        decimal budget
        date start_date
        date end_date
        varchar(20) status
        int expected_leads
        decimal expected_revenue
    }
    content_master {
        varchar(10) content_id PK
        varchar(10) campaign_id FK
        varchar(10) client_id FK
        varchar(255) content_title
        varchar(100) topic
        varchar(50) content_pillar
        varchar(50) funnel_stage
        varchar(50) platform
        varchar(50) content_format
        varchar(20) priority
        varchar(100) owner
        date publish_date
        time publish_time
        varchar(20) status
        varchar(20) health_status
        text caption
        text hashtags
        text canva_link
        text drive_link
    }
    content_production {
        integer production_id PK
        varchar(10) content_id FK
        varchar(100) copywriter
        varchar(20) writer_status
        varchar(100) designer
        varchar(20) design_status
        varchar(100) video_editor
        varchar(20) editing_status
        int revision_count
        timestamp last_updated
    }
    performance_tracker {
        integer performance_id PK
        varchar(10) content_id FK
        int reach
        int impressions
        int likes
        int comments
        int shares
        int saves
        int link_clicks
        int leads_generated
        decimal revenue_generated
        decimal engagement_rate
        decimal content_score
    }
```
