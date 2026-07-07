-- Verification and Diagnostic Queries for SQLite Database
PRAGMA foreign_keys = ON;
.headers on
.mode column

SELECT '--- 1. List of Tables & Integrity Check ---' AS '';
PRAGMA integrity_check;
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';

SELECT '--- 2. Clients and their monthly retainers ---' AS '';
SELECT client_id, client_name, industry, monthly_retainer, status 
FROM clients;

SELECT '--- 3. Campaigns joined with Client information ---' AS '';
SELECT 
    c.campaign_id, 
    c.campaign_name, 
    cl.client_name, 
    c.budget, 
    c.expected_revenue 
FROM campaigns c
JOIN clients cl ON c.client_id = cl.client_id;

SELECT '--- 4. Content Master with Production Status ---' AS '';
SELECT 
    cm.content_id, 
    cm.content_title, 
    cm.platform, 
    cp.copywriter, 
    cp.writer_status, 
    cp.designer, 
    cp.design_status, 
    cp.revision_count
FROM content_master cm
LEFT JOIN content_production cp ON cm.content_id = cp.content_id;

SELECT '--- 5. Content Performance Metrics ---' AS '';
SELECT 
    cm.content_id, 
    cm.content_title, 
    cm.platform, 
    pt.reach, 
    pt.likes, 
    pt.leads_generated, 
    pt.revenue_generated,
    pt.engagement_rate
FROM content_master cm
LEFT JOIN performance_tracker pt ON cm.content_id = pt.content_id;

SELECT '--- 6. Client Campaign Performance ROI (Expected vs Generated Revenue) ---' AS '';
SELECT 
    cl.client_name,
    c.campaign_name,
    c.budget AS campaign_budget,
    SUM(pt.revenue_generated) AS total_revenue_generated,
    (SUM(pt.revenue_generated) - c.budget) AS net_roi
FROM campaigns c
JOIN clients cl ON c.client_id = cl.client_id
JOIN content_master cm ON cm.campaign_id = c.campaign_id
JOIN performance_tracker pt ON cm.content_id = pt.content_id
GROUP BY c.campaign_id;

SELECT '--- 7. Verification of Foreign Key Constraint Enforcement ---' AS '';
-- This insert should FAIL because client 'C999' does not exist in the clients table
.header off
SELECT 'Attempting to insert a campaign with invalid client_id (C999)...';
.header on
INSERT INTO campaigns (campaign_id, client_id, campaign_name, goal, budget, start_date, end_date, status, expected_leads, expected_revenue) 
VALUES ('CMP999', 'C999', 'Ghost Campaign', 'Should fail', 1000.00, '2026-06-01', '2026-06-30', 'Active', 10, 200.00);
