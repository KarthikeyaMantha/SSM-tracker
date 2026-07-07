import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default admin user if it doesn't exist
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@quantira.com' }
  })
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        email: 'admin@quantira.com',
        name: 'System Admin',
        password: passwordHash,
        role: 'ADMIN',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin'
      }
    })
    console.log('🌱 Created default admin user')
  }

  // Create demo users for other roles if they don't exist
  const usersToCreate = [
    { email: 'manager@quantira.com', name: 'Alice Manager', password: 'manager123', role: 'ACCOUNT_MANAGER' },
    { email: 'copywriter@quantira.com', name: 'Jane Copywriter', password: 'copywriter123', role: 'COPYWRITER' },
    { email: 'designer@quantira.com', name: 'Dave Designer', password: 'designer123', role: 'DESIGNER' },
    { email: 'reviewer@quantira.com', name: 'Sneha Reviewer', password: 'reviewer123', role: 'REVIEWER' },
    { email: 'client@acmecorp.com', name: 'Acme Admin', password: 'client123', role: 'CLIENT', clientName: 'Acme Corp' }
  ]

  for (const u of usersToCreate) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email }
    })
    if (!existing) {
      const hash = await bcrypt.hash(u.password, 10)
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          password: hash,
          role: u.role as any,
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}`,
          clientName: (u as any).clientName || null
        }
      })
      console.log(`🌱 Created demo user ${u.name} (${u.role})`)
    }
  }

  // 1. Add sample clients
  const clientData = [
    { clientId: 'CL-001', clientName: 'Acme Corp', industry: 'Technology', accountManager: 'Alice Smith', monthlyRetainer: 5000, startDate: new Date('2026-01-15'), status: 'Active' },
    { clientId: 'CL-002', clientName: 'Global Health', industry: 'Healthcare', accountManager: 'Bob Jones', monthlyRetainer: 7500, startDate: new Date('2026-02-10'), status: 'Active' },
    { clientId: 'CL-003', clientName: 'Eco Retail', industry: 'Retail', accountManager: 'Alice Smith', monthlyRetainer: 3200, startDate: new Date('2026-03-01'), status: 'Active' }
  ]

  for (const client of clientData) {
    await prisma.client.upsert({
      where: { clientName: client.clientName },
      update: {},
      create: client
    })
  }

  // 2. Add sample campaigns
  const campaignData = [
    { campaignId: 'CMP-001', clientId: 'Acme Corp', campaignName: 'SaaS Launch 2026', goal: 'Drive registrations', budget: 15000, startDate: new Date('2026-03-01'), endDate: new Date('2026-06-30'), status: 'Active' },
    { campaignId: 'CMP-002', clientId: 'Global Health', campaignName: 'Wellness Summit', goal: 'Promote ticket sales', budget: 20000, startDate: new Date('2026-04-10'), endDate: new Date('2026-08-15'), status: 'Active' },
    { campaignId: 'CMP-003', clientId: 'Eco Retail', campaignName: 'Summer Sale 2026', goal: 'Increase online orders', budget: 8000, startDate: new Date('2026-05-01'), endDate: new Date('2026-07-31'), status: 'Active' }
  ]

  for (const campaign of campaignData) {
    await prisma.campaign.upsert({
      where: { campaignId: campaign.campaignId },
      update: {},
      create: campaign
    })
  }

  // 3. Add sample content master list
  const contentData = [
    {
      contentId: 'CNT-001',
      campaignId: 'CMP-001',
      clientId: 'Acme Corp',
      contentTitle: 'Top 5 SaaS Trends',
      topic: 'SaaS Trends',
      contentPillar: 'Educational',
      funnelStage: 'TOFU',
      platform: 'LinkedIn',
      contentFormat: 'Infographic',
      priority: 'High',
      owner: 'Alice Smith',
      publishDate: new Date('2026-06-01'),
      publishTime: '09:00 AM',
      status: 'Published',
      healthStatus: 'On Track',
      caption: 'Here are the top SaaS trends...',
      hashtags: '#saas #tech',
      canvaLink: 'http://canva.com/1',
      driveLink: 'http://drive.google.com/1'
    },
    {
      contentId: 'CNT-002',
      campaignId: 'CMP-001',
      clientId: 'Acme Corp',
      contentTitle: 'Product Demo Video',
      topic: 'Product Walkthrough',
      contentPillar: 'Product Features',
      funnelStage: 'MOFU',
      platform: 'YouTube',
      contentFormat: 'Video',
      priority: 'Normal',
      owner: 'John Doe',
      publishDate: new Date('2026-06-15'),
      publishTime: '02:00 PM',
      status: 'Published',
      healthStatus: 'On Track',
      caption: 'Watch our demo...',
      hashtags: '#demo #saas',
      canvaLink: 'http://canva.com/2',
      driveLink: 'http://drive.google.com/2'
    },
    {
      contentId: 'CNT-003',
      campaignId: 'CMP-002',
      clientId: 'Global Health',
      contentTitle: 'Healthy Habits Campaign',
      topic: 'Wellness',
      contentPillar: 'Inspirational',
      funnelStage: 'TOFU',
      platform: 'Instagram',
      contentFormat: 'Carousel',
      priority: 'High',
      owner: 'Bob Jones',
      publishDate: new Date('2026-06-20'),
      publishTime: '10:30 AM',
      status: 'Published',
      healthStatus: 'On Track',
      caption: 'Start your day right...',
      hashtags: '#health #wellness',
      canvaLink: 'http://canva.com/3',
      driveLink: 'http://drive.google.com/3'
    }
  ]

  for (const item of contentData) {
    await prisma.contentMaster.upsert({
      where: { contentId: item.contentId },
      update: {},
      create: item
    })
  }

  // 4. Add Content Production data
  const productionData = [
    { contentId: 'CNT-001', copywriter: 'Jane Copywriter', writerStatus: 'Approved', designer: 'Dave Designer', designStatus: 'Approved', revisionCount: 2 },
    { contentId: 'CNT-002', copywriter: 'Jane Copywriter', writerStatus: 'Approved', videoEditor: 'Vince VideoEditor', editingStatus: 'Approved', revisionCount: 1 },
    { contentId: 'CNT-003', copywriter: 'Mark Writer', writerStatus: 'In Review', designer: 'Dave Designer', designStatus: 'Approved', revisionCount: 3 }
  ]

  for (const prod of productionData) {
    await prisma.contentProduction.upsert({
      where: { contentId: prod.contentId },
      update: {},
      create: prod
    })
  }

  // 5. Add Performance tracking data
  const performanceData = [
    { contentId: 'CNT-001', reach: 5000, impressions: 12000, likes: 350, comments: 45, shares: 80, saves: 110, profileVisits: 320, linkClicks: 240, leadsGenerated: 15, revenueGenerated: 750.00, engagementRate: 4.88, contentScore: 8.5 },
    { contentId: 'CNT-002', reach: 2500, impressions: 4000, likes: 180, comments: 25, shares: 12, saves: 5, profileVisits: 150, linkClicks: 150, leadsGenerated: 45, revenueGenerated: 2250.00, engagementRate: 5.43, contentScore: 9.0 },
    { contentId: 'CNT-003', reach: 8000, impressions: 15000, likes: 920, comments: 115, shares: 310, saves: 405, profileVisits: 680, linkClicks: 520, leadsGenerated: 85, revenueGenerated: 4250.00, engagementRate: 8.97, contentScore: 9.5 }
  ]

  for (const perf of performanceData) {
    await prisma.performanceTracker.upsert({
      where: { contentId: perf.contentId },
      update: {},
      create: perf
    })
  }

  // 5b. Add Content Scorecard data
  const scorecardData = [
    { contentId: 'CNT-001', reachScore: 8.5, engagementScore: 7.9, leadScore: 6.2, conversionScore: 7.0, overallScore: 8.5 },
    { contentId: 'CNT-002', reachScore: 9.0, engagementScore: 8.8, leadScore: 9.5, conversionScore: 9.0, overallScore: 9.0 },
    { contentId: 'CNT-003', reachScore: 9.5, engagementScore: 9.2, leadScore: 9.0, conversionScore: 9.4, overallScore: 9.5 }
  ]

  for (const sc of scorecardData) {
    await prisma.contentScorecard.upsert({
      where: { contentId: sc.contentId },
      update: {},
      create: sc
    })
  }

  // Add ContentMaster entry for CNT-0002 (required parent for performance & scorecard)
  await prisma.contentMaster.upsert({
    where: { contentId: 'CNT-0002' },
    update: {},
    create: {
      contentId: 'CNT-0002',
      clientId: 'Acme Corp',
      contentTitle: 'Excel Import — CNT-0002',
      platform: 'Instagram',
      status: 'Published',
      priority: 'Normal',
      healthStatus: 'On Track'
    }
  })

  // Add Performance Data from Excel
  await prisma.performanceTracker.upsert({
    where: { contentId: 'CNT-0002' },
    update: {},
    create: {
      contentId: 'CNT-0002',
      reach: 1000,
      impressions: 0,
      likes: 50,
      comments: 10,
      shares: 20,
      saves: 8,
      profileVisits: 0,
      linkClicks: 0,
      leadsGenerated: 0,
      revenueGenerated: 0,
      engagementRate: 8.80,
      contentScore: 7.52
    }
  })

  // Add Scorecard Data for CNT-0002
  await prisma.contentScorecard.upsert({
    where: { contentId: 'CNT-0002' },
    update: {},
    create: {
      contentId: 'CNT-0002',
      reachScore: 8.0,
      engagementScore: 8.5,
      leadScore: 5.0,
      conversionScore: 6.0,
      overallScore: 7.52
    }
  })

  // 6. Add Approvals logs
  const approvalsData = [
    { contentId: 'CNT-001', approvalStatus: 'Pending', submittedBy: 'rahul', feedback: 'Please review the copywriter drafts and graphics for the SaaS trends post.', revisionRound: 1 },
    { contentId: 'CNT-003', approvalStatus: 'Pending', submittedBy: 'sneha', feedback: 'Instagram carousel graphics finalized. Awaiting final review from brand lead.', revisionRound: 1 }
  ]

  for (const app of approvalsData) {
    await prisma.approval.upsert({
      where: { contentId: app.contentId },
      update: {},
      create: app
    })
  }

  // 7. Add Content Requests
  const requestsData = [
    { client: 'Acme Corp', requestTitle: 'Q3 Launch Banner', description: 'Requesting a promotional banner for the Q3 SaaS launch campaign.', requestedBy: 'Alice Smith', status: 'Pending' },
    { client: 'Global Health', requestTitle: 'Case Study Video Script', description: 'Copywriter request for testimonial script for the Health & Wellness summit.', requestedBy: 'Bob Jones', status: 'Pending' },
    { client: 'Eco Retail', requestTitle: 'Instagram Stories Draft', description: 'Need 3 custom product-mockup graphics for Summer Sale promo.', requestedBy: 'Alice Smith', status: 'Approved' }
  ]

  for (const req of requestsData) {
    // ContentRequest model uses autoincrement ID, so we create directly
    await prisma.contentRequest.create({
      data: req
    })
  }

  // 8. Add Assets
  const assetsData = [
    { contentId: 'CNT-001', assetType: 'Image', canvaLink: 'http://canva.com/1', driveLink: 'http://drive.google.com/1', version: 2 },
    { contentId: 'CNT-002', assetType: 'Video', canvaLink: null, driveLink: 'http://drive.google.com/2', version: 1 },
    { contentId: 'CNT-003', assetType: 'Image', canvaLink: 'http://canva.com/3', driveLink: 'http://drive.google.com/3', version: 3 }
  ]

  for (const asset of assetsData) {
    await prisma.asset.create({
      data: asset
    })
  }

  // 9. Add QA E2E Test Records (required for Playwright E2E tests to run reliably)
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
  })

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
  })

  await prisma.contentMaster.upsert({
    where: { contentId: 'CNT-QA01' },
    update: {},
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
  })

  await prisma.contentProduction.upsert({
    where: { contentId: 'CNT-QA01' },
    update: {},
    create: {
      contentId: 'CNT-QA01',
      writerStatus: 'Not Started',
      designStatus: 'Not Started',
      editingStatus: 'Not Started',
      revisionCount: 0
    }
  })

  await prisma.approval.upsert({
    where: { contentId: 'CNT-QA01' },
    update: {},
    create: {
      contentId: 'CNT-QA01',
      submittedBy: 'QA Manager',
      reviewer: 'Manager',
      approvalStatus: 'Pending',
      revisionRound: 1
    }
  })

  await prisma.performanceTracker.upsert({
    where: { contentId: 'CNT-QA01' },
    update: {},
    create: {
      contentId: 'CNT-QA01',
      reach: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      profileVisits: 0,
      linkClicks: 0,
      leadsGenerated: 0,
      revenueGenerated: 0,
      engagementRate: 0
    }
  })

  await prisma.contentScorecard.upsert({
    where: { contentId: 'CNT-QA01' },
    update: {},
    create: {
      contentId: 'CNT-QA01',
      reachScore: 0,
      engagementScore: 0,
      leadScore: 0,
      conversionScore: 0,
      overallScore: 0
    }
  })

  console.log('✅ Seeding complete successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
