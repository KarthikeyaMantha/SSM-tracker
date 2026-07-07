-- SQL Script to Create Approvals and Content Requests tables in SQLite database

PRAGMA foreign_keys = ON;

-- 1. Create approvals table
CREATE TABLE IF NOT EXISTS approvals (
    approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(10) REFERENCES content_master(content_id),
    approval_status VARCHAR(20) DEFAULT 'Pending',
    requested_by VARCHAR(100),
    feedback TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create content_requests table
CREATE TABLE IF NOT EXISTS content_requests (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id VARCHAR(10) REFERENCES clients(client_id),
    request_title VARCHAR(255),
    description TEXT,
    requested_by VARCHAR(100),
    request_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Pending'
);

-- 3. Insert mock data if not already exists (using INSERT OR IGNORE or basic check)
-- Clean previous testing records if any
DELETE FROM approvals;
DELETE FROM content_requests;

-- Insert fresh mock approvals
INSERT INTO approvals (content_id, approval_status, requested_by, feedback) VALUES
('CNT001', 'Pending', 'rahul', 'Please review the copywriter drafts and graphics for the SaaS trends post.'),
('CNT003', 'Pending', 'sneha', 'Instagram carousel graphics finalized. Awaiting final review from brand lead.');

-- Insert fresh mock content requests
INSERT INTO content_requests (client_id, request_title, description, requested_by, status) VALUES
('C001', 'Q3 Launch Banner', 'Requesting a promotional banner for the Q3 SaaS launch campaign.', 'Alice Smith', 'Pending'),
('C002', 'Case Study Video Script', 'Copywriter request for testimonial script for the Health & Wellness summit.', 'Bob Jones', 'Pending'),
('C003', 'Instagram Stories Draft', 'Need 3 custom product-mockup graphics for Summer Sale promo.', 'Alice Smith', 'Approved');
