import schedule
import time
import requests
import pandas as pd
from sqlalchemy import create_engine, text
import os
from datetime import datetime

# Load DB URI from environment variables with SQLite fallback
DB_URI = os.getenv("DATABASE_URL", "sqlite:///marketing.db")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")

engine = create_engine(DB_URI)

def send_slack_alert(message, color="#ff0000"):
    """Sends a formatted message to Slack/Microsoft Teams or logs it locally if webhook not set"""
    payload = {
        "text": "[ALERT] Quantira Content OS Alert",
        "attachments": [
            {
                "color": color,
                "text": message
            }
        ]
    }
    
    if SLACK_WEBHOOK_URL:
        try:
            response = requests.post(SLACK_WEBHOOK_URL, json=payload)
            if response.status_code == 200:
                print(f"[{datetime.now()}] Slack alert sent successfully.")
            else:
                print(f"[{datetime.now()}] Failed to send Slack alert. Status code: {response.status_code}")
        except Exception as e:
            print(f"[{datetime.now()}] Failed to send Slack alert: {e}")
    else:
        # Fallback logging to file & terminal (useful for local verification)
        log_msg = f"--- MOCK SLACK ALERT ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ---\n"
        log_msg += f"Color: {color}\n"
        log_msg += f"Message:\n{message}\n"
        log_msg += "-" * 50 + "\n"
        
        print(log_msg)
        with open("alerts.log", "a", encoding="utf-8") as lf:
            lf.write(log_msg)

def check_overdue_posts():
    """Checks for content items past their publish date that are not Published"""
    # SQLite uses DATE('now') while PostgreSQL uses CURRENT_DATE
    # We choose a query compatible with both
    is_sqlite = engine.dialect.name == "sqlite"
    date_func = "DATE('now')" if is_sqlite else "CURRENT_DATE"
    
    query = f"""
        SELECT content_id, content_title, owner, publish_date 
        FROM content_master 
        WHERE status != 'Published' AND publish_date < {date_func}
    """
    try:
        df = pd.read_sql(text(query), engine)
        if not df.empty:
            message = f"[WARNING] *{len(df)} posts are OVERDUE!*\n\n"
            for _, row in df.iterrows():
                message += f"• *{row['content_title']}* (Owner: {row['owner']}) - Due: {row['publish_date']}\n"
            send_slack_alert(message, color="#ff0000")
        else:
            print(f"[{datetime.now()}] Checked overdue posts: None found.")
    except Exception as e:
        print(f"[{datetime.now()}] Error checking overdue posts: {e}")

def check_pending_approvals():
    """Reminds reviewers of pending approvals"""
    query = """
        SELECT a.content_id, cm.content_title, a.requested_by 
        FROM approvals a
        JOIN content_master cm ON a.content_id = cm.content_id
        WHERE a.approval_status = 'Pending'
    """
    try:
        df = pd.read_sql(text(query), engine)
        if not df.empty:
            message = f"[ALERT] *{len(df)} posts are waiting for approval!*\n\n"
            for _, row in df.iterrows():
                message += f"• *{row['content_title']}* (Submitted by: {row['requested_by']})\n"
            send_slack_alert(message, color="#ffcc00")
        else:
            print(f"[{datetime.now()}] Checked pending approvals: None found.")
    except Exception as e:
        print(f"[{datetime.now()}] Error checking pending approvals: {e}")

# Schedule the daily checks
schedule.every().day.at("09:00").do(check_overdue_posts)
schedule.every().day.at("10:00").do(check_pending_approvals)

if __name__ == "__main__":
    print("[START] Quantira Alert Scheduler Started...")
    print(f"Connected to Database URI: {DB_URI}")
    
    # Run a test cycle immediately on launch to verify the connection and queries
    print("\nRunning initial test check cycle...")
    check_overdue_posts()
    check_pending_approvals()
    print("Initial checks completed. Entering schedule polling loop (Ctrl+C to quit)...\n")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(10) # check for scheduled jobs every 10 seconds
    except KeyboardInterrupt:
        print("Alert scheduler stopped.")
