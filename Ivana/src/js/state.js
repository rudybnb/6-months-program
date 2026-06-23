// In-memory application state - Wiped clean for fresh execution
export const state = {
  currentUserRole: 'admin', // 'admin' or 'client'
  selectedClientId: 'groundwork-demo', // Start with demo client selected
  
  // Live Currency Exchange Rate State
  currency: 'GBP', // 'GBP' or 'ZAR'
  gbpToZarRate: 22.85,
  prevGbpToZarRate: 22.85,
  rateChangePercent: 0.0,

  // Pre-configured NGO clients
  clients: [
    {
      id: 'groundwork-demo',
      name: 'groundWork SA (Demo)',
      isDemo: true,
      isBriefApproved: true,
      isMeetingSummaryApproved: true,
      areAgentsActivated: true,
      clientStatus: 'Active',
      logo: '🌱',
      primaryContact: 'Bobby Peek',
      keyContact: 'Bobby Peek',
      email: 'bobby@groundwork.org.za',
      phone: '', // 1. Missing
      website: 'www.groundwork.org.za',
      country: 'South Africa',
      sector: 'Environmental Justice',
      mission: 'To improve the quality of life of vulnerable people through environmental justice advocacy.',
      mainCause: 'Air Quality & Environmental Health',
      shortDesc: 'A non-profit environmental justice service and developmental organization working in South Africa.',
      mainServices: 'Community air monitoring, legal advocacy, pollution tracking',
      communities: 'Durban South, Mpumalanga Highveld, Vaal Triangle',
      fundingPartners: 'Sida, European Union, Clean Air Fund',
      activeProjectsCount: 3,
      reportsDueCount: 1,
      monthlyFee: 2500,
      contractValue: 30000,
      startDate: '2026-01-10',
      renewalDate: '2027-01-10',
      lastActivity: 'Active monitoring logs updated',
      nextDeadline: '2026-07-15',
      notes: 'High priority client focusing on industrial fence-line communities.',
      healthScore: 92,
      complianceScore: 95,
      projectCompletionScore: 90,

      // Brand Identity
      brandColours: '#15803d, #1e3a8a',
      fonts: 'Inter, Outfit',
      toneOfVoice: 'Empowering, Urgent, Evidence-based',
      writingStyle: 'Professional, community-centric, factual',
      wordsToUse: 'Environmental justice, community monitoring, grassroots, accountability',
      wordsToAvoid: '', // 2. Missing
      approvedHashtags: '#EnvironmentalJustice, #CleanAirSA, #GrassrootsAction',
      canvaTemplates: '', // 3. Missing
      posterExamples: '', // 4. Missing
      socialHandles: '@groundworksa',

      // Target Audience
      targetReach: 'Local residents in high-pollution industrial zones, climate donors, policy makers',
      audienceCommunity: 'Fence-line communities living near refineries and coal plants',
      audienceDonor: 'International green foundations and clean air funds',
      audienceGovernment: 'Department of Forestry, Fisheries and the Environment',
      audienceYouth: 'School climate advocacy groups in Durban',
      audienceMedia: 'National environmental journalists and local radio',
      ageGroups: 'All age groups, with youth emphasis',
      locations: 'South Africa (Durban, Mpumalanga, Vaal)',
      languages: '', // 5. Missing
      culturalConsiderations: '', // 6. Missing

      // Campaign Info
      campaignName: 'Clean Air Durban',
      campaignGoal: 'Deploy 15 PM2.5 air sensors in Southern Durban schools',
      campaignStart: '2026-05-01',
      campaignEnd: '2026-10-31',
      campaignMessage: 'Every child has a right to breathe clean air. Monitor to protect.',
      campaignFacts: 'Southern Durban residents suffer from disproportionately high asthma rates due to refinery proximity.',
      keyFacts: 'Southern Durban residents suffer from disproportionately high asthma rates due to refinery proximity.',
      campaignCta: 'Support Durban schools by sponsoring a community air monitor.',
      campaignPlatforms: 'LinkedIn, Facebook, WhatsApp',
      campaignFrequency: '3 posts per week',
      campaignPriority: 'High',

      // Project Evidence
      evidenceReports: 'Durban South Air Quality Audit 2025',
      evidenceResearch: 'Asthma Prevalence Study in Fence-line Schools',
      evidencePhotos: 'Sensor deployment photo folder',
      evidenceVideos: 'Community workshop highlight video',
      evidenceNotes: 'Southern Durban Community Workshop Minutes May 2026',
      evidenceRegisters: 'Attendance register Durban sensor training',
      evidenceSurveys: '', // 7. Missing
      evidenceFeedback: 'Resident quotes on refinery flare emission incidents',
      evidenceCaseStudies: 'Case Study: School Sensor Installation Vukuzakhe High',
      evidenceTestimonials: '', // 8. Missing
      evidenceNews: '', // 9. Missing
      evidenceFunderDocs: 'Clean Air Fund Strategic Alignment Guidelines',

      // Donor Info
      currentFunders: 'Clean Air Fund, Sida',
      grantNames: 'Strategic Air Quality Partner Funding',
      reportingDeadlines: 'Quarterly reports due on the 15th post-quarter',
      requiredDonorOutputs: 'Monthly progress email, raw sensor log csv, case study',
      donorLogoRequirements: '', // 10. Missing
      funderCommunicationRules: 'Consultancy logo must be secondary to NGO logo.',
      requiredImpactMetrics: 'Sensors deployed, students trained, reports sent',
      requiredEvidence: 'Photo of installation, signed training register',

      // Content Requirements
      contentPlatforms: 'Facebook, LinkedIn, Email Newsletter',
      contentTarget: '12 social posts, 1 newsletter per month',
      posterSizes: '', // 11. Missing
      captionStyle: 'Bold headers, short paragraphs, calls to action',
      imageStyle: 'Real photos of community advocates and sensor installs',
      videoStyle: '', // 12. Missing
      approvalProcess: 'Drafted by AI, internal review by Irene, final client approval via portal',
      publishingDeadlines: '', // 13. Missing
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
      baselineStartDate: '2026-01-10'
    },
    {
      id: 'vukani-demo',
      name: 'Vukani Environmental (Demo)',
      isDemo: true,
      isBriefApproved: true,
      isMeetingSummaryApproved: true,
      areAgentsActivated: true,
      clientStatus: 'Active',
      logo: '🌀',
      primaryContact: 'Nomcebo Mabuza',
      keyContact: 'Nomcebo Mabuza',
      email: 'nomcebo@vukanienv.org',
      phone: '+27 11 982 1104',
      website: 'www.vukanienvironmental.org',
      country: 'South Africa',
      sector: 'Waste Management',
      mission: 'To promote environmental health and recycling co-operatives in townships.',
      mainCause: 'Township waste management & recycling co-operatives',
      shortDesc: 'A community organization empowering waste pickers in Soweto.',
      mainServices: 'Waste picker safety gear, co-operative training, collection hubs',
      communities: 'Soweto, Alexandra, Tembisa',
      fundingPartners: 'UNEP, Vukani trust',
      activeProjectsCount: 1,
      reportsDueCount: 0,
      monthlyFee: 1500,
      contractValue: 18000,
      startDate: '2026-02-15',
      renewalDate: '2027-02-15',
      lastActivity: 'Co-op registers uploaded',
      nextDeadline: 'None',
      notes: 'Focus on recycling equipment upgrades and waste picker health guides.',
      healthScore: 85,
      complianceScore: 100,
      projectCompletionScore: 80,

      // Brand Identity
      brandColours: '#0284c7, #eab308',
      fonts: 'Roboto, Arial',
      toneOfVoice: 'Informative, grassroots, encouraging',
      writingStyle: 'Simple and accessible english and zulu summaries',
      wordsToUse: 'Co-operative, recycling, waste picker safety',
      wordsToAvoid: '',
      approvedHashtags: '',
      canvaTemplates: '',
      posterExamples: '',
      socialHandles: '',

      // Target Audience
      targetReach: 'Township waste pickers, local councillors, plastic recycling companies',
      audienceCommunity: 'Local recycling co-operative members in Soweto',
      audienceDonor: '',
      audienceGovernment: '',
      audienceYouth: '',
      audienceMedia: '',
      ageGroups: 'Adults aged 18-60',
      locations: 'Gauteng (Soweto)',
      languages: '',
      culturalConsiderations: '',

      // Campaign Info
      campaignName: 'Soweto Waste Picker Dignity Project',
      campaignGoal: 'Equip 100 waste pickers with high-visibility jackets and steel-toe boots',
      campaignStart: '2026-06-01',
      campaignEnd: '2026-08-31',
      campaignMessage: 'Waste pickers perform an essential service. Support safety & dignity.',
      campaignFacts: 'Waste pickers recycle up to 80% of packaging waste in township areas without formal wages.',
      keyFacts: 'Waste pickers recycle up to 80% of packaging waste in township areas without formal wages.',
      campaignCta: 'Donate boots or high-visibility gear at our Soweto hub.',
      campaignPlatforms: 'Facebook, WhatsApp',
      campaignFrequency: '1 post per week',
      campaignPriority: 'Medium',

      // Project Evidence
      evidenceReports: 'Waste Picker Impact Survey Gauteng 2025',
      evidenceResearch: '',
      evidencePhotos: '',
      evidenceVideos: '',
      evidenceNotes: '',
      evidenceRegisters: 'Vukani Soweto Co-op Registration List',
      evidenceSurveys: '',
      evidenceFeedback: '',
      evidenceCaseStudies: '',
      evidenceTestimonials: '',
      evidenceNews: '',
      evidenceFunderDocs: '',

      // Donor Info
      currentFunders: 'UNEP',
      grantNames: 'Environmental Co-operative Grants',
      reportingDeadlines: '',
      requiredDonorOutputs: '',
      donorLogoRequirements: '',
      funderCommunicationRules: '',
      requiredImpactMetrics: '',
      requiredEvidence: '',

      // Content Requirements
      contentPlatforms: 'Facebook, WhatsApp',
      contentTarget: '',
      posterSizes: '',
      publishingDeadlines: '',
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
      baselineStartDate: '2026-02-15'
    }
  ],

  meetings: [
    {
      id: 'meet_gw_onboarding',
      client_id: 'groundwork-demo',
      title: 'Initial Onboarding Alignment Meeting',
      date: '2026-06-22',
      notes: 'Reviewed clean air goals, school sensor programs, and the Clean Air Durban strategy.',
      transcript: 'Bobby Peek: "We need 15 sensors deployed in schools so we can track Durban air pollution." Irene: "We will target Durban South, Mpumalanga Highveld, and Durban schools."',
      status: 'Processed'
    },
    {
      id: 'meet_vk_onboarding',
      client_id: 'vukani-demo',
      title: 'Soweto Waste Picker Onboarding Meeting',
      date: '2026-06-20',
      notes: 'Aligned on the township waste picker dignity campaign, boot distributions, and safety gear requirements.',
      transcript: 'Nomcebo: "Our primary goal is equipping 100 waste pickers with high-vis jackets and steel-toe boots. We need community training."',
      status: 'Processed'
    }
  ],
  changeLogs: [],
  changeLogHistory: [],

  // CEO Command Center Metrics - Seeded
  ceoMetrics: {
    businessHealthScore: 88,
    clientHealthScore: 89,
    revenueScore: 80,
    reportingComplianceScore: 97,
    projectCompletionScore: 92,
    agentPerformanceScore: 95,
    overallAiRecommendation: 'Seeded with groundWork SA and Vukani Environmental demo profiles. Check AI Control Room to execute agents.'
  },

  // Campaigns Section
  campaigns: [
    { id: 'cmp1', client: 'groundwork-demo', client_id: 'groundwork-demo', name: 'Clean Air Durban', goal: 'Deploy 15 sensors', budget: 12000, status: 'Active' },
    { id: 'cmp2', client: 'vukani-demo', client_id: 'vukani-demo', name: 'Soweto Waste Picker Dignity Project', goal: 'Equip 100 pickers', budget: 8500, status: 'Active' }
  ],

  // Tasks (Today's Priorities)
  tasks: [
    { id: 'tsk1', name: 'Review groundWork Sensor Brief', client: 'groundwork-demo', client_id: 'groundwork-demo', priority: 'High', dueDate: 'Today', status: 'Pending' }
  ],

  // Content Module Pipeline
  content: [],
  contentRequests: [],
  mediaLibrary: [],
  awarenessDays: [],

  // Reports Center
  reports: [
    { id: 'rep1', name: 'Durban School Air Quality Status Report', client: 'groundwork-demo', client_id: 'groundwork-demo', donor: 'Clean Air Fund', dueDate: '2026-07-15', status: 'Drafting', completion: 45, agent: 'Donor Reporting Agent' }
  ],

  // AI Agents Configuration & Metrics - Reset to requested list
  agents: [
    { id: 'storytelling', name: 'Storytelling Agent', purpose: 'Turns NGO reports, research and field updates into simple human stories.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'socialmedia', name: 'Social Media Agent', purpose: 'Creates social media captions and platform-specific content.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'canva-brief', name: 'Canva Poster Brief Agent', purpose: 'Creates high-quality digital poster briefs for Canva design.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'calendar', name: 'Content Calendar Agent', purpose: 'Plans monthly and quarterly content calendars.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'reporting', name: 'Donor Reporting Agent', purpose: 'Turns project work and impact data into funder-ready reports.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'analytics', name: 'Analytics Agent', purpose: 'Tracks content performance and suggests improvements.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'funding-comm', name: 'Funding Communication Agent', purpose: 'Helps turn NGO impact into donor-facing communication.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' }
  ],

  // Evidence Inbox Items
  evidence: [
    {
      id: 'ev_report_pdf',
      name: 'groundWork_Social_Media_Performance_Report.pdf',
      client: 'groundwork-demo',
      client_id: 'groundwork-demo',
      project: 'Social Media Management',
      campaign: 'Clean Air Durban',
      contentType: 'Reports',
      dateUploaded: '2026-06-22',
      sourceType: 'PDF',
      verificationStatus: 'Verified',
      textExcerpt: 'Facebook and Instagram performance review: Facebook reach grew to 4.2K followers and 178.7K views; Instagram views reached 319.2K and interactions reached 15.4K between Nov 2025 and May 2026.',
      isDemoData: true
    },
    {
      id: 'ev1',
      name: 'Durban South Air Quality Audit 2025.pdf',
      client: 'groundwork-demo',
      client_id: 'groundwork-demo',
      project: 'School Sensor Deployment',
      campaign: 'Clean Air Durban',
      contentType: 'Reports',
      dateUploaded: '2026-06-15',
      sourceType: 'PDF',
      verificationStatus: 'Verified',
      textExcerpt: 'Analysis of Southern Durban schools indicates PM2.5 levels exceed WHO limits by 140% on average during winter months.',
      isDemoData: true
    },
    {
      id: 'ev2',
      name: 'Vukuzakhe High Sensor Installation Photo.jpg',
      client: 'groundwork-demo',
      client_id: 'groundwork-demo',
      project: 'School Sensor Deployment',
      campaign: 'Clean Air Durban',
      contentType: 'Photos',
      dateUploaded: '2026-06-18',
      sourceType: 'Image',
      verificationStatus: 'Verified',
      textExcerpt: 'High resolution photo confirming deployment of PM2.5 monitoring sensor at Vukuzakhe High School entrance.',
      isDemoData: true
    },
    {
      id: 'ev3',
      name: 'Soweto Picker Survey Data.xlsx',
      client: 'vukani-demo',
      client_id: 'vukani-demo',
      project: 'Waste Picker Dignity',
      campaign: 'Soweto Waste Picker Dignity Project',
      contentType: 'Survey results',
      dateUploaded: '2026-06-20',
      sourceType: 'Excel',
      verificationStatus: 'Needs Review',
      textExcerpt: 'Survey data showing 87 out of 100 Soweto waste pickers operate without basic safety boots or high-visibility clothing.',
      isDemoData: true
    }
  ],

  aiOutputs: [
    {
      id: 'out1',
      clientId: 'groundwork-demo',
      client_id: 'groundwork-demo',
      campaignName: 'Clean Air Durban',
      campaign_id: 'cmp1',
      campaignId: 'cmp1',
      project_id: 'School Sensor Deployment',
      projectId: 'School Sensor Deployment',
      evidence_id: 'ev1',
      evidenceId: 'ev1',
      source_evidence_id: 'ev1',
      source_meeting_id: '',
      source_manual_entry_id: '',
      agentId: 'socialmedia',
      agent_id: 'socialmedia',
      outputType: '5 Facebook posts',
      platform: 'Facebook',
      tone: 'Urgent, Empowering',
      dueDate: '2026-07-01',
      sourceEvidence: 'Analysis of Southern Durban schools indicates PM2.5 levels exceed WHO limits by 140% on average during winter months.',
      sourceDocName: 'Durban South Air Quality Audit 2025.pdf',
      sourceDocType: 'PDF',
      sourceDocUploadDate: '2026-06-15',
      confidenceScore: 98,
      verificationStatus: 'Verified',
      approvalStatus: 'Draft',
      approval_status: 'Draft',
      approved_by: '',
      approved_at: '',
      scheduled_by: '',
      scheduled_at: '',
      published_by: '',
      published_at: '',
      created_at: '2026-06-20T12:00:00Z',
      createdAt: '2026-06-20T12:00:00Z',
      updated_at: '2026-06-20T12:00:00Z',
      updatedAt: '2026-06-20T12:00:00Z',
      content: '🚨 Durban Air Quality Alert! 🚨\n\nDid you know that Southern Durban schools exceed WHO air safety limits by 140% during winter? This is unacceptable for our children\'s health.\n\nWe are deploying 15 new PM2.5 monitors to Durban schools to hold polluters accountable. Knowledge is power. Support our sensor campaign today!\n\n#CleanAirSA #EnvironmentalJustice #BreatheSafe',
      approvalPerson: 'Irene K.',
      isDemoData: true
    },
    {
      id: 'out2',
      clientId: 'vukani-demo',
      client_id: 'vukani-demo',
      campaignName: 'Soweto Waste Picker Dignity Project',
      campaign_id: 'cmp2',
      campaignId: 'cmp2',
      project_id: 'Waste Picker Dignity',
      projectId: 'Waste Picker Dignity',
      evidence_id: 'ev3',
      evidenceId: 'ev3',
      source_evidence_id: 'ev3',
      source_meeting_id: '',
      source_manual_entry_id: '',
      agentId: 'storytelling',
      agent_id: 'storytelling',
      outputType: 'Donor impact story',
      platform: 'Email newsletter',
      tone: 'Grassroots, Encouraging',
      dueDate: '2026-07-05',
      sourceEvidence: 'Survey data showing 87 out of 100 Soweto waste pickers operate without basic safety boots or high-visibility clothing.',
      sourceDocName: 'Soweto Picker Survey Data.xlsx',
      sourceDocType: 'Excel',
      sourceDocUploadDate: '2026-06-20',
      confidenceScore: 90,
      verificationStatus: 'Needs Review',
      approvalStatus: 'Internal Review',
      approval_status: 'Internal Review',
      approved_by: '',
      approved_at: '',
      scheduled_by: '',
      scheduled_at: '',
      published_by: '',
      published_at: '',
      created_at: '2026-06-21T14:30:00Z',
      createdAt: '2026-06-21T14:30:00Z',
      updated_at: '2026-06-21T14:30:00Z',
      updatedAt: '2026-06-21T14:30:00Z',
      content: 'Title: Restoring Dignity to Soweto\'s Waste Heroes\n\nNomcebo Mabuza stands at the gates of the Soweto Recycling Hub, looking at the daily queue of collectors. In a recent survey, Vukani Environmental discovered that 87% of township waste pickers do not own a single pair of safety boots.\n\nNomcebo says: "They perform 80% of our local recycling work, yet they walk the streets in worn-out trainers. It is about dignity." Vukani is raising support to equip 100 collectors with steel-toe boots. Join us in making Soweto clean and safe.',
      approvalPerson: 'Nomcebo Mabuza',
      isDemoData: true
    }
  ],

  // Impact Tracker Metrics (Global & Client specific)
  impactMetrics: {
    'groundwork-demo': {
      peopleReached: 5200,
      schoolsReached: 12,
      learnersReached: 2400,
      workshopsHeld: 8,
      communitiesEngaged: 3,
      volunteers: 45,
      campaignReach: 178700,
      mediaMentions: 5,
      reportsSubmitted: 6,
      fundingSecured: 55000,
      monthlyTrends: [
        { month: 'Jan', reached: 800, funding: 10000 },
        { month: 'Feb', reached: 1500, funding: 10000 },
        { month: 'Mar', reached: 2300, funding: 15000 },
        { month: 'Apr', reached: 3100, funding: 15000 },
        { month: 'May', reached: 4200, funding: 20000 },
        { month: 'Jun', reached: 5200, funding: 55000 }
      ]
    },
    'vukani-demo': {
      peopleReached: 1200,
      schoolsReached: 0,
      learnersReached: 0,
      workshopsHeld: 4,
      communitiesEngaged: 1,
      volunteers: 18,
      campaignReach: 24000,
      mediaMentions: 1,
      reportsSubmitted: 2,
      fundingSecured: 15000,
      monthlyTrends: [
        { month: 'Jan', reached: 200, funding: 5000 },
        { month: 'Feb', reached: 400, funding: 5000 },
        { month: 'Mar', reached: 600, funding: 10000 },
        { month: 'Apr', reached: 800, funding: 10000 },
        { month: 'May', reached: 1000, funding: 15000 },
        { month: 'Jun', reached: 1200, funding: 15000 }
      ]
    }
  },

  // Global Funding Opportunities Database (Left intact so AI Matching works for new clients)
  fundingOpportunities: [
    { 
      id: 'fnd1', 
      funder: 'Clean Air Fund', 
      grantName: 'Strategic Air Quality Partner Funding', 
      amount: null, // Amount not confirmed
      currency: 'GBP',
      deadline: null, // Deadline not confirmed
      sector: 'Environmental Health & Climate', 
      country: 'South Africa, India, Global', 
      eligibility: 'Non-profit organizations working on source emission reduction and data campaigns', 
      status: 'New', 
      probabilityScore: 85, 
      recommendation: 'Excellent match for African air monitoring advocacy programs.', 
      notes: 'Requires clean air evidence logs.',
      website: 'cleanairfund.org',
      email: 'info@cleanairfund.org',
      phone: '+44 (0)208 0756 200',
      sourceUrl: 'https://www.cleanairfund.org/',
      dateFound: '2026-06-22',
      dateLastVerified: '2026-06-22',
      sourceExcerpt: 'We do not accept unsolicited proposals. Instead, our teams identify potential partners and projects that align with our strategic aims to tackle air pollution.',
      sourceType: 'website',
      verificationStatus: 'Verified',
      confidenceScore: 98,
      isDemoData: false
    },
    { 
      id: 'fnd2', 
      funder: 'MacArthur Foundation', 
      grantName: 'Climate Solutions & Environmental Justice Grants', 
      amount: null, // Amount not confirmed
      currency: 'USD',
      deadline: null, // Deadline not confirmed
      sector: 'Environmental Justice', 
      country: 'Nigeria, India, United States', 
      eligibility: 'Non-profit partners working on climate mitigation and policy reforms', 
      status: 'New', 
      probabilityScore: 70, 
      recommendation: 'Suited for legal human-rights environmental litigation.', 
      notes: 'Focuses heavily on policy reform.',
      website: 'macfound.org',
      email: '4answers@macfound.org',
      phone: '+1 (312) 726-8000',
      sourceUrl: 'https://www.macfound.org/programs/climate/',
      dateFound: '2026-06-22',
      dateLastVerified: '2026-06-22',
      sourceExcerpt: 'We support organizations working to address climate change and advance environmental justice in India, Nigeria, and the United States. The Foundation does not accept unsolicited proposals.',
      sourceType: 'website',
      verificationStatus: 'Verified',
      confidenceScore: 95,
      isDemoData: false
    },
    { 
      id: 'fnd3', 
      funder: 'Climate & Clean Air Coalition', 
      grantName: 'National Action & Policy Support', 
      amount: 75000, 
      currency: 'USD',
      deadline: '2026-08-31', 
      sector: 'Clean Energy & Air Quality', 
      country: 'Developing Countries (Low & Middle Income)', 
      eligibility: 'Low- and middle-income country non-profits and government partners', 
      status: 'New', 
      probabilityScore: 92, 
      recommendation: 'Suited for urban sensor networks and air metrics tracking.', 
      notes: 'Needs state-level or regional endorsements.',
      website: 'ccacoalition.org',
      email: 'unep-newsdesk@un.org',
      phone: '+254 20 762 1234',
      sourceUrl: 'https://www.ccacoalition.org/calls-for-proposals',
      dateFound: '2026-06-22',
      dateLastVerified: '2026-06-22',
      sourceExcerpt: 'The Climate and Clean Air Coalition (CCAC) launches calls for proposals to support national planning and mitigation of short-lived climate pollutants (SLCPs). Standard awards range up to USD 75,000.',
      sourceType: 'website',
      verificationStatus: 'Verified',
      confidenceScore: 97,
      isDemoData: false
    },
    { 
      id: 'fnd4', 
      funder: 'Comic Relief', 
      grantName: 'Global Majority & Community Resilience Grants', 
      amount: null, // Amount not confirmed
      currency: 'GBP',
      deadline: null, // Deadline not confirmed
      sector: 'Youth Empowerment & Equity', 
      country: 'South Africa, United Kingdom, East Africa', 
      eligibility: 'Youth-led community organizations and civil society advocacy groups', 
      status: 'New', 
      probabilityScore: 60, 
      recommendation: 'Good for school leadership and climate workshops.', 
      notes: 'Requires child protection policy.',
      website: 'comicrelief.com',
      email: 'fundinginfo@comicrelief.com',
      phone: '+44 (0) 20 7820 2080',
      sourceUrl: 'https://www.comicrelief.com/funding/',
      dateFound: '2026-06-22',
      dateLastVerified: '2026-06-22',
      sourceExcerpt: 'Comic Relief supports community-led organizations in the UK and internationally to address systemic inequalities and improve resilience. Grant awards are tailored to project scopes.',
      sourceType: 'website',
      verificationStatus: 'Verified',
      confidenceScore: 92,
      isDemoData: false
    },
    { 
      id: 'fnd5', 
      funder: 'EPIC Air Quality Fund', 
      grantName: 'Air Quality Data & Action Grant', 
      amount: 15000, 
      currency: 'USD',
      deadline: '2026-04-15', 
      sector: 'Environmental Health & Data', 
      country: 'High-burden Air Quality Countries', 
      eligibility: 'Local advocacy non-profits and data research organizations', 
      status: 'New', 
      probabilityScore: 78, 
      recommendation: 'Highly compatible for collaborative regional projects.', 
      notes: 'Requires deployment of PM2.5 sensors.',
      website: 'epic.uchicago.edu',
      email: 'unepinfo@unep.org',
      phone: '+254 20 762 1234',
      sourceUrl: 'https://epic.uchicago.edu/air-quality-fund/',
      dateFound: '2026-06-22',
      dateLastVerified: '2026-06-22',
      sourceExcerpt: 'The EPIC Air Quality Fund pilot grants of USD 15,000 support local organizations to deploy air monitoring equipment and raise public awareness. Applications close on April 15.',
      sourceType: 'website',
      verificationStatus: 'Verified',
      confidenceScore: 96,
      isDemoData: false
    }
  ],

  // Activity Logs - Cleared
  agentActivityLogs: [],

  // Real-time AI pipeline generation storage (stores simulation state)
  simulation: {
    isRunning: false,
    currentStep: 0,
    evidenceText: '',
    targetClientId: '',
    results: {
      story: null,
      posts: [],
      report: null,
      funding: null
    }
  }
};

// Event emitter listener store for simple reactivity
const listeners = [];
export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function notify() {
  listeners.forEach(fn => fn(state));
}

const API_BASE = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? (window.location.port === '5173' ? 'http://localhost:3000' : window.location.origin)
    : (window.location.hostname === 'ik-communications.onrender.com' ? 'https://ik-communications-api.onrender.com' : window.location.origin))
  : 'http://localhost:3000';

export async function authFetch(url, options = {}) {
  options.headers = options.headers || {};
  if (state.token) {
    options.headers['Authorization'] = `Bearer ${state.token}`;
  }
  return fetch(url, options);
}

// Asynchronously load all client data from backend
export async function loadClientWorkspaceData(clientId) {
  if (!clientId) return;
  try {
    // 1. Fetch client profile brief details
    const clientRes = await authFetch(`${API_BASE}/api/clients/${clientId}`);
    if (clientRes.ok) {
      const clientData = await clientRes.json();
      const idx = state.clients.findIndex(c => c.id === clientId);
      const taggedClient = { ...clientData, databaseBacked: true };
      if (idx > -1) {
        state.clients[idx] = taggedClient;
      } else {
        state.clients.push(taggedClient);
      }
    }

    // 2. Fetch campaigns
    const campRes = await authFetch(`${API_BASE}/api/clients/${clientId}/campaigns`);
    if (campRes.ok) {
      state.campaigns = await campRes.json();
    }

    // 3. Fetch evidence
    const evRes = await authFetch(`${API_BASE}/api/clients/${clientId}/evidence`);
    if (evRes.ok) {
      state.evidence = await evRes.json();
    }

    // 4. Fetch meetings list
    const meetRes = await authFetch(`${API_BASE}/api/clients/${clientId}/meetings-list`);
    if (meetRes.ok) {
      state.meetings = await meetRes.json();
    }

    // 5. Fetch AI outputs
    const outRes = await authFetch(`${API_BASE}/api/clients/${clientId}/ai-outputs`);
    if (outRes.ok) {
      state.aiOutputs = await outRes.json();
    }

    // 6. Fetch reports
    const repRes = await authFetch(`${API_BASE}/api/clients/${clientId}/reports`);
    if (repRes.ok) {
      state.reports = await repRes.json();
    }

    // 7. Fetch proposed change logs
    const clRes = await authFetch(`${API_BASE}/api/clients/${clientId}/change-logs`);
    if (clRes.ok) {
      state.changeLogs = await clRes.json();
    }

    // 8. Fetch approved version history logs
    const clhRes = await authFetch(`${API_BASE}/api/clients/${clientId}/change-log-history`);
    if (clhRes.ok) {
      state.changeLogHistory = await clhRes.json();
    }

    // 9. Fetch audit logs
    const auditRes = await authFetch(`${API_BASE}/api/clients/${clientId}/audit-logs`);
    if (auditRes.ok) {
      const logs = await auditRes.json();
      state.agentActivityLogs = logs.map(l => ({
        timestamp: new Date(l.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        agent: l.action,
        client: getClientName(l.clientId),
        message: l.details,
        status: 'success'
      }));
    }

    // 10. Update impact metrics cache
    if (!state.impactMetrics[clientId]) {
      state.impactMetrics[clientId] = {
        peopleReached: 0,
        schoolsReached: 0,
        learnersReached: 0,
        workshopsHeld: 0,
        communitiesEngaged: 0,
        volunteers: 0,
        campaignReach: 0,
        mediaMentions: 0,
        reportsSubmitted: 0,
        fundingSecured: 0,
        monthlyTrends: []
      };
    }
    
    const cl = state.clients.find(c => c.id === clientId);
    if (cl) {
      state.impactMetrics[clientId].peopleReached = (cl.fbFollowers || 0) + (cl.igFollowers || 0);
      state.impactMetrics[clientId].campaignReach = (cl.fbAvgReach || 0) + (cl.igAvgReach || 0);
      state.impactMetrics[clientId].volunteers = cl.volunteers || 0;
      state.impactMetrics[clientId].fundingSecured = cl.fundingSecured || 0;
    }

    const reqRes = await authFetch(`${API_BASE}/api/clients/${clientId}/content-requests`);
    if (reqRes.ok) {
      state.contentRequests = await reqRes.json();
    }

    const mediaRes = await authFetch(`${API_BASE}/api/clients/${clientId}/media-library`);
    if (mediaRes.ok) {
      state.mediaLibrary = await mediaRes.json();
    }

    const awRes = await authFetch(`${API_BASE}/api/awareness-days`);
    if (awRes.ok) {
      state.awarenessDays = await awRes.json();
    }

    // Map database-backed ai_outputs to state.content for Kanban Board
    state.content = state.aiOutputs.map(o => {
      const camp = state.campaigns.find(cmp => cmp.id === o.campaignId);
      return {
        id: o.id,
        client: o.clientId,
        campaign: camp ? camp.name : (o.outputType || 'Social Campaign'),
        title: o.title || o.outputType || 'Untitled Post',
        platform: o.platform || 'LinkedIn',
        status: o.approvalStatus === 'Draft' ? 'Ideas' : (o.approvalStatus === 'Internal Review' ? 'Review' : (o.approvalStatus === 'Client Approved' ? 'Approval' : o.approvalStatus)),
        approvalStatus: o.approvalStatus || 'Draft',
        content: o.content,
        aiGenerated: o.agentId !== 'manual',
        contentPillar: o.contentPillar || 'Phase 1: Awareness',
        internalNotes: o.internalNotes || '',
        clientNotes: o.clientNotes || '',
        ...o
      };
    });

    notify();
  } catch (err) {
    console.error('Failed to load client workspace data from backend:', err);
  }
}

export async function changeUserRole(role) {
  state.currentUserRole = role;

  const email = role === 'admin' ? 'admin@ikcomms.org' : 'bobby@groundwork.org.za';
  const password = role === 'admin' ? 'admin123' : 'bobby123';

  try {
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (loginRes.ok) {
      const userData = await loginRes.json();
      state.token = userData.token;
      console.log('[TEMP DEBUG] changeUserRole - Login successful, token set');

      // Reload clients
      const clientsRes = await authFetch(`${API_BASE}/api/clients`);
      console.log(`[TEMP DEBUG] changeUserRole - GET /api/clients response status: ${clientsRes.status}`);
      if (clientsRes.ok) {
        const dbClients = await clientsRes.json();
        state.clients = dbClients.map(c => ({ ...c, databaseBacked: true }));
        console.log(`[TEMP DEBUG] changeUserRole - Loaded ${state.clients.length} database-backed clients`);
      } else {
        console.warn('[TEMP DEBUG] changeUserRole - Failed to load clients from database, using frontend fallback');
      }

      if (role === 'admin') {
        state.selectedClientId = state.clients[0]?.id || 'groundwork-demo';
      } else {
        state.selectedClientId = userData.clientId || 'groundwork-demo';
      }

      await loadClientWorkspaceData(state.selectedClientId);
    } else {
      console.warn(`[TEMP DEBUG] changeUserRole - Login response not OK: ${loginRes.status}`);
    }
  } catch (err) {
    console.error('Authentication check failed:', err);
  }
  notify();
}

export async function selectClient(clientId) {
  state.selectedClientId = clientId;
  await loadClientWorkspaceData(clientId);
  notify();
}

export async function addContentCard(card) {
  try {
    const res = await authFetch(`${API_BASE}/api/ai-outputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: card.client || card.clientId || state.selectedClientId,
        campaignId: card.campaignId || null,
        agentId: card.agentId || 'manual',
        outputType: card.outputType || 'Social Post',
        content: card.content || 'Draft content text.',
        approvalStatus: card.status || 'Ideas',
        contentPillar: card.contentPillar || 'Phase 1: Awareness',
        internalNotes: card.internalNotes || '',
        clientNotes: card.clientNotes || '',
        platform: card.platform || 'LinkedIn',
        title: card.title || 'Untitled Post',
        sourceRequestId: card.sourceRequestId || null
      })
    });
    if (res.ok) {
      await loadClientWorkspaceData(state.selectedClientId);
    }
  } catch (err) {
    console.error('Failed to add content card:', err);
  }
}

export async function updateContentStatus(cardId, newStatus) {
  let dbStatus = newStatus;
  if (newStatus === 'Ideas') dbStatus = 'Draft';
  else if (newStatus === 'Review') dbStatus = 'Internal Review';
  else if (newStatus === 'Approval') dbStatus = 'Client Approved';
  await updateAiOutputStatus(cardId, dbStatus);
}

export async function approveContentCard(cardId) {
  await updateAiOutputStatus(cardId, 'Approved');
}

export async function updateContentDetails(cardId, updates) {
  try {
    const res = await authFetch(`${API_BASE}/api/ai-outputs/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      await loadClientWorkspaceData(state.selectedClientId);
    }
  } catch (err) {
    console.error('Failed to update content details:', err);
  }
}

export async function addContentRequest(req) {
  try {
    const res = await authFetch(`${API_BASE}/api/clients/${state.selectedClientId}/content-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (res.ok) {
      await loadClientWorkspaceData(state.selectedClientId);
    }
  } catch (err) {
    console.error('Failed to add content request:', err);
  }
}

export async function updateContentRequestStatus(id, updates) {
  try {
    const res = await authFetch(`${API_BASE}/api/content-requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      await loadClientWorkspaceData(state.selectedClientId);
    }
  } catch (err) {
    console.error('Failed to update content request:', err);
  }
}

export async function addMediaAsset(asset) {
  try {
    const res = await authFetch(`${API_BASE}/api/clients/${state.selectedClientId}/media-library`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset)
    });
    if (res.ok) {
      await loadClientWorkspaceData(state.selectedClientId);
    }
  } catch (err) {
    console.error('Failed to add media asset:', err);
  }
}

export function generateProposalDraft(opp) {
  const client = state.clients.find(c => c.id === state.selectedClientId) || state.clients[0];
  if (!client) return 'Please create an NGO Client profile first before generating grant proposals.';

  const displayAmt = opp.amount 
    ? `${opp.currency === 'USD' ? '$' : '£'}${opp.amount.toLocaleString()} ${opp.currency}`
    : 'Amount not confirmed';

  return `
GRANT PROPOSAL CONCEPT NOTE
===========================
Funder: ${opp.funder}
Grant Name: ${opp.grantName}
Requested Funding: ${displayAmt}
Applicant: ${client.name}
Sector: ${opp.sector}
Country Focus: ${opp.country}

PROJECT OBJECTIVE:
Scaling the local grassroots interventions of ${client.name} in response to ${opp.sector} priorities, specifically addressing localized community indicators.

PROBLEM STATEMENT:
In ${client.country}, communities lack sufficient resources and technical systems to monitor, advocate, and report on critical ${opp.sector} factors. Our organization, backed by key stakeholders like ${client.currentFunders}, aims to expand direct community capacity.

PROPOSED ACTIVITIES:
1. Conduct community outreach and specialized training workshops.
2. Deploy local monitoring devices/toolkits (increasing current infrastructure).
3. Draft regular updates and reports using specialized AI pipelines to keep donors informed.

IMPACT METRICS TARGETED:
- People reached: +5,000 new beneficiaries
- Active participants trained: +150 stakeholders
- Monthly accountability reports submitted to ${opp.funder}

Status: Draft Generated by Funding Agent. Ready for Owner Review.
`;
}

// Simulated AI pipeline runner
export function runAIPipeline(evidence, clientId) {
  if (state.simulation.isRunning) return;

  state.simulation.isRunning = true;
  state.simulation.currentStep = 1;
  state.simulation.evidenceText = evidence;
  state.simulation.targetClientId = clientId;
  state.simulation.results = {
    story: null,
    posts: [],
    report: null,
    funding: null
  };
  notify();

  setAgentStatus('storytelling', 'Running');

  setTimeout(async () => {
    const clientName = getClientName(clientId);
    state.simulation.results.story = {
      title: `Grassroots Success: Community Action in ${clientName}`,
      narrative: `Empowered by fresh evidence: "${evidence}". This milestone project has mobilized residents.`,
      highlight: `Impact Statement: "Active community mobilization resulted in direct participation of local stakeholders."`
    };
    state.simulation.currentStep = 2;
    setAgentStatus('storytelling', 'Waiting');
    setAgentStatus('socialmedia', 'Running');
    notify();

    setTimeout(async () => {
      state.simulation.results.posts = [
        { platform: 'LinkedIn', text: `📈 Impact Alert! We are proud to highlight ${clientName}'s latest initiative: "${evidence}". #NGOImpact` },
        { platform: 'Facebook', text: `🌱 Community action in action! Here is how our team at ${clientName} is driving change: ${evidence}.` }
      ];
      state.simulation.currentStep = 3;
      setAgentStatus('socialmedia', 'Waiting');
      setAgentStatus('reporting', 'Running');
      notify();

      setTimeout(async () => {
        const reportName = `Field Evidence Report: ${evidence.substring(0, 30)}...`;
        state.simulation.currentStep = 4;
        setAgentStatus('reporting', 'Needs Review');
        setAgentStatus('funding', 'Running');
        notify();

        setTimeout(async () => {
          state.simulation.currentStep = 5;
          state.simulation.isRunning = false;
          setAgentStatus('funding', 'Waiting');
          
          // Save generated draft content to server database
          try {
            await addAiOutput({
              clientId,
              agentId: 'socialmedia',
              outputType: 'LinkedIn/Facebook drafts',
              content: `LinkedIn: Impact Alert! we highlight ${clientName}'s latest initiative: "${evidence}"`,
              sourceEvidenceId: state.evidence[0]?.id || 'ev_report_pdf'
            });
          } catch (outErr) {
            console.error('Failed to auto-insert pipeline output:', outErr);
          }
          notify();
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

function setAgentStatus(agentId, status) {
  const agent = state.agents.find(a => a.id === agentId);
  if (agent) agent.status = status;
}

function getClientName(clientId) {
  const cl = state.clients.find(c => c.id === clientId);
  return cl ? cl.name : 'Unknown NGO';
}

export function setCurrency(curr) {
  state.currency = curr;
  notify();
}

export async function updateExchangeRate() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/GBP');
    const data = await res.json();
    if (data && data.rates && data.rates.ZAR) {
      const newRate = data.rates.ZAR;
      if (state.gbpToZarRate !== newRate) {
        state.prevGbpToZarRate = state.gbpToZarRate;
        state.gbpToZarRate = newRate;
        const diff = newRate - state.prevGbpToZarRate;
        state.rateChangePercent = (diff / state.prevGbpToZarRate) * 100;
      }
      notify();
    }
  } catch (err) {
    console.error('Failed to fetch live exchange rate:', err);
  }
}

export function simulateMarketShift() {
  const sign = Math.random() > 0.5 ? 1 : -1;
  const magnitude = (Math.random() * 0.07 + 0.01) / 100; 
  const newRate = state.gbpToZarRate * (1 + (sign * magnitude));
  state.prevGbpToZarRate = state.gbpToZarRate;
  state.gbpToZarRate = newRate;
  state.rateChangePercent = ((newRate - state.prevGbpToZarRate) / state.prevGbpToZarRate) * 100;
  notify();
}

export function deleteFundingOpportunity(id) {
  state.fundingOpportunities = state.fundingOpportunities.filter(o => o.id !== id);
  notify();
}

export function addFundingOpportunity(opp) {
  if (!opp.sourceUrl || !opp.sourceUrl.trim() || !opp.sourceExcerpt || !opp.sourceExcerpt.trim()) {
    throw new Error('Verification failure: Grant opportunities must contain a valid source URL and verification excerpt.');
  }
  const newOpp = {
    id: 'fnd' + Math.floor(Math.random() * 10000000),
    status: 'New',
    probabilityScore: opp.probabilityScore || 75,
    recommendation: opp.recommendation || 'Custom ingested opportunity.',
    notes: opp.notes || 'Verified through ingestion system.',
    isDemoData: false,
    ...opp
  };
  state.fundingOpportunities.unshift(newOpp);
  notify();
}

export function calculateBriefCompletion(client) {
  if (!client) return { score: 0, status: 'Red', statusText: 'Not Enough Information', missing: {} };
  
  const fields = {
    ngoProfile: {
      name: 'Organisation name', website: 'Website', country: 'Country', sector: 'Sector', 
      mission: 'Mission statement', primaryContact: 'Primary contact person', email: 'Contact email', phone: 'Contact phone number'
    },
    brandIdentity: {
      logo: 'Logo upload', brandColours: 'Brand colours', fonts: 'Fonts', toneOfVoice: 'Tone of voice', 
      writingStyle: 'Writing style', wordsToUse: 'Words to use', wordsToAvoid: 'Words to avoid', 
      approvedHashtags: 'Approved hashtags', canvaTemplates: 'Existing Canva templates', 
      posterExamples: 'Existing poster examples', socialHandles: 'Social media handles'
    },
    targetAudience: {
      targetReach: 'Who the NGO wants to reach', audienceCommunity: 'Community audience', 
      audienceDonor: 'Donor audience', audienceGovernment: 'Government audience', 
      audienceYouth: 'Youth audience', audienceMedia: 'Media audience', 
      ageGroups: 'Age groups', locations: 'Locations', languages: 'Languages required', 
      culturalConsiderations: 'Cultural considerations'
    },
    campaignInfo: {
      campaignName: 'Campaign name', campaignGoal: 'Campaign goal', startDate: 'Campaign start date', 
      endDate: 'Campaign end date', mainMessage: 'Main message', keyFacts: 'Key facts', 
      callToAction: 'Call to action', targetPlatforms: 'Target platforms', 
      monthlyContentTarget: 'Required posting frequency', priority: 'Campaign priority'
    },
    donorInfo: {
      currentFunders: 'Current funders', grantNames: 'Grant names', reportingDeadlines: 'Reporting deadlines', 
      requiredDonorOutputs: 'Required donor outputs', donorLogoRequirements: 'Donor logo requirements', 
      funderCommunicationRules: 'Funder communication rules', requiredImpactMetrics: 'Required impact metrics', 
      requiredEvidence: 'Required evidence'
    }
  };

  let totalFields = 45;
  let filledCount = 0;
  const missing = {
    ngoProfile: [], brandIdentity: [], targetAudience: [], campaignInfo: [], donorInfo: []
  };

  for (const section in fields) {
    for (const field in fields[section]) {
      const val = client[field];
      if (val !== undefined && val !== null && val !== '' && (Array.isArray(val) ? val.length > 0 : true)) {
        filledCount++;
      } else {
        missing[section].push(fields[section][field]);
      }
    }
  }

  const score = Math.round((filledCount / totalFields) * 100);
  let status = 'Red';
  let statusText = 'Not Enough Information';
  if (score >= 80) {
    status = 'Green';
    statusText = 'Ready to Generate';
  } else if (score >= 40) {
    status = 'Yellow';
    statusText = 'Missing Important Information';
  }

  return { score, status, statusText, missing };
}

// Ingest evidence uploads
export async function addEvidence(item) {
  const clientId = item.clientId || item.client_id || state.selectedClientId;
  
  // If item is FormData (real file upload)
  if (item instanceof FormData) {
    try {
      const res = await authFetch(`${API_BASE}/api/clients/${clientId}/evidence/upload`, {
        method: 'POST',
        body: item
      });
      const evidenceData = await res.json();
      await loadClientWorkspaceData(clientId);
      return evidenceData;
    } catch (err) {
      console.error('Multipart evidence upload failed:', err);
    }
  } else {
    // Normal JSON mockup ingest
    try {
      const res = await authFetch(`${API_BASE}/api/clients/${clientId}/evidence/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      const data = await res.json();
      await loadClientWorkspaceData(clientId);
      return data;
    } catch (err) {
      console.error('JSON evidence upload failed:', err);
    }
  }
}

// Ingest Zoom transcript/meeting records
export async function addMeeting(meeting) {
  const clientId = meeting.clientId || meeting.client_id || state.selectedClientId;
  
  if (meeting instanceof FormData) {
    try {
      const res = await authFetch(`${API_BASE}/api/clients/${clientId}/meetings`, {
        method: 'POST',
        body: meeting
      });
      const data = await res.json();
      await loadClientWorkspaceData(clientId);
      return data;
    } catch (err) {
      console.error('Multipart meeting upload failed:', err);
    }
  } else {
    try {
      const res = await authFetch(`${API_BASE}/api/clients/${clientId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meeting)
      });
      const data = await res.json();
      await loadClientWorkspaceData(clientId);
      return data;
    } catch (err) {
      console.error('JSON meeting ingestion failed:', err);
    }
  }
}

// AI Output creation with database check constraints
export async function addAiOutput(output) {
  const clientId = output.clientId || output.client_id || state.selectedClientId;
  try {
    const res = await authFetch(`${API_BASE}/api/ai-outputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...output,
        clientId
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create AI output');
    }

    const createdOut = await res.json();
    await loadClientWorkspaceData(clientId);
    return createdOut;
  } catch (err) {
    console.error('AI Output creation failed:', err);
    throw err;
  }
}

// Update AI output workflow statuses (approval, scheduling, publishing)
export async function updateAiOutputStatus(id, newStatus, approvedBy = 'Irene K.') {
  try {
    const res = await authFetch(`${API_BASE}/api/ai-outputs/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, approvedBy })
    });
    if (res.ok) {
      await loadClientWorkspaceData(state.selectedClientId);
    }
  } catch (err) {
    console.error('AI status update failed:', err);
  }
}

export async function updateClientBrief(clientId, briefData) {
  try {
    const res = await authFetch(`${API_BASE}/api/clients/${clientId}/brief`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(briefData)
    });
    if (res.ok) {
      await loadClientWorkspaceData(clientId);
    }
  } catch (err) {
    console.error('Client brief update failed:', err);
  }
}

export async function addClientWorkspace(clientObj, campaigns = [], evidence = [], meeting = null) {
  try {
    const res = await authFetch(`${API_BASE}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientObj)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create client workspace');
    }

    const savedClient = await res.json();

    // Insert campaigns
    for (const c of campaigns) {
      await authFetch(`${API_BASE}/api/clients/${savedClient.id}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
    }

    // Insert evidence files (including multipart form files uploaded in onboarding wizard)
    for (const e of evidence) {
      if (e.file) {
        const formData = new FormData();
        formData.append('file', e.file);
        formData.append('onboardingStep', e.onboardingStep || e.onboarding_step || 'General Evidence');
        if (e.campaignId || e.campaign_id) {
          formData.append('campaignId', e.campaignId || e.campaign_id);
        }
        formData.append('sourceType', e.sourceType || e.source_type || 'PDF');
        formData.append('verificationStatus', e.verificationStatus || e.verification_status || 'Verified');
        formData.append('textExcerpt', e.textExcerpt || `Ingested file: ${e.file.name}`);

        await authFetch(`${API_BASE}/api/clients/${savedClient.id}/evidence/upload`, {
          method: 'POST',
          body: formData
        });
      } else {
        await authFetch(`${API_BASE}/api/clients/${savedClient.id}/evidence/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(e)
        });
      }
    }

    // Insert meeting summary
    if (meeting) {
      const mData = {
        title: meeting.title,
        date: meeting.date,
        notes: meeting.notes,
        transcript: meeting.transcript
      };
      const mRes = await authFetch(`${API_BASE}/api/clients/${savedClient.id}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mData)
      });
      const savedMeeting = await mRes.json();

      if (meeting.summaryData && meeting.summaryData.changes && meeting.summaryData.changes.length > 0) {
        await authFetch(`${API_BASE}/api/clients/${savedClient.id}/change-logs/propose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingId: savedMeeting.id,
            changes: meeting.summaryData.changes
          })
        });
      }
    }

    // Reload clients and select
    const clientsRes = await authFetch(`${API_BASE}/api/clients`);
    if (clientsRes.ok) {
      const dbClients = await clientsRes.json();
      state.clients = dbClients.map(c => ({ ...c, databaseBacked: true }));
    }

    state.selectedClientId = savedClient.id;
    await loadClientWorkspaceData(savedClient.id);
  } catch (err) {
    console.error('Workspace onboarding failed:', err);
    throw err;
  }
}

// Propose adjustments
export async function proposeMeetingChangeLog(clientId, meetingId, changes = []) {
  try {
    const res = await authFetch(`${API_BASE}/api/clients/${clientId}/change-logs/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, changes })
    });
    if (res.ok) {
      await loadClientWorkspaceData(clientId);
    }
  } catch (err) {
    console.error('Propose change log failed:', err);
  }
}

// Approve proposed adjustments (Admin only)
export async function approveMeetingChangeLog(logId, approvalUser = 'Irene K.') {
  try {
    const res = await authFetch(`${API_BASE}/api/change-logs/${logId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalUser })
    });
    if (res.ok) {
      await loadClientWorkspaceData(state.selectedClientId);
    }
  } catch (err) {
    console.error('Approve change log failed:', err);
  }
}

// Reject proposed adjustments
export async function rejectMeetingChangeLog(logId) {
  try {
    // Simply mark status as Rejected or delete log
    await loadClientWorkspaceData(state.selectedClientId);
  } catch (err) {
    console.error('Reject change log failed:', err);
  }
}

// Delete client workspace from backend database and refresh state
export async function deleteClientWorkspace(clientId) {
  try {
    console.log(`[TEMP DEBUG] deleteClientWorkspace - sending DELETE /api/clients/${clientId}`);
    const res = await authFetch(`${API_BASE}/api/clients/${clientId}`, {
      method: 'DELETE'
    });
    console.log(`[TEMP DEBUG] deleteClientWorkspace - DELETE /api/clients/${clientId} response status: ${res.status}`);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to delete client workspace');
    }

    // Reload clients
    const clientsRes = await authFetch(`${API_BASE}/api/clients`);
    console.log(`[TEMP DEBUG] deleteClientWorkspace - Reload GET /api/clients response status: ${clientsRes.status}`);
    if (clientsRes.ok) {
      const dbClients = await clientsRes.json();
      state.clients = dbClients.map(c => ({ ...c, databaseBacked: true }));
    }

    // Switch selected client if active was deleted
    if (state.selectedClientId === clientId) {
      state.selectedClientId = state.clients[0]?.id || '';
      if (state.selectedClientId) {
        await loadClientWorkspaceData(state.selectedClientId);
      }
    } else {
      await loadClientWorkspaceData(state.selectedClientId);
    }
    notify();
  } catch (err) {
    console.error('Workspace deletion failed:', err);
    throw err;
  }
}

export function simulateMeetingAgentAnalysis(meetingText) {
  const changes = [];
  const text = meetingText.toLowerCase();

  if (text.includes('primary school') || text.includes('younger kids')) {
    changes.push({
      field: 'audienceYouth',
      label: 'Youth Audience',
      oldVal: 'School climate advocacy groups in Durban',
      newVal: 'Primary school student eco-clubs aged 7-12',
      reason: 'Meeting focus shifted specifically to younger children.'
    });
  }

  if (text.includes('30 sensors') || text.includes('thirty sensors')) {
    changes.push({
      field: 'goalsAchieve',
      label: 'Campaign Goal',
      oldVal: 'Deploy 15 PM2.5 air sensors in Southern Durban schools',
      newVal: 'Deploy 30 PM2.5 air sensors in schools and clinics',
      reason: 'Funder expanded grant coverage targets.'
    });
  }

  if (text.includes('monthly reporting') || text.includes('every month')) {
    changes.push({
      field: 'reportingDeadlines',
      label: 'Reporting Deadlines',
      oldVal: 'Quarterly reports due on the 15th post-quarter',
      newVal: 'Monthly progress check-in reports due on 5th of each month',
      reason: 'Clean Air Fund requested monthly data updates.'
    });
  }

  return {
    summary: 'Aligned on school monitor expansion. Clean Air Fund requested monthly updates.',
    goalsDetected: '1. Track school air quality indices.\n2. Scale training to primary level.',
    decisions: '1. Double sensor deployment targets.\n2. Establish monthly reporting.',
    actionPoints: '1. Procure 15 additional monitors.\n2. Setup monthly reporting template.',
    campaignChanges: changes.length > 0 ? `${changes.length} campaign profile shifts recommended` : 'None detected',
    outputs: 'Primary workshop brief, Monthly PDF report outline',
    missingInfo: 'Awaiting formal contract addendum.',
    nextSteps: '1. Approve proposed change log.',
    agentTargets: 'Storytelling Agent, Canva Brief Agent, Donor Reporting Agent',
    changes
  };
}

// Initial trigger to boot-login and load baseline workspaces from SQLite
changeUserRole(state.currentUserRole);


