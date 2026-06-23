import knex from 'knex';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  pool: {
    afterCreate: (conn, cb) => {
      conn.run('PRAGMA foreign_keys = ON', cb);
    }
  },
  useNullAsDefault: true
});

export async function initDb() {
  console.log('Initializing database schema (camelCase columns)...');

  // Users table
  if (!await db.schema.hasTable('users')) {
    await db.schema.createTable('users', table => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('passwordHash').notNullable();
      table.string('role').notNullable(); // 'admin' or 'client'
      table.timestamps(true, true);
    });
  }

  // Client Workspaces table
  if (!await db.schema.hasTable('client_workspaces')) {
    await db.schema.createTable('client_workspaces', table => {
      table.string('id').primary(); // client_id
      table.string('name').notNullable();
      table.string('logo').defaultTo('🌱');
      table.string('website');
      table.string('country');
      table.string('sector');
      table.string('primaryContact');
      table.string('email');
      table.string('phone');
      table.decimal('monthlyFee', 10, 2).defaultTo(0.0);
      table.decimal('contractValue', 12, 2).defaultTo(0.0);
      table.date('startDate');
      table.date('renewalDate');
      table.string('clientStatus').defaultTo('Lead');
      table.boolean('isBriefApproved').defaultTo(false);
      table.boolean('isMeetingSummaryApproved').defaultTo(false);
      table.boolean('areAgentsActivated').defaultTo(false);

      // Social Baseline Starting Benchmarks
      table.string('fbPageUrl');
      table.integer('fbFollowers').defaultTo(0);
      table.integer('fbAvgReach').defaultTo(0);
      table.decimal('fbAvgEngagement', 5, 2).defaultTo(0.0);
      table.string('igHandle');
      table.integer('igFollowers').defaultTo(0);
      table.integer('igAvgReach').defaultTo(0);
      table.decimal('igAvgEngagement', 5, 2).defaultTo(0.0);
      table.text('baselineTopPosts');
      table.text('baselineDemographics');
      table.date('baselineStartDate');

      // Brief details
      table.text('goalsAchieve');
      table.text('goalsProblem');
      table.text('goalsTop3');
      table.text('goalsSuccess');
      table.text('goalsChallenges');
      table.text('goalsSupport');

      table.text('mission');
      table.text('shortDesc');
      table.text('toneOfVoice');
      table.text('writingStyle');
      table.text('wordsToUse');
      table.text('wordsToAvoid');
      table.string('brandColours');
      table.string('fonts');
      table.text('approvedHashtags');
      table.text('socialHandles');
      table.string('canvaTemplates');
      table.text('posterExamples');

      table.text('targetReach');
      table.text('audienceCommunity');
      table.text('audienceDonor');
      table.text('audienceGovernment');
      table.text('audienceYouth');
      table.text('audienceMedia');
      table.text('locations');
      table.text('ageGroups');
      table.text('languages');
      table.text('culturalConsiderations');
      table.text('audienceUnderstanding');
      table.text('audienceAction');

      table.text('currentFunders');
      table.text('grantNames');
      table.text('reportingDeadlines');
      table.text('requiredDonorOutputs');
      table.text('donorLogoRequirements');
      table.text('funderCommunicationRules');
      table.text('requiredImpactMetrics');
      table.text('requiredEvidence');
      table.string('reportFrequency').defaultTo('Monthly');

      table.timestamps(true, true);
    });
  }

  // Client Users mapping table
  if (!await db.schema.hasTable('client_users')) {
    await db.schema.createTable('client_users', table => {
      table.string('id').primary();
      table.string('userId').references('id').inTable('users').onDelete('CASCADE');
      table.string('clientId').references('id').inTable('client_workspaces').onDelete('CASCADE');
      table.timestamp('createdAt').defaultTo(db.fn.now());
      table.unique(['userId', 'clientId']);
    });
  }

  // Campaigns table
  if (!await db.schema.hasTable('campaigns')) {
    await db.schema.createTable('campaigns', table => {
      table.string('id').primary();
      table.string('clientId').references('id').inTable('client_workspaces').onDelete('CASCADE');
      table.string('name').notNullable();
      table.text('goal');
      table.text('description');
      table.string('priority').defaultTo('Medium');
      table.date('startDate');
      table.date('endDate');
      table.string('targetPlatforms');
      table.string('monthlyContentTarget');
      table.text('mainMessage');
      table.text('callToAction');
      table.string('projectLead');
      table.string('relatedFunder');
      table.string('status').defaultTo('Active');
      table.timestamps(true, true);
    });
  }

  // Meetings table
  if (!await db.schema.hasTable('meetings')) {
    await db.schema.createTable('meetings', table => {
      table.string('id').primary();
      table.string('clientId').references('id').inTable('client_workspaces').onDelete('CASCADE');
      table.string('campaignId').references('id').inTable('campaigns').onDelete('SET NULL');
      table.string('title').notNullable();
      table.date('date').notNullable();
      table.text('notes');
      table.text('transcript');
      table.string('status').defaultTo('Processed');
      table.string('recordingFile');
      table.string('transcriptFile');
      table.string('transcriptFormat');
      table.text('attendees');
      table.timestamps(true, true);
    });
  }

  // Evidence table
  if (!await db.schema.hasTable('evidence')) {
    await db.schema.createTable('evidence', table => {
      table.string('id').primary();
      table.string('clientId').references('id').inTable('client_workspaces').onDelete('CASCADE');
      table.string('campaignId').references('id').inTable('campaigns').onDelete('SET NULL');
      table.string('name').notNullable(); // Sanitized file name
      table.text('originalName'); // Original user file name
      table.string('filePath'); // Path on disk
      table.integer('fileSize'); // Size in bytes
      table.string('contentType');
      table.string('onboardingStep');
      table.string('sourceType').defaultTo('PDF');
      table.string('verificationStatus').defaultTo('Unverified');
      table.text('textExcerpt');
      table.string('uploadedBy').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('uploadedAt').defaultTo(db.fn.now());
      table.timestamps(true, true);
    });
  }

  // Reports table
  if (!await db.schema.hasTable('reports')) {
    await db.schema.createTable('reports', table => {
      table.string('id').primary();
      table.string('clientId').references('id').inTable('client_workspaces').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('donor');
      table.date('dueDate');
      table.string('status').defaultTo('Drafting');
      table.integer('completion').defaultTo(0);
      table.string('agent');
      table.string('reportType').notNullable();
      table.timestamps(true, true);
    });
  }

  // AI Outputs table
  if (!await db.schema.hasTable('ai_outputs')) {
    await db.schema.createTable('ai_outputs', table => {
      table.string('id').primary();
      table.string('clientId').references('id').inTable('client_workspaces').onDelete('CASCADE');
      table.string('campaignId').references('id').inTable('campaigns').onDelete('SET NULL');
      table.string('agentId').notNullable();
      table.string('outputType').notNullable();
      table.text('content').notNullable();
      table.integer('confidenceScore').defaultTo(100);
      table.string('verificationStatus').defaultTo('Verified');
      table.string('approvalStatus').defaultTo('Draft');

      // Single source trace columns
      table.string('sourceEvidenceId').references('id').inTable('evidence').onDelete('SET NULL');
      table.string('sourceMeetingId').references('id').inTable('meetings').onDelete('SET NULL');
      table.string('sourceManualEntryId').references('id').inTable('evidence').onDelete('SET NULL');

      // Audits
      table.string('approvedBy');
      table.timestamp('approvedAt').nullable();
      table.string('scheduledBy');
      table.timestamp('scheduledAt').nullable();
      table.string('publishedBy');
      table.timestamp('publishedAt').nullable();

      table.timestamps(true, true);

      // CHECK constraint to enforce exactly one source ID
      table.check(
        '(CASE WHEN sourceEvidenceId IS NOT NULL THEN 1 ELSE 0 END + ' +
        'CASE WHEN sourceMeetingId IS NOT NULL THEN 1 ELSE 0 END + ' +
        'CASE WHEN sourceManualEntryId IS NOT NULL THEN 1 ELSE 0 END) = 1',
        [],
        'chk_single_source'
      );
    });
  }

  // Change Logs table
  if (!await db.schema.hasTable('change_logs')) {
    await db.schema.createTable('change_logs', table => {
      table.string('id').primary();
      table.string('clientId').references('id').inTable('client_workspaces').onDelete('CASCADE');
      table.string('meetingId').references('id').inTable('meetings').onDelete('CASCADE');
      table.string('status').defaultTo('Pending');
      table.string('approvedBy');
      table.timestamp('approvedAt').nullable();
      table.timestamps(true, true);
    });
  }

  // Change Log Details table
  if (!await db.schema.hasTable('change_log_details')) {
    await db.schema.createTable('change_log_details', table => {
      table.string('id').primary();
      table.string('changeLogId').references('id').inTable('change_logs').onDelete('CASCADE');
      table.string('field').notNullable();
      table.string('label').notNullable();
      table.text('oldVal');
      table.text('newVal');
      table.text('reason');
    });
  }

  // Change Log History table (Version Control Archive)
  if (!await db.schema.hasTable('change_log_history')) {
    await db.schema.createTable('change_log_history', table => {
      table.string('id').primary();
      table.string('clientId').references('id').inTable('client_workspaces').onDelete('CASCADE');
      table.string('meetingId').references('id').inTable('meetings').onDelete('SET NULL');
      table.string('field').notNullable();
      table.string('label').notNullable();
      table.text('oldValue');
      table.text('newValue');
      table.text('reason');
      table.string('approvedBy');
      table.timestamp('approvedAt').notNullable();
    });
  }

  // Audit Logs table
  if (!await db.schema.hasTable('audit_logs')) {
    await db.schema.createTable('audit_logs', table => {
      table.string('id').primary();
      table.string('userId').references('id').inTable('users').onDelete('SET NULL');
      table.string('action').notNullable();
      table.string('clientId').references('id').inTable('client_workspaces').onDelete('SET NULL');
      table.string('targetId');
      table.text('details');
      table.string('ipAddress');
      table.timestamp('createdAt').defaultTo(db.fn.now());
    });
  }

  console.log('Database tables setup successfully.');
  await seedInitialData();
}

async function seedInitialData() {
  const userCount = await db('users').count('id as count').first();
  if (userCount.count > 0) return;

  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', adminSalt);
  const bobbyHash = await bcrypt.hash('bobby123', adminSalt);

  await db('users').insert([
    { id: 'usr-admin', name: 'Irene K.', email: 'admin@ikcomms.org', passwordHash: adminHash, role: 'admin' },
    { id: 'usr-bobby', name: 'Bobby Peek', email: 'bobby@groundwork.org.za', passwordHash: bobbyHash, role: 'client' }
  ]);

  const client1 = {
    id: 'groundwork-demo',
    name: 'groundWork SA (Demo)',
    logo: '🌱',
    website: 'www.groundwork.org.za',
    country: 'South Africa',
    sector: 'Environmental Justice',
    primaryContact: 'Bobby Peek',
    email: 'bobby@groundwork.org.za',
    phone: '+27 33 342 5662',
    monthlyFee: 2500.00,
    contractValue: 30000.00,
    startDate: '2026-01-10',
    renewalDate: '2027-01-10',
    clientStatus: 'Active',
    isBriefApproved: true,
    isMeetingSummaryApproved: true,
    areAgentsActivated: true,
    fbPageUrl: 'https://facebook.com/groundworksa',
    fbFollowers: 4200,
    fbAvgReach: 178700,
    fbAvgEngagement: 4.20,
    igHandle: '@groundworksa',
    igFollowers: 1500,
    igAvgReach: 319200,
    igAvgEngagement: 5.40,
    baselineTopPosts: '1. Durban School Air Quality Audit announcement (15.4K reach)\n2. Vukuzakhe High sensor installation photo post (12.2K reach)',
    baselineDemographics: 'Durban South residents, 58% female, 42% male; 25-45 age group 70%',
    baselineStartDate: '2026-01-10',
    goalsAchieve: 'Deploy 15 PM2.5 air sensors in Southern Durban schools.',
    goalsProblem: 'Southern Durban residents suffer from disproportionately high asthma rates due to refinery proximity.',
    goalsTop3: '1. Translate raw sensor logs into stories\n2. Mobilize parent advocacy groups\n3. Influence school zoning policies',
    goalsSuccess: 'Establish clean breathing zones around school boundaries.',
    goalsChallenges: 'Lack of city air monitors and slow environmental regulations.',
    goalsSupport: 'Social media management, newsletters, Canva brief design.',
    mission: 'To improve the quality of life of vulnerable people through environmental justice advocacy.',
    shortDesc: 'A non-profit environmental justice service and developmental organization working in South Africa.',
    toneOfVoice: 'Empowering, Urgent, Evidence-based',
    writingStyle: 'Professional, community-centric, factual',
    wordsToUse: 'Environmental justice, community monitoring, grassroots, accountability',
    brandColours: '#15803d, #1e3a8a',
    fonts: 'Inter, Outfit',
    approvedHashtags: '#EnvironmentalJustice, #CleanAirSA, #GrassrootsAction',
    socialHandles: '@groundworksa',
    currentFunders: 'Clean Air Fund, Sida',
    grantNames: 'Strategic Air Quality Partner Funding',
    reportingDeadlines: 'Quarterly reports due on the 15th post-quarter',
    requiredDonorOutputs: 'Monthly progress email, raw sensor log csv, case study',
    funderCommunicationRules: 'Consultancy logo must be secondary to NGO logo.',
    requiredImpactMetrics: 'Sensors deployed, students trained, reports sent',
    requiredEvidence: 'Photo of installation, signed training register',
    reportFrequency: 'Quarterly'
  };

  const client2 = {
    id: 'vukani-demo',
    name: 'Vukani Environmental (Demo)',
    logo: '🌀',
    website: 'www.vukanienvironmental.org',
    country: 'South Africa',
    sector: 'Waste Management',
    primaryContact: 'Nomcebo Mabuza',
    email: 'nomcebo@vukanienv.org',
    phone: '+27 11 982 1104',
    monthlyFee: 1500.00,
    contractValue: 18000.00,
    startDate: '2026-02-15',
    renewalDate: '2027-02-15',
    clientStatus: 'Active',
    isBriefApproved: true,
    isMeetingSummaryApproved: true,
    areAgentsActivated: true,
    fbPageUrl: 'https://facebook.com/vukanienvironmental',
    fbFollowers: 1200,
    fbAvgReach: 24000,
    fbAvgEngagement: 3.10,
    igHandle: '@vukanienv',
    igFollowers: 500,
    igAvgReach: 12000,
    igAvgEngagement: 2.80,
    baselineTopPosts: '1. Soweto Picker survey results graphic (5.2K reach)\n2. High-vis vests donation highlight (3.1K reach)',
    baselineDemographics: 'Soweto local volunteers, 50% female, 50% male; 18-30 age group 80%',
    baselineStartDate: '2026-02-15',
    goalsAchieve: 'Equip 100 waste pickers with safety gear.',
    goalsProblem: 'Waste pickers recycle up to 80% of packaging waste without formal wages, health benefits, or safety boots.',
    goalsTop3: '1. Raise safety gear funding\n2. Share waste-picker collection impact\n3. Promote co-op health workshops',
    goalsSuccess: '100% safety gear deployment.',
    goalsChallenges: 'Distributing gear to informal operators across Soweto.',
    goalsSupport: 'Facebook posters and co-op registers creation.',
    mission: 'To promote environmental health and recycling co-operatives in townships.',
    shortDesc: 'A community organization empowering waste pickers in Soweto.',
    toneOfVoice: 'Informative, grassroots, encouraging',
    writingStyle: 'Simple and accessible English and Zulu summaries',
    wordsToUse: 'Co-operative, recycling, waste picker safety',
    brandColours: '#0284c7, #eab308',
    fonts: 'Roboto, Arial',
    currentFunders: 'UNEP',
    grantNames: 'Environmental Co-operative Grants',
    reportFrequency: 'Monthly'
  };

  await db('client_workspaces').insert([client1, client2]);

  await db('client_users').insert({
    id: 'cu-bobby',
    userId: 'usr-bobby',
    clientId: 'groundwork-demo'
  });

  await db('campaigns').insert([
    { id: 'cmp1', clientId: 'groundwork-demo', name: 'Clean Air Durban', goal: 'Deploy 15 sensors', description: 'Deploy 15 air monitors.', priority: 'High', status: 'Active' },
    { id: 'cmp2', clientId: 'vukani-demo', name: 'Soweto Waste Picker Dignity Project', goal: 'Equip 100 pickers', description: 'Provide safety gear.', priority: 'Medium', status: 'Active' }
  ]);

  const sampleEvidence = [
    {
      id: 'ev_report_pdf',
      clientId: 'groundwork-demo',
      campaignId: 'cmp1',
      name: 'groundWork_Social_Media_Performance_Report.pdf',
      originalName: 'groundWork_Social_Media_Performance_Report.pdf',
      filePath: 'storage/uploads/groundWork_Social_Media_Performance_Report.pdf',
      fileSize: 154020,
      contentType: 'application/pdf',
      onboardingStep: 'General Evidence',
      sourceType: 'PDF',
      verificationStatus: 'Verified',
      textExcerpt: 'Facebook reach grew to 4.2K followers and 178.7K views; Instagram views reached 319.2K.',
      uploadedBy: 'usr-admin'
    },
    {
      id: 'ev1',
      clientId: 'groundwork-demo',
      campaignId: 'cmp1',
      name: 'Durban_South_Air_Quality_Audit_2025.pdf',
      originalName: 'Durban_South_Air_Quality_Audit_2025.pdf',
      filePath: 'storage/uploads/Durban_South_Air_Quality_Audit_2025.pdf',
      fileSize: 245000,
      contentType: 'application/pdf',
      onboardingStep: 'General Evidence',
      sourceType: 'PDF',
      verificationStatus: 'Verified',
      textExcerpt: 'PM2.5 levels exceed WHO limits by 140% on average during winter months.',
      uploadedBy: 'usr-admin'
    },
    {
      id: 'ev3',
      clientId: 'vukani-demo',
      campaignId: 'cmp2',
      name: 'Soweto_Picker_Survey_Data.xlsx',
      originalName: 'Soweto_Picker_Survey_Data.xlsx',
      filePath: 'storage/uploads/Soweto_Picker_Survey_Data.xlsx',
      fileSize: 98400,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      onboardingStep: 'General Evidence',
      sourceType: 'Excel',
      verificationStatus: 'Needs Review',
      textExcerpt: 'Survey data showing 87 out of 100 Soweto waste pickers operate without basic safety boots.',
      uploadedBy: 'usr-admin'
    }
  ];
  await db('evidence').insert(sampleEvidence);

  await db('meetings').insert([
    {
      id: 'meet_gw_onboarding',
      clientId: 'groundwork-demo',
      campaignId: 'cmp1',
      title: 'Initial Onboarding Alignment Meeting',
      date: '2026-06-22',
      notes: 'Reviewed clean air Durban strategy.',
      transcript: 'Bobby Peek: "We need 15 sensors deployed in schools so we can track Durban air pollution."',
      status: 'Processed'
    }
  ]);

  await db('ai_outputs').insert([
    {
      id: 'out1',
      clientId: 'groundwork-demo',
      campaignId: 'cmp1',
      agentId: 'socialmedia',
      outputType: '5 Facebook posts',
      content: '🚨 Durban Air Quality Alert! 🚨\n\nDid you know that Southern Durban schools exceed WHO air safety limits by 140% during winter?',
      confidenceScore: 98,
      verificationStatus: 'Verified',
      approvalStatus: 'Draft',
      sourceEvidenceId: 'ev1'
    }
  ]);

  await db('reports').insert([
    {
      id: 'rep1',
      clientId: 'groundwork-demo',
      name: 'Durban School Air Quality Status Report',
      donor: 'Clean Air Fund',
      dueDate: '2026-07-15',
      status: 'Drafting',
      completion: 45,
      agent: 'Donor Reporting Agent',
      reportType: 'Donor'
    }
  ]);

  console.log('Seed data successfully written to database.');
}

export default db;
export { db };
