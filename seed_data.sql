-- Seed Data for Marketing Campaign and Content Management Database

PRAGMA foreign_keys = ON;

-- 1. Insert Clients
INSERT INTO clients (client_id, client_name, industry, account_manager, monthly_retainer, start_date, status) VALUES
('C001', 'Acme Corp', 'Technology', 'Alice Smith', 5000.00, '2026-01-15', 'Active'),
('C002', 'Global Health', 'Healthcare', 'Bob Jones', 7500.00, '2026-02-10', 'Active'),
('C003', 'Eco Retail', 'Retail', 'Alice Smith', 3200.00, '2026-03-01', 'Active');

-- 2. Insert Campaigns
INSERT INTO campaigns (campaign_id, client_id, campaign_name, goal, budget, start_date, end_date, status, expected_leads, expected_revenue) VALUES
('CMP001', 'C001', 'SaaS Launch 2026', 'Drive registrations', 15000.00, '2026-03-01', '2026-06-30', 'Active', 500, 25000.00),
('CMP002', 'C002', 'Wellness Summit', 'Promote ticket sales', 20000.00, '2026-04-10', '2026-08-15', 'Active', 1000, 50000.00),
('CMP003', 'C003', 'Summer Sale 2026', 'Increase online orders', 8000.00, '2026-05-01', '2026-07-31', 'Active', 300, 12000.00);

-- 3. Insert Content Master
INSERT INTO content_master (content_id, campaign_id, client_id, content_title, topic, content_pillar, funnel_stage, platform, content_format, priority, owner, publish_date, publish_time, status, health_status, caption, hashtags, canva_link, drive_link) VALUES
('CNT001', 'CMP001', 'C001', 'Top 5 SaaS Trends', 'SaaS Trends', 'Educational', 'TOFU', 'LinkedIn', 'Infographic', 'High', 'Alice Smith', '2026-06-01', '09:00:00', 'Published', 'Healthy', 'Here are the top SaaS trends...', '#saas #tech', 'http://canva.com/1', 'http://drive.google.com/1'),
('CNT002', 'CMP001', 'C001', 'Product Demo Video', 'Product Walkthrough', 'Product Features', 'MOFU', 'YouTube', 'Video', 'Medium', 'John Doe', '2026-06-15', '14:00:00', 'Published', 'Healthy', 'Watch our demo...', '#demo #saas', 'http://canva.com/2', 'http://drive.google.com/2'),
('CNT003', 'CMP002', 'C002', 'Healthy Habits Campaign', 'Wellness', 'Inspirational', 'TOFU', 'Instagram', 'Carousel', 'High', 'Bob Jones', '2026-06-20', '10:30:00', 'Published', 'Healthy', 'Start your day right...', '#health #wellness', 'http://canva.com/3', 'http://drive.google.com/3');

-- 4. Insert Content Production (production_id will be auto-assigned)
INSERT INTO content_production (content_id, copywriter, writer_status, designer, design_status, video_editor, editing_status, revision_count) VALUES
('CNT001', 'Jane Copywriter', 'Approved', 'Dave Designer', 'Approved', NULL, 'Not Required', 2),
('CNT002', 'Jane Copywriter', 'Approved', NULL, 'Not Required', 'Vince VideoEditor', 'Approved', 1),
('CNT003', 'Mark Writer', 'In Review', 'Dave Designer', 'Approved', NULL, 'Not Required', 3);

-- 5. Insert Performance Tracker (performance_id will be auto-assigned)
INSERT INTO performance_tracker (content_id, reach, impressions, likes, comments, shares, saves, link_clicks, leads_generated, revenue_generated, engagement_rate, content_score) VALUES
('CNT001', 5000, 12000, 350, 45, 80, 110, 240, 15, 750.00, 4.88, 8.5),
('CNT002', 2500, 4000, 180, 25, 12, 5, 150, 45, 2250.00, 5.43, 9.0),
('CNT003', 8000, 15000, 920, 115, 310, 405, 520, 85, 4250.00, 8.97, 9.5);
