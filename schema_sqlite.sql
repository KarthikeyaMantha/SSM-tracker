-- SQLite Specific Schema (optimized with AUTOINCREMENT primary keys and foreign key constraints)

PRAGMA foreign_keys = ON;

CREATE TABLE clients (
    client_id VARCHAR(10) PRIMARY KEY,
    client_name VARCHAR(100),
    industry VARCHAR(50),
    account_manager VARCHAR(100),
    monthly_retainer DECIMAL(10,2),
    start_date DATE,
    status VARCHAR(20)
);

CREATE TABLE campaigns (
    campaign_id VARCHAR(10) PRIMARY KEY,
    client_id VARCHAR(10) REFERENCES clients(client_id),
    campaign_name VARCHAR(100),
    goal TEXT,
    budget DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    expected_leads INT,
    expected_revenue DECIMAL(10,2)
);

CREATE TABLE content_master (
    content_id VARCHAR(10) PRIMARY KEY,
    campaign_id VARCHAR(10) REFERENCES campaigns(campaign_id),
    client_id VARCHAR(10) REFERENCES clients(client_id),
    content_title VARCHAR(255),
    topic VARCHAR(100),
    content_pillar VARCHAR(50),
    funnel_stage VARCHAR(50),
    platform VARCHAR(50),
    content_format VARCHAR(50),
    priority VARCHAR(20),
    owner VARCHAR(100),
    publish_date DATE,
    publish_time TIME,
    status VARCHAR(20),
    health_status VARCHAR(20),
    caption TEXT,
    hashtags TEXT,
    canva_link TEXT,
    drive_link TEXT
);

CREATE TABLE content_production (
    production_id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(10) REFERENCES content_master(content_id),
    copywriter VARCHAR(100),
    writer_status VARCHAR(20),
    designer VARCHAR(100),
    design_status VARCHAR(20),
    video_editor VARCHAR(100),
    editing_status VARCHAR(20),
    revision_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE performance_tracker (
    performance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(10) REFERENCES content_master(content_id),
    reach INT,
    impressions INT,
    likes INT,
    comments INT,
    shares INT,
    saves INT,
    link_clicks INT,
    leads_generated INT,
    revenue_generated DECIMAL(10,2),
    engagement_rate DECIMAL(5,2),
    content_score DECIMAL(5,2)
);
