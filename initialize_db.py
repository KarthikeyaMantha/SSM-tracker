import sqlite3
import os
import sys

def main():
    db_file = "marketing.db"
    schema_file = "schema.sql"

    print("=== Initializing SQLite Database ===")

    # 1. Read SQL schema
    if not os.path.exists(schema_file):
        print(f"Error: Schema file '{schema_file}' not found.")
        sys.exit(1)

    with open(schema_file, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    # 2. Modify SQL schema for SQLite compatibility
    # SQLite does not support SERIAL. We replace "SERIAL PRIMARY KEY" with "INTEGER PRIMARY KEY AUTOINCREMENT"
    sqlite_schema_sql = schema_sql.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
    # For TIMESTAMP DEFAULT CURRENT_TIMESTAMP we'll keep as is since SQLite supports it.

    # 3. Connect to SQLite database
    print(f"Connecting to database: {db_file}")
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Enable foreign keys in SQLite
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 4. Create Tables
    print("Executing schema to create tables...")
    try:
        # SQLite's executescript automatically commits
        cursor.executescript(sqlite_schema_sql)
        print("Tables created successfully.")
    except sqlite3.Error as e:
        print(f"Error executing schema: {e}")
        conn.close()
        sys.exit(1)

    # 5. Insert Mock Data
    print("Inserting mock data for verification...")
    try:
        # Clients
        clients_data = [
            ("C001", "Acme Corp", "Technology", "Alice Smith", 5000.00, "2026-01-15", "Active"),
            ("C002", "Global Health", "Healthcare", "Bob Jones", 7500.00, "2026-02-10", "Active"),
            ("C003", "Eco Retail", "Retail", "Alice Smith", 3200.00, "2026-03-01", "Active")
        ]
        cursor.executemany("""
            INSERT INTO clients (client_id, client_name, industry, account_manager, monthly_retainer, start_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, clients_data)

        # Campaigns
        campaigns_data = [
            ("CMP001", "C001", "SaaS Launch 2026", "Drive registrations", 15000.00, "2026-03-01", "2026-06-30", "Active", 500, 25000.00),
            ("CMP002", "C002", "Wellness Summit", "Promote ticket sales", 20000.00, "2026-04-10", "2026-08-15", "Active", 1000, 50000.00),
            ("CMP003", "C003", "Summer Sale 2026", "Increase online orders", 8000.00, "2026-05-01", "2026-07-31", "Active", 300, 12000.00)
        ]
        cursor.executemany("""
            INSERT INTO campaigns (campaign_id, client_id, campaign_name, goal, budget, start_date, end_date, status, expected_leads, expected_revenue)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, campaigns_data)

        # Content Master
        content_data = [
            ("CNT001", "CMP001", "C001", "Top 5 SaaS Trends", "SaaS Trends", "Educational", "TOFU", "LinkedIn", "Infographic", "High", "Alice Smith", "2026-06-01", "09:00:00", "Published", "Healthy", "Here are the top SaaS trends...", "#saas #tech", "http://canva.com/1", "http://drive.google.com/1"),
            ("CNT002", "CMP001", "C001", "Product Demo Video", "Product Walkthrough", "Product Features", "MOFU", "YouTube", "Video", "Medium", "John Doe", "2026-06-15", "14:00:00", "Published", "Healthy", "Watch our demo...", "#demo #saas", "http://canva.com/2", "http://drive.google.com/2"),
            ("CNT003", "CMP002", "C002", "Healthy Habits Campaign", "Wellness", "Inspirational", "TOFU", "Instagram", "Carousel", "High", "Bob Jones", "2026-06-20", "10:30:00", "Published", "Healthy", "Start your day right...", "#health #wellness", "http://canva.com/3", "http://drive.google.com/3")
        ]
        cursor.executemany("""
            INSERT INTO content_master (content_id, campaign_id, client_id, content_title, topic, content_pillar, funnel_stage, platform, content_format, priority, owner, publish_date, publish_time, status, health_status, caption, hashtags, canva_link, drive_link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, content_data)

        # Content Production
        production_data = [
            ("CNT001", "Jane Copywriter", "Approved", "Dave Designer", "Approved", None, "Not Required", 2),
            ("CNT002", "Jane Copywriter", "Approved", None, "Not Required", "Vince VideoEditor", "Approved", 1),
            ("CNT003", "Mark Writer", "In Review", "Dave Designer", "Approved", None, "Not Required", 3)
        ]
        cursor.executemany("""
            INSERT INTO content_production (content_id, copywriter, writer_status, designer, design_status, video_editor, editing_status, revision_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, production_data)

        # Performance Tracker
        performance_data = [
            ("CNT001", 5000, 12000, 350, 45, 80, 110, 240, 15, 750.00, 4.88, 8.5),
            ("CNT002", 2500, 4000, 180, 25, 12, 5, 150, 45, 2250.00, 5.43, 9.0),
            ("CNT003", 8000, 15000, 920, 115, 310, 405, 520, 85, 4250.00, 8.97, 9.5)
        ]
        cursor.executemany("""
            INSERT INTO performance_tracker (content_id, reach, impressions, likes, comments, shares, saves, link_clicks, leads_generated, revenue_generated, engagement_rate, content_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, performance_data)

        conn.commit()
        print("Mock data inserted successfully.")

    except sqlite3.Error as e:
        print(f"Error inserting mock data: {e}")
        conn.rollback()
        conn.close()
        sys.exit(1)

    # 6. Verification Queries
    print("\n=== Verifying Database Integrity & Contents ===")
    try:
        # Check created tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = cursor.fetchall()
        print(f"Created Tables in database: {[t[0] for t in tables]}")

        # Check total row counts
        for table in [t[0] for t in tables]:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"- Table '{table}': {count} rows")

        # Run a join query to verify foreign key relations and data accessibility
        print("\nRunning a sample reporting query (Join of Client -> Campaign -> Content -> Performance):")
        query = """
            SELECT 
                cl.client_name,
                c.campaign_name,
                cm.content_title,
                cm.platform,
                pt.reach,
                pt.leads_generated,
                pt.revenue_generated
            FROM content_master cm
            JOIN clients cl ON cm.client_id = cl.client_id
            JOIN campaigns c ON cm.campaign_id = c.campaign_id
            LEFT JOIN performance_tracker pt ON cm.content_id = pt.content_id
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        print(f"{'Client':<15} | {'Campaign':<20} | {'Content Title':<25} | {'Platform':<10} | {'Reach':<6} | {'Leads':<5} | {'Revenue':<8}")
        print("-" * 100)
        for row in rows:
            print(f"{row[0]:<15} | {row[1]:<20} | {row[2]:<25} | {row[3]:<10} | {row[4]:<6} | {row[5]:<5} | ${row[6]:<8.2f}")

    except sqlite3.Error as e:
        print(f"Error during verification: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
