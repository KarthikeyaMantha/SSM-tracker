-- Enterprise Database Schema for Quantira Content OS
-- Compatible with PostgreSQL

CREATE TABLE IF NOT EXISTS clients (
    client_id VARCHAR(10) PRIMARY KEY,
    client_name VARCHAR(100),
    industry VARCHAR(50),
    account_manager VARCHAR(100),
    monthly_retainer DECIMAL(10,2),
    start_date DATE,
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS campaigns (
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

CREATE TABLE IF NOT EXISTS content_master (
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

CREATE TABLE IF NOT EXISTS content_production (
    production_id SERIAL PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS performance_tracker (
    performance_id SERIAL PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS approvals (
    approval_id SERIAL PRIMARY KEY,
    content_id VARCHAR(10) REFERENCES content_master(content_id),
    approval_status VARCHAR(20) DEFAULT 'Pending',
    requested_by VARCHAR(100),
    feedback TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_requests (
    request_id SERIAL PRIMARY KEY,
    client_id VARCHAR(10) REFERENCES clients(client_id),
    request_title VARCHAR(255),
    description TEXT,
    requested_by VARCHAR(100),
    request_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(50),
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id VARCHAR(50),
    old_value TEXT,
    new_value TEXT
);

-- Seed Initial Mock Data on Database Boot
INSERT INTO clients (client_id, client_name, industry, account_manager, monthly_retainer, start_date, status) VALUES
('C001', 'Acme Corp', 'Technology', 'Alice Smith', 5000.00, '2026-01-15', 'Active'),
('C002', 'Global Health', 'Healthcare', 'Bob Jones', 7500.00, '2026-02-10', 'Active'),
('C003', 'Eco Retail', 'Retail', 'Alice Smith', 3200.00, '2026-03-01', 'Active')
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO campaigns (campaign_id, client_id, campaign_name, goal, budget, start_date, end_date, status, expected_leads, expected_revenue) VALUES
('CMP001', 'C001', 'SaaS Launch 2026', 'Drive registrations', 15000.00, '2026-03-01', '2026-06-30', 'Active', 500, 25000.00),
('CMP002', 'C002', 'Wellness Summit', 'Promote ticket sales', 20000.00, '2026-04-10', '2026-08-15', 'Active', 1000, 50000.00),
('CMP003', 'C003', 'Summer Sale 2026', 'Increase online orders', 8000.00, '2026-05-01', '2026-07-31', 'Active', 300, 12000.00)
ON CONFLICT (campaign_id) DO NOTHING;

INSERT INTO content_master (content_id, campaign_id, client_id, content_title, topic, content_pillar, funnel_stage, platform, content_format, priority, owner, publish_date, publish_time, status, health_status, caption, hashtags, canva_link, drive_link) VALUES
('CNT001', 'CMP001', 'C001', 'Top 5 SaaS Trends', 'SaaS Trends', 'Educational', 'TOFU', 'LinkedIn', 'Infographic', 'High', 'Alice Smith', '2026-06-01', '09:00:00', 'Published', 'Healthy', 'Here are the top SaaS trends...', '#saas #tech', 'http://canva.com/1', 'http://drive.google.com/1'),
('CNT002', 'CMP001', 'C001', 'Product Demo Video', 'Product Walkthrough', 'Product Features', 'MOFU', 'YouTube', 'Video', 'Medium', 'John Doe', '2026-06-15', '14:00:00', 'Published', 'Healthy', 'Watch our demo...', '#demo #saas', 'http://canva.com/2', 'http://drive.google.com/2'),
('CNT003', 'CMP002', 'C002', 'Healthy Habits Campaign', 'Wellness', 'Inspirational', 'TOFU', 'Instagram', 'Carousel', 'High', 'Bob Jones', '2026-06-20', '10:30:00', 'Published', 'Healthy', 'Start your day right...', '#health #wellness', 'http://canva.com/3', 'http://drive.google.com/3')
ON CONFLICT (content_id) DO NOTHING;

INSERT INTO content_production (content_id, copywriter, writer_status, designer, design_status, video_editor, editing_status, revision_count) VALUES
('CNT001', 'Jane Copywriter', 'Approved', 'Dave Designer', 'Approved', NULL, 'Not Required', 2),
('CNT002', 'Jane Copywriter', 'Approved', NULL, 'Not Required', 'Vince VideoEditor', 'Approved', 1),
('CNT003', 'Mark Writer', 'In Review', 'Dave Designer', 'Approved', NULL, 'Not Required', 3);

INSERT INTO performance_tracker (content_id, reach, impressions, likes, comments, shares, saves, link_clicks, leads_generated, revenue_generated, engagement_rate, content_score) VALUES
('CNT001', 5000, 12000, 350, 45, 80, 110, 240, 15, 750.00, 4.88, 8.5),
('CNT002', 2500, 4000, 180, 25, 12, 5, 150, 45, 2250.00, 5.43, 9.0),
('CNT003', 8000, 15000, 920, 115, 310, 405, 520, 85, 4250.00, 8.97, 9.5);

INSERT INTO approvals (content_id, approval_status, requested_by, feedback) VALUES
('CNT001', 'Pending', 'rahul', 'Please review the copywriter drafts and graphics for the SaaS trends post.'),
('CNT003', 'Pending', 'sneha', 'Instagram carousel graphics finalized. Awaiting final review from brand lead.');

INSERT INTO content_requests (client_id, request_title, description, requested_by, status) VALUES
('C001', 'Q3 Launch Banner', 'Requesting a promotional banner for the Q3 SaaS launch campaign.', 'Alice Smith', 'Pending'),
('C002', 'Case Study Video Script', 'Copywriter request for testimonial script for the Health & Wellness summit.', 'Bob Jones', 'Pending'),
('C003', 'Instagram Stories Draft', 'Need 3 custom product-mockup graphics for Summer Sale promo.', 'Alice Smith', 'Approved');
