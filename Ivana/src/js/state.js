// In-memory application state - Wiped clean for fresh execution
export const state = {
  currentUserRole: 'admin', // 'admin' or 'client'
  selectedClientId: '', // No client selected initially
  
  // Live Currency Exchange Rate State
  currency: 'GBP', // 'GBP' or 'ZAR'
  gbpToZarRate: 22.85,
  prevGbpToZarRate: 22.85,
  rateChangePercent: 0.0,

  // Clear all NGO clients
  clients: [],

  // CEO Command Center Metrics - Cleared
  ceoMetrics: {
    businessHealthScore: 0,
    clientHealthScore: 0,
    revenueScore: 0,
    reportingComplianceScore: 0,
    projectCompletionScore: 0,
    agentPerformanceScore: 0,
    overallAiRecommendation: 'Awaiting evidence upload. Please add an NGO client to start tracking impact and performance metrics.'
  },

  // Campaigns Section - Cleared
  campaigns: [],

  // Tasks (Today's Priorities) - Cleared
  tasks: [],

  // Content Module Pipeline - Cleared
  content: [],

  // Reports Center - Cleared
  reports: [],

  // AI Agents Configuration & Metrics - Reset
  agents: [
    { id: 'storytelling', name: 'Storytelling Agent', description: 'Turns reports, notes and updates into engaging narrative stories and case studies.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'socialmedia', name: 'Social Media Agent', description: 'Creates, schedules, and monitors multi-platform social media posts & graphics recommendations.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'reporting', name: 'Donor Reporting Agent', description: 'Compiles project data, impact stats, and updates into beautiful, donor-ready reports.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'funding', name: 'Funding Agent', description: 'Finds funding grants, tracks matching indices, and generates grant proposal drafts.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'newsletter', name: 'Newsletter Agent', description: 'Composes stakeholder newsletters, bulletins, and donor updates.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'analytics', name: 'Analytics Agent', description: 'Aggregates engagement stats, reach metrics, web hits and open rates.', status: 'Waiting', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' },
    { id: 'planner', name: 'Content Planner Agent', description: 'Manages editorial calendars and aligns posts with campaign timelines.', status: 'Disabled', lastRun: 'Never', tasksCompleted: 0, successRate: 100, error: 'None', nextTask: 'None' }
  ],

  // Impact Tracker Metrics (Global & Client specific) - Cleared
  impactMetrics: {},

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

// Action functions
export function changeUserRole(role) {
  state.currentUserRole = role;
  notify();
}

export function selectClient(clientId) {
  state.selectedClientId = clientId;
  notify();
}

export function addContentCard(card) {
  state.content.push({
    id: 'cnt' + (state.content.length + 1),
    aiGenerated: false,
    publishDate: 'None',
    approvalStatus: 'Draft',
    ...card
  });
  notify();
}

export function updateContentStatus(cardId, newStatus) {
  const card = state.content.find(c => c.id === cardId);
  if (card) {
    card.status = newStatus;
    if (newStatus === 'Published') {
      card.approvalStatus = 'Approved';
      const client = state.selectedClientId;
      if (state.impactMetrics[client]) {
        state.impactMetrics[client].campaignReach += Math.floor(Math.random() * 500) + 200;
        state.impactMetrics[client].peopleReached += Math.floor(Math.random() * 50) + 10;
      }
    }
    notify();
  }
}

export function approveContentCard(cardId) {
  const card = state.content.find(c => c.id === cardId);
  if (card) {
    card.approvalStatus = 'Approved';
    if (card.status === 'Approval') {
      card.status = 'Scheduled';
    }
    notify();
  }
}

export function generateProposalDraft(opportunityId) {
  const opp = state.fundingOpportunities.find(o => o.id === opportunityId);
  if (!opp) return '';

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
In ${client.country}, communities lack sufficient resources and technical systems to monitor, advocate, and report on critical ${opp.sector} factors. Our organization, backed by key stakeholders like ${client.fundingPartners}, aims to expand direct community capacity.

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

// Simulated AI Agent pipeline execution
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

  // Step 1: Storytelling Agent (1.5 seconds)
  setTimeout(() => {
    const clientName = getClientName(clientId);
    state.simulation.results.story = {
      title: `Grassroots Success: Community Action in ${clientName}`,
      narrative: `Empowered by fresh evidence: "${evidence}". This milestone project has mobilized residents, showing first-hand how community-led interventions create visible impact. Participants mapped key pollution and risk zones, creating actionable evidence.`,
      highlight: `Impact Statement: "Active community mobilization resulted in direct participation of local stakeholders, building key grassroots evidence."`
    };
    state.simulation.currentStep = 2;
    setAgentStatus('storytelling', 'Waiting');
    setAgentStatus('socialmedia', 'Running');
    logActivity('Storytelling Agent', clientName, 'Parsed evidence and created community impact narrative.', 'success');
    notify();

    // Step 2: Social Media Agent (1.5 seconds)
    setTimeout(() => {
      state.simulation.results.posts = [
        {
          platform: 'LinkedIn',
          text: `📈 Impact Alert! We are proud to highlight ${clientName}'s latest initiative. Focused on community empowerment: "${evidence}". Together, we're building grassroots transparency. #NGOImpact #CommunityDevelopment #Sustainability`
        },
        {
          platform: 'Facebook',
          text: `🌱 Community action in action! Here is how our team at ${clientName} is driving change today: ${evidence}. Thanks to all our volunteers and partners for making this possible! 🤝 #CleanAir #GreenFuture`
        },
        {
          platform: 'Instagram',
          text: `📊 Transforming evidence into action. Today's highlight from the field: "${evidence}". Swipe to see updates from our local projects! 📸 #EcoCommunity #Grassroots`
        }
      ];
      state.simulation.currentStep = 3;
      setAgentStatus('socialmedia', 'Waiting');
      setAgentStatus('reporting', 'Running');
      logActivity('Social Media Agent', clientName, 'Generated 3 posts (LinkedIn, Facebook, Instagram) based on the new narrative.', 'success');
      notify();

      // Step 3: Donor Reporting Agent (1.5 seconds)
      setTimeout(() => {
        const reportName = `Field Evidence Report: ${evidence.substring(0, 30)}...`;
        const newReport = {
          id: 'r' + (state.reports.length + 1),
          name: reportName,
          client: clientId,
          donor: 'Global Impact Fund',
          dueDate: 'In 14 days',
          status: 'Pending Review',
          completion: 90,
          agent: 'Donor Reporting Agent'
        };
        state.reports.unshift(newReport);
        state.simulation.results.report = newReport;

        state.simulation.currentStep = 4;
        setAgentStatus('reporting', 'Needs Review');
        setAgentStatus('funding', 'Running');
        logActivity('Donor Reporting Agent', clientName, `Created report: "${reportName}" for donor submission.`, 'success');
        
        state.tasks.unshift({
          id: 't' + (state.tasks.length + 1),
          name: `Review Generated Report: ${reportName}`,
          client: clientId,
          priority: 'High',
          dueDate: 'Today',
          status: 'Needs Review',
          actionText: 'Review'
        });

        notify();

        // Step 4: Funding Agent (1.5 seconds)
        setTimeout(() => {
          // Identify matching grant from opportunities pool (or pick a fallback)
          const realFallback = {
            id: 'fnd-fallback',
            funder: 'Climate & Clean Air Coalition',
            grantName: 'National Action & Policy Support',
            amount: 75000,
            currency: 'USD',
            deadline: '2026-08-31',
            sector: 'Clean Energy & Air Quality',
            country: 'Developing Countries',
            eligibility: 'Low- and middle-income country non-profits',
            probabilityScore: 92,
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
          };
          const matchingGrant = state.fundingOpportunities[Math.floor(Math.random() * state.fundingOpportunities.length)] || realFallback;
          state.simulation.results.funding = {
            grantName: matchingGrant.grantName,
            funder: matchingGrant.funder,
            amount: matchingGrant.amount,
            matchReason: `High probability score (${matchingGrant.probabilityScore}%)! Current activity matches their focus area: ${matchingGrant.sector}.`
          };

          // Increment client metrics
          if (state.impactMetrics[clientId]) {
            state.impactMetrics[clientId].peopleReached += Math.floor(Math.random() * 150) + 50;
            state.impactMetrics[clientId].workshopsHeld += 1;
            state.impactMetrics[clientId].campaignReach += Math.floor(Math.random() * 1200) + 500;
          }

          // Add generated content to Content pipeline board under 'Review'
          state.content.unshift({
            id: 'cnt' + (state.content.length + 1),
            title: `Community Highlight: ${evidence.substring(0, 25)}...`,
            client: clientId,
            campaign: 'Environmental Health',
            platform: 'LinkedIn',
            status: 'Review',
            author: 'Storytelling Agent',
            publishDate: 'Today',
            aiGenerated: true,
            approvalStatus: 'Pending'
          });

          // Simulate overall business score adjustments on first run
          state.ceoMetrics.businessHealthScore = 95;
          state.ceoMetrics.clientHealthScore = 90;
          state.ceoMetrics.revenueScore = 85;
          state.ceoMetrics.reportingComplianceScore = 90;
          state.ceoMetrics.projectCompletionScore = 90;
          state.ceoMetrics.agentPerformanceScore = 98;
          state.ceoMetrics.overallAiRecommendation = `Focus on newly uploaded narratives for ${clientName}. Storytelling output is waiting for review.`;

          state.simulation.currentStep = 5;
          state.simulation.isRunning = false;
          setAgentStatus('funding', 'Waiting');
          logActivity('Funding Agent', clientName, `Cross-referenced data with active grants. Recommended applying to "${matchingGrant.grantName}".`, 'success');
          
          const activeAgentIds = ['storytelling', 'socialmedia', 'reporting', 'funding'];
          activeAgentIds.forEach(id => {
            const ag = state.agents.find(a => a.id === id);
            if (ag) {
              ag.tasksCompleted += 1;
              ag.lastRun = 'Just now';
            }
          });

          notify();
        }, 1500);
      }, 1500);
    }, 1500);
  }, 1500);
}

// Helper utilities
function setAgentStatus(agentId, status) {
  const agent = state.agents.find(a => a.id === agentId);
  if (agent) {
    agent.status = status;
  }
}

function logActivity(agent, client, message, status) {
  state.agentActivityLogs.unshift({
    timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    agent,
    client,
    message,
    status
  });
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
  // Simulate small market ticks: GBP strengthening or weakening by ±0.01% to ±0.08% against ZAR
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
  // Validation: Enforce source evidence URL and excerpt before ingestion
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

