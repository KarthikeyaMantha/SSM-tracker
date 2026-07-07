import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

test.describe('Quantira Content OS - E2E QA Test Suite', () => {

  test.beforeAll(async () => {
    const prisma = new PrismaClient();
    try {
      // Ensure QA client exists
      await prisma.client.upsert({
        where: { clientName: 'QA E2E Client' },
        update: {},
        create: {
          clientId: 'CL-QA1',
          clientName: 'QA E2E Client',
          industry: 'Testing',
          accountManager: 'Jane QA Manager',
          monthlyRetainer: 12000,
          startDate: new Date('2026-06-25'),
          status: 'Active'
        }
      });

      // Ensure QA campaign exists
      await prisma.campaign.upsert({
        where: { campaignId: 'CMP-QA1' },
        update: {},
        create: {
          campaignId: 'CMP-QA1',
          clientId: 'QA E2E Client',
          campaignName: 'QA E2E Campaign',
          goal: 'Verify E2E flows',
          budget: 25000,
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-12-31'),
          status: 'Active'
        }
      });

      // Ensure QA content master exists
      await prisma.contentMaster.upsert({
        where: { contentId: 'CNT-QA01' },
        update: { status: 'Draft', healthStatus: 'On Track' },
        create: {
          contentId: 'CNT-QA01',
          campaignId: 'CMP-QA1',
          clientId: 'QA E2E Client',
          contentTitle: 'QA E2E Content Title',
          topic: 'QA Testing',
          contentPillar: 'Educational',
          funnelStage: 'TOFU',
          platform: 'LinkedIn',
          contentFormat: 'Article',
          priority: 'Normal',
          owner: 'QA Manager',
          publishDate: new Date('2026-06-25'),
          publishTime: '10:00',
          status: 'Draft',
          healthStatus: 'On Track',
        }
      });

      // Ensure QA production record exists and is reset
      await prisma.contentProduction.upsert({
        where: { contentId: 'CNT-QA01' },
        update: { writerStatus: 'Not Started', designStatus: 'Not Started', editingStatus: 'Not Started', revisionCount: 0 },
        create: {
          contentId: 'CNT-QA01',
          writerStatus: 'Not Started',
          designStatus: 'Not Started',
          editingStatus: 'Not Started',
          revisionCount: 0
        }
      });

      // Ensure QA approval record exists and is reset to Pending
      await prisma.approval.upsert({
        where: { contentId: 'CNT-QA01' },
        update: { approvalStatus: 'Pending', feedback: null },
        create: {
          contentId: 'CNT-QA01',
          submittedBy: 'QA Manager',
          reviewer: 'Manager',
          approvalStatus: 'Pending',
          revisionRound: 1
        }
      });

      // Ensure QA performance record exists and is reset
      await prisma.performanceTracker.upsert({
        where: { contentId: 'CNT-QA01' },
        update: { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0 },
        create: {
          contentId: 'CNT-QA01',
          reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0,
          saves: 0, profileVisits: 0, linkClicks: 0, leadsGenerated: 0,
          revenueGenerated: 0, engagementRate: 0
        }
      });

      // Delete any leftover assets from previous run
      await prisma.asset.deleteMany({ where: { contentId: 'CNT-QA01' } }).catch(() => {});

    } catch (e) {
      console.error('beforeAll upsert error:', e);
    } finally {
      await prisma.$disconnect();
    }
  });

  test('1. Core Data Flow (Clients -> Campaigns -> Content Master)', async ({ page }) => {
    // Verify QA E2E Client is visible
    await page.goto('/clients');
    await page.waitForSelector('td', { state: 'attached' }).catch(() => {});
    await page.waitForTimeout(3000);
    await expect(page.locator('td', { hasText: 'QA E2E Client' })).toBeVisible();

    // Verify QA E2E Campaign is visible
    await page.goto('/campaigns');
    await page.waitForSelector('td', { state: 'attached' }).catch(() => {});
    await page.waitForTimeout(3000);
    await expect(page.locator('td', { hasText: 'QA E2E Campaign' })).toBeVisible();

    // Verify QA E2E Content Title is visible
    await page.goto('/content-master');
    await page.waitForSelector('td', { state: 'attached' }).catch(() => {});
    await page.waitForTimeout(3000);
    await expect(page.locator('td', { hasText: 'QA E2E Content Title' })).toBeVisible();
  });

  test('2. Production Workflow Update', async ({ page }) => {
    await page.goto('/production');
    await page.waitForSelector('.production-card', { state: 'visible' });
    await page.waitForTimeout(1000);

    const card = page.locator('.production-card', { hasText: 'QA E2E Content Title' });
    await expect(card).toBeVisible();

    await card.locator('.ant-select').first().click();
    await page.locator('.ant-select-item-option-content:visible').filter({ hasText: /^In Progress$/ }).click();

    await expect(card.locator('.ant-select-selection-item').first()).toHaveText('In Progress');
    await page.waitForTimeout(1000);
  });

  test('3. Approval & Feedback Loop', async ({ page }) => {
    await page.goto('/approvals');
    await page.waitForSelector('.approval-card', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);

    const card = page.locator('.approval-card', { hasText: 'QA E2E Content Title' });
    await expect(card).toBeVisible();

    await card.locator('button:has-text("Request Revision")').click();

    const textarea = page.locator('textarea').first();
    await textarea.fill('Needs CTA link fixes and font check.');

    await page.locator('button:has-text("Send Instructions")').click();

    await card.locator('text=Expand').click();

    await expect(card.locator('span:has-text("REVISION")')).toBeVisible();
    await expect(card.locator('p:has-text("Needs CTA link fixes")')).toBeVisible();
  });

  test('4. Analytics & Dashboard Sync', async ({ page }) => {
    await page.goto('/performance');
    // Performance page now uses cards, not a table — wait for card grid to load
    await page.waitForTimeout(3000);

    // Find the performance card for QA content (card-based layout)
    const perfCard = page.locator('.ant-card', { hasText: 'QA E2E Content Title' }).first();
    await expect(perfCard).toBeVisible({ timeout: 15000 });

    // Fill Reach input (large number display + input below it)
    const reachInput = perfCard.locator('input[placeholder="Reach"]').first();
    await reachInput.clear();
    await reachInput.fill('4500');

    // Fill Likes input inside engagement grid
    const likesInput = perfCard.locator('input').filter({ hasNot: page.locator('input[placeholder="Reach"]') }).nth(2);
    await likesInput.clear();
    await likesInput.fill('150');

    // Click the Save Metrics button inside the card
    await perfCard.locator('button:has-text("Save Metrics")').click();

    // Verify the saved confirmation
    await expect(perfCard.locator('button:has-text("Saved")')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    // Navigate to /client-dashboard and verify reach updated
    await page.goto('/client-dashboard');
    await page.waitForSelector('div.group', { state: 'visible' });
    await page.waitForTimeout(2000);

    const clientCard = page.locator('div.group', { hasText: 'QA E2E Client' });
    await expect(clientCard.locator('p:has-text("4,500")')).toBeVisible({ timeout: 15000 });
  });

  test('5. Calendar & Asset Linking', async ({ page }) => {
    // Navigate to /calendar — content is scheduled on 2026-06-25
    await page.goto('/calendar');
    await page.waitForTimeout(3000);

    // Calendar may show current month; content badge is on Jun 25 2026
    // Look for the button with the content title
    await expect(page.locator('button:has-text("QA E2E Content Title")')).toBeVisible({ timeout: 30000 });

    // Navigate to /assets and add an asset
    await page.goto('/assets');
    await page.waitForSelector('button:has-text("Add Asset")', { state: 'visible' });
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Add Asset")').click();
    await expect(page.locator('text=Add New Asset')).toBeVisible();

    await page.locator('form select').first().selectOption('QA E2E Content Title');
    await page.locator('form select').nth(1).selectOption('Video');
    await page.locator('form input[type="url"]').nth(0).fill('https://canva.com/qa-video');
    await page.locator('form input[type="url"]').nth(1).fill('https://drive.google.com/qa-video-folder');

    await page.locator('form button:has-text("Upload Asset")').click();

    const row = page.locator('tr', { hasText: 'QA E2E Content Title' });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.locator('a:has-text("Canva")')).toBeVisible();
    await expect(row.locator('a:has-text("Drive")')).toBeVisible();
  });

});
