import { 
  state, 
  subscribe,
  notify, 
  changeUserRole, 
  selectClient, 
  addContentCard, 
  updateContentStatus, 
  approveContentCard, 
  generateProposalDraft, 
  runAIPipeline,
  setCurrency,
  deleteFundingOpportunity,
  addFundingOpportunity,
  calculateBriefCompletion,
  addEvidence,
  addAiOutput,
  updateAiOutputStatus,
  updateClientBrief,
  addClientWorkspace,
  proposeMeetingChangeLog,
  approveMeetingChangeLog,
  rejectMeetingChangeLog,
  simulateMeetingAgentAnalysis,
  proposeClientBriefChangeLog,
  addCampaign,
  updateCampaign,
  deleteCampaign,
  addMeeting,
  deleteClientWorkspace,
  addContentRequest,
  updateContentRequestStatus,
  addMediaAsset,
  updateContentDetails
} from './state.js';

import { renderLineChart, renderBarChart } from './chart.js';

// Helper functions for grant formatting
function formatOpportunityAmount(opp, selectedCurrency) {
  if (opp.amount === null || opp.amount === undefined) {
    return `<span style="color: var(--warning-color, #d97706); font-weight: 500;">Amount not confirmed</span>`;
  }
  
  let amountInGBP = opp.amount;
  if (opp.currency === 'USD') {
    amountInGBP = opp.amount * 0.78; // Approx conversion rate from USD to GBP
  }

  if (selectedCurrency === 'ZAR') {
    const convertedZar = amountInGBP * state.gbpToZarRate;
    const prevConvertedZar = amountInGBP * state.prevGbpToZarRate;
    const differenceZar = convertedZar - prevConvertedZar;
    
    let diffStr = '';
    if (differenceZar > 0) {
      diffStr = ` <span class="rate-indicator positive" style="color: var(--success-color); font-size: 0.7rem; font-weight: 600; margin-left: 0.25rem;">(+R${differenceZar.toFixed(0)})</span>`;
    } else if (differenceZar < 0) {
      diffStr = ` <span class="rate-indicator negative" style="color: var(--danger-color); font-size: 0.7rem; font-weight: 600; margin-left: 0.25rem;">(R${differenceZar.toFixed(0)})</span>`;
    }
    
    return `<strong>R ${convertedZar.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong>${diffStr}`;
  } else {
    // Default or GBP view
    const formattedGBP = `£${amountInGBP.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    if (opp.currency === 'USD') {
      return `<strong>${formattedGBP}</strong> <span style="font-size: 0.75rem; color: var(--text-muted);">($${opp.amount.toLocaleString()} USD)</span>`;
    }
    return `<strong>${formattedGBP}</strong>`;
  }
}

function formatOpportunityDeadline(opp) {
  if (opp.deadline === null || opp.deadline === undefined) {
    return `<span style="color: var(--warning-color, #d97706); font-weight: 500;">Deadline not confirmed</span>`;
  }
  return opp.deadline;
}

// RENDER ADMIN DASHBOARD
export function renderAdminDashboard(container) {
  const activeClientsCount = state.clients.filter(c => c.monthlyFee > 0).length;
  const totalRevenue = state.clients.reduce((acc, c) => acc + c.monthlyFee, 0);
  const activeProjectsCount = state.clients.reduce((acc, c) => acc + (c.activeProjectsCount || 0), 0);
  const reportsDueCount = state.reports.filter(r => r.status !== 'Submitted').length;
  const contentWaitingCount = state.content.filter(c => c.approvalStatus === 'Pending').length;
  const fundingOpportunitiesCount = state.fundingOpportunities.filter(o => o.status === 'New' || o.status === 'Reviewing').length;

  container.innerHTML = `
    <!-- Top KPI Row -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon primary">👥</div>
        <div class="kpi-info">
          <span class="kpi-label">Total Clients</span>
          <span class="kpi-value">${activeClientsCount} Managed</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon success">£</div>
        <div class="kpi-info">
          <span class="kpi-label">Monthly Revenue</span>
          <span class="kpi-value">£${totalRevenue.toLocaleString()}</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon info">📁</div>
        <div class="kpi-info">
          <span class="kpi-label">Active Projects</span>
          <span class="kpi-value">${activeProjectsCount} Running</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon warning">📝</div>
        <div class="kpi-info">
          <span class="kpi-label">Reports Due</span>
          <span class="kpi-value">${reportsDueCount} Required</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon danger">⏳</div>
        <div class="kpi-info">
          <span class="kpi-label">Content Waiting</span>
          <span class="kpi-value">${contentWaitingCount} Approvals</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon primary">💎</div>
        <div class="kpi-info">
          <span class="kpi-label">Funding Opps</span>
          <span class="kpi-value">${fundingOpportunitiesCount} Live</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon danger">🔥</div>
        <div class="kpi-info">
          <span class="kpi-label">Tasks Due Today</span>
          <span class="kpi-value">${state.tasks.length} Priorities</span>
        </div>
      </div>
    </div>

    <!-- CEO Command Center -->
    <div class="dashboard-section card command-center">
      <div class="section-header">
        <div>
          <h2>⚡ CEO Command Center</h2>
          <p class="subtitle">Real-time business performance scores and top action priorities</p>
        </div>
        <div class="overall-badge">
          <span class="badge-number">${state.ceoMetrics.businessHealthScore}</span>
          <span class="badge-label">Business Score</span>
        </div>
      </div>
      
      <div class="score-grid">
        <div class="score-card">
          <span class="score-title">Client Health</span>
          <div class="progress-bar-container">
            <div class="progress-bar success" style="width: ${state.ceoMetrics.clientHealthScore}%"></div>
          </div>
          <span class="score-value">${state.ceoMetrics.clientHealthScore}/100</span>
        </div>
        <div class="score-card">
          <span class="score-title">Revenue Target</span>
          <div class="progress-bar-container">
            <div class="progress-bar info" style="width: ${state.ceoMetrics.revenueScore}%"></div>
          </div>
          <span class="score-value">${state.ceoMetrics.revenueScore}/100</span>
        </div>
        <div class="score-card">
          <span class="score-title">Reporting Compliance</span>
          <div class="progress-bar-container">
            <div class="progress-bar warning" style="width: ${state.ceoMetrics.reportingComplianceScore}%"></div>
          </div>
          <span class="score-value">${state.ceoMetrics.reportingComplianceScore}/100</span>
        </div>
        <div class="score-card">
          <span class="score-title">Project Delivery</span>
          <div class="progress-bar-container">
            <div class="progress-bar success" style="width: ${state.ceoMetrics.projectCompletionScore}%"></div>
          </div>
          <span class="score-value">${state.ceoMetrics.projectCompletionScore}/100</span>
        </div>
        <div class="score-card">
          <span class="score-title">AI Agents Efficiency</span>
          <div class="progress-bar-container">
            <div class="progress-bar primary" style="width: ${state.ceoMetrics.agentPerformanceScore}%"></div>
          </div>
          <span class="score-value">${state.ceoMetrics.agentPerformanceScore}/100</span>
        </div>
      </div>

      <div class="ai-recommendation-box">
        <div class="ai-recommendation-header">
          <span class="sparkle">✨</span> <strong>AI Consultant Recommendation</strong>
        </div>
        <p class="ai-recommendation-text">"${state.ceoMetrics.overallAiRecommendation}"</p>
      </div>
    </div>

    <!-- Main Content Split -->
    <div class="dashboard-split">
      
      <!-- Client Health Section -->
      <div class="dashboard-section card client-health">
        <div class="section-header">
          <h2>🏥 Client Health Status</h2>
          <span class="tag">Managed Accounts</span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Status</th>
                <th>Projects</th>
                <th>Reports Due</th>
                <th>Monthly Fee</th>
                <th>Next Deadline</th>
              </tr>
            </thead>
            <tbody>
              ${state.clients.slice(0, 4).map(c => `
                <tr class="clickable-row" data-client-id="${c.id}">
                  <td>
                    <div class="client-cell">
                      <span class="client-logo-circle">${c.logo}</span>
                      <strong>${c.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge ${c.databaseBacked ? (c.isBriefApproved ? 'green' : 'yellow') : 'disabled'}">
                      <span class="dot"></span> ${c.databaseBacked ? (c.isBriefApproved ? 'Healthy' : 'Pending Onboarding') : 'Frontend Demo Placeholder'}
                    </span>
                  </td>
                  <td>${c.activeProjectsCount}</td>
                  <td>${c.reportsDueCount}</td>
                  <td><strong>£${c.monthlyFee.toLocaleString()}</strong></td>
                  <td><span class="deadline-txt ${c.databaseBacked && c.status === 'red' ? 'danger' : ''}">${c.nextDeadline || 'None'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Today's Work Section -->
      <div class="dashboard-section card today-tasks">
        <div class="section-header">
          <h2>🔥 Today's Priorities</h2>
          <span class="tag danger">Urgent Actions</span>
        </div>
        <div class="task-list">
          ${state.tasks.map(t => {
            const client = state.clients.find(c => c.id === t.client) || { name: 'NGO Client', logo: '🌐' };
            let priorityClass = t.priority.toLowerCase();
            let statusClass = t.status.toLowerCase().replace(' ', '-');
            return `
              <div class="task-item">
                <div class="task-main">
                  <div class="task-title">
                    <span class="priority-badge ${priorityClass}">${t.priority}</span>
                    <strong>${t.name}</strong>
                  </div>
                  <div class="task-meta">
                    <span>${client.logo} ${client.name}</span> • 
                    <span class="task-due ${t.status === 'Overdue' ? 'danger' : ''}">${t.dueDate}</span>
                  </div>
                </div>
                <div class="task-action">
                  <button class="btn btn-sm btn-outline action-task-btn" data-task-id="${t.id}" data-action="${t.actionText}">
                    ${t.actionText}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>

    <!-- AI Evidence Pipeline Trigger Box -->
    <div class="dashboard-section card pipeline-trigger-card">
      <div class="pipeline-card-inner">
        <div class="pipeline-info-side">
          <h2>🚀 Upload Field Evidence & Run AI Pipeline</h2>
          <p>Instantly transform raw report data, community feedback, meeting notes or sensor logs into storytelling narratives, donor reports, and campaign assets in real-time.</p>
          <div class="preset-triggers">
            <span>Try Preset templates:</span>
            <button class="btn btn-sm btn-ghost preset-btn" data-text="Held a clean-air workshop with 50 local high schoolers in Durban. Set up 3 PM2.5 air sensors. Learners plotted air monitoring charts and identified emissions zones.">Durban Air Sensors</button>
            <button class="btn btn-sm btn-ghost preset-btn" data-text="Zero Waste campaign audit: Collected 4 tons of recyclable plastics from Durban High School. 85 school kids organized the recycling workshop.">Zero Waste Schools</button>
            <button class="btn btn-sm btn-ghost preset-btn" data-text="Eco Justice litigation victory: Port Harcourt High Court ruled gas flaring by foreign operators is a violation of life & dignity. Legal arguments drafted for 12 community plaintiffs.">Niger Delta Court Win</button>
          </div>
        </div>
        <div class="pipeline-action-side">
          <div class="input-group">
            <textarea id="pipelineEvidenceInput" placeholder="Paste field notes, survey results, whatsapp reports, or photo caption text..."></textarea>
            <div class="pipeline-select-row">
              <select id="pipelineClientSelect">
                ${state.clients.slice(0, 4).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
              <button id="runPipelineBtn" class="btn btn-primary">Run AI Agents</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind events
  // Row click to profile
  container.querySelectorAll('.clickable-row').forEach(row => {
    row.addEventListener('click', () => {
      const clientId = row.getAttribute('data-client-id');
      selectClient(clientId);
      window.location.hash = `#clients?id=${clientId}`;
    });
  });

  // Action task buttons
  container.querySelectorAll('.action-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = btn.getAttribute('data-task-id');
      const action = btn.getAttribute('data-action');
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        if (action === 'Approve') {
          // Find content card to approve
          const card = state.content.find(c => c.client === task.client && c.approvalStatus === 'Pending');
          if (card) {
            approveContentCard(card.id);
            alert(`Approved content card: "${card.title}"`);
          } else {
            alert('Approved task successfully!');
          }
          // Remove task
          state.tasks = state.tasks.filter(t => t.id !== taskId);
          notify();
        } else if (action === 'Generate') {
          // Navigate to funding
          selectClient(task.client);
          window.location.hash = '#funding';
        } else if (action === 'Review' || action === 'Generate Narrative') {
          // Trigger AI logs or report center
          window.location.hash = '#reports';
        }
      }
    });
  });

  // Preset buttons
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const txt = btn.getAttribute('data-text');
      const input = document.getElementById('pipelineEvidenceInput');
      if (input) input.value = txt;

      // Auto pick client
      const select = document.getElementById('pipelineClientSelect');
      if (select) {
        if (txt.includes('Durban') || txt.includes('Waste')) {
          select.value = 'groundwork';
        } else if (txt.includes('Court') || txt.includes('Niger')) {
          select.value = 'ecojustice';
        }
      }
    });
  });

  // Run pipeline trigger
  const runBtn = document.getElementById('runPipelineBtn');
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const evidence = document.getElementById('pipelineEvidenceInput').value.trim();
      const clientId = document.getElementById('pipelineClientSelect').value;
      if (!evidence) {
        alert('Please enter some field evidence or click one of the preset templates.');
        return;
      }
      openPipelineModal();
      runAIPipeline(evidence, clientId);
    });
  }
}

// RENDER NGO CLIENT DASHBOARD
export function renderClientDashboard(container) {
  const client = state.clients.find(c => c.id === state.selectedClientId) || state.clients[0];
  if (!client) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <h2>🌱 Welcome to the NGO Client Portal</h2>
        <p class="subtitle mt-2">There are currently no active NGO client profiles in the system.</p>
        <p class="mt-4">Please toggle back to the <strong>IK Admin Console</strong> and select <strong>Clients</strong> to add a new NGO client profile.</p>
      </div>
    `;
    return;
  }
  const clientCampaigns = state.campaigns.filter(c => c.client === client.id);
  const clientReports = state.reports.filter(r => r.client === client.id);
  const clientContent = state.content.filter(c => c.client === client.id);
  const clientFunding = state.fundingOpportunities.filter(f => f.country === client.country || f.sector.includes(client.sector.split(' ')[0]));
  const metrics = state.impactMetrics[client.id] || { peopleReached: 0, campaignReach: 0, reportsSubmitted: 0, fundingSecured: 0 };

  container.innerHTML = `
    <div class="client-dash-header">
      <div class="client-profile-summary">
        <span class="client-profile-logo">${client.logo}</span>
        <div>
          <h1>${client.name} Dashboard</h1>
          <p class="subtitle">${client.sector} • ${client.country}</p>
        </div>
      </div>
      <div class="dash-role-indicator">
        <span class="badge success">Client Portal Access</span>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon primary">👥</div>
        <div class="kpi-info">
          <span class="kpi-label">People Reached</span>
          <span class="kpi-value">${metrics.peopleReached.toLocaleString()}</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon success">📣</div>
        <div class="kpi-info">
          <span class="kpi-label">Social Campaign Reach</span>
          <span class="kpi-value">${metrics.campaignReach.toLocaleString()}</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon warning">📁</div>
        <div class="kpi-info">
          <span class="kpi-label">Active Campaigns</span>
          <span class="kpi-value">${clientCampaigns.length} Running</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon danger">📝</div>
        <div class="kpi-info">
          <span class="kpi-label">Reports Drafted/Due</span>
          <span class="kpi-value">${clientReports.filter(r => r.status !== 'Submitted').length} Pending</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon primary">💰</div>
        <div class="kpi-info">
          <span class="kpi-label">Funding Secured</span>
          <span class="kpi-value">£${metrics.fundingSecured.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="dashboard-split mt-6">
      <!-- Campaigns Section -->
      <div class="dashboard-section card">
        <div class="section-header">
          <h2>📁 Active Campaigns</h2>
          <span class="tag">Operational Pipelines</span>
        </div>
        <div class="campaign-list">
          ${clientCampaigns.length > 0 ? clientCampaigns.map(c => `
            <div class="campaign-item">
              <div class="campaign-info">
                <div class="campaign-name-row">
                  <strong>${c.name}</strong>
                  <span class="status-badge ${c.progress > 80 ? 'green' : 'yellow'}">${c.status}</span>
                </div>
                <div class="campaign-sub">
                  <span>Assigned Agent: <strong>${c.assigned}</strong></span> • 
                  <span>Deadline: <strong>${c.deadline}</strong></span>
                </div>
                <div class="campaign-progress-row">
                  <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${c.progress}%"></div>
                  </div>
                  <span class="progress-pct">${c.progress}%</span>
                </div>
              </div>
            </div>
          `).join('') : '<div class="chart-empty">No active campaigns.</div>'}
        </div>
      </div>

      <!-- Left-over widgets: Scheduled content and approvals -->
      <div class="right-split-stack">
        <!-- Content Awaiting Approval -->
        <div class="dashboard-section card">
          <div class="section-header">
            <h2>⏳ Assets Awaiting Your Approval</h2>
            <span class="tag danger">Action Required</span>
          </div>
          <div class="approvals-list">
            ${clientContent.filter(c => c.approvalStatus === 'Pending').length > 0 ? 
              clientContent.filter(c => c.approvalStatus === 'Pending').map(c => `
                <div class="approval-item">
                  <div class="approval-info">
                    <span class="platform-badge">${c.platform}</span>
                    <strong>${c.title}</strong>
                    <p class="approval-desc">Drafted by ${c.author} for ${c.campaign}</p>
                  </div>
                  <div class="approval-actions">
                    <button class="btn btn-sm btn-ghost approve-content-btn" data-content-id="${c.id}">Approve Post</button>
                  </div>
                </div>
              `).join('') : '<div class="chart-empty">No items waiting for approval. All caught up!</div>'
            }
          </div>
        </div>

        <!-- Reports Due & Status -->
        <div class="dashboard-section card">
          <div class="section-header">
            <h2>📝 Funder Reports Due</h2>
            <span class="tag">Compliance Monitor</span>
          </div>
          <div class="reports-due-list">
            ${clientReports.length > 0 ? clientReports.map(r => `
              <div class="report-due-item">
                <div class="report-due-main">
                  <strong>${r.name}</strong>
                  <div class="report-due-meta">
                    <span>Funder: ${r.donor}</span> • 
                    <span class="danger">${r.dueDate}</span>
                  </div>
                </div>
                <div>
                  <span class="status-badge ${r.status === 'Submitted' ? 'green' : r.status === 'Pending Review' ? 'yellow' : 'red'}">
                    ${r.status}
                  </div>
              </div>
            `).join('') : '<div class="chart-empty">No reports compiled.</div>'}
          </div>
        </div>
      </div>
    </div>

    <!-- Impact & Funding Split -->
    <div class="dashboard-split mt-6">
      <!-- Impact Graph -->
      <div class="dashboard-section card">
        <div class="section-header">
          <h2>📊 Engagement Trend (People Reached)</h2>
          <span class="tag success">Performance Index</span>
        </div>
        <div id="clientTrendChart" class="chart-container"></div>
      </div>

      <!-- Funding Opportunities -->
      <div class="dashboard-section card">
        <div class="section-header">
          <h2>💎 Matched Grant Opportunities</h2>
          <span class="tag">AI Recommended</span>
        </div>
        <div class="matched-funding-list">
          ${clientFunding.length > 0 ? clientFunding.map(f => `
            <div class="funding-opportunity-item">
              <div class="funding-details">
                <strong>${f.grantName}</strong>
                <span>Funder: ${f.funder} • Sector: ${f.sector}</span>
                <span class="amount">Value: ${formatOpportunityAmount(f, 'GBP')}</span>
              </div>
              <div class="funding-actions">
                <span class="match-score success">${f.probabilityScore}% Match</span>
                <button class="btn btn-sm btn-outline generate-draft-btn" data-opportunity-id="${f.id}">Generate Proposal</button>
              </div>
            </div>
          `).join('') : '<div class="chart-empty">No direct matches. Review sector categories in settings.</div>'}
        </div>
      </div>
    </div>
  `;

  // Draw Line Chart
  if (metrics.monthlyTrends) {
    const chartData = metrics.monthlyTrends.map(t => ({ label: t.month, value: t.reached }));
    setTimeout(() => {
      renderLineChart('clientTrendChart', chartData, { width: 500, height: 180 });
    }, 100);
  }

  // Bind actions
  container.querySelectorAll('.approve-content-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.getAttribute('data-content-id');
      approveContentCard(cardId);
      alert('Content approved! Scheduled for automatic publishing.');
    });
  });

  container.querySelectorAll('.generate-draft-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const oppId = btn.getAttribute('data-opportunity-id');
      openSourceEvidenceModal(oppId, () => {
        const draft = generateProposalDraft(oppId);
        openDraftModal(draft, oppId);
      });
    });
  });
}

// RENDER CLIENTS MODULE (List and Profile Views)
export function renderClientsModule(container) {
  // If a specific client is selected via Query parameters, render the Profile view!
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const profileId = urlParams.get('id');

  if (profileId) {
    renderClientProfile(container, profileId);
    return;
  }

  // Otherwise, render the client list
  container.innerHTML = `
    <div class="section-header-row mb-6">
      <div>
        <h1>NGO Clients Database</h1>
        <p class="subtitle">Management center for active contracts, reports, and AI Agent alignments</p>
      </div>
      <button class="btn btn-primary" id="addNewClientBtn">+ Add NGO Client</button>
    </div>

    <!-- Filter & Search Row -->
    <div class="table-actions card mb-6">
      <div class="search-box-container">
        <span class="search-icon">🔍</span>
        <input type="text" id="clientSearchInput" placeholder="Search NGO name, sector, primary contact, country..." />
      </div>
      <div class="filter-group">
        <select id="clientStatusFilter">
          <option value="all">All Statuses</option>
          <option value="green">Healthy (Green)</option>
          <option value="yellow">Needs Attention (Yellow)</option>
          <option value="red">Critical (Red)</option>
        </select>
      </div>
    </div>

    <!-- Clients Grid -->
    <div class="clients-card-grid" id="clientsGridContainer">
      ${state.clients.map(c => {
        const statusClass = c.databaseBacked ? (c.isBriefApproved ? 'green' : 'yellow') : 'disabled';
        const statusText = c.databaseBacked ? (c.isBriefApproved ? 'Healthy' : 'Pending Onboarding') : 'Frontend Demo Placeholder';
        return `
        <div class="client-card card hover-card-clickable" data-client-id="${c.id}">
          <div class="client-card-top">
            <span class="client-card-logo">${c.logo}</span>
            <div style="display:flex; gap:0.4rem; align-items:center;">
              <span class="status-badge ${statusClass}">
                <span class="dot"></span> ${statusText}
              </span>
              ${state.currentUserRole === 'admin' ? `
                <button type="button" class="btn-delete-workspace" data-id="${c.id}" style="background:none; border:none; cursor:pointer; font-size:1.15rem; color:#ef4444; padding:0.2rem; margin-top:-2px;" title="Delete Workspace">🗑️</button>
              ` : ''}
            </div>
          </div>
          <h3 class="client-card-name">${c.name}</h3>
          <p class="client-card-sector">${c.sector}</p>
          <div class="client-card-country-row">
            <span>📍 ${c.country || 'Global'}</span>
          </div>
          
          <div class="client-card-metrics mt-4">
            <div class="client-mini-metric">
              <span class="mini-label">Monthly Fee</span>
              <span class="mini-value">${c.monthlyFee > 0 ? '£' + c.monthlyFee.toLocaleString() : 'Archived'}</span>
            </div>
            <div class="client-mini-metric">
              <span class="mini-label">Projects</span>
              <span class="mini-value">${c.activeProjectsCount || 0} Active</span>
            </div>
            <div class="client-mini-metric">
              <span class="mini-label">Reports Due</span>
              <span class="mini-value">${c.reportsDueCount || 0}</span>
            </div>
          </div>
          <div class="client-card-footer mt-4">
            <span class="last-activity">Active: ${c.lastActivity}</span>
            <span class="arrow">→</span>
          </div>
        </div>
        `;
      }).join('')}
    </div>
  `;

  // Attach search/filter logic
  const searchInput = document.getElementById('clientSearchInput');
  const statusFilter = document.getElementById('clientStatusFilter');
  const gridContainer = document.getElementById('clientsGridContainer');

  const bindDeleteListeners = () => {
    gridContainer.querySelectorAll('.btn-delete-workspace').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Avoid opening the client profile
        const id = btn.getAttribute('data-id');
        const clientObj = state.clients.find(c => c.id === id);
        if (clientObj && !clientObj.databaseBacked) {
          alert('This is a frontend demo placeholder and cannot be deleted.');
          return;
        }
        const clName = clientObj?.name || 'this workspace';
        if (confirm(`Are you sure you want to permanently delete the workspace "${clName}"? This will delete all associated campaigns, meetings, evidence, reports, and AI logs.`)) {
          try {
            await deleteClientWorkspace(id);
            alert(`Workspace "${clName}" has been successfully deleted.`);
            renderClientsModule(container); // Re-render page
          } catch (err) {
            alert('Failed to delete workspace: ' + err.message);
          }
        }
      });
    });
  };

  const filterClients = () => {
    const query = searchInput.value.toLowerCase();
    const filterStatus = statusFilter.value;

    const filtered = state.clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(query) || 
                            c.sector.toLowerCase().includes(query) || 
                            (c.country && c.country.toLowerCase().includes(query));
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    gridContainer.innerHTML = filtered.length > 0 ? filtered.map(c => {
      const statusClass = c.databaseBacked ? (c.isBriefApproved ? 'green' : 'yellow') : 'disabled';
      const statusText = c.databaseBacked ? (c.isBriefApproved ? 'Healthy' : 'Pending Onboarding') : 'Frontend Demo Placeholder';
      return `
      <div class="client-card card hover-card-clickable" data-client-id="${c.id}">
        <div class="client-card-top">
          <span class="client-card-logo">${c.logo}</span>
          <div style="display:flex; gap:0.4rem; align-items:center;">
            <span class="status-badge ${statusClass}">
              <span class="dot"></span> ${statusText}
            </span>
            ${state.currentUserRole === 'admin' ? `
              <button type="button" class="btn-delete-workspace" data-id="${c.id}" style="background:none; border:none; cursor:pointer; font-size:1.15rem; color:#ef4444; padding:0.2rem; margin-top:-2px;" title="Delete Workspace">🗑️</button>
            ` : ''}
          </div>
        </div>
        <h3 class="client-card-name">${c.name}</h3>
        <p class="client-card-sector">${c.sector}</p>
        <div class="client-card-country-row">
          <span>📍 ${c.country || 'Global'}</span>
        </div>
        
        <div class="client-card-metrics mt-4">
          <div class="client-mini-metric">
            <span class="mini-label">Monthly Fee</span>
            <span class="mini-value">${c.monthlyFee > 0 ? '£' + c.monthlyFee.toLocaleString() : 'Archived'}</span>
          </div>
          <div class="client-mini-metric">
            <span class="mini-label">Projects</span>
            <span class="mini-value">${c.activeProjectsCount || 0} Active</span>
          </div>
          <div class="client-mini-metric">
            <span class="mini-label">Reports Due</span>
            <span class="mini-value">${c.reportsDueCount || 0}</span>
          </div>
        </div>
        <div class="client-card-footer mt-4">
          <span class="last-activity">Active: ${c.lastActivity}</span>
          <span class="arrow">→</span>
        </div>
      </div>
      `;
    }).join('') : '<div class="chart-empty w-full">No matching NGO clients found.</div>';

    // Rebind cards
    gridContainer.querySelectorAll('.client-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-client-id');
        selectClient(id);
        window.location.hash = `#clients?id=${id}`;
      });
    });
    bindDeleteListeners();
  };

  if (searchInput && statusFilter) {
    searchInput.addEventListener('input', filterClients);
    statusFilter.addEventListener('change', filterClients);
  }

  // Bind initial cards
  gridContainer.querySelectorAll('.client-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-client-id');
      selectClient(id);
      window.location.hash = `#clients?id=${id}`;
    });
  });
  bindDeleteListeners();

  // Add new client btn trigger
  const newClientBtn = document.getElementById('addNewClientBtn');
  if (newClientBtn) {
    newClientBtn.addEventListener('click', () => {
      openNewClientModal();
    });
  }
}

// RENDER SINGLE CLIENT PROFILE VIEW
function renderClientProfile(container, clientId) {
  const client = state.clients.find(c => c.id === clientId);
  if (!client) {
    container.innerHTML = `<div class="chart-empty">Client ID: "${clientId}" not found in database. <a href="#clients">Back to List</a></div>`;
    return;
  }

  const clientCampaigns = state.campaigns.filter(c => c.client === client.id);
  const clientReports = state.reports.filter(r => r.client === client.id);
  const clientContent = state.content.filter(c => c.client === client.id);
  const clientFunding = state.fundingOpportunities.filter(f => f.country === client.country || f.sector.includes(client.sector.split(' ')[0]));
  const metrics = state.impactMetrics[client.id] || { peopleReached: 0, campaignReach: 0, reportsSubmitted: 0, fundingSecured: 0, customMetrics: [] };

  container.innerHTML = `
    <div class="profile-back-row" style="display:flex; justify-content:space-between; align-items:center;">
      <a href="#clients" class="back-link">← Back to Clients Database</a>
      ${state.currentUserRole === 'admin' ? `
        <button type="button" class="btn btn-danger btn-sm" id="btnDeleteProfileWorkspace" style="background-color:#ef4444; border-color:#ef4444; color:white; font-weight:700; border:none; padding:0.4rem 0.8rem; border-radius:6px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; gap:0.25rem;" title="Delete Workspace">
          🗑️ Delete NGO Workspace
        </button>
      ` : ''}
    </div>

    <div class="profile-header-card card mt-4">
      <div class="profile-header-main">
        <span class="profile-lg-logo">${client.logo}</span>
        <div>
          <div class="profile-title-badges">
            <h1>${client.name}</h1>
            <span class="status-badge ${client.databaseBacked ? (client.isBriefApproved ? 'green' : 'yellow') : 'disabled'}">
              <span class="dot"></span> ${client.databaseBacked ? (client.isBriefApproved ? 'Healthy' : 'Pending Onboarding') : 'Frontend Demo Placeholder'}
            </span>
            ${state.currentUserRole === 'admin' ? `
              <button type="button" class="btn btn-outline btn-sm" id="btnEditClientProfile" style="margin-left: 1rem; display: inline-flex; align-items: center; gap: 0.25rem;">
                ✏️ Edit Profile
              </button>
            ` : ''}
          </div>
          <p class="subtitle">${client.sector} • 📍 ${client.country}</p>
        </div>
      </div>
      
      <div class="profile-quick-meta">
        <div class="meta-item">
          <span class="meta-lbl">Monthly Contract</span>
          <span class="meta-val highlight-val">£${client.monthlyFee.toLocaleString()}/mo</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">Contract Value</span>
          <span class="meta-val">£${client.contractValue ? client.contractValue.toLocaleString() : 'N/A'}/yr</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">Start Date</span>
          <span class="meta-val">${client.startDate || 'N/A'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">Renewal Date</span>
          <span class="meta-val">${client.renewalDate || 'N/A'}</span>
        </div>
      </div>
    </div>

    <!-- Profile Split -->
    <div class="profile-split mt-6">
      
      <!-- Primary Contact & Details Card -->
      <div class="profile-details-card card">
        <h3>📋 Organisation Details</h3>
        <div class="detail-fields mt-4">
          <div class="field-item">
            <span class="field-lbl">Primary Contact</span>
            <span class="field-val"><strong>${client.primaryContact}</strong></span>
          </div>
          <div class="field-item">
            <span class="field-lbl">Email Address</span>
            <span class="field-val"><a href="mailto:${client.email}">${client.email}</a></span>
          </div>
          <div class="field-item">
            <span class="field-lbl">Phone Number</span>
            <span class="field-val">${client.phone}</span>
          </div>
          <div class="field-item">
            <span class="field-lbl">Website URL</span>
            <span class="field-val"><a href="https://${client.website}" target="_blank">${client.website}</a></span>
          </div>
          <div class="field-item">
            <span class="field-lbl">Funding Partners</span>
            <span class="field-val">${client.fundingPartners}</span>
          </div>
          <div class="field-item mt-4">
            <span class="field-lbl">Notes & Directives</span>
            <p class="notes-block">${client.notes}</p>
          </div>
        </div>
      </div>

      <!-- Activity Tab Panel -->
      <div class="profile-tabs-card card">
        <div class="tab-headers">
          <button class="profile-tab-btn active" data-tab="overview">Overview & Impact</button>
          <button class="profile-tab-btn" data-tab="campaigns">Campaigns (${clientCampaigns.length})</button>
          <button class="profile-tab-btn" data-tab="reports">Reports (${clientReports.length})</button>
          <button class="profile-tab-btn" data-tab="content">Content (${clientContent.length})</button>
          <button class="profile-tab-btn" data-tab="funding">Funding Opps (${clientFunding.length})</button>
          <button class="profile-tab-btn" data-tab="recommendations">AI Recommendations</button>
          <button class="profile-tab-btn" data-tab="meeting-intel">Meeting Intel & logs</button>
        </div>

        <div class="tab-body mt-4" id="profileTabBody">
          <!-- Overview Tab (Default) -->
          <div class="tab-pane active" id="tab-overview">
            <h4>Impact Tracker</h4>
            <div class="impact-grid-mini mt-4">
              <div class="impact-stat-mini">
                <span class="lbl">People Reached</span>
                <span class="val">${metrics.peopleReached.toLocaleString()}</span>
              </div>
              <div class="impact-stat-mini">
                <span class="lbl">Campaign Reach</span>
                <span class="val">${metrics.campaignReach.toLocaleString()}</span>
              </div>
              <div class="impact-stat-mini">
                <span class="lbl">Reports Filed</span>
                <span class="val">${metrics.reportsSubmitted}</span>
              </div>
              <div class="impact-stat-mini">
                <span class="lbl">Secured Grants</span>
                <span class="val">£${metrics.fundingSecured.toLocaleString()}</span>
              </div>
            </div>
            
            ${metrics.customMetrics && metrics.customMetrics.length > 0 ? `
              <h4 class="mt-6">NGO Custom Metrics</h4>
              <div class="impact-grid-mini mt-4">
                ${metrics.customMetrics.map(cm => `
                  <div class="impact-stat-mini border-secondary">
                    <span class="lbl">${cm.label}</span>
                    <span class="val text-secondary">${cm.value}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Social Media Baseline Grid -->
            <h4 class="mt-6">📢 Social Media Starting Baseline</h4>
            <div class="impact-grid-mini mt-4" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div class="impact-stat-mini" style="border-left: 4px solid #1877f2; background: white;">
                <span class="lbl" style="color:#1877f2; font-weight:700;">📘 Facebook Baseline</span>
                <span class="val" style="font-size:0.85rem; font-weight:700; word-break: break-all; margin:0.25rem 0;">
                  ${client.fbPageUrl ? `<a href="${client.fbPageUrl}" target="_blank" style="color: #1877f2; text-decoration: underline;">View Page</a>` : 'Not Connected'}
                </span>
                <div style="font-size:0.7rem; color:#475569; line-height:1.4;">
                  👥 Followers: <strong>${(client.fbFollowers || 0).toLocaleString()}</strong><br/>
                  📈 Reach: <strong>${(client.fbAvgReach || 0).toLocaleString()}</strong><br/>
                  ⚡ Engagement: <strong>${client.fbAvgEngagement || 0.0}%</strong>
                </div>
              </div>
              <div class="impact-stat-mini" style="border-left: 4px solid #c13584; background: white;">
                <span class="lbl" style="color:#c13584; font-weight:700;">📸 Instagram Baseline</span>
                <span class="val" style="font-size:0.85rem; font-weight:700; margin:0.25rem 0;">
                  ${client.igHandle || 'Not Connected'}
                </span>
                <div style="font-size:0.7rem; color:#475569; line-height:1.4;">
                  👥 Followers: <strong>${(client.igFollowers || 0).toLocaleString()}</strong><br/>
                  📈 Reach: <strong>${(client.igAvgReach || 0).toLocaleString()}</strong><br/>
                  ⚡ Engagement: <strong>${client.igAvgEngagement || 0.0}%</strong>
                </div>
              </div>
              <div class="impact-stat-mini" style="border-left: 4px solid #10b981; background: white; grid-column: span 2;">
                <span class="lbl" style="color:#10b981; font-weight:700;">📅 Baseline Context</span>
                <div style="font-size:0.7rem; color:#334155; line-height:1.4; margin-top:0.25rem;">
                  📅 Start Date: <strong>${client.baselineStartDate || 'None'}</strong><br/>
                  👥 Demographics: <strong>${client.baselineDemographics || 'N/A'}</strong><br/>
                  🔥 Top Posts: <strong>${client.baselineTopPosts || 'N/A'}</strong>
                </div>
              </div>
            </div>

            <h4 class="mt-6">Performance Trend</h4>
            <div id="profileTrendChart" class="chart-container mt-4"></div>
          </div>

          <!-- Campaigns Tab -->
          <div class="tab-pane" id="tab-campaigns">
            <h4>Active Campaigns</h4>
            <div class="campaign-table-container mt-4">
              <table>
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Next Deadline</th>
                    <th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  ${clientCampaigns.map(c => `
                    <tr>
                      <td><strong>${c.name}</strong></td>
                      <td>
                        <div class="progress-bar-container">
                          <div class="progress-bar" style="width: ${c.progress}%"></div>
                        </div>
                        <span class="progress-pct">${c.progress}%</span>
                      </td>
                      <td><span class="status-badge ${c.progress > 80 ? 'green' : 'yellow'}">${c.status}</span></td>
                      <td>${c.deadline}</td>
                      <td>${c.assigned}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Reports Tab -->
          <div class="tab-pane" id="tab-reports">
            <h4>Reports Log</h4>
            <div class="campaign-table-container mt-4">
              <table>
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Donor</th>
                    <th>Due Date</th>
                    <th>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${clientReports.map(r => `
                    <tr>
                      <td><strong>${r.name}</strong></td>
                      <td>${r.donor}</td>
                      <td>${r.dueDate}</td>
                      <td>${r.completion}%</td>
                      <td><span class="status-badge ${r.status === 'Submitted' ? 'green' : r.status === 'Pending Review' ? 'yellow' : 'red'}">${r.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Content Tab -->
          <div class="tab-pane" id="tab-content">
            <h4>Content Pipeline & Assets</h4>
            <div class="content-table-container mt-4">
              <table>
                <thead>
                  <tr>
                    <th>Asset Title</th>
                    <th>Platform</th>
                    <th>Publisher</th>
                    <th>Approval</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${clientContent.map(cnt => `
                    <tr>
                      <td><strong>${cnt.title}</strong></td>
                      <td><span class="platform-badge">${cnt.platform}</span></td>
                      <td>${cnt.author}</td>
                      <td>
                        <span class="status-badge ${cnt.approvalStatus === 'Approved' ? 'green' : 'yellow'}">
                          ${cnt.approvalStatus}
                        </span>
                      </td>
                      <td><strong>${cnt.status}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Funding Tab -->
          <div class="tab-pane" id="tab-funding">
            <h4>Matched Funding Grants</h4>
            <div class="matched-funding-list mt-4">
              ${clientFunding.map(f => `
                <div class="funding-opportunity-item mb-4">
                  <div class="funding-details">
                    <strong>${f.grantName}</strong>
                    <span>Funder: ${f.funder} • Eligibility: ${f.eligibility}</span>
                    <span class="amount">Value: ${formatOpportunityAmount(f, 'GBP')}</span>
                  </div>
                  <div class="funding-actions">
                    <span class="match-score success">${f.probabilityScore}% Match</span>
                    <button class="btn btn-sm btn-outline generate-draft-btn" data-opportunity-id="${f.id}">Generate Concept Draft</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- AI Recommendations Tab -->
          <div class="tab-pane" id="tab-recommendations">
            <h4>AI Generated Actions for ${client.name}</h4>
            <div class="recommendations-box-list mt-4">
              <div class="recommendation-item-card">
                <span class="sparkle">✨</span>
                <div class="rec-details">
                  <strong>Expand Waste picker storytelling</strong>
                  <p>Based on high social media reach for the waste heroic post, scheduling 2 additional human stories by the Storytelling Agent will likely boost engagement by 15%.</p>
                </div>
              </div>
              <div class="recommendation-item-card">
                <span class="sparkle">✨</span>
                <div class="rec-details">
                  <strong>Submit Clean Air Fund Report in 5 days</strong>
                  <p>Drafting for Clean Air Fund is 75% complete. Compile Durban monitoring records to finalize the report and proceed with approval workflow.</p>
                </div>
              </div>
              <div class="recommendation-item-card">
                <span class="sparkle">✨</span>
                <div class="rec-details">
                  <strong>Apply to Bloomberg Nairobi Smart Cities Grant</strong>
                  <p>This £80,000 grant has a high match index (92%). The Funding Agent has simulated a project draft based on the sensor deployment updates.</p>
                </div>
              </div>
            </div>

            <!-- Meeting Intel & Logs Tab -->
            <div class="tab-pane" id="tab-meeting-intel">
              <div style="background:#e0f2fe; border:1px solid #bae6fd; padding:0.75rem; border-radius:8px; color:#0369a1; font-size:0.8rem; font-weight:600; display:flex; gap:0.4rem; align-items:center; margin-bottom:1rem;">
                <span>💡</span>
                <span>[PROTOTYPE ONLY] File uploads and transcript scanning are simulated. The Meeting Agent requires human approval before updating client parameters.</span>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:1.5rem;">
                <!-- Left Column: Upload and Propose -->
                <div>
                  <div class="card p-4" style="background:#f8fafc; border:1px solid var(--border-color); border-radius:8px; margin-bottom:1rem;">
                    <h4 style="margin:0 0 0.5rem 0; font-size:0.9rem; font-weight:700; color:#0f172a; text-transform:none;">🤖 Run Meeting Agent on New Transcript</h4>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-top:0.5rem;">
                      <div class="form-group">
                        <label>Meeting Date</label>
                        <input type="date" id="profileMeetingDate" value="${new Date().toISOString().split('T')[0]}" style="font-size:0.75rem;" />
                      </div>
                      <div class="form-group">
                        <label>Campaign Linkage</label>
                        <select id="profileMeetingCampaign" style="font-size:0.75rem; height:30px;">
                          <option value="General">General Workspace (No Campaign)</option>
                          ${clientCampaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                      </div>
                    </div>

                    <div class="form-group mt-2">
                      <label>Attendees List</label>
                      <input type="text" id="profileMeetingAttendees" placeholder="e.g. Bobby Peek, Irene K." style="font-size:0.75rem;" />
                    </div>

                    <div style="background:#f1f5f9; padding:0.75rem; border-radius:6px; margin-top:0.75rem; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:0.5rem;">
                      <span style="font-size:0.7rem; font-weight:700; color:#475569; display:block;">📹 ZOOM AUDIO/VIDEO RECORDING [PROTOTYPE]</span>
                      <div class="form-group" style="margin:0;">
                        <input type="text" id="profileMeetingRecordingFile" placeholder="e.g. GMT20260623_Zoom_Recording.mp4" style="font-size:0.75rem;" />
                      </div>

                      <span style="font-size:0.7rem; font-weight:700; color:#475569; display:block; margin-top:0.25rem;">📄 ZOOM TRANSCRIPT FILE (.txt, .docx, .pdf, .vtt, .srt)</span>
                      <div style="display:flex; gap:0.5rem; align-items:center;">
                        <input type="file" id="profileMeetingTranscriptFile" accept=".vtt,.srt,.txt,.docx,.pdf" style="font-size:0.75rem; flex-grow:1;" />
                      </div>
                    </div>

                    <div class="form-group mt-3">
                      <label>Paste Meeting Notes / Transcript Text</label>
                      <textarea id="profileMeetingNotesText" style="height:100px; font-size:0.8rem;" placeholder="Paste text here..."></textarea>
                    </div>
                    
                    <button class="btn btn-sm btn-primary mt-3" id="profileRunMeetingAgentBtn" style="background:#4f46e5; border-color:#4f46e5; font-weight:700; width:100%;">🧠 Ingest & Scan Meeting</button>
                    
                    <!-- Loader -->
                    <div id="profileMeetingAgentLoader" style="display:none; text-align:center; padding:1rem; color:#4f46e5; font-size:0.75rem;">
                      <div style="border: 2px solid #f3f3f3; border-top: 2px solid #4f46e5; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto 0.5rem auto;"></div>
                      Analyzing notes for strategic shifts...
                    </div>
                  </div>

                  <!-- Proposed Change Logs -->
                  <div id="owProposedChangeLogsArea">
                    \${renderProposedChangeLogsHtml(client.id)}
                  </div>
                </div>

                <!-- Right Column: Version History Timeline & Past Meetings -->
                <div>
                  <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:8px; margin-bottom:1rem;">
                    <h4 style="margin:0 0 0.75rem 0; font-size:0.9rem; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:0.25rem; text-transform:none;">📜 Approved Version History</h4>
                    <div id="owVersionHistoryArea">
                      \${renderVersionHistoryHtml(client.id)}
                    </div>
                  </div>

                  <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:8px;">
                    <h4 style="margin:0 0 0.75rem 0; font-size:0.9rem; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:0.25rem; text-transform:none;">📅 Processed Meetings Log</h4>
                    <div id="owMeetingsLogArea">
                      \${renderMeetingsLogHtml(client.id)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    `;

    // Draw trend chart
  if (metrics.monthlyTrends) {
    const chartData = metrics.monthlyTrends.map(t => ({ label: t.month, value: t.reached }));
    setTimeout(() => {
      renderLineChart('profileTrendChart', chartData, { width: 500, height: 180 });
    }, 100);
  }

  // Handle Tab Switch
  container.querySelectorAll('.profile-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      const pane = container.querySelector(`#tab-${tabId}`);
      if (pane) pane.classList.add('active');

      // Re-trigger SVG render if tab-overview is opened
      if (tabId === 'overview' && metrics.monthlyTrends) {
        setTimeout(() => {
          renderLineChart('profileTrendChart', chartData, { width: 500, height: 180 });
        }, 50);
      }
    });
  });

  // Rebind generate concept draft buttons
  container.querySelectorAll('.generate-draft-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const oppId = btn.getAttribute('data-opportunity-id');
      openSourceEvidenceModal(oppId, () => {
        const draft = generateProposalDraft(oppId);
        openDraftModal(draft, oppId);
      });
    });
  });

  // Bind meeting-intel run agent
  const runProfileAgentBtn = container.querySelector('#profileRunMeetingAgentBtn');
  if (runProfileAgentBtn) {
    runProfileAgentBtn.addEventListener('click', async () => {
      const text = container.querySelector('#profileMeetingNotesText').value.trim();
      const fileInput = container.querySelector('#profileMeetingTranscriptFile');
      const file = fileInput ? fileInput.files[0] : null;

      if (!text && !file) {
        alert('Please enter meeting transcript or notes, or upload a transcript file.');
        return;
      }
      
      const dateVal = container.querySelector('#profileMeetingDate').value;
      const campaignVal = container.querySelector('#profileMeetingCampaign').value;
      const attendeesVal = container.querySelector('#profileMeetingAttendees').value.trim();
      const recordingVal = container.querySelector('#profileMeetingRecordingFile').value.trim();

      const loader = container.querySelector('#profileMeetingAgentLoader');
      if (loader) loader.style.display = 'block';
      runProfileAgentBtn.style.display = 'none';

      // Read text if file is uploaded and notes are empty
      let transcriptText = text;
      if (file && !transcriptText) {
        try {
          if (file.name.endsWith('.txt') || file.name.endsWith('.vtt') || file.name.endsWith('.srt')) {
            transcriptText = await file.text();
            const textArea = container.querySelector('#profileMeetingNotesText');
            if (textArea) textArea.value = transcriptText;
          } else {
            transcriptText = `[Transcript file: ${file.name}]`;
          }
        } catch (err) {
          console.error('Failed to read transcript file contents:', err);
          transcriptText = `[Error reading transcript file: ${file.name}]`;
        }
      }

      setTimeout(async () => {
        try {
          const analysis = simulateMeetingAgentAnalysis(transcriptText);
          
          let newMeeting = null;
          const meetingDate = dateVal || new Date().toISOString().split('T')[0];

          if (file) {
            const meetingData = new FormData();
            meetingData.append('file', file);
            meetingData.append('title', `Zoom Ingestion: ${file.name}`);
            meetingData.append('date', meetingDate);
            meetingData.append('notes', analysis.summary);
            meetingData.append('transcript', transcriptText);
            meetingData.append('recordingFile', recordingVal);
            meetingData.append('attendees', attendeesVal);
            if (campaignVal !== 'General') {
              meetingData.append('campaignId', campaignVal);
            }
            newMeeting = await addMeeting(meetingData);
          } else {
            newMeeting = await addMeeting({
              clientId: client.id,
              campaignId: campaignVal === 'General' ? null : campaignVal,
              title: 'Subsequent Strategy Session',
              date: meetingDate,
              notes: analysis.summary,
              transcript: transcriptText,
              recordingFile: recordingVal,
              attendees: attendeesVal
            });
          }

          // Add matching evidence file to Evidence Inbox
          if (file) {
            const evidenceData = new FormData();
            evidenceData.append('file', file);
            evidenceData.append('onboardingStep', 'Evidence & Notes');
            if (campaignVal !== 'General') {
              evidenceData.append('campaignId', campaignVal);
            }
            evidenceData.append('sourceType', file.name.endsWith('.pdf') ? 'PDF' : (file.name.endsWith('.docx') ? 'Word' : 'Text'));
            evidenceData.append('verificationStatus', 'Verified');
            evidenceData.append('textExcerpt', transcriptText);
            await addEvidence(evidenceData);
          } else {
            await addEvidence({
              clientId: client.id,
              campaignId: campaignVal === 'General' ? null : campaignVal,
              name: 'meeting_notes_' + new Date().toISOString().split('T')[0].replace(/-/g, '_') + '.txt',
              originalName: 'meeting_notes_' + new Date().toISOString().split('T')[0].replace(/-/g, '_') + '.txt',
              filePath: '',
              fileSize: transcriptText.length,
              contentType: 'text/plain',
              onboardingStep: 'Evidence & Notes',
              sourceType: 'Text',
              verificationStatus: 'Verified',
              textExcerpt: transcriptText
            });
          }

          if (analysis.changes.length > 0 && newMeeting && newMeeting.id) {
            await proposeMeetingChangeLog(client.id, newMeeting.id, analysis.changes);
            alert('🧠 Meeting Intelligence Agent: Strategic Shifts Detected!\nA proposed Change Log requires human approval before updating client briefs.');
          } else {
            alert('🧠 Meeting Intelligence Agent: Notes analyzed.\nNo strategic shifts detected in the brief.');
          }
          
          const txtarea = container.querySelector('#profileMeetingNotesText');
          if (txtarea) txtarea.value = '';
          
          const recInput = container.querySelector('#profileMeetingRecordingFile');
          if (recInput) recInput.value = '';
          
          const transInput = container.querySelector('#profileMeetingTranscriptFile');
          if (transInput) transInput.value = '';

          const attendeesInput = container.querySelector('#profileMeetingAttendees');
          if (attendeesInput) attendeesInput.value = '';

          // Reload workspace details
          await loadClientWorkspaceData(client.id);
          renderClientProfile(container, client.id);
        } catch (err) {
          alert('Failed to run meeting agent: ' + err.message);
        } finally {
          if (loader) loader.style.display = 'none';
          runProfileAgentBtn.style.display = 'block';
        }
      }, 1500);
    });
  }

  // Bind change log approve/reject buttons
  container.querySelectorAll('.ow-approve-shift').forEach(btn => {
    btn.addEventListener('click', () => {
      const logId = btn.getAttribute('data-log-id');
      approveMeetingChangeLog(logId, 'Irene K.');
      alert('Approved shifts! Client profile and other agents have been successfully updated.');
      renderClientProfile(container, client.id);
    });
  });

  container.querySelectorAll('.ow-reject-shift').forEach(btn => {
    btn.addEventListener('click', () => {
      const logId = btn.getAttribute('data-log-id');
      rejectMeetingChangeLog(logId);
      alert('Proposed shifts discarded.');
      renderClientProfile(container, client.id);
    });
  });

  const deleteBtn = container.querySelector('#btnDeleteProfileWorkspace');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!client.databaseBacked) {
        alert('This is a frontend demo placeholder and cannot be deleted.');
        return;
      }
      const clName = client.name || 'this workspace';
      if (confirm(`Are you sure you want to permanently delete the workspace "${clName}"? This will delete all associated campaigns, meetings, evidence, reports, and AI logs.`)) {
        try {
          await deleteClientWorkspace(client.id);
          alert(`Workspace "${clName}" has been successfully deleted.`);
          window.location.hash = '#clients';
        } catch (err) {
          alert('Failed to delete workspace: ' + err.message);
        }
      }
    });
  }

  const editBtn = container.querySelector('#btnEditClientProfile');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      openEditClientProfileModal(client.id);
    });
  }
}

// Sub-renderers for Meeting Intel Tab
function renderProposedChangeLogsHtml(client_id) {
  const pendingLogs = state.changeLogs.filter(l => (l.clientId === client_id || l.client_id === client_id) && l.status === 'Pending');
  if (pendingLogs.length === 0) {
    return `<div style="font-size:0.8rem; color:var(--text-muted); font-style:italic; text-align:center; padding:1rem; border:1px dashed var(--border-color); border-radius:8px;">No pending strategic shifts or manual updates detected. The agents are aligned with current client brief.</div>`;
  }

  return pendingLogs.map(log => {
    const isManual = !log.meetingId && !log.meeting_id;
    const themeBg = isManual ? '#f5f3ff' : '#fffbeb';
    const themeBorder = isManual ? '#c7d2fe' : '#fcd34d';
    const themeText = isManual ? '#3730a3' : '#78350f';
    const themeTitleColor = isManual ? '#4f46e5' : '#b45309';
    const themeBadgeBg = isManual ? '#e0e7ff' : '#fef3c7';
    const titleText = isManual ? '📝 Proposed Profile Changes' : '⚠️ Strategic Shifts Detected';
    const badgeText = isManual ? 'Manual Profile Change' : 'Approval Required';
    const descText = isManual 
      ? 'An admin manually edited the client profile. Please review and approve these updates to update other AI agents.' 
      : 'The Meeting Agent scanned the notes and detected differences between the conversation and the current active client profile. Confirm to update other AI agents.';

    return `
      <div class="proposed-changelog-box" style="background:${themeBg}; border:1px solid ${themeBorder}; border-radius:8px; padding:1rem; margin-top:1rem; font-size:0.8rem; line-height:1.4; color:${themeText};">
        <h4 style="margin:0 0 0.5rem 0; color:${themeTitleColor}; font-size:0.85rem; font-weight:700; display:flex; justify-content:space-between; align-items:center; text-transform:none;">
          <span>${titleText}</span>
          <span style="font-size:0.65rem; background:${themeBadgeBg}; padding:0.1rem 0.35rem; border-radius:4px; font-weight:700; color:${themeTitleColor};">${badgeText}</span>
        </h4>
        <p style="font-size:0.75rem; margin-bottom:0.75rem; color:${themeText};">${descText}</p>
        
        <div style="background:white; border:1px solid ${themeBorder}; border-radius:6px; overflow:hidden; margin-bottom:1rem;">
          <table style="width:100%; border-collapse:collapse; font-size:0.75rem; text-align:left; color:#0f172a;">
            <thead>
              <tr style="background:${themeBadgeBg}; color:${themeText};">
                <th style="padding:0.4rem 0.6rem; border-bottom:1px solid ${themeBorder};">Parameter</th>
                <th style="padding:0.4rem 0.6rem; border-bottom:1px solid ${themeBorder};">Current Value</th>
                <th style="padding:0.4rem 0.6rem; border-bottom:1px solid ${themeBorder};">Proposed Value</th>
              </tr>
            </thead>
            <tbody>
              ${log.changes.map(ch => `
                <tr style="border-bottom:1px solid #fef3c7;">
                  <td style="padding:0.4rem 0.6rem; font-weight:600; vertical-align:top; color:${themeTitleColor};">${ch.label}</td>
                  <td style="padding:0.4rem 0.6rem; vertical-align:top; color:#64748b;">${ch.oldVal || ch.oldValue || 'None'}</td>
                  <td style="padding:0.4rem 0.6rem; vertical-align:top; font-weight:600; color:#059669; background:#f0fdf4;">${ch.newVal || ch.newValue || 'None'}<div style="font-size:0.65rem; color:#047857; font-weight:normal; margin-top:0.15rem;">Reason: ${ch.reason}</div></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
          <button class="btn btn-xs btn-outline ow-reject-shift" data-log-id="${log.id}" style="color:#b91c1c; border-color:#fca5a5;">Reject Shifts</button>
          <button class="btn btn-xs btn-primary ow-approve-shift" data-log-id="${log.id}" style="background:#059669; border-color:#059669; color:white; font-weight:700;">Approve & Update Agents</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderVersionHistoryHtml(client_id) {
  const history = state.changeLogHistory.filter(h => h.clientId === client_id || h.client_id === client_id);
  if (history.length === 0) {
    return `<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic; padding:0.5rem 0;">No approved changes recorded yet. This client workspace is running on the original onboarding brief.</div>`;
  }

  return `
    <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:220px; overflow-y:auto; padding-right:0.25rem;">
      ${history.map(h => `
        <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:6px; padding:0.6rem; font-size:0.75rem; line-height:1.4;">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem; font-size:0.7rem; color:var(--text-muted);">
            <strong>Shifted: ${h.label}</strong>
            <span>${h.approvedAt.substring(0,10)} ${h.approvedAt.substring(11,16)}</span>
          </div>
          <div style="margin-bottom:0.25rem;">
            <span style="text-decoration:line-through; color:#94a3b8;">${h.oldValue || 'None'}</span>
            <span style="color:#059669; font-weight:600;"> → ${h.newValue || 'None'}</span>
          </div>
          <div style="font-size:0.7rem; color:#64748b; margin-top:0.2rem; background:white; padding:0.3rem 0.5rem; border-radius:4px; border:1px solid #e2e8f0;">
            <strong>Reason:</strong> ${h.reason}
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:var(--text-muted); margin-top:0.3rem;">
            <span>Approved by: <strong>${h.approvedBy}</strong></span>
            <span>Source: <strong>${(h.meetingId || h.meeting_id) ? 'Meeting alignment' : 'Manual Profile Change'}</strong></span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMeetingsLogHtml(client_id) {
  const meetings = state.meetings.filter(m => m.clientId === client_id || m.client_id === client_id);
  if (meetings.length === 0) {
    return `<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic; padding:0.5rem 0;">No meetings processed for this workspace.</div>`;
  }

  return `
    <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:300px; overflow-y:auto;">
      ${meetings.map(m => {
        let recordingHtml = m.recording_file ? `<div style="margin-top:0.25rem; font-size:0.7rem; color:#475569;">🎥 <strong>Zoom Recording:</strong> <code>${m.recording_file}</code></div>` : '';
        let transcriptFileHtml = m.transcript_file ? `<div style="margin-top:0.15rem; font-size:0.7rem; color:#475569;">📄 <strong>Zoom Transcript:</strong> <code>${m.transcript_file}</code> (Format: <strong>${m.transcript_format || '.txt'}</strong>)</div>` : '';
        let attendeesHtml = m.attendees ? `<div style="margin-top:0.15rem; font-size:0.7rem; color:#475569;">👥 <strong>Attendees:</strong> ${m.attendees}</div>` : '';
        
        let campaignName = 'General Workspace';
        if (m.campaign_id && m.campaign_id !== 'General') {
          const camp = state.campaigns.find(c => c.id === m.campaign_id || c.name === m.campaign_id);
          if (camp) campaignName = camp.name;
          else campaignName = m.campaign_id;
        }
        let campaignHtml = `<div style="margin-top:0.15rem; font-size:0.7rem; color:#475569;">📢 <strong>Campaign Linkage:</strong> <span class="badge success" style="background:#e0f2fe; color:#0369a1; font-size:0.6rem; padding:0.05rem 0.25rem;">${campaignName}</span></div>`;

        return `
          <div style="border:1px solid var(--border-color); border-radius:6px; padding:0.6rem; font-size:0.75rem; line-height:1.4; background:white;">
            <div style="display:flex; justify-content:space-between; font-weight:600; color:#0f172a; margin-bottom:0.25rem;">
              <span>📅 ${m.date} - ${m.title}</span>
              <span style="font-size:0.65rem; color:#059669; font-weight:700;">${m.status}</span>
            </div>
            <p style="margin:0; font-size:0.75rem; color:#475569;">${m.notes}</p>
            ${recordingHtml}
            ${transcriptFileHtml}
            ${attendeesHtml}
            ${campaignHtml}
            
            <!-- Collapsible Transcript Mock -->
            <details style="margin-top:0.4rem; font-size:0.7rem; color:var(--text-muted);">
              <summary style="cursor:pointer; color:var(--primary-color); font-weight:600; outline:none;">Show Meeting Transcript Excerpt</summary>
              <div style="margin-top:0.25rem; background:#f8fafc; padding:0.4rem; border-radius:4px; font-family:monospace; white-space:pre-wrap; border:1px solid #e2e8f0; max-height:100px; overflow-y:auto; line-height:1.3;">
                ${m.transcript}
              </div>
            </details>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// RENDER CONTENT PIPELINE KANBAN BOARD
let activePlatformFilter = 'All';

export function renderContentModule(container) {
  const activeContentSubTab = localStorage.getItem('activeContentSubTab') || 'Board';
  const columns = ['Ideas', 'Drafting', 'Review', 'Approval', 'Scheduled', 'Published'];
  const clientsFilter = state.currentUserRole === 'admin' ? state.clients : state.clients.filter(c => c.id === state.selectedClientId);
  const platforms = ['All', 'LinkedIn', 'Facebook', 'Instagram', 'WhatsApp', 'Email Newsletter', 'Website'];

  const subtabs = [
    { id: 'Board', name: '📋 Board' },
    { id: 'Requests', name: '📥 Content Requests' },
    { id: 'Media', name: '🖼️ Media Library' },
    { id: 'Calendar', name: '📅 Awareness Days Calendar' }
  ];

  container.innerHTML = `
    <div class="section-header-row mb-6">
      <div>
        <h1>Content Hub</h1>
        <p class="subtitle">Manage content pipeline, requests, media assets, and commemorative awareness days</p>
      </div>
      <div class="header-actions" id="contentHubHeaderActions"></div>
    </div>

    <!-- Sub-tabbed Navigation -->
    <div class="cr-tabs-nav mb-6" style="margin-top: -0.5rem;">
      ${subtabs.map(tab => `
        <button class="cr-tab-btn ${activeContentSubTab === tab.id ? 'active' : ''}" data-subtab="${tab.id}">
          ${tab.name}
        </button>
      `).join('')}
    </div>

    <div id="contentSubtabContent"></div>
  `;

  // Bind sub-tabs clicks
  container.querySelectorAll('.cr-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const subtab = btn.getAttribute('data-subtab');
      localStorage.setItem('activeContentSubTab', subtab);
      renderContentModule(container);
    });
  });

  const contentArea = container.querySelector('#contentSubtabContent');
  const headerActions = container.querySelector('#contentHubHeaderActions');

  if (activeContentSubTab === 'Board') {
    // Render Header Button
    headerActions.innerHTML = `<button class="btn btn-primary" id="addContentIdeaBtn">+ Create Content Idea</button>`;
    const addIdeaBtn = document.getElementById('addContentIdeaBtn');
    if (addIdeaBtn) {
      addIdeaBtn.addEventListener('click', () => {
        openNewIdeaModal(clientsFilter);
      });
    }

    // Render Board HTML
    contentArea.innerHTML = `
      <!-- Buffer-style platform filter bar -->
      <div class="kanban-filters-row mb-4">
        ${platforms.map(p => `
          <button class="btn btn-sm ${activePlatformFilter === p ? 'btn-primary' : 'btn-outline'} platform-filter-btn" data-platform="${p}">
            ${p}
          </button>
        `).join('')}
      </div>

      <!-- Columns Container -->
      <div class="kanban-board">
        ${columns.map(col => {
          // Filter content by column status, workspace scope client, and platform filter
          const columnCards = state.content.filter(cnt => {
            const matchCol = cnt.status === col;
            const matchClient = state.currentUserRole === 'admin' || cnt.client === state.selectedClientId;
            const matchPlatform = activePlatformFilter === 'All' || cnt.platform === activePlatformFilter;
            return matchCol && matchClient && matchPlatform;
          });

          return `
            <div class="kanban-column" data-status="${col}">
              <div class="column-header">
                <h3>${col}</h3>
                <span class="column-count">${columnCards.length}</span>
              </div>
              
              <div class="column-cards-container" id="kanban-col-${col}">
                ${columnCards.map(c => {
                  const ngo = state.clients.find(cl => cl.id === c.client) || { name: 'Client', logo: '🌱' };
                  let appStatusClass = c.approvalStatus.toLowerCase().replace(' ', '-');
                  
                  return `
                    <div class="content-card card" draggable="true" data-card-id="${c.id}">
                      <div class="card-tag-row" style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                        <span class="platform-badge" style="font-size: 0.68rem; padding: 1px 4px;">${c.platform}</span>
                        ${c.contentPillar ? `<span class="pillar-badge" style="font-size: 0.68rem; padding: 1px 4px; border-radius: 4px; ${getColorForPillar(c.contentPillar)}">${c.contentPillar}</span>` : ''}
                        ${c.aiGenerated ? '<span class="ai-badge" style="font-size: 0.68rem; padding: 1px 4px;">🤖 AI</span>' : ''}
                      </div>
                      <h4 class="card-title">${c.title || 'Untitled Post'}</h4>
                      <p class="card-campaign">${c.campaign || 'General Content'}</p>
                      
                      <div class="card-client-row">
                        <span class="mini-logo">${ngo.logo}</span>
                        <span class="mini-name">${ngo.name}</span>
                      </div>

                      <div class="card-footer mt-4">
                        <span class="approval-tag ${appStatusClass}">${c.approvalStatus}</span>
                        
                        <div class="card-actions">
                          ${col === 'Approval' ? `
                            <button class="btn btn-xs btn-primary kanban-approve-btn" data-card-id="${c.id}">Approve</button>
                          ` : ''}
                          
                          <!-- Simple column shifter for mock interaction -->
                          <div class="column-shifter">
                            <button class="shift-btn prev-col" data-card-id="${c.id}">◀</button>
                            <button class="shift-btn next-col" data-card-id="${c.id}">▶</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
                ${columnCards.length === 0 ? '<div class="column-empty">Empty</div>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Platform Filter buttons bind
    contentArea.querySelectorAll('.platform-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activePlatformFilter = btn.getAttribute('data-platform');
        renderContentModule(container);
      });
    });

    // Content card click
    contentArea.querySelectorAll('.content-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.shift-btn') || e.target.closest('.kanban-approve-btn')) return;
        const cardId = card.getAttribute('data-card-id');
        const item = state.content.find(c => c.id === cardId);
        if (item) {
          openBufferComposerModal(item, container);
        }
      });
    });

    // Column shift handlers
    contentArea.querySelectorAll('.shift-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cardId = btn.getAttribute('data-card-id');
        const isNext = btn.classList.contains('next-col');
        const card = state.content.find(c => c.id === cardId);
        
        if (card) {
          const currentIndex = columns.indexOf(card.status);
          let newIndex = isNext ? currentIndex + 1 : currentIndex - 1;
          if (newIndex >= 0 && newIndex < columns.length) {
            updateContentStatus(cardId, columns[newIndex]);
          }
        }
      });
    });

    // Approve button inside Kanban card
    contentArea.querySelectorAll('.kanban-approve-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cardId = btn.getAttribute('data-card-id');
        approveContentCard(cardId);
      });
    });

  } else if (activeContentSubTab === 'Requests') {
    headerActions.innerHTML = `<button class="btn btn-primary" id="addRequestBtn">+ Request Content</button>`;
    const addRequestBtn = document.getElementById('addRequestBtn');
    if (addRequestBtn) {
      addRequestBtn.addEventListener('click', () => {
        openNewRequestModal();
      });
    }

    const requests = state.currentUserRole === 'admin' 
      ? state.contentRequests 
      : (state.contentRequests || []).filter(r => r.clientId === state.selectedClientId);

    contentArea.innerHTML = `
      <div class="card">
        <div class="table-container">
          <table class="clean-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid var(--border-color);">
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Title</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Campaign</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Assigned To</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Requested By</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Due Date</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Status</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Source Evidence</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${requests.map(r => {
                const camp = state.campaigns.find(c => c.id === r.campaignId);
                const ev = state.evidence.find(e => e.id === r.sourceEvidenceId);
                const evLink = ev 
                  ? `<a href="#evidence" class="evidence-details-link" style="color: var(--primary-color); text-decoration: underline;" data-ev-id="${ev.id}">📄 ${ev.originalName || ev.name}</a>` 
                  : '<span style="color: var(--text-muted); font-size: 0.75rem;">None</span>';
                
                return `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 0.75rem 1rem; font-weight: 600;">
                      ${r.title}
                      ${r.description ? `<div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400; margin-top: 2px; white-space: pre-wrap;">${r.description}</div>` : ''}
                    </td>
                    <td style="padding: 0.75rem 1rem;">${camp ? camp.name : '<span style="color: var(--text-muted);">General</span>'}</td>
                    <td style="padding: 0.75rem 1rem;">${r.assignee || '<span style="color: var(--text-muted);">Unassigned</span>'}</td>
                    <td style="padding: 0.75rem 1rem;">${r.requestedBy || 'N/A'}</td>
                    <td style="padding: 0.75rem 1rem;">${r.dueDate || 'TBD'}</td>
                    <td style="padding: 0.75rem 1rem;">
                      <select class="live-request-status-select clean-select" data-request-id="${r.id}" style="padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color); font-size: 0.8rem;">
                        <option value="Awaiting Instruction" ${r.status === 'Awaiting Instruction' ? 'selected' : ''}>Awaiting Instruction</option>
                        <option value="Drafting" ${r.status === 'Drafting' ? 'selected' : ''}>Drafting</option>
                        <option value="Pending Review" ${r.status === 'Pending Review' ? 'selected' : ''}>Pending Review</option>
                        <option value="Completed" ${r.status === 'Completed' ? 'selected' : ''}>Completed</option>
                      </select>
                    </td>
                    <td style="padding: 0.75rem 1rem;">${evLink}</td>
                    <td style="padding: 0.75rem 1rem;">
                      <button class="btn btn-xs btn-outline draft-card-from-request-btn" data-request-id="${r.id}">Draft Card</button>
                    </td>
                  </tr>
                `;
              }).join('')}
              ${requests.length === 0 ? '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No content requests found.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Dropdown change status handler
    contentArea.querySelectorAll('.live-request-status-select').forEach(select => {
      select.addEventListener('change', async () => {
        const reqId = select.getAttribute('data-request-id');
        const newStatus = select.value;
        await updateContentRequestStatus(reqId, { status: newStatus });
        alert(`Request status updated to "${newStatus}"`);
      });
    });

    // Draft Card button handler
    contentArea.querySelectorAll('.draft-card-from-request-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const reqId = btn.getAttribute('data-request-id');
        const r = state.contentRequests.find(req => req.id === reqId);
        if (r) {
          openNewIdeaModal(clientsFilter, {
            title: r.title,
            client: r.clientId,
            campaignId: r.campaignId,
            description: r.description || '',
            sourceRequestId: r.id
          });
        }
      });
    });

  } else if (activeContentSubTab === 'Media') {
    headerActions.innerHTML = `<button class="btn btn-primary" id="addMediaBtn">+ Add Archive Link</button>`;
    const addMediaBtn = document.getElementById('addMediaBtn');
    if (addMediaBtn) {
      addMediaBtn.addEventListener('click', () => {
        openNewMediaModal();
      });
    }

    const mediaItems = state.currentUserRole === 'admin' 
      ? state.mediaLibrary 
      : (state.mediaLibrary || []).filter(m => m.clientId === state.selectedClientId);

    contentArea.innerHTML = `
      <div class="card">
        <div class="table-container">
          <table class="clean-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid var(--border-color);">
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Subject</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Media Type</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Linked Campaign</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Usage Rights</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Archive Link</th>
              </tr>
            </thead>
            <tbody>
              ${mediaItems.map(m => {
                const camp = state.campaigns.find(c => c.id === m.campaignId);
                const isUrl = (m.archiveLink || '').startsWith('http');
                const linkHtml = isUrl 
                  ? `<a href="${m.archiveLink}" target="_blank" class="btn btn-xs btn-outline">Open Link ↗</a>` 
                  : `<span class="badge" style="background-color: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">📂 ${m.archiveLink || 'Local'}</span>`;
                
                return `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 0.75rem 1rem; font-weight: 600;">
                      ${m.subject}
                      ${m.sourceFrom ? `<div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400; margin-top: 2px;">Source: ${m.sourceFrom}</div>` : ''}
                    </td>
                    <td style="padding: 0.75rem 1rem;">${m.mediaType || 'Photos'}</td>
                    <td style="padding: 0.75rem 1rem;">${camp ? camp.name : '<span style="color: var(--text-muted);">General</span>'}</td>
                    <td style="padding: 0.75rem 1rem; font-size: 0.8rem; color: #475569;">${m.usageRights || '<span style="color: var(--text-muted);">No restrictions listed</span>'}</td>
                    <td style="padding: 0.75rem 1rem;">${linkHtml}</td>
                  </tr>
                `;
              }).join('')}
              ${mediaItems.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No media library assets found.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } else if (activeContentSubTab === 'Calendar') {
    headerActions.innerHTML = '';

    const awarenessDays = state.awarenessDays || [];

    contentArea.innerHTML = `
      <div class="card">
        <div class="table-container">
          <table class="clean-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid var(--border-color);">
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Occasion</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Date</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Linked Campaign</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Type</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Status</th>
                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${awarenessDays.map(aw => {
                const camp = state.campaigns.find(c => c.id === aw.campaignId);
                const campName = camp ? camp.name : (aw.drivingCampaign || '<span style="color: var(--text-muted);">General</span>');
                return `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 0.75rem 1rem; font-weight: 600;">
                      ${aw.occasion}
                      ${aw.createPostAction ? `<div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400; margin-top: 2px; white-space: pre-wrap;">💡 Action: ${aw.createPostAction}</div>` : ''}
                    </td>
                    <td style="padding: 0.75rem 1rem;">${aw.date || 'TBD'}</td>
                    <td style="padding: 0.75rem 1rem;">${campName}</td>
                    <td style="padding: 0.75rem 1rem;">${aw.contentType || 'Post'}</td>
                    <td style="padding: 0.75rem 1rem;">
                      <span class="approval-tag ${aw.status.toLowerCase()}">${aw.status}</span>
                    </td>
                    <td style="padding: 0.75rem 1rem;">
                      <button class="btn btn-xs btn-outline create-post-from-calendar-btn" data-aw-id="${aw.id}">Create Post</button>
                    </td>
                  </tr>
                `;
              }).join('')}
              ${awarenessDays.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No awareness calendar days found.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Create post click handler
    contentArea.querySelectorAll('.create-post-from-calendar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const awId = btn.getAttribute('data-aw-id');
        const aw = state.awarenessDays.find(a => a.id === awId);
        if (aw) {
          openNewIdeaModal(clientsFilter, {
            title: `Post Commemorating: ${aw.occasion}`,
            client: aw.clientId || state.selectedClientId,
            campaignId: aw.campaignId || null,
            description: aw.createPostAction || ''
          });
        }
      });
    });
  }
}

function getColorForPillar(pillar) {
  const p = (pillar || '').toLowerCase();
  if (p.includes('awareness')) return 'background-color: hsl(210, 100%, 96%); color: hsl(210, 100%, 40%); border: 1px solid hsl(210, 100%, 90%);';
  if (p.includes('education')) return 'background-color: hsl(280, 100%, 97%); color: hsl(280, 70%, 45%); border: 1px solid hsl(280, 100%, 92%);';
  if (p.includes('action')) return 'background-color: hsl(10, 100%, 96%); color: hsl(10, 80%, 45%); border: 1px solid hsl(10, 100%, 90%);';
  return 'background-color: hsl(140, 100%, 96%); color: hsl(140, 100%, 30%); border: 1px solid hsl(140, 100%, 90%);';
}

function openBufferComposerModal(item, container) {
  const modal = document.getElementById('globalModalContainer');
  const ngo = state.clients.find(cl => cl.id === item.client) || { name: 'Client NGO', logo: '🌱', primaryContact: 'Bobby Peek' };
  
  let activePreviewPlatform = item.platform || 'LinkedIn';
  if (!['LinkedIn', 'Facebook', 'Instagram'].includes(activePreviewPlatform)) {
    activePreviewPlatform = 'LinkedIn';
  }

  const renderModalContent = () => {
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h2>📱 Buffer Composer & Social Channel Preview</h2>
            <button class="close-modal-btn" id="closeGlobalModal">×</button>
          </div>
          <div class="modal-body buffer-composer-body">
            <div class="composer-split-grid">
              
              <!-- Editor Side -->
              <div class="composer-editor-side" style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div class="form-group">
                  <label style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Title / Idea Name</label>
                  <input type="text" id="composerTitle" value="${item.title || ''}" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; font-weight: 600;" required />
                </div>
                
                <div class="form-group">
                  <label style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Target Channel Platform</label>
                  <select id="composerPlatform" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;">
                    <option value="LinkedIn" ${item.platform === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                    <option value="Facebook" ${item.platform === 'Facebook' ? 'selected' : ''}>Facebook</option>
                    <option value="Instagram" ${item.platform === 'Instagram' ? 'selected' : ''}>Instagram</option>
                    <option value="WhatsApp" ${item.platform === 'WhatsApp' ? 'selected' : ''}>WhatsApp</option>
                    <option value="Email Newsletter" ${item.platform === 'Email Newsletter' ? 'selected' : ''}>Email Newsletter</option>
                    <option value="Website" ${item.platform === 'Website' ? 'selected' : ''}>Website</option>
                  </select>
                </div>

                <div class="form-group">
                  <label style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Content Pillar</label>
                  <select id="composerPillar" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;">
                    <option value="Phase 1: Awareness" ${item.contentPillar === 'Phase 1: Awareness' ? 'selected' : ''}>Phase 1: Awareness</option>
                    <option value="Phase 2: Education" ${item.contentPillar === 'Phase 2: Education' ? 'selected' : ''}>Phase 2: Education</option>
                    <option value="Phase 3: Action" ${item.contentPillar === 'Phase 3: Action' ? 'selected' : ''}>Phase 3: Action</option>
                  </select>
                </div>

                <div class="form-group">
                  <label style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Edit Post Caption Draft</label>
                  <textarea id="composerTextarea" class="composer-input-textarea" style="width: 100%; height: 160px; font-family: inherit; font-size: 0.88rem; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; outline: none; resize: vertical;" placeholder="Type social copy here...">${item.content || ''}</textarea>
                </div>

                ${state.currentUserRole === 'admin' ? `
                  <div class="form-group">
                    <label style="font-weight: 600; color: var(--primary-color); display: block; margin-bottom: 0.25rem;">📝 Internal Notes (Admin-only)</label>
                    <textarea id="composerInternalNotes" rows="2" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; font-family: inherit; font-size: 0.8rem;" placeholder="Admin internal coordination notes...">${item.internalNotes || ''}</textarea>
                  </div>
                ` : ''}

                <div class="form-group">
                  <label style="font-weight: 600; display: block; margin-bottom: 0.25rem;">💬 Client Notes & Feedback</label>
                  <textarea id="composerClientNotes" rows="2" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; font-family: inherit; font-size: 0.8rem;" placeholder="Client feedback notes...">${item.clientNotes || ''}</textarea>
                </div>

                <div class="composer-meta-details" style="font-size: 0.78rem; background: #f8fafc; padding: 0.50rem; border-radius: 6px;">
                  <div class="detail-row"><span>NGO Client:</span> <strong>${ngo.name}</strong></div>
                  <div class="detail-row"><span>Campaign Scope:</span> <strong>${item.campaign || 'General'}</strong></div>
                </div>
              </div>
              
              <!-- Live Preview Device -->
              <div class="composer-preview-side">
                <div class="preview-platform-tabs">
                  <button class="preview-tab-btn ${activePreviewPlatform === 'LinkedIn' ? 'active' : ''}" data-pref="LinkedIn">LinkedIn</button>
                  <button class="preview-tab-btn ${activePreviewPlatform === 'Facebook' ? 'active' : ''}" data-pref="Facebook">Facebook</button>
                  <button class="preview-tab-btn ${activePreviewPlatform === 'Instagram' ? 'active' : ''}" data-pref="Instagram">Instagram</button>
                </div>

                <div class="device-preview-box" id="socialMockupPreviewArea">
                  <!-- Injected Mockup -->
                </div>
              </div>

            </div>

            <div class="modal-footer mt-6" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button class="btn btn-outline" id="copyComposerTextBtn">Copy Text</button>
              <button class="btn btn-outline" id="saveComposerBtn">Save Changes</button>
              <button class="btn btn-primary" id="approveComposerScheduleBtn">Approve & Queue Post</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const updateMockup = () => {
      const text = document.getElementById('composerTextarea').value;
      const previewArea = document.getElementById('socialMockupPreviewArea');
      let postTextHtml = text.replace(/\n/g, '<br>');

      if (activePreviewPlatform === 'LinkedIn') {
        previewArea.innerHTML = `
          <div class="mock-post-card mock-linkedin">
            <div class="mock-post-header">
              <span class="mock-avatar">${ngo.logo}</span>
              <div class="mock-header-info">
                <strong>${ngo.name}</strong>
                <span>${ngo.primaryContact || 'Project Representative'} • 1st</span>
                <span>Just now • 🌐</span>
              </div>
            </div>
            <div class="mock-post-body mt-4">
              <p>${postTextHtml}</p>
              <div class="mock-post-media mt-4">
                📊 [Embedded Impact Story & Visual Evidence]
              </div>
            </div>
            <div class="mock-post-actions mt-4">
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>🔁 Repost</span>
              <span>✉️ Send</span>
            </div>
          </div>
        `;
      } else if (activePreviewPlatform === 'Facebook') {
        previewArea.innerHTML = `
          <div class="mock-post-card mock-facebook">
            <div class="mock-post-header">
              <span class="mock-avatar bg-facebook-avatar">${ngo.logo}</span>
              <div class="mock-header-info">
                <strong>${ngo.name}</strong>
                <span>Just now • 👥</span>
              </div>
            </div>
            <div class="mock-post-body mt-4">
              <p>${postTextHtml}</p>
              <div class="mock-post-media mt-4">
                📷 [Project evidence attachment]
              </div>
            </div>
            <div class="mock-post-actions mt-4">
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>📣 Share</span>
            </div>
          </div>
        `;
      } else if (activePreviewPlatform === 'Instagram') {
        previewArea.innerHTML = `
          <div class="mock-post-card mock-instagram">
            <div class="mock-instagram-header">
              <span class="mock-avatar-ig">${ngo.logo}</span>
              <strong>${ngo.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_ngo</strong>
            </div>
            <div class="mock-instagram-image">
              📷 [Instagram Photo View]
            </div>
            <div class="mock-instagram-actions">
              <span>❤️</span> <span>💬</span> <span>✈️</span>
            </div>
            <div class="mock-post-body-ig">
              <p><strong>${ngo.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_ngo</strong> ${postTextHtml}</p>
            </div>
          </div>
        `;
      }
    };

    updateMockup();

    // Event hooks
    document.getElementById('closeGlobalModal').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    document.getElementById('composerTextarea').addEventListener('input', updateMockup);

    // Sync platform select changing live preview
    document.getElementById('composerPlatform').addEventListener('change', (e) => {
      activePreviewPlatform = e.target.value;
      if (!['LinkedIn', 'Facebook', 'Instagram'].includes(activePreviewPlatform)) {
        activePreviewPlatform = 'LinkedIn';
      }
      modal.querySelectorAll('.preview-tab-btn').forEach(btn => {
        if (btn.getAttribute('data-pref') === activePreviewPlatform) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      updateMockup();
    });

    modal.querySelectorAll('.preview-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activePreviewPlatform = btn.getAttribute('data-pref');
        modal.querySelectorAll('.preview-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateMockup();
      });
    });

    document.getElementById('copyComposerTextBtn').addEventListener('click', () => {
      const text = document.getElementById('composerTextarea').value;
      navigator.clipboard.writeText(text);
      alert('Post draft copy copied to clipboard!');
    });

    document.getElementById('saveComposerBtn').addEventListener('click', async () => {
      const title = document.getElementById('composerTitle').value;
      const platform = document.getElementById('composerPlatform').value;
      const contentPillar = document.getElementById('composerPillar').value;
      const content = document.getElementById('composerTextarea').value;
      const clientNotes = document.getElementById('composerClientNotes').value;

      const updates = {
        title,
        platform,
        contentPillar,
        content,
        clientNotes
      };

      const internalNotesEl = document.getElementById('composerInternalNotes');
      if (internalNotesEl) {
        updates.internalNotes = internalNotesEl.value;
      }

      await updateContentDetails(item.id, updates);
      alert('Changes saved successfully!');
      modal.style.display = 'none';
      renderContentModule(container);
    });

    document.getElementById('approveComposerScheduleBtn').addEventListener('click', async () => {
      const title = document.getElementById('composerTitle').value;
      const platform = document.getElementById('composerPlatform').value;
      const contentPillar = document.getElementById('composerPillar').value;
      const content = document.getElementById('composerTextarea').value;
      const clientNotes = document.getElementById('composerClientNotes').value;

      const updates = {
        title,
        platform,
        contentPillar,
        content,
        clientNotes,
        approvalStatus: 'Scheduled'
      };

      const internalNotesEl = document.getElementById('composerInternalNotes');
      if (internalNotesEl) {
        updates.internalNotes = internalNotesEl.value;
      }

      await updateContentDetails(item.id, updates);
      await updateContentStatus(item.id, 'Scheduled');
      
      alert('Draft approved! Saved and moved to Buffer Queue schedule.');
      modal.style.display = 'none';
      renderContentModule(container);
    });
  };

  renderModalContent();
  modal.style.display = 'flex';
}


function getSocialDraftText(item, ngo) {
  if (item.title.includes('Highlight:')) {
    return `🌱 Action in the field! We are proud to share this latest community milestone from our team at ${ngo.name}. 

Thanks to our volunteers and local advocates, our grassroots capacity is expanding. Supporting transparent environmental monitoring for a cleaner, greener future. 

Full report compiled and ready for donor submission! 📈 #NGOImpact #CommunityDevelopment #Sustainability`;
  }
  return `📢 Project updates from our campaign calendar! We at ${ngo.name} are excited to announce our upcoming milestones. Stay tuned for further stories! #Advocacy #CleanEnergy #Africa`;
}

// RENDER REPORTS CENTER (Cross-client tracking)
export function renderReportsCenter(container) {
  const listReports = state.currentUserRole === 'admin' 
    ? state.reports 
    : state.reports.filter(r => r.client === state.selectedClientId);

  container.innerHTML = `
    <div class="section-header-row mb-6">
      <div>
        <h1>Donor Reporting Center</h1>
        <p class="subtitle">Compliance dashboard for tracking quarterly, monthly, and board narratives</p>
      </div>
    </div>

    <!-- Reports Table -->
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Client</th>
              <th>Donor</th>
              <th>Due Date</th>
              <th>Assigned Agent</th>
              <th>Completion</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${listReports.map(r => {
              const ngo = state.clients.find(c => c.id === r.client) || { name: 'Client NGO', logo: '🌐' };
              let statusClass = r.status.toLowerCase().replace(' ', '-');
              return `
                <tr>
                  <td><strong>${r.name}</strong></td>
                  <td>
                    <div class="client-cell">
                      <span>${ngo.logo}</span>
                      <span>${ngo.name}</span>
                    </div>
                  </td>
                  <td>${r.donor}</td>
                  <td><span class="deadline-txt ${r.status === 'Draft' && r.dueDate.includes('Overdue') ? 'danger' : ''}">${r.dueDate}</span></td>
                  <td>🤖 ${r.agent}</td>
                  <td>
                    <div class="progress-bar-container">
                      <div class="progress-bar" style="width: ${r.completion}%"></div>
                    </div>
                    <span class="progress-pct">${r.completion}%</span>
                  </td>
                  <td><span class="status-badge ${statusClass}">${r.status}</span></td>
                  <td>
                    <div class="report-actions-row">
                      <button class="btn btn-xs btn-outline review-report-btn" data-report-id="${r.id}">Review</button>
                      <button class="btn btn-xs btn-outline export-report-btn" data-report-id="${r.id}">Export</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind Export & Review Buttons
  container.querySelectorAll('.export-report-btn, .review-report-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const repId = btn.getAttribute('data-report-id');
      const report = state.reports.find(r => r.id === repId);
      if (report) {
        openReportExportModal(report);
      }
    });
  });
}

// RENDER IMPACT DASHBOARD
export function renderImpactDashboard(container) {
  // Aggregate metrics if Admin, scope to selected if Client
  let metrics = {
    peopleReached: 0,
    schoolsReached: 0,
    learnersReached: 0,
    workshopsHeld: 0,
    communitiesEngaged: 0,
    volunteers: 0,
    campaignReach: 0,
    mediaMentions: 0,
    reportsSubmitted: 0,
    fundingSecured: 0
  };

  if (state.currentUserRole === 'admin') {
    // Sum all clients
    state.clients.forEach(c => {
      const m = state.impactMetrics[c.id];
      if (m) {
        metrics.peopleReached += m.peopleReached || 0;
        metrics.schoolsReached += m.schoolsReached || 0;
        metrics.learnersReached += m.learnersReached || 0;
        metrics.workshopsHeld += m.workshopsHeld || 0;
        metrics.communitiesEngaged += m.communitiesEngaged || 0;
        metrics.volunteers += m.volunteers || 0;
        metrics.campaignReach += m.campaignReach || 0;
        metrics.mediaMentions += m.mediaMentions || 0;
        metrics.reportsSubmitted += m.reportsSubmitted || 0;
        metrics.fundingSecured += m.fundingSecured || 0;
      }
    });
  } else {
    // Client scope
    metrics = state.impactMetrics[state.selectedClientId] || metrics;
  }

  container.innerHTML = `
    <div class="section-header-row mb-6">
      <div>
        <h1>Impact & Performance Analytics</h1>
        <p class="subtitle">Aggregated metrics proving outreach and educational training milestones</p>
      </div>
    </div>

    <!-- Impact Cards Grid -->
    <div class="impact-cards-container">
      <div class="impact-metric-card card">
        <span class="label">People Reached</span>
        <span class="value">${metrics.peopleReached.toLocaleString()}</span>
        <span class="sub text-success">↑ 14% this month</span>
      </div>
      <div class="impact-metric-card card">
        <span class="label">Schools Engaged</span>
        <span class="value">${metrics.schoolsReached} Schools</span>
        <span class="sub text-success">Target: 50</span>
      </div>
      <div class="impact-metric-card card">
        <span class="label">Learners Trained</span>
        <span class="value">${metrics.learnersReached.toLocaleString()} Students</span>
        <span class="sub text-info">Air safety curriculum</span>
      </div>
      <div class="impact-metric-card card">
        <span class="label">Workshops Held</span>
        <span class="value">${metrics.workshopsHeld} Sessions</span>
        <span class="sub text-success">Direct grassroots engagement</span>
      </div>
      <div class="impact-metric-card card">
        <span class="label">Communities Involved</span>
        <span class="value">${metrics.communitiesEngaged} Zones</span>
        <span class="sub text-muted">Sub-Saharan Africa</span>
      </div>
      <div class="impact-metric-card card">
        <span class="label">Active Volunteers</span>
        <span class="value">${metrics.volunteers} Advocates</span>
        <span class="sub text-success">↑ 22 new signups</span>
      </div>
      <div class="impact-metric-card card">
        <span class="label">Media & Press Mentions</span>
        <span class="value">${metrics.mediaMentions} Articles</span>
        <span class="sub text-info">National & Local news</span>
      </div>
      <div class="impact-metric-card card">
        <span class="label">Reports Submitted</span>
        <span class="value">${metrics.reportsSubmitted} Donor Logs</span>
        <span class="sub text-success">100% compliance rate</span>
      </div>
      <div class="impact-metric-card card">
        <span class="label">Funding Secured</span>
        <span class="value">£${metrics.fundingSecured.toLocaleString()}</span>
        <span class="sub text-success">From 6 matching grants</span>
      </div>
    </div>

    <!-- Graphs container -->
    <div class="dashboard-split mt-6">
      <div class="dashboard-section card">
        <h3>📊 Historical Reach (Monthly Trend)</h3>
        <div id="impactReachChart" class="chart-container mt-4"></div>
      </div>
      
      <div class="dashboard-section card">
        <h3>💰 Secured Funding Allocations</h3>
        <div id="impactFundingChart" class="chart-container mt-4"></div>
      </div>
    </div>
  `;

  // Draw both charts safely
  const firstClient = state.clients[0];
  const refTrends = firstClient && state.impactMetrics[firstClient.id]?.monthlyTrends 
    ? state.impactMetrics[firstClient.id].monthlyTrends 
    : [
        { month: 'Jan', reached: 0, funding: 0 },
        { month: 'Feb', reached: 0, funding: 0 },
        { month: 'Mar', reached: 0, funding: 0 },
        { month: 'Apr', reached: 0, funding: 0 },
        { month: 'May', reached: 0, funding: 0 },
        { month: 'Jun', reached: 0, funding: 0 }
      ];
  const reachData = refTrends.map(t => ({ label: t.month, value: t.reached }));
  const fundingData = refTrends.map(t => ({ label: t.month, value: t.funding }));

  setTimeout(() => {
    renderLineChart('impactReachChart', reachData, { width: 500, height: 200 });
    renderBarChart('impactFundingChart', fundingData, { width: 500, height: 200 });
  }, 100);
}

// RENDER FUNDING OPPORTUNITY TRACKER
export function renderFundingTracker(container) {
  const grants = state.currentUserRole === 'admin' 
    ? state.fundingOpportunities 
    : state.fundingOpportunities.filter(f => {
        const client = state.clients.find(c => c.id === state.selectedClientId);
        if (!client) return false;
        return f.country === client.country || f.sector.includes(client.sector.split(' ')[0]);
      });

  container.innerHTML = `
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .spinner {
        border: 3px solid rgba(59, 130, 246, 0.1);
        border-top: 3px solid var(--primary-color) !important;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 0 auto 0.5rem auto;
      }
    </style>

    <div class="section-header-row mb-6">
      <div>
        <h1>Grant Discovery & Funding Tracker</h1>
        <p class="subtitle">AI matches international environmental and human-rights grants to active NGO scopes</p>
      </div>
      ${
        state.currentUserRole === 'admin'
          ? `<button class="btn btn-primary" id="toggleIngestPanelBtn" style="display: flex; align-items: center; gap: 0.35rem;">
               <span>📥</span> Ingest New Grant
             </button>`
          : ''
      }
    </div>

    <!-- Grant Ingestion & Verification Panel -->
    <div id="grantIngestPanel" class="card mb-6" style="display: none; border: 1px solid var(--primary-color); border-radius: 12px; padding: 1.5rem; background: var(--bg-color-alt, #f8fafc);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
        <h2 style="font-size: 1.15rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; color: var(--primary-color);">
          <span>📥</span> Ingest & Verify New Grant Opportunity
        </h2>
        <button class="btn btn-ghost btn-sm" id="closeIngestPanelBtn" style="font-size: 1.25rem; line-height: 1; padding: 0.2rem 0.5rem; background: none; border: none; cursor: pointer; color: var(--text-muted);">&times;</button>
      </div>
      
      <!-- Ingest Tabs selector -->
      <div class="ingest-tabs-row" style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
        <button class="btn btn-sm ingest-tab-btn btn-primary" data-tab="manual" style="padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.8rem;">✍️ Manual Entry</button>
        <button class="btn btn-sm ingest-tab-btn btn-ghost" data-tab="api" style="padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.8rem;">🔌 API / Web Fetcher</button>
        <button class="btn btn-sm ingest-tab-btn btn-ghost" data-tab="document" style="padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.8rem;">📄 Document Reader</button>
      </div>

      <!-- Tab content area -->
      <div class="ingest-tab-content">
        <!-- Manual Entry Tab -->
        <div id="ingest-pane-manual" class="ingest-pane active-pane">
          <form id="manualIngestForm" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Funder Name *</label>
              <input type="text" id="ingestFunder" placeholder="e.g. Ford Foundation" required style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Grant Program Name *</label>
              <input type="text" id="ingestGrantName" placeholder="e.g. Natural Resources and Climate Change" required style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Amount Value (Number or leave blank if unconfirmed)</label>
              <input type="number" id="ingestAmount" placeholder="e.g. 50000" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Currency</label>
              <select id="ingestCurrency" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);">
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="ZAR">ZAR (R)</option>
              </select>
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Deadline Date (YYYY-MM-DD or leave blank if unconfirmed)</label>
              <input type="date" id="ingestDeadline" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Sector Focus *</label>
              <input type="text" id="ingestSector" placeholder="e.g. Climate, Equity, Health" required style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Country Eligibility *</label>
              <input type="text" id="ingestCountry" placeholder="e.g. South Africa, Global, Kenya" required style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Eligibility Guidelines Summary *</label>
              <input type="text" id="ingestEligibility" placeholder="e.g. Registered non-profit advocacy organizations" required style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Website Homepage URL</label>
              <input type="text" id="ingestWebsite" placeholder="e.g. fordfoundation.org" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Funder Email Contact</label>
              <input type="email" id="ingestEmail" placeholder="e.g. grants@fordfoundation.org" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Funder Phone Contact</label>
              <input type="text" id="ingestPhone" placeholder="e.g. +1 212 573-5000" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Verification Status</label>
              <select id="ingestVerificationStatus" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);">
                <option value="Verified">Verified</option>
                <option value="Needs Review">Needs Review</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: span 2; display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Official Source/Evidence URL * (Direct link to funder guidelines/announcement)</label>
              <input type="url" id="ingestSourceUrl" placeholder="e.g. https://www.fordfoundation.org/work/our-grants/grants-database/" required style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
            </div>
            <div class="form-group" style="grid-column: span 2; display: flex; flex-direction: column; gap: 0.25rem;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Verbatim Source Excerpt (Verification Evidence of Amount & Deadline) *</label>
              <textarea id="ingestSourceExcerpt" rows="3" placeholder="Exact quote verifying details. e.g., 'We offer grants up to $150,000 to non-profits working in rural areas...'" required style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; font-family: inherit; resize: vertical; background: var(--card-bg, #ffffff);"></textarea>
            </div>
            <div style="grid-column: span 2; display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
              <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1.5rem; border-radius: 6px;">Verify & Save Grant</button>
            </div>
          </form>
        </div>

        <!-- API / Web Fetcher Ingest Tab -->
        <div id="ingest-pane-api" class="ingest-pane" style="display: none;">
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">
              Ingest grant opportunities dynamically from official funder websites or public API endpoints. This system matches metadata tags to identify and scrape eligible scopes.
            </p>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="text" id="apiFetcherUrl" placeholder="Enter funder website URL or API endpoint (e.g. https://www.ccacoalition.org/calls-for-proposals)" style="flex-grow: 1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg, #ffffff);" />
              <button class="btn btn-primary" id="triggerApiFetchBtn" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;">Fetch & Parse</button>
            </div>

            <!-- Staging area preview -->
            <div id="apiFetcherPreview" style="display: none; border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background: var(--card-bg, #ffffff);">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: var(--primary-color);">🔍 Discovered Grant Opportunity (Pending Verification)</h4>
              <div id="apiPreviewFields" style="font-size: 0.85rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; line-height: 1.4;">
                <!-- Filled dynamically -->
              </div>
              <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button class="btn btn-outline btn-sm" id="cancelApiIngestBtn" style="padding: 0.35rem 1rem; font-size: 0.75rem;">Cancel</button>
                <button class="btn btn-primary btn-sm" id="confirmApiIngestBtn" style="padding: 0.35rem 1rem; font-size: 0.75rem;">Confirm & Ingest Opportunity</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Reader Tab -->
        <div id="ingest-pane-document" class="ingest-pane" style="display: none;">
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">
              Upload call-for-proposals guidelines or request documents (PDF, TXT, DOCX). The system runs a local NLP regex parser to extract amounts, deadlines, and verification excerpt highlights.
            </p>
            <div id="docDropZone" style="border: 2px dashed var(--border-color); border-radius: 8px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--card-bg, #ffffff);">
              <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">📁</span>
              <strong style="display: block; font-size: 0.85rem;">Click to select or drag & drop grant guideline files here</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.25rem;">Supports PDF, TXT or markdown (max 10MB)</span>
              <input type="file" id="docFileInput" accept=".txt,.pdf,.md" style="display: none;" />
            </div>

            <!-- Processing loader -->
            <div id="docReaderLoading" style="display: none; text-align: center; padding: 1rem;">
              <div class="spinner"></div>
              <span style="font-size: 0.8rem; color: var(--text-muted);">Scanning document details & extracting key parameters...</span>
            </div>

            <!-- Staging area preview -->
            <div id="docReaderPreview" style="display: none; border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background: var(--card-bg, #ffffff);">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: var(--primary-color);">🔍 Discovered Grant Opportunity (Pending Verification)</h4>
              <div id="docPreviewFields" style="font-size: 0.85rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; line-height: 1.4;">
                <!-- Filled dynamically -->
              </div>
              <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button class="btn btn-outline btn-sm" id="cancelDocIngestBtn" style="padding: 0.35rem 1rem; font-size: 0.75rem;">Cancel</button>
                <button class="btn btn-primary btn-sm" id="confirmDocIngestBtn" style="padding: 0.35rem 1rem; font-size: 0.75rem;">Confirm & Ingest Opportunity</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Currency Selector and Market Rates Panel -->
    <div class="currency-tabs-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;">
      <!-- Currency Tabs Switcher -->
      <div style="display: flex; background-color: #E2E8F0; padding: 0.25rem; border-radius: 8px; gap: 0.25rem;">
        <button class="btn btn-sm currency-tab-btn ${state.currency === 'GBP' ? 'btn-primary' : 'btn-ghost'}" data-currency="GBP" style="border-radius: 6px; font-size: 0.8rem; padding: 0.4rem 1rem;">View in GBP (£)</button>
        <button class="btn btn-sm currency-tab-btn ${state.currency === 'ZAR' ? 'btn-primary' : 'btn-ghost'}" data-currency="ZAR" style="border-radius: 6px; font-size: 0.8rem; padding: 0.4rem 1rem;">View in ZAR (R)</button>
      </div>

      <!-- Currency Market Status Monitor -->
      <div class="card" style="margin: 0; padding: 0.75rem 1rem; flex-grow: 1; max-width: 500px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-color: var(--border-color); box-shadow: var(--shadow-sm); border-radius: 10px;">
        <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.15rem;">
          <span style="color: var(--text-muted); font-size: 0.7rem; font-weight: 600; text-transform: uppercase; display: flex; align-items: center; gap: 0.25rem;">
            <span>💱</span> Exchange Rate Monitor
          </span>
          <strong>1 GBP = R ${state.gbpToZarRate.toFixed(4)} ZAR</strong>
        </div>
        <div>
          ${
            state.rateChangePercent > 0
              ? `<span class="status-badge green" style="font-weight: 700; font-size: 0.75rem; padding: 0.35rem 0.65rem;">
                   📈 +${state.rateChangePercent.toFixed(4)}% GBP Stronger
                 </span>`
              : state.rateChangePercent < 0
              ? `<span class="status-badge red" style="font-weight: 700; font-size: 0.75rem; padding: 0.35rem 0.65rem;">
                   📉 ${state.rateChangePercent.toFixed(4)}% GBP Weaker
                 </span>`
              : `<span class="status-badge disabled" style="font-weight: 700; font-size: 0.75rem; padding: 0.35rem 0.65rem;">
                   Stable (No Change)
                 </span>`
          }
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Funder Name</th>
              <th>Grant Name</th>
              <th>Amount</th>
              <th>Deadline</th>
              <th>Sector Focus</th>
              <th>Country Limit</th>
              <th>Match Index</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${grants.map(g => {
              let probClass = g.probabilityScore > 80 ? 'green' : g.probabilityScore > 65 ? 'yellow' : 'red';
              let verificationClass = g.verificationStatus === 'Verified' ? 'green' : g.verificationStatus === 'Unverified' ? 'red' : 'yellow';
              
              return `
                <tr>
                  <td>
                    <strong>${g.funder}</strong>
                    <div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 0.35rem; display: flex; flex-direction: column; gap: 0.15rem; line-height: 1.3;">
                      <span style="display: flex; align-items: center; gap: 0.25rem;">
                        <span>🌐</span> <a href="${g.sourceUrl}" target="_blank" style="color: var(--primary-color); text-decoration: underline;">${g.website}</a>
                      </span>
                      <span style="display: flex; align-items: center; gap: 0.25rem;">
                        <span>✉️</span> <a href="mailto:${g.email}" style="color: inherit;">${g.email}</a>
                      </span>
                      <span style="display: flex; align-items: center; gap: 0.25rem;">
                        <span>📞</span> <span>${g.phone}</span>
                      </span>
                    </div>
                  </td>
                  <td>${g.grantName}</td>
                  <td>${formatOpportunityAmount(g, state.currency)}</td>
                  <td>${formatOpportunityDeadline(g)}</td>
                  <td><span class="tag">${g.sector}</span></td>
                  <td>📍 ${g.country}</td>
                  <td>
                    <span class="status-badge ${probClass}">
                      ${g.probabilityScore}% Match
                    </span>
                  </td>
                  <td>
                    <span class="status-badge ${verificationClass}">${g.verificationStatus}</span>
                    <div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 0.25rem;">
                      Score: <strong>${g.confidenceScore}%</strong>
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                      <button class="btn btn-xs btn-primary generate-proposal-btn" data-opportunity-id="${g.id}">
                        Draft proposal
                      </button>
                      <button class="btn btn-xs btn-outline view-source-btn" data-opportunity-id="${g.id}" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">
                        🔍 Source
                      </button>
                      <button class="btn btn-xs btn-outline delete-opportunity-btn" data-opportunity-id="${g.id}" title="Delete Opportunity" style="color: var(--danger-color); border-color: rgba(239, 68, 68, 0.25); padding: 0.2rem 0.4rem; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind proposal buttons
  container.querySelectorAll('.generate-proposal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const oppId = btn.getAttribute('data-opportunity-id');
      openSourceEvidenceModal(oppId, () => {
        const draft = generateProposalDraft(oppId);
        openDraftModal(draft, oppId);
      });
    });
  });

  // Bind view source buttons
  container.querySelectorAll('.view-source-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const oppId = btn.getAttribute('data-opportunity-id');
      openSourceEvidenceModal(oppId);
    });
  });

  // Bind currency selector buttons
  container.querySelectorAll('.currency-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const currency = btn.getAttribute('data-currency');
      setCurrency(currency);
    });
  });

  // Bind delete buttons
  container.querySelectorAll('.delete-opportunity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const oppId = btn.getAttribute('data-opportunity-id');
      const opp = state.fundingOpportunities.find(o => o.id === oppId);
      if (opp && confirm(`Are you sure you want to delete the grant opportunity "${opp.grantName}" from "${opp.funder}"?`)) {
        deleteFundingOpportunity(oppId);
      }
    });
  });

  // --- INGESTION PANEL BINDINGS ---
  const toggleBtn = container.querySelector('#toggleIngestPanelBtn');
  const ingestPanel = container.querySelector('#grantIngestPanel');
  const closeBtn = container.querySelector('#closeIngestPanelBtn');

  if (toggleBtn && ingestPanel) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = ingestPanel.style.display === 'none';
      ingestPanel.style.display = isHidden ? 'block' : 'none';
    });
  }

  if (closeBtn && ingestPanel) {
    closeBtn.addEventListener('click', () => {
      ingestPanel.style.display = 'none';
    });
  }

  // Ingest Tab Switcher
  container.querySelectorAll('.ingest-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.ingest-tab-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-ghost');
      });
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-ghost');

      const targetTab = btn.getAttribute('data-tab');
      container.querySelectorAll('.ingest-pane').forEach(p => {
        p.style.display = 'none';
      });
      
      const pane = container.querySelector(`#ingest-pane-${targetTab}`);
      if (pane) {
        pane.style.display = 'block';
      }
    });
  });

  // 1. Manual Form Submission
  const manualForm = container.querySelector('#manualIngestForm');
  if (manualForm) {
    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const amountVal = container.querySelector('#ingestAmount').value;
      const deadlineVal = container.querySelector('#ingestDeadline').value;

      const opp = {
        funder: container.querySelector('#ingestFunder').value,
        grantName: container.querySelector('#ingestGrantName').value,
        amount: amountVal ? parseInt(amountVal) : null,
        currency: container.querySelector('#ingestCurrency').value,
        deadline: deadlineVal || null,
        sector: container.querySelector('#ingestSector').value,
        country: container.querySelector('#ingestCountry').value,
        eligibility: container.querySelector('#ingestEligibility').value,
        website: container.querySelector('#ingestWebsite').value || 'grants-info.org',
        email: container.querySelector('#ingestEmail').value || 'info@grants-info.org',
        phone: container.querySelector('#ingestPhone').value || 'N/A',
        sourceUrl: container.querySelector('#ingestSourceUrl').value,
        sourceExcerpt: container.querySelector('#ingestSourceExcerpt').value,
        sourceType: 'manual entry',
        verificationStatus: container.querySelector('#ingestVerificationStatus').value,
        confidenceScore: 95
      };

      try {
        addFundingOpportunity(opp);
        alert('Grant opportunity successfully verified and saved!');
        manualForm.reset();
        if (ingestPanel) ingestPanel.style.display = 'none';
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  // 2. API Ingestion Simulator
  const fetchBtn = container.querySelector('#triggerApiFetchBtn');
  const apiPreview = container.querySelector('#apiFetcherPreview');
  let stagedApiOpp = null;

  if (fetchBtn) {
    fetchBtn.addEventListener('click', () => {
      const url = container.querySelector('#apiFetcherUrl').value;
      if (!url || !url.trim()) {
        alert('Please enter a valid website or API URL.');
        return;
      }

      fetchBtn.disabled = true;
      fetchBtn.innerText = 'Fetching...';

      setTimeout(() => {
        fetchBtn.disabled = false;
        fetchBtn.innerText = 'Fetch & Parse';

        const isUndp = url.toLowerCase().includes('undp') || url.toLowerCase().includes('sgp') || url.toLowerCase().includes('gef');
        
        if (isUndp) {
          stagedApiOpp = {
            funder: 'Global Environment Facility (GEF)',
            grantName: 'Climate Change Mitigation Grants',
            amount: 50000,
            currency: 'USD',
            deadline: '2026-11-15',
            sector: 'Climate & Biodiversity',
            country: 'Developing Countries Focus',
            eligibility: 'Community-based organizations and NGOs working in environmental preservation',
            website: 'sgp.undp.org',
            email: 'sgp.info@undp.org',
            phone: '+1 212 906-5073',
            sourceUrl: url,
            sourceExcerpt: 'The maximum grant amount per project is US$50,000, SGP grants are made directly to community-based organizations and non-governmental organizations.',
            sourceType: 'API',
            verificationStatus: 'Verified',
            confidenceScore: 96
          };
        } else {
          stagedApiOpp = {
            funder: 'Oak Foundation',
            grantName: 'Climate and Marine Conservation Grant',
            amount: null,
            currency: 'USD',
            deadline: null,
            sector: 'Climate Change & Oceans',
            country: 'Global Focus',
            eligibility: 'Non-profit advocacy and environmental organizations',
            website: 'oakfnd.org',
            email: 'info@oakfnd.org',
            phone: '+41 22 318 8800',
            sourceUrl: url,
            sourceExcerpt: 'We support efforts to safeguard our future by addressing climate change and marine conservation. Oak Foundation does not accept unsolicited letters of inquiry.',
            sourceType: 'website',
            verificationStatus: 'Verified',
            confidenceScore: 92
          };
        }

        const fieldsContainer = container.querySelector('#apiPreviewFields');
        if (fieldsContainer) {
          fieldsContainer.innerHTML = `
            <div><strong>Funder:</strong> ${stagedApiOpp.funder}</div>
            <div><strong>Grant Name:</strong> ${stagedApiOpp.grantName}</div>
            <div><strong>Amount:</strong> ${stagedApiOpp.amount ? '$' + stagedApiOpp.amount.toLocaleString() : 'Amount not confirmed'}</div>
            <div><strong>Deadline:</strong> ${stagedApiOpp.deadline || 'Deadline not confirmed'}</div>
            <div><strong>Country Focus:</strong> ${stagedApiOpp.country}</div>
            <div><strong>Sector:</strong> ${stagedApiOpp.sector}</div>
            <div style="grid-column: span 2; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem;">
              <strong>Extracted Source Evidence:</strong>
              <blockquote style="margin: 0.25rem 0 0 0; background: rgba(59, 130, 246, 0.05); border-left: 3px solid var(--primary-color); padding: 0.5rem; font-style: italic; font-size: 0.8rem;">
                "${stagedApiOpp.sourceExcerpt}"
              </blockquote>
            </div>
          `;
        }

        if (apiPreview) apiPreview.style.display = 'block';
      }, 1000);
    });
  }

  const cancelApiBtn = container.querySelector('#cancelApiIngestBtn');
  if (cancelApiBtn && apiPreview) {
    cancelApiBtn.addEventListener('click', () => {
      apiPreview.style.display = 'none';
      stagedApiOpp = null;
      container.querySelector('#apiFetcherUrl').value = '';
    });
  }

  const confirmApiBtn = container.querySelector('#confirmApiIngestBtn');
  if (confirmApiBtn && apiPreview) {
    confirmApiBtn.addEventListener('click', () => {
      if (stagedApiOpp) {
        try {
          addFundingOpportunity(stagedApiOpp);
          alert('API parsed opportunity successfully verified and saved!');
          apiPreview.style.display = 'none';
          stagedApiOpp = null;
          container.querySelector('#apiFetcherUrl').value = '';
          if (ingestPanel) ingestPanel.style.display = 'none';
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }
    });
  }

  // 3. Document Guideline Ingest Simulator
  const dropZone = container.querySelector('#docDropZone');
  const fileInput = container.querySelector('#docFileInput');
  const docLoading = container.querySelector('#docReaderLoading');
  const docPreview = container.querySelector('#docReaderPreview');
  let stagedDocOpp = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        processDocFile(file.name);
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--primary-color)';
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'var(--border-color)';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--border-color)';
      const file = e.dataTransfer.files[0];
      if (file) {
        processDocFile(file.name);
      }
    });
  }

  function processDocFile(fileName) {
    if (docPreview) docPreview.style.display = 'none';
    if (docLoading) docLoading.style.display = 'block';

    setTimeout(() => {
      if (docLoading) docLoading.style.display = 'none';

      // Load a real environmental guidelines parser preset
      stagedDocOpp = {
        funder: 'Rockefeller Brothers Fund',
        grantName: 'Sustainable Development Project Funding',
        amount: null, // Amount not confirmed
        currency: 'USD',
        deadline: null, // Deadline not confirmed
        sector: 'Sustainable Development & Climate',
        country: 'Global (emphasis on high burden areas)',
        eligibility: 'Non-profit organizations promoting ecological health and carbon transition programs',
        website: 'rbf.org',
        email: 'grants@rbf.org',
        phone: '+1 212 812-4200',
        sourceUrl: 'https://www.rbf.org/programs/sustainable-development',
        sourceExcerpt: 'Our Sustainable Development program supports efforts to build a green economy. The RBF does not have formal application deadlines and reviews proposals on a rolling basis.',
        sourceType: 'PDF',
        verificationStatus: 'Verified',
        confidenceScore: 94
      };

      const fieldsContainer = container.querySelector('#docPreviewFields');
      if (fieldsContainer) {
        fieldsContainer.innerHTML = `
          <div><strong>Funder:</strong> ${stagedDocOpp.funder}</div>
          <div><strong>Grant Name:</strong> ${stagedDocOpp.grantName}</div>
          <div><strong>Amount:</strong> ${stagedDocOpp.amount ? '$' + stagedDocOpp.amount.toLocaleString() : 'Amount not confirmed'}</div>
          <div><strong>Deadline:</strong> ${stagedDocOpp.deadline || 'Deadline not confirmed'}</div>
          <div><strong>Country Focus:</strong> ${stagedDocOpp.country}</div>
          <div><strong>Sector:</strong> ${stagedDocOpp.sector}</div>
          <div style="grid-column: span 2; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem;">
            <strong>Extracted Source Evidence (from file "${fileName}"):</strong>
            <blockquote style="margin: 0.25rem 0 0 0; background: rgba(59, 130, 246, 0.05); border-left: 3px solid var(--primary-color); padding: 0.5rem; font-style: italic; font-size: 0.8rem;">
              "${stagedDocOpp.sourceExcerpt}"
            </blockquote>
          </div>
        `;
      }

      if (docPreview) docPreview.style.display = 'block';
    }, 1500);
  }

  const cancelDocBtn = container.querySelector('#cancelDocIngestBtn');
  if (cancelDocBtn && docPreview) {
    cancelDocBtn.addEventListener('click', () => {
      docPreview.style.display = 'none';
      stagedDocOpp = null;
      if (fileInput) fileInput.value = '';
    });
  }

  const confirmDocBtn = container.querySelector('#confirmDocIngestBtn');
  if (confirmDocBtn && docPreview) {
    confirmDocBtn.addEventListener('click', () => {
      if (stagedDocOpp) {
        try {
          addFundingOpportunity(stagedDocOpp);
          alert('PDF guideline parameters successfully verified and saved!');
          docPreview.style.display = 'none';
          stagedDocOpp = null;
          if (fileInput) fileInput.value = '';
          const ingestPanel = container.querySelector('#ingestNewGrantPanel');
          if (ingestPanel) ingestPanel.style.display = 'none';
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }
    });
  }
}

// --- HELPERS FOR AGENTS DASHBOARD ---
// --- MODULE-LEVEL PERSISTENT STATE FOR AGENTS CONTROL ROOM ---
let crActiveTab = 'overview';
let crWizardStep = 1;
let crWizardInputs = {
  clientId: '',
  campaignName: '',
  agentId: '',
  outputType: '',
  evidenceId: '',
  dueDate: '',
  approvalPerson: '',
  platform: 'Facebook',
  tone: 'Grassroots, Encouraging'
};
let crEvidenceFilter = 'All';
let crSelectedSettingAgentId = 'storytelling';
let crExpandedOutputs = {};

const triggerDownload = (content, filename, type) => {
  const blob = new Blob([content], { type: type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

function getFileIcon(type) {
  if (type === 'PDF') return '📄';
  if (type === 'Excel' || type === 'CSV') return '📊';
  if (type === 'Word' || type === 'Text') return '📝';
  if (type === 'Image') return '📷';
  if (type === 'Video') return '🎥';
  if (type === 'Link') return '🔗';
  if (type === 'Email') return '📧';
  return '📁';
}

function getAgentNameById(id) {
  const names = {
    storytelling: 'Storytelling Agent',
    socialmedia: 'Social Media Agent',
    'canva-brief': 'Canva Poster Brief Agent',
    calendar: 'Content Calendar Agent',
    reporting: 'Donor Reporting Agent',
    analytics: 'Analytics Agent',
    'funding-comm': 'Funding Communication Agent'
  };
  return names[id] || id;
}

function getApprovalStatusClass(status) {
  if (status === 'Draft') return 'red';
  if (status === 'Internal Review') return 'yellow';
  if (status === 'Sent to Client') return 'yellow';
  if (status === 'Client Approved') return 'green';
  if (status === 'Scheduled') return 'green';
  if (status === 'Published') return 'green';
  return 'red';
}

function getAgentOutputsList(agentId) {
  const list = {
    storytelling: 'Impact stories, Case studies, Community stories, Donor stories',
    socialmedia: 'Facebook posts, Instagram captions, LinkedIn posts, WhatsApp updates',
    'canva-brief': 'Canva poster brief, Poster headline, Layout direction, Colour guidance',
    calendar: 'Monthly calendar, Weekly content plan, Campaign schedule',
    reporting: 'Monthly report, Quarterly report, Donor updates, PDF drafts',
    analytics: 'Monthly analytics summary, Performance report, Recommendations',
    'funding-comm': 'Donor update, Funding pitch, Proposal summary, Impact statement'
  };
  return list[agentId] || '';
}

function generateSimulatedAiOutputContent(agentId, client, campaignName, sourceExcerpt, tone, outputType, platform) {
  const brandColours = client.brandColours || 'Standard green/blue';
  
  if (agentId === 'storytelling') {
    return `Title: Voices from ${client.name} - Our Impact in Action\n\nActive Campaign: ${campaignName}\nTone Focus: ${tone}\n\nWe stood by the gates this morning and listened to community leaders. Based on recent evidence: "${sourceExcerpt}", the reality is clear. This isn't just about statistics; it is about human dignity.\n\n"Every step forward is a milestone," says a resident we spoke with. This project aims to bring sustainable, community-backed support to those who need it most. Join us.`;
  }
  
  if (agentId === 'socialmedia') {
    return `📢 CAMPAIGN UPDATE: ${campaignName}\nPlatform: ${platform}\nTone: ${tone}\n\nDid you know? ${sourceExcerpt} This is why we are taking direct action today.\n\nWe need your voice and your support. Share this update, and let's make an impact together!\n\nApproved Hashtags: ${client.approvedHashtags || '#NGOImpact #SocialDignity'}\n👉 Contact us: ${client.email || 'info@ngo.org'}`;
  }
  
  if (agentId === 'canva-brief') {
    return `🎨 CANVA DIGITAL POSTER BRIEF\nClient: ${client.name}\nCampaign: ${campaignName}\nPoster Size: ${client.posterSizes || '1080x1080 (Square Social Post)'}\n\n[DESIGN SPECIFICATIONS]\n- Main Headline: Empowering Our Community: ${campaignName}\n- Subheading: Evidence of Need: ${sourceExcerpt}\n- Visual Theme: Professional, high contrast, featuring real community workshop photos.\n- Recommended Colours: ${brandColours}\n- Primary CTA: Scan the QR code or call ${client.phone || 'us'} to participate.\n- Brand Assets: Include logo ${client.logo || '🌱'} in the top-right corner.`;
  }
  
  if (agentId === 'calendar') {
    return `📅 CONTENT CALENDAR SCHEDULER\nCampaign: ${campaignName}\nGenerated for: next 30 days\nPosting Frequency: ${client.campaignFrequency || '3 posts per week'}\n\n[SCHEDULE OUTLINE]\n- Week 1: Awareness announcement. Quote source evidence: "${sourceExcerpt}". Highlight problem statement.\n- Week 2: Spotlight community testimonials and photos.\n- Week 3: Direct call to action. Drive clicks to website ${client.website || 'ngo website'}.\n- Week 4: Funder appreciation and reporting updates. Link outcomes to current metrics.`;
  }
  
  if (agentId === 'reporting') {
    return `📋 FORMAL DONOR PERFORMANCE DRAFT\nReporting Period: Q2 2026\nFunder Target: ${client.currentFunders || 'Donor Partners'}\nCampaign: ${campaignName}\n\n[EXECUTIVE SUMMARY]\nThis performance report is compiled for the board and funding stakeholders. Over the last quarter, we tracked and addressed core needs.\n\n[KEY EVIDENCE FOUNDATION]\nAccording to verified findings: "${sourceExcerpt}". These results confirm that our active interventions are vital.\n\n[IMPACT DATA SUMMARY]\n- Deployed actions completed: High compliance\n- Community engagement feedback: Highly positive\n- Date generated: ${new Date().toISOString().split('T')[0]}`;
  }
  
  if (agentId === 'analytics') {
    return `📊 ANALYTICS & INSIGHTS BRIEF\nClient: ${client.name}\nCampaign Performance: ${campaignName}\n\n[PERFORMANCE METRICS SUMMARY]\n- Reach: +14% growth month-over-month\n- High-Engagement Content Element: Posts mentioning: "${sourceExcerpt}" achieved 2.4x standard shares.\n\n[STRATEGIC RECOMMENDATIONS]\n1. Increase WhatsApp updates frequency.\n2. Leverage Canva templates with HSL matching colors: ${brandColours}.\n3. Target local media and youth groups for high reach.`;
  }
  
  if (agentId === 'funding-comm') {
    return `✉️ SUPPORTER & FUNDER ADVISORY\nFunder Segment: ${client.currentFunders || 'Potential Donors'}\nCampaign Context: ${campaignName}\n\nDear Stakeholders,\n\nWe are pleased to share our progress report. Backed by verified observations: "${sourceExcerpt}", we have successfully structured our developmental programs.\n\nThank you for standing with ${client.name}. Together, we are creating transparent, accountable, and evidence-driven development.\n\nSincerely,\n${client.primaryContact || 'Program Director'}`;
  }

  return `Generated draft for ${outputType} using verified source.`;
}

function openSimulateUploadModal(clientId) {
  const modal = document.getElementById('globalModalContainer');
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 500px;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📥 Connect & Tag Source Evidence</h2>
          <button class="close-modal-btn" id="closeGlobalModal">×</button>
        </div>
        <div class="modal-body">
          <form id="simUploadForm" style="display:flex; flex-direction:column; gap:0.75rem;">
            <div class="form-group">
              <label>File Name / Resource Title</label>
              <input type="text" id="suName" placeholder="e.g. Durban School Sensor Training Register.pdf" required class="form-control" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label>Resource Format</label>
                <select id="suSourceType" class="form-select" required>
                  <option value="PDF">PDF Report</option>
                  <option value="Excel">Excel Spreadsheet</option>
                  <option value="CSV">CSV Data</option>
                  <option value="Word">Word Document</option>
                  <option value="Image">Image / Photo</option>
                  <option value="Video">Video Clip</option>
                  <option value="Link">External Website Link</option>
                  <option value="Email">Email Communication</option>
                </select>
              </div>
              <div class="form-group">
                <label>Content Tag Type</label>
                <select id="suContentType" class="form-select" required>
                  <option value="Reports">Reports</option>
                  <option value="Research documents">Research documents</option>
                  <option value="Photos">Photos</option>
                  <option value="Videos">Videos</option>
                  <option value="Workshop notes">Workshop notes</option>
                  <option value="Attendance registers">Attendance registers</option>
                  <option value="Survey results">Survey results</option>
                  <option value="Community feedback">Community feedback</option>
                  <option value="Case studies">Case studies</option>
                  <option value="Testimonials">Testimonials</option>
                  <option value="News articles">News articles</option>
                  <option value="Funder documents">Funder documents</option>
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label>Project Name</label>
                <input type="text" id="suProject" placeholder="e.g. School Sensor Deployment" required class="form-control" />
              </div>
              <div class="form-group">
                <label>Campaign Tag</label>
                <select id="suCampaign" class="form-select" required>
                  ${state.campaigns.filter(c => c.client === clientId).map(c => `
                    <option value="${c.name}">${c.name}</option>
                  `).join('') || `<option value="${client.campaignName || 'General'}">${client.campaignName || 'General'}</option>`}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Verbatim Excerpt / Factual Statement</label>
              <textarea id="suExcerpt" placeholder="Enter key facts, numbers, dates or figures from the file (e.g. 15 air monitors deployed in Southern Durban schools on June 18th)" required class="form-control" style="height:80px;"></textarea>
              <span style="font-size:0.65rem; color:var(--text-muted);">This text will be mapped directly into AI Agent memory blocks.</span>
            </div>

            <div class="form-group">
              <label>Initial Verification Audit Status</label>
              <select id="suStatus" class="form-select" required>
                <option value="Verified">Verified (Confirmed Source)</option>
                <option value="Needs Review">Needs Review (Awaiting check)</option>
                <option value="Unverified">Unverified (Unconfirmed entry)</option>
              </select>
            </div>

            <div id="uploadProgressSection" style="display:none; background:#f1f5f9; padding:0.5rem; border-radius:4px; margin-top:0.5rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.7rem; margin-bottom:0.15rem;">
                <span id="uploadStatusLabel">Uploading and scanning data stream...</span>
                <span id="uploadProgressPercent">0%</span>
              </div>
              <div style="background:#cbd5e1; height:4px; border-radius:2px; overflow:hidden;">
                <div id="uploadSimulatorProgressBar" style="background:var(--primary-color); height:100%; width:0%; transition:width: 0.05s linear;"></div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary mt-2" style="width:100%;">⚡ Connect & Ingest File</button>
          </form>
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';

  document.getElementById('closeGlobalModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  const form = document.getElementById('simUploadForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('suName').value;
    const sourceType = document.getElementById('suSourceType').value;
    const contentType = document.getElementById('suContentType').value;
    const project = document.getElementById('suProject').value;
    const campaign = document.getElementById('suCampaign').value;
    const excerpt = document.getElementById('suExcerpt').value;
    const status = document.getElementById('suStatus').value;

    const progressSection = document.getElementById('uploadProgressSection');
    const progressBar = document.getElementById('uploadSimulatorProgressBar');
    const progressLabel = document.getElementById('uploadStatusLabel');
    const percentLabel = document.getElementById('uploadProgressPercent');

    progressSection.style.display = 'block';
    
    let pct = 0;
    const intv = setInterval(() => {
      pct += 10;
      progressBar.style.width = `${pct}%`;
      percentLabel.textContent = `${pct}%`;
      
      if (pct === 30) progressLabel.textContent = 'Scanning file headers...';
      else if (pct === 60) progressLabel.textContent = 'Performing integrity check...';
      else if (pct === 90) progressLabel.textContent = 'Tagging campaign indexes...';

      if (pct >= 100) {
        clearInterval(intv);
        addEvidence({
          name: name,
          client: clientId,
          project: project,
          campaign: campaign,
          contentType: contentType,
          sourceType: sourceType,
          verificationStatus: status,
          textExcerpt: excerpt,
          isDemoData: false
        });

        // Log in console
        state.agentActivityLogs.unshift({
          timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          agent: 'System Ingest',
          client: client.name,
          message: `Evidence file "${name}" ingested and marked as ${status}.`,
          status: 'success'
        });

        alert(`Success! "${name}" has been connected to the Evidence Inbox.`);
        modal.style.display = 'none';
        notify();
      }
    }, 120);
  });
}

function openEditBriefModal(clientId) {
  const modal = document.getElementById('globalModalContainer');
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;

  // We construct the HTML for the tabs and fields
  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 800px; width: 90vw;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>✏️ Edit Client Brief Profile</h2>
          <button class="close-modal-btn" id="closeGlobalModal">×</button>
        </div>
        <div class="modal-body" style="padding-top: 0.5rem;">
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
            Update information across all 7 categories (71 fields total) to increase AI Generation readiness.
          </p>

          <!-- Tab Navigation -->
          <div class="brief-tab-nav">
            <button class="brief-tab-btn active" data-tab="tab-profile">A. NGO Profile</button>
            <button class="brief-tab-btn" data-tab="tab-brand">B. Brand Identity</button>
            <button class="brief-tab-btn" data-tab="tab-audience">C. Target Audience</button>
            <button class="brief-tab-btn" data-tab="tab-campaign">D. Campaign Info</button>
            <button class="brief-tab-btn" data-tab="tab-evidence">E. Project Evidence</button>
            <button class="brief-tab-btn" data-tab="tab-donor">F. Funder Info</button>
            <button class="brief-tab-btn" data-tab="tab-content">G. Content Needs</button>
          </div>

          <!-- Form wrapper -->
          <form id="editBriefForm">
            
            <!-- Tab A: NGO Profile -->
            <div class="brief-tab-content active" id="tab-profile">
              <div class="brief-tab-form-grid">
                <div class="form-group">
                  <label>Organisation Name</label>
                  <input type="text" name="name" value="${client.name || ''}" class="form-control" required />
                </div>
                <div class="form-group">
                  <label>Website URL</label>
                  <input type="text" name="website" value="${client.website || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Country</label>
                  <input type="text" name="country" value="${client.country || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Sector Focus</label>
                  <input type="text" name="sector" value="${client.sector || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Main Cause</label>
                  <input type="text" name="mainCause" value="${client.mainCause || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Key Contact Person</label>
                  <input type="text" name="keyContact" value="${client.keyContact || client.primaryContact || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Contact Email</label>
                  <input type="email" name="email" value="${client.email || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Contact Phone</label>
                  <input type="text" name="phone" value="${client.phone || ''}" class="form-control" />
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Mission Statement</label>
                  <textarea name="mission" class="form-control" style="height: 50px;">${client.mission || ''}</textarea>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Short Description of NGO</label>
                  <textarea name="shortDesc" class="form-control" style="height: 50px;">${client.shortDesc || ''}</textarea>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Main Services or Campaigns</label>
                  <textarea name="mainServices" class="form-control" style="height: 50px;">${client.mainServices || ''}</textarea>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Communities they support</label>
                  <input type="text" name="communities" value="${client.communities || ''}" class="form-control" />
                </div>
              </div>
            </div>

            <!-- Tab B: Brand Identity -->
            <div class="brief-tab-content" id="tab-brand">
              <div class="brief-tab-form-grid">
                <div class="form-group">
                  <label>Logo Emblem Emoji/Text</label>
                  <input type="text" name="logo" value="${client.logo || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Brand Colours (Comma sep HEX/Names)</label>
                  <input type="text" name="brandColours" value="${client.brandColours || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Brand Fonts</label>
                  <input type="text" name="fonts" value="${client.fonts || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Tone of Voice</label>
                  <input type="text" name="toneOfVoice" value="${client.toneOfVoice || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Writing Style</label>
                  <input type="text" name="writingStyle" value="${client.writingStyle || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Approved Hashtags</label>
                  <input type="text" name="approvedHashtags" value="${client.approvedHashtags || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Social Media Handles</label>
                  <input type="text" name="socialHandles" value="${client.socialHandles || ''}" class="form-control" />
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Words to Use</label>
                  <textarea name="wordsToUse" class="form-control" style="height: 40px;">${client.wordsToUse || ''}</textarea>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Words to Avoid</label>
                  <textarea name="wordsToAvoid" class="form-control" style="height: 40px;">${client.wordsToAvoid || ''}</textarea>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Existing Canva Templates URLs</label>
                  <input type="text" name="canvaTemplates" value="${client.canvaTemplates || ''}" class="form-control" />
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Existing Poster Examples / Guidelines</label>
                  <input type="text" name="posterExamples" value="${client.posterExamples || ''}" class="form-control" />
                </div>
              </div>
            </div>

            <!-- Tab C: Target Audience -->
            <div class="brief-tab-content" id="tab-audience">
              <div class="brief-tab-form-grid">
                <div class="form-group" style="grid-column: span 2;">
                  <label>Who the NGO wants to reach (Target Reach)</label>
                  <textarea name="targetReach" class="form-control" style="height: 40px;">${client.targetReach || ''}</textarea>
                </div>
                <div class="form-group">
                  <label>Community Audience</label>
                  <input type="text" name="audienceCommunity" value="${client.audienceCommunity || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Donor Audience</label>
                  <input type="text" name="audienceDonor" value="${client.audienceDonor || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Government Audience</label>
                  <input type="text" name="audienceGovernment" value="${client.audienceGovernment || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Youth Audience</label>
                  <input type="text" name="audienceYouth" value="${client.audienceYouth || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Media Audience</label>
                  <input type="text" name="audienceMedia" value="${client.audienceMedia || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Target Age Groups</label>
                  <input type="text" name="ageGroups" value="${client.ageGroups || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Locations</label>
                  <input type="text" name="locations" value="${client.locations || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Languages Required</label>
                  <input type="text" name="languages" value="${client.languages || ''}" class="form-control" />
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Cultural Considerations</label>
                  <input type="text" name="culturalConsiderations" value="${client.culturalConsiderations || ''}" class="form-control" />
                </div>
              </div>
            </div>

            <!-- Tab D: Campaign Info -->
            <div class="brief-tab-content" id="tab-campaign">
              <div class="brief-tab-form-grid">
                <div class="form-group">
                  <label>Campaign Name</label>
                  <input type="text" name="campaignName" value="${client.campaignName || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Campaign Goal</label>
                  <input type="text" name="campaignGoal" value="${client.campaignGoal || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Campaign Start Date</label>
                  <input type="date" name="campaignStart" value="${client.campaignStart || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Campaign End Date</label>
                  <input type="date" name="campaignEnd" value="${client.campaignEnd || ''}" class="form-control" />
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Main Campaign Message</label>
                  <textarea name="campaignMessage" class="form-control" style="height: 50px;">${client.campaignMessage || ''}</textarea>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label>Key Facts / Figures</label>
                  <textarea name="keyFacts" class="form-control" style="height: 50px;">${client.keyFacts || client.campaignFacts || ''}</textarea>
                </div>
                <div class="form-group">
                  <label>Call to Action (CTA)</label>
                  <input type="text" name="campaignCta" value="${client.campaignCta || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Target Platforms</label>
                  <input type="text" name="campaignPlatforms" value="${client.campaignPlatforms || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Posting Frequency</label>
                  <input type="text" name="campaignFrequency" value="${client.campaignFrequency || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Campaign Priority</label>
                  <select name="campaignPriority" class="form-select">
                    <option value="High" ${client.campaignPriority === 'High' ? 'selected' : ''}>High</option>
                    <option value="Medium" ${client.campaignPriority === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="Low" ${client.campaignPriority === 'Low' ? 'selected' : ''}>Low</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Tab E: Project Evidence -->
            <div class="brief-tab-content" id="tab-evidence">
              <div class="brief-tab-form-grid">
                <div class="form-group">
                  <label>PDF Reports Title</label>
                  <input type="text" name="evidenceReports" value="${client.evidenceReports || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Research Documents</label>
                  <input type="text" name="evidenceResearch" value="${client.evidenceResearch || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Photos Folders</label>
                  <input type="text" name="evidencePhotos" value="${client.evidencePhotos || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Videos Assets</label>
                  <input type="text" name="evidenceVideos" value="${client.evidenceVideos || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Workshop Notes Summary</label>
                  <input type="text" name="evidenceNotes" value="${client.evidenceNotes || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Attendance Registers</label>
                  <input type="text" name="evidenceRegisters" value="${client.evidenceRegisters || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Survey Results summary</label>
                  <input type="text" name="evidenceSurveys" value="${client.evidenceSurveys || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Community Feedback Quotes</label>
                  <input type="text" name="evidenceFeedback" value="${client.evidenceFeedback || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Case Studies</label>
                  <input type="text" name="evidenceCaseStudies" value="${client.evidenceCaseStudies || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Testimonials</label>
                  <input type="text" name="evidenceTestimonials" value="${client.evidenceTestimonials || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>News Articles Links</label>
                  <input type="text" name="evidenceNews" value="${client.evidenceNews || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Funder Documents Guidelines</label>
                  <input type="text" name="evidenceFunderDocs" value="${client.evidenceFunderDocs || ''}" class="form-control" />
                </div>
              </div>
            </div>

            <!-- Tab F: Funder Info -->
            <div class="brief-tab-content" id="tab-donor">
              <div class="brief-tab-form-grid">
                <div class="form-group">
                  <label>Current Funders</label>
                  <input type="text" name="currentFunders" value="${client.currentFunders || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Grant Names</label>
                  <input type="text" name="grantNames" value="${client.grantNames || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Reporting Deadlines</label>
                  <input type="text" name="reportingDeadlines" value="${client.reportingDeadlines || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Required Donor Outputs</label>
                  <input type="text" name="requiredDonorOutputs" value="${client.requiredDonorOutputs || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Donor Logo Requirements</label>
                  <input type="text" name="donorLogoRequirements" value="${client.donorLogoRequirements || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Funder Communication Rules</label>
                  <input type="text" name="funderCommunicationRules" value="${client.funderCommunicationRules || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Required Impact Metrics</label>
                  <input type="text" name="requiredImpactMetrics" value="${client.requiredImpactMetrics || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Required Evidence Types</label>
                  <input type="text" name="requiredEvidence" value="${client.requiredEvidence || ''}" class="form-control" />
                </div>
              </div>
            </div>

            <!-- Tab G: Content Needs -->
            <div class="brief-tab-content" id="tab-content">
              <div class="brief-tab-form-grid">
                <div class="form-group">
                  <label>Platforms to Create Content For</label>
                  <input type="text" name="contentPlatforms" value="${client.contentPlatforms || ''}" class="form-control" placeholder="e.g. Facebook, Instagram, LinkedIn" />
                </div>
                <div class="form-group">
                  <label>Monthly Content Target</label>
                  <input type="text" name="contentTarget" value="${client.contentTarget || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Poster Sizes Required</label>
                  <input type="text" name="posterSizes" value="${client.posterSizes || ''}" class="form-control" placeholder="e.g. Square 1080x1080, A4 Banner" />
                </div>
                <div class="form-group">
                  <label>Caption Style</label>
                  <input type="text" name="captionStyle" value="${client.captionStyle || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Image Style</label>
                  <input type="text" name="imageStyle" value="${client.imageStyle || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Video Style</label>
                  <input type="text" name="videoStyle" value="${client.videoStyle || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Approval Process Rules</label>
                  <input type="text" name="approvalProcess" value="${client.approvalProcess || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Publishing Deadlines</label>
                  <input type="text" name="publishingDeadlines" value="${client.publishingDeadlines || ''}" class="form-control" />
                </div>
              </div>
            </div>

            <!-- Submit row -->
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; border-top:1px solid var(--border-color); padding-top:1rem; margin-top:1.5rem;">
              <button type="button" class="btn btn-outline" id="closeBriefModalBtn">Cancel</button>
              <button type="submit" class="btn btn-primary">💾 Save Client Brief</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';

  // Cancel trigger
  const cancelBtn = document.getElementById('closeBriefModalBtn');
  cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; });

  // Tab switching logic
  const tabButtons = modal.querySelectorAll('.brief-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      modal.querySelectorAll('.brief-tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Form submission logic
  const form = document.getElementById('editBriefForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const updatedFields = {};
    for (const [key, value] of formData.entries()) {
      updatedFields[key] = value;
    }

    // Call updateClientBrief state mutation
    updateClientBrief(clientId, updatedFields);
    
    // Log change
    state.agentActivityLogs.unshift({
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      agent: 'Brief Manager',
      client: client.name,
      message: 'NGO Client brief profile successfully updated and completion score re-indexed.',
      status: 'success'
    });

    alert('Client Brief updated successfully!');
    modal.style.display = 'none';
  });
}

function getAgentChecklist(agentId, client, clientEvidence) {
  let checklist = [];
  if (agentId === 'storytelling') {
    checklist = [
      { name: 'Campaign brief completed', met: !!client.campaignName && !!client.campaignGoal },
      { name: 'Reports / Research available', met: !!client.evidenceReports || !!client.evidenceResearch },
      { name: 'Project evidence attached', met: !!client.evidenceNotes || !!client.evidenceRegisters || clientEvidence.length > 0 },
      { name: 'Target audience selected', met: !!client.targetReach },
      { name: 'Tone of voice selected', met: !!client.toneOfVoice },
      { name: 'Key message completed', met: !!client.campaignMessage },
      { name: 'Photos / evidence available', met: !!client.evidencePhotos || !!client.evidenceVideos }
    ];
  } else if (agentId === 'socialmedia') {
    checklist = [
      { name: 'Client profile completed', met: !!client.name && !!client.website },
      { name: 'Campaign brief completed', met: !!client.campaignGoal },
      { name: 'Target audience selected', met: !!client.targetReach },
      { name: 'Brand voice selected', met: !!client.toneOfVoice },
      { name: 'Platform selected', met: !!client.contentPlatforms || !!client.campaignPlatforms },
      { name: 'Source evidence attached', met: clientEvidence.length > 0 },
      { name: 'Approval person selected', met: !!client.primaryContact }
    ];
  } else if (agentId === 'canva-brief') {
    checklist = [
      { name: 'Campaign title completed', met: !!client.campaignName },
      { name: 'Poster message complete', met: !!client.campaignMessage },
      { name: 'Target platform selected', met: !!client.contentPlatforms },
      { name: 'Logo uploaded', met: !!client.logo },
      { name: 'Brand colours configured', met: !!client.brandColours },
      { name: 'Image assets defined', met: !!client.evidencePhotos },
      { name: 'Poster size defined', met: !!client.posterSizes },
      { name: 'Main CTA defined', met: !!client.campaignCta },
      { name: 'Contact details verified', met: !!client.email || !!client.phone }
    ];
  } else if (agentId === 'calendar') {
    checklist = [
      { name: 'Campaign dates ready', met: !!client.campaignStart && !!client.campaignEnd },
      { name: 'Posting frequency configured', met: !!client.campaignFrequency },
      { name: 'Platforms selected', met: !!client.contentPlatforms },
      { name: 'Campaign priorities active', met: !!client.campaignPriority },
      { name: 'Donor deadlines tagged', met: !!client.reportingDeadlines }
    ];
  } else if (agentId === 'reporting') {
    checklist = [
      { name: 'Project data / Impact ready', met: !!client.requiredImpactMetrics },
      { name: 'Photos / Media ready', met: !!client.evidencePhotos },
      { name: 'Attendance records ready', met: !!client.evidenceRegisters },
      { name: 'Survey results configured', met: !!client.evidenceSurveys || clientEvidence.some(ev => ev.contentType === 'Survey results') },
      { name: 'Donor requirements defined', met: !!client.requiredDonorOutputs },
      { name: 'Reporting period active', met: !!client.reportingDeadlines }
    ];
  } else if (agentId === 'analytics') {
    checklist = [
      { name: 'Social metrics available', met: true },
      { name: 'Reach & engagement track', met: true },
      { name: 'Website clicks log', met: true },
      { name: 'Top-performing posts list', met: true }
    ];
  } else if (agentId === 'funding-comm') {
    checklist = [
      { name: 'Funder details verified', met: !!client.currentFunders },
      { name: 'Project results compiled', met: !!client.requiredImpactMetrics },
      { name: 'Impact stories generated', met: true },
      { name: 'Evidence documents linked', met: clientEvidence.length > 0 },
      { name: 'Funding goals clear', met: !!client.campaignGoal },
      { name: 'Grant requirements defined', met: !!client.grantNames }
    ];
  }
  return checklist;
}

function renderActiveTabContent(client, briefStatus, clientEvidence, clientOutputs) {
  if (crActiveTab === 'overview') {
    return renderOverviewTabContent(client, briefStatus, clientEvidence, clientOutputs);
  } else if (crActiveTab === 'create-work') {
    return renderCreateWorkTabContent(client, briefStatus, clientEvidence);
  } else if (crActiveTab === 'evidence') {
    return renderEvidenceTabContent(client, clientEvidence);
  } else if (crActiveTab === 'approvals') {
    return renderApprovalsTabContent(client, clientOutputs);
  } else if (crActiveTab === 'reports') {
    return renderReportsTabContent(client);
  } else if (crActiveTab === 'settings') {
    return renderSettingsTabContent();
  }
  return '';
}

function renderOverviewTabContent(client, briefStatus, clientEvidence, clientOutputs) {
  // 1. Tasks due today
  const clientTasks = state.tasks.filter(t => t.client === client.id);
  const tasksHtml = clientTasks.length === 0 
    ? `<div class="empty-state-text" style="color:var(--text-muted); font-size:0.8rem; font-style:italic; padding:1rem 0;">No priorities due today. You are all caught up!</div>`
    : `<ul class="today-tasks-list" style="list-style:none; padding:0; margin:0.5rem 0 0 0; display:flex; flex-direction:column; gap:0.5rem;">
        ${clientTasks.map(t => `
          <li class="today-task-item ${t.status === 'Completed' ? 'completed' : ''}" style="display:flex; align-items:center; gap:0.5rem; background:#f8fafc; padding:0.5rem; border-radius:6px; border:1px solid #f1f5f9; font-size:0.8rem;">
            <input type="checkbox" class="task-checkbox" data-task-id="${t.id}" ${t.status === 'Completed' ? 'checked' : ''} style="cursor:pointer;" />
            <span class="task-name" style="flex-grow:1; text-decoration: ${t.status === 'Completed' ? 'line-through' : 'none'}; color: ${t.status === 'Completed' ? 'var(--text-muted)' : 'inherit'};">${t.name}</span>
            <span class="badge ${t.priority === 'High' ? 'danger' : 'info'}" style="font-size:0.65rem; padding:0.15rem 0.35rem;">${t.priority}</span>
          </li>
        `).join('')}
       </ul>`;

  // 2. Drafts waiting for review
  const drafts = clientOutputs.filter(o => o.approvalStatus === 'Draft' || o.approvalStatus === 'Internal Review');
  const draftsHtml = drafts.length === 0
    ? `<div class="empty-state-text" style="color:var(--text-muted); font-size:0.8rem; font-style:italic; padding:1rem 0;">No drafts waiting for review.</div>`
    : `<div class="overview-list" style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
        ${drafts.map(d => `
          <div class="overview-list-item" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.5rem; border-radius:6px; border:1px solid #f1f5f9; font-size:0.8rem;">
            <div>
              <strong>${getAgentNameById(d.agentId)}</strong>
              <span class="text-muted" style="font-size:0.75rem;"> - ${d.outputType}</span>
            </div>
            <button class="btn btn-xs btn-outline overview-go-approvals" data-tab="approvals" style="padding:0.15rem 0.4rem; font-size:0.65rem;">Review</button>
          </div>
        `).join('')}
       </div>`;

  // 3. Content waiting for client approval
  const clientAwaiting = clientOutputs.filter(o => o.approvalStatus === 'Sent to Client');
  const awaitingHtml = clientAwaiting.length === 0
    ? `<div class="empty-state-text" style="color:var(--text-muted); font-size:0.8rem; font-style:italic; padding:1rem 0;">No content waiting for client approval.</div>`
    : `<div class="overview-list" style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
        ${clientAwaiting.map(d => `
          <div class="overview-list-item" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.5rem; border-radius:6px; border:1px solid #f1f5f9; font-size:0.8rem;">
            <div>
              <strong>${getAgentNameById(d.agentId)}</strong>
              <span class="text-muted" style="font-size:0.75rem;"> - ${d.outputType}</span>
            </div>
            <button class="btn btn-xs btn-outline overview-go-approvals" data-tab="approvals" style="padding:0.15rem 0.4rem; font-size:0.65rem;">View</button>
          </div>
        `).join('')}
       </div>`;

  // 4. Reports due
  const reports = state.reports.filter(r => r.client === client.id && r.status !== 'Submitted');
  const reportsHtml = reports.length === 0
    ? `<div class="empty-state-text" style="color:var(--text-muted); font-size:0.8rem; font-style:italic; padding:1rem 0;">No reports due this period.</div>`
    : `<div class="clean-table-container" style="margin-top:0.5rem; border-radius:6px;">
        <table class="clean-table" style="font-size:0.75rem; width:100%;">
          <thead>
            <tr>
              <th style="padding:0.4rem 0.6rem; font-size:0.7rem;">Report</th>
              <th style="padding:0.4rem 0.6rem; font-size:0.7rem;">Donor</th>
              <th style="padding:0.4rem 0.6rem; font-size:0.7rem;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(r => `
              <tr>
                <td style="padding:0.4rem 0.6rem;"><strong>${r.name}</strong></td>
                <td style="padding:0.4rem 0.6rem;">${r.donor}</td>
                <td style="padding:0.4rem 0.6rem;"><span style="color:var(--danger-color); font-weight:600;">${r.dueDate}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
       </div>`;

  // 5. Missing client info checklist
  let missingFieldsHtml = '';
  if (briefStatus.score === 100) {
    missingFieldsHtml = `<div class="ready-alert" style="background:#ecfdf5; border:1px solid #6ee7b7; padding:0.75rem; border-radius:6px; color:#047857; font-size:0.8rem; font-weight:500; margin-top:0.5rem;">🎉 Client profile is 100% complete! Agents have maximum contextual accuracy.</div>`;
  } else {
    missingFieldsHtml = `
      <div class="missing-info-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-top:0.5rem;">
        ${Object.keys(briefStatus.missing).map(sec => {
          const missingFields = briefStatus.missing[sec];
          if (missingFields.length === 0) return '';
          const sectionTitles = {
            ngoProfile: 'Profile',
            brandIdentity: 'Brand',
            targetAudience: 'Audience',
            campaignInfo: 'Campaign',
            projectEvidence: 'Evidence',
            donorInfo: 'Funder',
            contentRequirements: 'Needs'
          };
          return `
            <div class="missing-info-section" style="background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:0.5rem; font-size:0.75rem;">
              <h4 style="margin:0 0 0.25rem 0; font-weight:600; font-size:0.75rem; color:#b45309;">${sectionTitles[sec] || sec}</h4>
              <ul class="missing-fields-list" style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.15rem; color:#78350f;">
                ${missingFields.slice(0, 2).map(f => `<li style="white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">• ${f}</li>`).join('')}
                ${missingFields.length > 2 ? `<li style="font-weight:600; font-size:0.65rem;">+${missingFields.length - 2} more</li>` : ''}
              </ul>
            </div>
          `;
        }).join('')}
      </div>
      <div style="margin-top:0.75rem; display:flex; justify-content:flex-end;">
        <button class="btn btn-xs btn-primary" id="overviewEditBrief">Complete Profile</button>
      </div>
    `;
  }

  return `
    <div class="overview-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
      <!-- Left Column -->
      <div class="overview-col" style="display:flex; flex-direction:column; gap:1.5rem;">
        <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
          <h3 class="card-title" style="margin:0 0 0.25rem 0; font-size:1.05rem; font-weight:600;">📅 Today's Priorities</h3>
          <p class="card-subtitle" style="margin:0; font-size:0.75rem; color:var(--text-muted);">Quick checklist of tactical tasks needing attention today.</p>
          ${tasksHtml}
        </div>
        <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
          <h3 class="card-title" style="margin:0 0 0.25rem 0; font-size:1.05rem; font-weight:600;">📋 Reports & Deliverables Due</h3>
          <p class="card-subtitle" style="margin:0; font-size:0.75rem; color:var(--text-muted);">Key reporting milestones required by donors.</p>
          ${reportsHtml}
        </div>
      </div>

      <!-- Right Column -->
      <div class="overview-col" style="display:flex; flex-direction:column; gap:1.5rem;">
        <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
          <h3 class="card-title" style="margin:0 0 0.25rem 0; font-size:1.05rem; font-weight:600;">⚡ Drafts Waiting Review</h3>
          <p class="card-subtitle" style="margin:0; font-size:0.75rem; color:var(--text-muted);">AI-generated items requiring internal oversight.</p>
          ${draftsHtml}
        </div>
        <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
          <h3 class="card-title" style="margin:0 0 0.25rem 0; font-size:1.05rem; font-weight:600;">📤 Sent for Client Approval</h3>
          <p class="card-subtitle" style="margin:0; font-size:0.75rem; color:var(--text-muted);">Items currently in the client approval pipeline.</p>
          ${awaitingHtml}
        </div>
        <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
          <h3 class="card-title" style="margin:0 0 0.25rem 0; font-size:1.05rem; font-weight:600;">⚠️ Context Completeness Alerts</h3>
          <p class="card-subtitle" style="margin:0; font-size:0.75rem; color:var(--text-muted);">Missing profile variables that limit agent effectiveness.</p>
          ${missingFieldsHtml}
        </div>
      </div>
    </div>
  `;
}

function renderCreateWorkTabContent(client, briefStatus, clientEvidence) {
  if (!client.isBriefApproved) {
    return `
      <div class="agent-placeholder-alert danger p-6 rounded" style="background:#fef2f2; border:1px solid #fca5a5; color:#b91c1c; text-align:center; padding:3rem; margin:1.5rem auto; max-width:700px; border-radius:12px;">
        <span style="font-size:3rem; display:block; margin-bottom:1rem;">🔒 AI Content Generation Locked</span>
        <h3 style="font-size:1.35rem; font-weight:700; margin-bottom:0.75rem; color:#b91c1c; text-transform:none;">Client Onboarding Brief Pending Approval</h3>
        <p style="font-size:0.9rem; color:#7f1d1d; max-width:600px; margin:0 auto 1.5rem auto; line-height:1.6; text-transform:none;">
          Under the platform's strict Accuracy & Context Policy, AI agents are locked from compiling final content for <strong>${client.name}</strong> until their workspace brief has been formally reviewed and approved by a consultant.
        </p>
        <div>
          <button class="btn btn-primary" id="wzOnboardUnlockBtn" style="background:#b91c1c; border-color:#991b1b; padding:0.6rem 1.5rem; font-weight:700; border-radius:8px;">✏️ Complete Onboarding Wizard</button>
        </div>
      </div>
    `;
  }

  // Wizard Steps Header
  const stepsHeader = `
    <div class="wizard-steps-header mb-4">
      <div class="wizard-step-bubble ${crWizardStep >= 1 ? 'active' : ''} ${crWizardStep > 1 ? 'completed' : ''}" data-step="1">
        <span class="step-num">${crWizardStep > 1 ? '✓' : '1'}</span>
        <span class="step-label">Client</span>
      </div>
      <div class="wizard-step-line ${crWizardStep > 1 ? 'completed' : ''}"></div>
      <div class="wizard-step-bubble ${crWizardStep >= 2 ? 'active' : ''} ${crWizardStep > 2 ? 'completed' : ''}" data-step="2">
        <span class="step-num">${crWizardStep > 2 ? '✓' : '2'}</span>
        <span class="step-label">Campaign</span>
      </div>
      <div class="wizard-step-line ${crWizardStep > 2 ? 'completed' : ''}"></div>
      <div class="wizard-step-bubble ${crWizardStep >= 3 ? 'active' : ''} ${crWizardStep > 3 ? 'completed' : ''}" data-step="3">
        <span class="step-num">${crWizardStep > 3 ? '✓' : '3'}</span>
        <span class="step-label">Agent</span>
      </div>
      <div class="wizard-step-line ${crWizardStep > 3 ? 'completed' : ''}"></div>
      <div class="wizard-step-bubble ${crWizardStep >= 4 ? 'active' : ''} ${crWizardStep > 4 ? 'completed' : ''}" data-step="4">
        <span class="step-num">${crWizardStep > 4 ? '✓' : '4'}</span>
        <span class="step-label">Format</span>
      </div>
      <div class="wizard-step-line ${crWizardStep > 4 ? 'completed' : ''}"></div>
      <div class="wizard-step-bubble ${crWizardStep >= 5 ? 'active' : ''} ${crWizardStep > 5 ? 'completed' : ''}" data-step="5">
        <span class="step-num">${crWizardStep > 5 ? '✓' : '5'}</span>
        <span class="step-label">Evidence</span>
      </div>
      <div class="wizard-step-line ${crWizardStep > 5 ? 'completed' : ''}"></div>
      <div class="wizard-step-bubble ${crWizardStep >= 6 ? 'active' : ''} ${crWizardStep > 6 ? 'completed' : ''}" data-step="6">
        <span class="step-num">6</span>
        <span class="step-label">Generate</span>
      </div>
    </div>
  `;

  let stepBody = '';
  
  if (crWizardStep === 1) {
    stepBody = `
      <div class="wizard-step-panel">
        <h3>Step 1: Select Client Workspace</h3>
        <p class="step-desc">Specify which NGO client profile context the AI Agent should load.</p>
        <div class="form-group mt-2">
          <label>Active Client</label>
          <select id="wzClientSelect" class="form-select">
            ${state.clients.map(c => `
              <option value="${c.id}" ${c.id === crWizardInputs.clientId ? 'selected' : ''}>
                ${c.logo} ${c.name}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
  } else if (crWizardStep === 2) {
    stepBody = `
      <div class="wizard-step-panel">
        <h3>Step 2: Select Target Campaign</h3>
        <p class="step-desc">Focus the AI on a specific pre-defined strategy or reporting goal.</p>
        <div class="form-group mt-2">
          <label>Target Campaign</label>
          <select id="wzCampaignSelect" class="form-select">
            ${state.campaigns.filter(c => c.client === crWizardInputs.clientId).map(c => `
              <option value="${c.name}" ${c.name === crWizardInputs.campaignName ? 'selected' : ''}>${c.name}</option>
            `).join('') || `<option value="${client.campaignName || 'General'}">${client.campaignName || 'General'}</option>`}
          </select>
        </div>
      </div>
    `;
  } else if (crWizardStep === 3) {
    const selectedAgentId = crWizardInputs.agentId;
    let agentDetailsHtml = '';
    
    if (selectedAgentId) {
      const checklist = getAgentChecklist(selectedAgentId, client, clientEvidence);
      const isReady = checklist.every(c => c.met);
      
      agentDetailsHtml = `
        <div class="selected-agent-details-box mt-4 p-4 border rounded" style="background:#f8fafc; border-color:#e2e8f0;">
          <h4 style="margin-top: 0; font-weight:600; display:flex; align-items:center; gap:0.4rem; font-size:0.9rem;">
            🤖 ${getAgentNameById(selectedAgentId)} Configured
          </h4>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:1rem; line-height:1.4;">
            ${state.agents.find(a => a.id === selectedAgentId).purpose}
          </p>

          <div class="agent-checklist-box" style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:0.75rem;">
            <div class="agent-checklist-title" style="font-weight:600; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-color);">Agent Readiness Checklist:</div>
            <ul class="agent-checklist" style="list-style:none; padding:0; margin:0; font-size:0.75rem; display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">
              ${checklist.map(c => `
                <li class="${c.met ? 'checked' : 'missing'}" style="display:flex; align-items:center; gap:0.3rem;">
                  ${c.met ? '✅' : '❌'} ${c.name}
                </li>
              `).join('')}
            </ul>
          </div>

          ${!isReady ? `
            <div class="agent-placeholder-alert warning mt-3" style="background:#fef2f2; border:1px solid #fca5a5; padding:0.75rem; border-radius:6px; color:#b91c1c; font-size:0.75rem; line-height:1.4;">
              <strong>⚠️ This agent is missing critical client data.</strong> Please complete the client brief profile to unlock final AI generation capabilities.
              <div style="margin-top:0.5rem;">
                <button class="btn btn-xs btn-primary" id="wzCompleteBriefBtn" style="background:#b91c1c; border-color:#b91c1c;">✏️ Complete Brief</button>
              </div>
            </div>
          ` : `
            <div class="agent-placeholder-alert success mt-3" style="background:#ecfdf5; border:1px solid #6ee7b7; padding:0.75rem; border-radius:6px; color:#047857; font-size:0.75rem; font-weight:500;">
              🎉 Agent is 100% ready! All client profile parameters have been fully provided.
            </div>
          `}
        </div>
      `;
    }

    stepBody = `
      <div class="wizard-step-panel">
        <h3>Step 3: Assign AI Agent Co-worker</h3>
        <p class="step-desc">Select the specialist agent to construct this piece of work.</p>
        
        <div class="agents-tiles-grid mt-3" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:0.5rem;">
          ${state.agents.map(a => {
            const isSelected = a.id === selectedAgentId;
            return `
              <button class="agent-tile-btn ${isSelected ? 'selected' : ''}" data-agent-id="${a.id}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0.75rem; border:1px solid var(--border-color); border-radius:8px; background:${isSelected ? '#eff6ff' : 'white'}; border-color:${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}; cursor:pointer; outline:none; transition:all 0.2s;">
                <div class="agent-tile-emoji" style="font-size:1.25rem; margin-bottom:0.25rem;">🤖</div>
                <div class="agent-tile-name" style="font-size:0.75rem; font-weight:600; text-align:center; color:${isSelected ? 'var(--primary-color)' : 'inherit'};">${a.name}</div>
              </button>
            `;
          }).join('')}
        </div>

        ${agentDetailsHtml}
      </div>
    `;
  } else if (crWizardStep === 4) {
    const listOutputs = getAgentOutputsList(crWizardInputs.agentId).split(', ');
    
    stepBody = `
      <div class="wizard-step-panel">
        <h3>Step 4: Select Output Format</h3>
        <p class="step-desc">Choose the format details that align with this output category.</p>
        <div class="form-group mt-2">
          <label>Output Format</label>
          <select id="wzOutputTypeSelect" class="form-select">
            <option value="">-- Choose output format --</option>
            ${listOutputs.map(o => `
              <option value="${o}" ${o === crWizardInputs.outputType ? 'selected' : ''}>${o}</option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
  } else if (crWizardStep === 5) {
    stepBody = `
      <div class="wizard-step-panel">
        <h3>Step 5: Attach Factual Evidence</h3>
        <p class="step-desc">Select verified logs or report documents to serve as the ground-truth facts for the AI Agent.</p>
        <div class="form-group mt-2">
          <label>Source Document (Evidence Inbox)</label>
          <select id="wzEvidenceSelect" class="form-select">
            <option value="">-- Choose factual source document --</option>
            ${clientEvidence.map(e => `
              <option value="${e.id}" ${e.id === crWizardInputs.evidenceId ? 'selected' : ''}>
                ${e.name} (${e.verificationStatus})
              </option>
            `).join('')}
          </select>
        </div>
        ${clientEvidence.length === 0 ? `
          <div class="agent-placeholder-alert warning mt-3" style="background:#fffbeb; border:1px solid #fcd34d; padding:0.75rem; border-radius:6px; color:#b45309; font-size:0.75rem; line-height:1.4;">
            No evidence files have been connected for this client. Please upload/connect source evidence in the Evidence tab, or simulate a quick upload here.
            <div style="margin-top: 0.5rem;">
              <button class="btn btn-xs btn-primary" id="wzQuickUploadBtn">📥 Simulate Quick Upload</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } else if (crWizardStep === 6) {
    const ev = clientEvidence.find(e => e.id === crWizardInputs.evidenceId);
    const isUnverified = ev && ev.verificationStatus === 'Unverified';

    stepBody = `
      <div class="wizard-step-panel">
        <h3>Step 6: Review & Generate Draft</h3>
        <p class="step-desc">Confirm your settings and run the agent compilation pipeline.</p>
        
        <div class="wizard-review-grid mt-3" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; background:#f8fafc; border:1px solid #e2e8f0; padding:0.75rem; border-radius:8px; font-size:0.8rem;">
          <div class="review-item"><strong>Client:</strong> <span>${client.logo} ${client.name}</span></div>
          <div class="review-item"><strong>Campaign:</strong> <span>${crWizardInputs.campaignName}</span></div>
          <div class="review-item"><strong>Agent:</strong> <span>${getAgentNameById(crWizardInputs.agentId)}</span></div>
          <div class="review-item"><strong>Format:</strong> <span>${crWizardInputs.outputType}</span></div>
          <div class="review-item" style="grid-column: span 2;">
            <strong>Evidence:</strong> 
            <span>${ev ? `${ev.name} (${ev.verificationStatus})` : 'None'}</span>
          </div>
        </div>

        ${isUnverified ? `
          <div class="wizard-warning-card warning mt-3" style="background:#fffbeb; border:1px solid #fcd34d; padding:0.75rem; border-radius:6px; color:#b45309; font-size:0.75rem; display:flex; gap:0.5rem; align-items:flex-start; line-height:1.4;">
            <span>⚠️</span>
            <div>
              <strong>Accuracy Policy Warning:</strong> The selected source document is marked as <strong>Unverified</strong>. Generating final content using unverified statistics or facts is against accuracy rules.
            </div>
          </div>
        ` : ''}

        <div class="wizard-additional-inputs mt-4">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label>Target Platform</label>
              <select id="wzPlatform" class="form-select">
                <option value="Facebook" ${crWizardInputs.platform === 'Facebook' ? 'selected' : ''}>Facebook</option>
                <option value="Instagram" ${crWizardInputs.platform === 'Instagram' ? 'selected' : ''}>Instagram</option>
                <option value="LinkedIn" ${crWizardInputs.platform === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                <option value="WhatsApp" ${crWizardInputs.platform === 'WhatsApp' ? 'selected' : ''}>WhatsApp</option>
                <option value="Email newsletter" ${crWizardInputs.platform === 'Email newsletter' ? 'selected' : ''}>Email newsletter</option>
                <option value="Website" ${crWizardInputs.platform === 'Website' ? 'selected' : ''}>Website</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tone of Voice</label>
              <select id="wzTone" class="form-select">
                <option value="Grassroots, Encouraging" ${crWizardInputs.tone === 'Grassroots, Encouraging' ? 'selected' : ''}>Grassroots, Encouraging</option>
                <option value="Urgent, Empowering" ${crWizardInputs.tone === 'Urgent, Empowering' ? 'selected' : ''}>Urgent, Empowering</option>
                <option value="Professional, Fact-based" ${crWizardInputs.tone === 'Professional, Fact-based' ? 'selected' : ''}>Professional, Fact-based</option>
                <option value="Informative, Accessible" ${crWizardInputs.tone === 'Informative, Accessible' ? 'selected' : ''}>Informative, Accessible</option>
              </select>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-top:0.75rem;">
            <div class="form-group">
              <label>Due Date</label>
              <input type="date" id="wzDueDate" class="form-control" value="${crWizardInputs.dueDate}" />
            </div>
            <div class="form-group">
              <label>Approval Reviewer</label>
              <input type="text" id="wzApprovalPerson" class="form-control" value="${crWizardInputs.approvalPerson}" />
            </div>
          </div>
        </div>

        <!-- Progress simulator loader -->
        <div id="wzGenProgress" style="display:none; background:#f1f5f9; padding:0.75rem; border-radius:6px; border:1px solid #e2e8f0; margin-top:1.25rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; margin-bottom:0.25rem;">
            <strong id="wzGenStatusText">AI Agent compiling inputs...</strong>
            <span id="wzGenPercent">0%</span>
          </div>
          <div style="background:#cbd5e1; height:6px; border-radius:3px; overflow:hidden;">
            <div id="wzGenProgressBar" style="background:var(--primary-color); height:100%; width:0%; transition:width 0.1s linear;"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Next / Prev button triggers logic
  const isAgentTileSelected = !!crWizardInputs.agentId;
  const isAgentReady = isAgentTileSelected && getAgentChecklist(crWizardInputs.agentId, client, clientEvidence).every(c => c.met);
  
  let nextDisabled = false;
  if (crWizardStep === 3 && !isAgentReady) nextDisabled = true;
  if (crWizardStep === 4 && !crWizardInputs.outputType) nextDisabled = true;
  if (crWizardStep === 5 && !crWizardInputs.evidenceId) nextDisabled = true;

  const buttonsRow = `
    <div class="wizard-buttons-row mt-4" style="display:flex; justify-content:space-between; align-items:center;">
      <button class="btn btn-outline" id="wzPrevBtn" ${crWizardStep === 1 ? 'disabled' : ''}>⬅️ Previous</button>
      ${crWizardStep < 6 ? `
        <button class="btn btn-primary" id="wzNextBtn" ${nextDisabled ? 'disabled' : ''}>Next ➡️</button>
      ` : `
        <button class="btn btn-success" id="wzGenerateBtn">🚀 Generate Content Draft</button>
      `}
    </div>
  `;

  return `
    <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
      ${stepsHeader}
      ${stepBody}
      ${buttonsRow}
    </div>
  `;
}

function renderEvidenceTabContent(client, clientEvidence) {
  let filtered = clientEvidence;
  if (crEvidenceFilter !== 'All') {
    filtered = clientEvidence.filter(e => e.verificationStatus === crEvidenceFilter);
  }

  const listHtml = filtered.length === 0
    ? `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No evidence files found matching criteria.</td></tr>`
    : filtered.map(e => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span>${getFileIcon(e.sourceType)}</span>
              <a href="/${e.name}" target="_blank" class="evidence-filename-link" style="text-decoration:underline; color:var(--primary-color); font-weight:600;" title="Click to open file in browser">${e.name}</a>
              ${e.isDemoData ? '<span class="demo-badge" style="background:#e0f2fe; color:#0369a1; font-size:0.65rem; padding:0.1rem 0.3rem; border-radius:4px; margin-left:0.25rem;">Demo</span>' : ''}
            </div>
          </td>
          <td>${e.project || 'General'} / ${e.campaign || 'None'}</td>
          <td>${e.sourceType}</td>
          <td><span class="badge-status ${e.verificationStatus.toLowerCase().replace(' ', '-')}">${e.verificationStatus}</span></td>
          <td>${e.dateUploaded}</td>
          <td>
            ${e.verificationStatus !== 'Verified' ? `
              <button class="btn btn-xs btn-outline verify-evidence-btn" data-ev-id="${e.id}">Verify Source</button>
            ` : `<span style="color:var(--success-color); font-weight:600; font-size:0.75rem;">✓ Verified</span>`}
          </td>
        </tr>
      `).join('');

  return `
    <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <h3 style="margin:0; font-weight:600;">📥 Evidence & Ingestion Database</h3>
          <p style="font-size:0.8rem; color:var(--text-muted); margin:0.25rem 0 0 0;">Manage and verify fact sheets, logs, audits, and research reports.</p>
        </div>
        <button class="btn btn-primary" id="ingestEvidenceBtn">➕ Connect & Ingest File</button>
      </div>

      <div class="evidence-filters mb-3" style="display:flex; gap:0.5rem; align-items:center;">
        <span style="font-size:0.8rem; font-weight:600; margin-right:0.5rem; color:var(--text-muted);">Filter Status:</span>
        <button class="btn btn-xs ${crEvidenceFilter === 'All' ? 'btn-primary' : 'btn-outline'}" data-filter="All">All</button>
        <button class="btn btn-xs ${crEvidenceFilter === 'Verified' ? 'btn-primary' : 'btn-outline'}" data-filter="Verified">Verified</button>
        <button class="btn btn-xs ${crEvidenceFilter === 'Needs Review' ? 'btn-primary' : 'btn-outline'}" data-filter="Needs Review">Needs Review</button>
        <button class="btn btn-xs ${crEvidenceFilter === 'Unverified' ? 'btn-primary' : 'btn-outline'}" data-filter="Unverified">Unverified</button>
      </div>

      <div class="clean-table-container">
        <table class="clean-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Project / Campaign</th>
              <th>Format</th>
              <th>Status</th>
              <th>Upload Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${listHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderApprovalsTabContent(client, clientOutputs) {
  if (clientOutputs.length === 0) {
    return `
      <div class="card p-4 text-center" style="padding:4rem; background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
        <span style="font-size:2rem; display:block; margin-bottom:1rem;">⏳</span>
        <h3 style="margin:0;">Approval Queue is Empty</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin:0.5rem 0 1.5rem 0;">No generated drafts found. Setup parameters and hit "Generate Content Draft" in the Create Work wizard to initiate.</p>
        <button class="btn btn-primary" id="approvalsGoCreateBtn">Create New Work</button>
      </div>
    `;
  }

  const itemsHtml = clientOutputs.map(o => {
    let statusStep = 1;
    if (o.approvalStatus === 'Internal Review') statusStep = 2;
    else if (o.approvalStatus === 'Sent to Client') statusStep = 3;
    else if (o.approvalStatus === 'Client Approved') statusStep = 4;
    else if (o.approvalStatus === 'Scheduled') statusStep = 5;
    else if (o.approvalStatus === 'Published') statusStep = 6;

    const isExpanded = crExpandedOutputs[o.id] !== false; // default expanded

    return `
      <div class="approval-card card mb-3" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm); overflow:hidden;">
        <!-- Accordion Header -->
        <div class="approval-accordion-header" data-out-id="${o.id}" style="display:flex; justify-content:space-between; align-items:center; padding:1rem; cursor:pointer; background:#f8fafc; user-select:none;">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span class="accordion-toggle-arrow" style="font-size:0.8rem; color:var(--text-muted); width:12px; display:inline-block;">${isExpanded ? '▼' : '▶'}</span>
            <div>
              <strong style="font-size:0.9rem; color:var(--primary-color);">${getAgentNameById(o.agentId)}</strong>
              <span class="text-muted" style="font-size:0.8rem; margin-left:0.25rem;">➔ ${o.outputType}</span>
              ${o.isDemoData ? '<span class="demo-badge" style="background:#e0f2fe; color:#0369a1; font-size:0.65rem; padding:0.1rem 0.3rem; border-radius:4px; margin-left:0.4rem;">Demo</span>' : ''}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span class="badge-status ${getApprovalStatusClass(o.approvalStatus)}">${o.approvalStatus}</span>
          </div>
        </div>

        <!-- Accordion Body -->
        <div class="approval-accordion-body" style="display: ${isExpanded ? 'block' : 'none'}; padding: 1.25rem; border-top: 1px solid var(--border-color);">
          <!-- Workflow Stage Map Visual -->
          <div class="status-stepper mb-3" style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); padding:0.4rem 0.6rem; background:#f8fafc; border-radius:6px; border:1px solid #f1f5f9;">
            <span class="step-indicator-item" style="font-weight:${statusStep === 1 ? '700' : '400'}; color:${statusStep >= 1 ? 'var(--primary-color)' : 'inherit'};">1. Draft</span>
            <span class="step-connector">➔</span>
            <span class="step-indicator-item" style="font-weight:${statusStep === 2 ? '700' : '400'}; color:${statusStep >= 2 ? 'var(--primary-color)' : 'inherit'};">2. Internal</span>
            <span class="step-connector">➔</span>
            <span class="step-indicator-item" style="font-weight:${statusStep === 3 ? '700' : '400'}; color:${statusStep >= 3 ? 'var(--primary-color)' : 'inherit'};">3. Sent</span>
            <span class="step-connector">➔</span>
            <span class="step-indicator-item" style="font-weight:${statusStep === 4 ? '700' : '400'}; color:${statusStep >= 4 ? 'var(--primary-color)' : 'inherit'};">4. Approved</span>
            <span class="step-connector">➔</span>
            <span class="step-indicator-item" style="font-weight:${statusStep === 5 ? '700' : '400'}; color:${statusStep >= 5 ? 'var(--primary-color)' : 'inherit'};">5. Scheduled</span>
            <span class="step-connector">➔</span>
            <span class="step-indicator-item" style="font-weight:${statusStep === 6 ? '700' : '400'}; color:${statusStep >= 6 ? 'var(--primary-color)' : 'inherit'};">6. Published</span>
          </div>

          <!-- Edit Content Block -->
          <div class="approval-content-box" id="contentBox-${o.id}" style="background:#f8fafc; padding:1rem; border-radius:6px; border:1px solid var(--border-color); font-size:0.85rem; line-height:1.5; white-space:pre-wrap; margin-bottom:0.75rem;">${o.content}</div>
          <textarea class="form-control" id="contentEdit-${o.id}" style="display:none; font-size:0.85rem; margin-bottom:0.75rem; height:150px; font-family:inherit; border-left: 3px solid var(--primary-color); line-height:1.5; width:100%; padding:0.5rem;">${o.content}</textarea>

          <!-- Source Evidence Trace Panel -->
          <div class="evidence-trace-box p-3" style="background:rgba(59, 130, 246, 0.03); border:1px solid rgba(59, 130, 246, 0.1); border-radius:6px; margin-bottom:1rem; font-size:0.75rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem; font-weight:600; color:var(--primary-color);">
              <span>🔍 EVIDENCE TRACE [Confidence: ${o.confidenceScore}%]</span>
              <span style="color:${o.verificationStatus === 'Verified' ? 'var(--success-color)' : 'var(--warning-color)'};">${o.verificationStatus} Evidence</span>
            </div>
            <div style="color:var(--text-muted); margin-bottom:0.4rem; display:flex; gap:0.75rem; flex-wrap:wrap;">
              <span><strong>Source File:</strong> ${o.sourceDocName || 'None'} (${o.sourceDocType || 'Unknown'})</span>
              ${o.source_evidence_id ? `<span>| <strong>Evidence ID:</strong> <code>${o.source_evidence_id}</code></span>` : ''}
              ${o.source_meeting_id ? `<span>| <strong>Meeting ID:</strong> <code>${o.source_meeting_id}</code></span>` : ''}
              ${o.source_manual_entry_id ? `<span>| <strong>Manual Entry ID:</strong> <code>${o.source_manual_entry_id}</code></span>` : ''}
            </div>
            <div class="evidence-trace-quote" style="font-style:italic; padding-left:0.5rem; border-left:2px solid #cbd5e1; color:#475569; margin-bottom:0.4rem;">
              "${o.sourceEvidence || 'Evidence missing. Please upload or verify source information.'}"
            </div>

            ${(o.approved_by || o.approved_at) ? `
              <div class="approval-info-box p-2 mb-1" style="background:#e6f4ea; border:1px solid #34a853; border-radius:6px; font-size:0.7rem; color:#137333; display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; font-weight:600;">
                <span>✔️ Approved by ${o.approved_by}</span>
                <span>📅 ${new Date(o.approved_at).toLocaleDateString()} ${new Date(o.approved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            ` : ''}
            ${(o.scheduled_by || o.scheduled_at) ? `
              <div class="schedule-info-box p-2 mb-1" style="background:#fffbeb; border:1px solid #f59e0b; border-radius:6px; font-size:0.7rem; color:#b45309; display:flex; justify-content:space-between; align-items:center; font-weight:600;">
                <span>📅 Scheduled by ${o.scheduled_by}</span>
                <span>📅 ${new Date(o.scheduled_at).toLocaleDateString()} ${new Date(o.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            ` : ''}
            ${(o.published_by || o.published_at) ? `
              <div class="publish-info-box p-2 mb-1" style="background:#e0f2fe; border:1px solid #0284c7; border-radius:6px; font-size:0.7rem; color:#0369a1; display:flex; justify-content:space-between; align-items:center; font-weight:600;">
                <span>📢 Published by ${o.published_by}</span>
                <span>📅 ${new Date(o.published_at).toLocaleDateString()} ${new Date(o.published_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            ` : ''}

            <div style="font-size:0.65rem; color:#b45309; font-weight:600; margin-top:0.4rem; display:flex; align-items:center; gap:0.2rem;">
              ⚠️ Strictly evidence-based. No facts, numbers, dates or campaign results were invented by AI.
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:0.75rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-xs btn-outline edit-output-btn" data-out-id="${o.id}">✏️ Edit</button>
              <button class="btn btn-xs btn-outline save-output-btn" data-out-id="${o.id}" style="display:none; background:var(--success-color); color:white; border-color:var(--success-color);">💾 Save</button>
              <button class="btn btn-xs btn-outline regen-output-btn" data-out-id="${o.id}">🔄 Regenerate</button>
            </div>
            <div style="display:flex; gap:0.4rem; justify-content:flex-end;">
              ${o.approvalStatus === 'Draft' ? `
                <button class="btn btn-xs btn-primary approve-stage-btn" data-out-id="${o.id}" data-target-status="Internal Review">Approve Internal</button>
              ` : ''}
              ${o.approvalStatus === 'Internal Review' ? `
                <button class="btn btn-xs btn-primary approve-stage-btn" data-out-id="${o.id}" data-target-status="Sent to Client">Send to Client</button>
              ` : ''}
              ${o.approvalStatus === 'Sent to Client' ? `
                <button class="btn btn-xs btn-primary approve-stage-btn" data-out-id="${o.id}" data-target-status="Client Approved">Client Approved</button>
              ` : ''}
              ${o.approvalStatus === 'Client Approved' ? `
                <button class="btn btn-xs btn-primary approve-stage-btn" data-out-id="${o.id}" data-target-status="Scheduled">Schedule Post</button>
              ` : ''}
              ${o.approvalStatus === 'Scheduled' ? `
                <button class="btn btn-xs btn-primary approve-stage-btn" data-out-id="${o.id}" data-target-status="Published">Publish Now</button>
              ` : ''}
              <button class="btn btn-xs btn-outline export-output-btn" data-out-id="${o.id}">📤 Export Text</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
      <div>
        <h3 style="margin:0; font-weight:600;">⏳ Content Approvals & Editorial Pipeline</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0.25rem 0 0 0;">Move generated drafts from creation to internal review, client portals, and social queues.</p>
      </div>
    </div>
    <div class="approvals-container">
      ${itemsHtml}
    </div>
  `;
}

function renderReportsTabContent(client) {
  const reports = state.reports.filter(r => r.client === client.id);
  const reportsHtml = reports.length === 0
    ? `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No reports created for this client yet.</td></tr>`
    : reports.map(r => `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.donor}</td>
          <td><span style="color:var(--danger-color); font-weight:600;">${r.dueDate}</span></td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <div style="background:#cbd5e1; height:6px; width:80px; border-radius:3px; overflow:hidden;">
                <div style="background:var(--success-color); height:100%; width:${r.completion}%;"></div>
              </div>
              <span>${r.completion}%</span>
            </div>
          </td>
          <td>${r.agent}</td>
          <td>
            <div style="display:flex; gap:0.25rem;">
              <button class="btn btn-xs btn-outline export-report-word" data-rep-id="${r.id}">Word</button>
              <button class="btn btn-xs btn-outline export-report-ppt" data-rep-id="${r.id}">PPT</button>
            </div>
          </td>
        </tr>
      `).join('');

  return `
    <div class="card p-4" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <h3 style="margin:0; font-weight:600;">📋 Donor & Funder Reporting Center</h3>
          <p style="font-size:0.8rem; color:var(--text-muted); margin:0.25rem 0 0 0;">Generate, track, and export formal reports compile-ready for grant compliance audits.</p>
        </div>
      </div>

      <div class="clean-table-container">
        <table class="clean-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Funder / Donor</th>
              <th>Due Date</th>
              <th>Completion Progress</th>
              <th>Generating Agent</th>
              <th>Export Layouts</th>
            </tr>
          </thead>
          <tbody>
            ${reportsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSettingsTabContent() {
  const selectedAgent = state.agents.find(a => a.id === crSelectedSettingAgentId) || state.agents[0];
  
  const instructions = selectedAgent.instructions || `You are the ${selectedAgent.name}. Your primary task is to align and process data to fulfill: ${selectedAgent.purpose}`;
  const brandVoice = selectedAgent.brandVoice || `Authentic, fact-driven, accessible, and community-centric.`;
  const guidelines = selectedAgent.guidelines || `1. Only present verified facts.\n2. Ensure grammar is clear and concise.\n3. Format headings with bold markers.`;
  const approvalRules = selectedAgent.approvalRules || `Requires internal review validation by IK Communications manager before publication.`;

  const sidebarHtml = state.agents.map(a => `
    <button class="settings-nav-btn ${a.id === crSelectedSettingAgentId ? 'active' : ''}" data-agent-id="${a.id}" style="width:100%; border:none; text-align:left; padding:0.6rem 0.8rem; border-radius:6px; font-size:0.8rem; font-weight:600; cursor:pointer; margin-bottom:0.25rem; display:block;">
      🤖 ${a.name}
    </button>
  `).join('');

  return `
    <div class="settings-layout" style="display:grid; grid-template-columns: 240px 1fr; gap:1.5rem;">
      <!-- Left Sidebar Selector -->
      <div class="settings-sidebar card p-3" style="align-self:start; background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
        <h4 style="margin:0 0 0.75rem 0; font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">AI Co-workers</h4>
        <div style="display:flex; flex-direction:column;">
          ${sidebarHtml}
        </div>
      </div>

      <!-- Right Editor Pane -->
      <div class="settings-editor card p-4" style="background:white; border:1px solid var(--border-color); border-radius:12px; box-shadow:var(--shadow-sm);">
        <h3 style="margin-top:0; font-weight:600;">⚙️ Agent Persona & Guidelines Configuration</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1.5rem;">Decouple and customize the core prompting instructions, rules and voice guidelines for <strong>${selectedAgent.name}</strong>.</p>
        
        <form id="agentSettingsForm" style="display:flex; flex-direction:column; gap:1rem;">
          <div class="form-group">
            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.25rem;">System Prompts / Directives</label>
            <textarea id="setInstructions" class="form-control" style="height:100px; font-size:0.8rem; font-family:inherit; line-height:1.4; width:100%; padding:0.5rem;">${instructions}</textarea>
          </div>
          <div class="form-group">
            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.25rem;">Tone & Brand Voice Parameters</label>
            <textarea id="setBrandVoice" class="form-control" style="height:80px; font-size:0.8rem; font-family:inherit; line-height:1.4; width:100%; padding:0.5rem;">${brandVoice}</textarea>
          </div>
          <div class="form-group">
            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.25rem;">Required Formatting Guidelines & Templates</label>
            <textarea id="setGuidelines" class="form-control" style="height:80px; font-size:0.8rem; font-family:inherit; line-height:1.4; width:100%; padding:0.5rem;">${guidelines}</textarea>
          </div>
          <div class="form-group">
            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.25rem;">Human-in-the-loop Approval Rules</label>
            <textarea id="setApprovalRules" class="form-control" style="height:80px; font-size:0.8rem; font-family:inherit; line-height:1.4; width:100%; padding:0.5rem;">${approvalRules}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:1rem; border-top:1px solid var(--border-color); padding-top:1rem;">
            <button type="submit" class="btn btn-primary">💾 Save Agent Persona Configuration</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function bindActiveTabEvents(container, client, briefStatus, clientEvidence, clientOutputs) {
  // Overview Tab events
  if (crActiveTab === 'overview') {
    container.querySelectorAll('.task-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const tid = chk.getAttribute('data-task-id');
        const task = state.tasks.find(t => t.id === tid);
        if (task) {
          task.status = chk.checked ? 'Completed' : 'Pending';
          notify();
        }
      });
    });

    container.querySelectorAll('.overview-go-approvals').forEach(btn => {
      btn.addEventListener('click', () => {
        crActiveTab = 'approvals';
        notify();
      });
    });

    const overviewEditBrief = document.getElementById('overviewEditBrief');
    if (overviewEditBrief) {
      overviewEditBrief.addEventListener('click', () => {
        openEditBriefModal(client.id);
      });
    }
  }

  // Create Work Tab events
  if (crActiveTab === 'create-work') {
    const wzOnboardUnlockBtn = document.getElementById('wzOnboardUnlockBtn');
    if (wzOnboardUnlockBtn) {
      wzOnboardUnlockBtn.addEventListener('click', () => {
        openNewClientModal();
      });
    }

    const wzClientSelect = document.getElementById('wzClientSelect');
    if (wzClientSelect) {
      wzClientSelect.addEventListener('change', (e) => {
        crWizardInputs.clientId = e.target.value;
        const matched = state.clients.find(c => c.id === e.target.value);
        if (matched) {
          const activeCampaigns = state.campaigns.filter(c => c.client === matched.id);
          crWizardInputs.campaignName = activeCampaigns.length > 0 ? activeCampaigns[0].name : (matched.campaignName || 'General');
          crWizardInputs.approvalPerson = matched.primaryContact || 'Irene K.';
          crWizardInputs.agentId = '';
          crWizardInputs.outputType = '';
          crWizardInputs.evidenceId = '';
        }
        notify();
      });
    }

    const wzCampaignSelect = document.getElementById('wzCampaignSelect');
    if (wzCampaignSelect) {
      wzCampaignSelect.addEventListener('change', (e) => {
        crWizardInputs.campaignName = e.target.value;
      });
    }

    container.querySelectorAll('.agent-tile-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        crWizardInputs.agentId = btn.getAttribute('data-agent-id');
        crWizardInputs.outputType = ''; // reset output type
        notify();
      });
    });

    const wzCompleteBriefBtn = document.getElementById('wzCompleteBriefBtn');
    if (wzCompleteBriefBtn) {
      wzCompleteBriefBtn.addEventListener('click', () => {
        openEditBriefModal(client.id);
      });
    }

    const wzOutputTypeSelect = document.getElementById('wzOutputTypeSelect');
    if (wzOutputTypeSelect) {
      wzOutputTypeSelect.addEventListener('change', (e) => {
        crWizardInputs.outputType = e.target.value;
        notify(); // redraw button state
      });
    }

    const wzEvidenceSelect = document.getElementById('wzEvidenceSelect');
    if (wzEvidenceSelect) {
      wzEvidenceSelect.addEventListener('change', (e) => {
        crWizardInputs.evidenceId = e.target.value;
        notify(); // redraw button state
      });
    }

    const wzQuickUploadBtn = document.getElementById('wzQuickUploadBtn');
    if (wzQuickUploadBtn) {
      wzQuickUploadBtn.addEventListener('click', () => {
        openSimulateUploadModal(client.id);
      });
    }

    const wzPrevBtn = document.getElementById('wzPrevBtn');
    if (wzPrevBtn) {
      wzPrevBtn.addEventListener('click', () => {
        crWizardStep = crWizardStep - 1;
        notify();
      });
    }

    const wzNextBtn = document.getElementById('wzNextBtn');
    if (wzNextBtn) {
      wzNextBtn.addEventListener('click', () => {
        crWizardStep = crWizardStep + 1;
        notify();
      });
    }

    const wzGenerateBtn = document.getElementById('wzGenerateBtn');
    if (wzGenerateBtn) {
      wzGenerateBtn.addEventListener('click', () => {
        // Read final inputs from review screen
        const platform = document.getElementById('wzPlatform').value;
        const tone = document.getElementById('wzTone').value;
        const dueDate = document.getElementById('wzDueDate').value;
        const approvalPerson = document.getElementById('wzApprovalPerson').value;

        crWizardInputs.platform = platform;
        crWizardInputs.tone = tone;
        crWizardInputs.dueDate = dueDate;
        crWizardInputs.approvalPerson = approvalPerson;

        const ev = clientEvidence.find(e => e.id === crWizardInputs.evidenceId);
        if (!ev) {
          alert('Please select a source evidence document.');
          return;
        }

        if (ev.verificationStatus === 'Unverified') {
          const proceed = confirm(`⚠️ Warning: Selected source evidence is currently Unverified. Generating content using unverified statistics or facts is against accuracy rules.\n\nDo you want to proceed anyway?`);
          if (!proceed) return;
        }

        // Show loading progress
        const progressBox = document.getElementById('wzGenProgress');
        const progressBar = document.getElementById('wzGenProgressBar');
        const progressText = document.getElementById('wzGenStatusText');
        const progressPercent = document.getElementById('wzGenPercent');
        
        progressBox.style.display = 'block';
        wzPrevBtn.disabled = true;
        wzGenerateBtn.disabled = true;

        let progressPct = 0;
        const interval = setInterval(() => {
          progressPct += 10;
          progressBar.style.width = `${progressPct}%`;
          progressPercent.textContent = `${progressPct}%`;
          
          if (progressPct === 20) progressText.textContent = `Feeding source document "${ev.name}" context...`;
          else if (progressPct === 50) progressText.textContent = `Applying target brand voice "${client.toneOfVoice}"...`;
          else if (progressPct === 80) progressText.textContent = `Verifying factual alignment against source excerpt...`;
          
          if (progressPct >= 100) {
            clearInterval(interval);
            
            const generatedContent = generateSimulatedAiOutputContent(crWizardInputs.agentId, client, crWizardInputs.campaignName, ev.textExcerpt, tone, crWizardInputs.outputType, platform);
            
            const matchedCampaign = state.campaigns.find(c => c.name === crWizardInputs.campaignName && c.client === client.id);
            addAiOutput({
              clientId: client.id,
              client_id: client.id,
              campaignName: crWizardInputs.campaignName,
              campaignId: matchedCampaign ? matchedCampaign.id : 'cmp_gen',
              campaign_id: matchedCampaign ? matchedCampaign.id : 'cmp_gen',
              projectId: ev.project || 'General',
              project_id: ev.project || 'General',
              evidenceId: ev.id,
              evidence_id: ev.id,
              agentId: crWizardInputs.agentId,
              agent_id: crWizardInputs.agentId,
              approvalStatus: 'Draft',
              approval_status: 'Draft',
              createdAt: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              outputType: crWizardInputs.outputType,
              platform: platform,
              tone: tone,
              dueDate: dueDate,
              sourceEvidence: ev.textExcerpt,
              sourceDocName: ev.name,
              sourceDocType: ev.sourceType,
              sourceDocUploadDate: ev.dateUploaded,
              confidenceScore: Math.floor(Math.random() * 8) + 92, // 92-99%
              verificationStatus: ev.verificationStatus,
              content: generatedContent,
              approvalPerson: approvalPerson
            });

            // Log activity in state
            const agentObj = state.agents.find(a => a.id === crWizardInputs.agentId);
            state.agentActivityLogs.unshift({
              timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              agent: agentObj ? agentObj.name : 'AI Agent',
              client: client.name,
              message: `Generated draft for "${crWizardInputs.campaignName}" successfully.`,
              status: 'success'
            });

            if (agentObj) {
              agentObj.tasksCompleted += 1;
              agentObj.lastRun = 'Just now';
            }

            alert(`🎉 Success! Content has been generated and pushed to the Approvals tab.`);
            crActiveTab = 'approvals';
            crWizardStep = 1;
            notify();
          }
        }, 150);
      });
    }
  }

  // Evidence Tab events
  if (crActiveTab === 'evidence') {
    container.querySelectorAll('.evidence-filters button').forEach(btn => {
      btn.addEventListener('click', () => {
        crEvidenceFilter = btn.getAttribute('data-filter');
        notify();
      });
    });

    const ingestEvidenceBtn = document.getElementById('ingestEvidenceBtn');
    if (ingestEvidenceBtn) {
      ingestEvidenceBtn.addEventListener('click', () => {
        openSimulateUploadModal(client.id);
      });
    }

    container.querySelectorAll('.verify-evidence-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const evId = btn.getAttribute('data-ev-id');
        const ev = state.evidence.find(e => e.id === evId);
        if (ev) {
          ev.verificationStatus = 'Verified';
          alert(`Source evidence "${ev.name}" is now Verified and ready for generation!`);
          notify();
        }
      });
    });
  }

  // Approvals Tab events
  if (crActiveTab === 'approvals') {
    const approvalsGoCreateBtn = document.getElementById('approvalsGoCreateBtn');
    if (approvalsGoCreateBtn) {
      approvalsGoCreateBtn.addEventListener('click', () => {
        crActiveTab = 'create-work';
        crWizardStep = 1;
        notify();
      });
    }

    container.querySelectorAll('.approval-accordion-header').forEach(hdr => {
      hdr.addEventListener('click', (e) => {
        // Prevent click if clicking inside buttons
        if (e.target.closest('button') || e.target.closest('a')) return;
        const outId = hdr.getAttribute('data-out-id');
        crExpandedOutputs[outId] = crExpandedOutputs[outId] === false ? true : false;
        notify();
      });
    });

    // Inline Editing
    container.querySelectorAll('.edit-output-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-out-id');
        document.getElementById(`contentBox-${id}`).style.display = 'none';
        const txt = document.getElementById(`contentEdit-${id}`);
        txt.style.display = 'block';
        txt.focus();
        btn.style.display = 'none';
        btn.parentElement.querySelector('.save-output-btn').style.display = 'inline-block';
      });
    });

    container.querySelectorAll('.save-output-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-out-id');
        const txtVal = document.getElementById(`contentEdit-${id}`).value;
        const out = state.aiOutputs.find(o => o.id === id);
        if (out) {
          out.content = txtVal;
          notify();
          alert('Changes saved successfully!');
        }
      });
    });

    // Regeneration
    container.querySelectorAll('.regen-output-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-out-id');
        const out = state.aiOutputs.find(o => o.id === id);
        if (out) {
          btn.disabled = true;
          btn.textContent = '🔄 Regening...';
          setTimeout(() => {
            const freshContent = generateSimulatedAiOutputContent(
              out.agentId,
              client,
              out.campaignName,
              out.sourceEvidence,
              out.tone || 'Empowering, Urgent',
              out.outputType,
              out.platform || 'Facebook'
            );
            out.content = freshContent;
            out.confidenceScore = Math.floor(Math.random() * 8) + 92;
            alert('Draft regenerated successfully with fresh configuration parameters!');
            notify();
          }, 600);
        }
      });
    });

    // Progression stage
    container.querySelectorAll('.approve-stage-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-out-id');
        const targetStatus = btn.getAttribute('data-target-status');
        updateAiOutputStatus(id, targetStatus);
        alert(`Output successfully transitioned to stage: "${targetStatus}"!`);
        notify();
      });
    });

    // Plain text export
    container.querySelectorAll('.export-output-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-out-id');
        const out = state.aiOutputs.find(o => o.id === id);
        if (out) {
          const filename = `${out.outputType.replace(/ /g, '_')}_draft.txt`;
          triggerDownload(out.content, filename, 'text/plain');
          alert('Plain text exported successfully!');
        }
      });
    });
  }

  // Reports Tab events
  if (crActiveTab === 'reports') {
    container.querySelectorAll('.export-report-word').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid = btn.getAttribute('data-rep-id');
        const report = state.reports.find(r => r.id === rid);
        if (report) {
          const filename = `${report.name.replace(/ /g, '_')}.doc`;
          const content = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head><title>${report.name}</title></head>
            <body style="font-family: Arial; padding: 20px;">
              <h2>DONOR UPDATE SUMMARY</h2>
              <p><strong>Report:</strong> ${report.name}</p>
              <p><strong>Funder / Grantor:</strong> ${report.donor}</p>
              <p><strong>Prepared for:</strong> Project Assessment Review</p>
              <p><strong>Compiled by:</strong> IK Communications AI Donor Agent</p>
              <h3>1. Executive Summary & Impact Analysis</h3>
              <p>During this operational milestone, community outreach efforts were heavily accelerated. Grassroots indicators verify consistent engagement with learners, local schools, and volunteers in support of core deliverables.</p>
              <h3>2. Visual Data Milestones</h3>
              <p>[Visual Performance Index Chart Embedded - Verification Compliance: OK]</p>
              <h3>3. Recommended Funder Actions</h3>
              <p>We recommend releasing the subsequent funding tranche in support of localized monitoring devices and educational curriculum deployment schedules.</p>
            </body>
            </html>
          `;
          triggerDownload(content, filename, 'application/msword');
          alert('Word document downloaded successfully!');
        }
      });
    });

    container.querySelectorAll('.export-report-ppt').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid = btn.getAttribute('data-rep-id');
        const report = state.reports.find(r => r.id === rid);
        if (report) {
          const filename = `${report.name.replace(/ /g, '_')}.txt`;
          const content = `IK COMMUNICATIONS AI AGENT PRESENTATION BRIEF
=============================================
Report Title: ${report.name}
Funder Target: ${report.donor}

[SLIDE 1: TITLE SLIDE]
- Header: Donor Update Summary
- Subtitle: Prepared for ${report.donor}
- Compiled by: IK Communications AI Donor Agent

[SLIDE 2: EXECUTIVE SUMMARY]
- Header: 1. Executive Summary & Impact Analysis
- Key Fact: Community outreach efforts heavily accelerated.
- Observation: Grassroots indicators verify consistent engagement.

[SLIDE 3: VISUAL METRICS]
- Header: 2. Visual Data Milestones
- Content: [Visual Performance Index Chart Embedded - Verification Compliance: OK]

[SLIDE 4: RECOMMENDATIONS]
- Header: 3. Recommended Funder Actions
- Action: Release subsequent funding tranche.
- Impact: localized monitoring devices and educational curriculum deployment.
`;
          triggerDownload(content, filename, 'text/plain');
          alert('PowerPoint text outline downloaded successfully!');
        }
      });
    });
  }

  // Settings Tab events
  if (crActiveTab === 'settings') {
    container.querySelectorAll('.settings-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        crSelectedSettingAgentId = btn.getAttribute('data-agent-id');
        notify();
      });
    });

    const agentSettingsForm = document.getElementById('agentSettingsForm');
    if (agentSettingsForm) {
      agentSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const instVal = document.getElementById('setInstructions').value;
        const voiceVal = document.getElementById('setBrandVoice').value;
        const guideVal = document.getElementById('setGuidelines').value;
        const ruleVal = document.getElementById('setApprovalRules').value;

        const agent = state.agents.find(a => a.id === crSelectedSettingAgentId);
        if (agent) {
          agent.instructions = instVal;
          agent.brandVoice = voiceVal;
          agent.guidelines = guideVal;
          agent.approvalRules = ruleVal;
          alert(`Configuration for ${agent.name} saved successfully!`);
          notify();
        }
      });
    }
  }
}

export function renderAgentsDashboard(container) {
  const selectedClientId = state.selectedClientId || 'groundwork-demo';
  const client = state.clients.find(c => c.id === selectedClientId) || state.clients[0];
  
  if (!client) {
    container.innerHTML = `<p>Error: No client profile found.</p>`;
    return;
  }

  // Calculate Brief Completion Score and missing info
  const briefStatus = calculateBriefCompletion(client);

  // Filter evidence and AI outputs for this client
  const clientEvidence = state.evidence.filter(e => e.client === client.id);
  const clientOutputs = state.aiOutputs.filter(o => o.clientId === client.id);

  // Persist / initialize wizard default client
  if (!crWizardInputs.clientId) crWizardInputs.clientId = client.id;
  if (!crWizardInputs.campaignName) {
    const activeCampaigns = state.campaigns.filter(c => c.client === client.id);
    crWizardInputs.campaignName = activeCampaigns.length > 0 ? activeCampaigns[0].name : (client.campaignName || 'General');
  }
  if (!crWizardInputs.dueDate) {
    crWizardInputs.dueDate = new Date(Date.now() + 604800000).toISOString().split('T')[0];
  }
  if (!crWizardInputs.approvalPerson) {
    crWizardInputs.approvalPerson = client.primaryContact || 'Irene K.';
  }

  // Render main container structure
  container.innerHTML = `
    <div class="control-room-layout">
      <!-- 1. Top Header -->
      <div class="cr-header-card mb-4" style="background:linear-gradient(135deg, #1e3a8a 0%, #15803d 100%); padding:1.25rem 1.5rem; border-radius:12px; box-shadow:var(--shadow-md); color:white; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.25rem;">
        <div class="cr-header-info" style="display:flex; gap:2rem; flex-wrap:wrap;">
          <div class="cr-header-meta-item" style="display:flex; flex-direction:column; gap:0.25rem;">
            <label style="font-size:0.7rem; text-transform:uppercase; opacity:0.85; font-weight:600; letter-spacing:0.5px; color:#cbd5e1;">Active Client</label>
            <select id="crClientSelect" class="cr-header-select" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.25); color:white; font-size:0.9rem; padding:0.25rem 0.5rem; border-radius:6px; font-weight:600; outline:none; cursor:pointer;">
              ${state.clients.map(c => `
                <option value="${c.id}" ${c.id === client.id ? 'selected' : ''} style="color:var(--text-color); font-weight:normal;">
                  ${c.logo} ${c.name}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="cr-header-meta-item" style="display:flex; flex-direction:column; gap:0.25rem;">
            <label style="font-size:0.7rem; text-transform:uppercase; opacity:0.85; font-weight:600; letter-spacing:0.5px; color:#cbd5e1;">Active Campaign</label>
            <span class="meta-value" style="font-size:0.95rem; font-weight:600;">${client.campaignName || 'General'}</span>
          </div>
          <div class="cr-header-meta-item" style="display:flex; flex-direction:column; gap:0.25rem;">
            <label style="font-size:0.7rem; text-transform:uppercase; opacity:0.85; font-weight:600; letter-spacing:0.5px; color:#cbd5e1;">Client Readiness Score</label>
            <span class="meta-value" style="display:flex; align-items:center; gap:0.4rem; font-size:0.95rem; font-weight:600;">
              <span>${briefStatus.score}%</span>
              <span class="badge-status ${briefStatus.status.toLowerCase()}" style="font-size:0.65rem; padding:0.15rem 0.35rem; font-weight:700;">${briefStatus.statusText}</span>
            </span>
          </div>
        </div>
        <button class="btn" id="crCreateWorkCta" style="background:white; color:#1e3a8a; font-weight:700; border:none; padding:0.5rem 1rem; border-radius:8px; cursor:pointer; box-shadow:var(--shadow-sm); transition:all 0.2s;">🚀 Create New Work</button>
      </div>

      <!-- 2. Main Navigation Tabs -->
      <div class="cr-tabs-nav mb-4" style="display:flex; border-bottom:1px solid var(--border-color); gap:1.5rem; margin-bottom:1.5rem;">
        <button class="cr-tab-btn ${crActiveTab === 'overview' ? 'active' : ''}" data-tab="overview" style="background:none; border:none; border-bottom:3px solid ${crActiveTab === 'overview' ? 'var(--primary-color)' : 'transparent'}; color:${crActiveTab === 'overview' ? 'var(--primary-color)' : 'var(--text-muted)'}; font-weight:700; padding:0.6rem 0.25rem; cursor:pointer; outline:none; font-size:0.85rem;">👁️ Overview</button>
        <button class="cr-tab-btn ${crActiveTab === 'create-work' ? 'active' : ''}" data-tab="create-work" style="background:none; border:none; border-bottom:3px solid ${crActiveTab === 'create-work' ? 'var(--primary-color)' : 'transparent'}; color:${crActiveTab === 'create-work' ? 'var(--primary-color)' : 'var(--text-muted)'}; font-weight:700; padding:0.6rem 0.25rem; cursor:pointer; outline:none; font-size:0.85rem;">🚀 Create Work</button>
        <button class="cr-tab-btn ${crActiveTab === 'evidence' ? 'active' : ''}" data-tab="evidence" style="background:none; border:none; border-bottom:3px solid ${crActiveTab === 'evidence' ? 'var(--primary-color)' : 'transparent'}; color:${crActiveTab === 'evidence' ? 'var(--primary-color)' : 'var(--text-muted)'}; font-weight:700; padding:0.6rem 0.25rem; cursor:pointer; outline:none; font-size:0.85rem;">📥 Evidence Inbox</button>
        <button class="cr-tab-btn ${crActiveTab === 'approvals' ? 'active' : ''}" data-tab="approvals" style="background:none; border:none; border-bottom:3px solid ${crActiveTab === 'approvals' ? 'var(--primary-color)' : 'transparent'}; color:${crActiveTab === 'approvals' ? 'var(--primary-color)' : 'var(--text-muted)'}; font-weight:700; padding:0.6rem 0.25rem; cursor:pointer; outline:none; font-size:0.85rem;">⏳ Approvals</button>
        <button class="cr-tab-btn ${crActiveTab === 'reports' ? 'active' : ''}" data-tab="reports" style="background:none; border:none; border-bottom:3px solid ${crActiveTab === 'reports' ? 'var(--primary-color)' : 'transparent'}; color:${crActiveTab === 'reports' ? 'var(--primary-color)' : 'var(--text-muted)'}; font-weight:700; padding:0.6rem 0.25rem; cursor:pointer; outline:none; font-size:0.85rem;">📋 Reports</button>
        <button class="cr-tab-btn ${crActiveTab === 'settings' ? 'active' : ''}" data-tab="settings" style="background:none; border:none; border-bottom:3px solid ${crActiveTab === 'settings' ? 'var(--primary-color)' : 'transparent'}; color:${crActiveTab === 'settings' ? 'var(--primary-color)' : 'var(--text-muted)'}; font-weight:700; padding:0.6rem 0.25rem; cursor:pointer; outline:none; font-size:0.85rem;">⚙️ Agent Settings</button>
      </div>

      <!-- Tab Panel Content -->
      <div class="cr-tab-panel active">
        ${renderActiveTabContent(client, briefStatus, clientEvidence, clientOutputs)}
      </div>
    </div>
  `;

  // Bind tab navigation click events
  container.querySelectorAll('.cr-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      crActiveTab = btn.getAttribute('data-tab');
      // If switching to create-work, reset wizard step to 1
      if (crActiveTab === 'create-work') {
        crWizardStep = 1;
      }
      notify();
    });
  });

  // Bind top header select change
  const crClientSelect = document.getElementById('crClientSelect');
  if (crClientSelect) {
    crClientSelect.addEventListener('change', (e) => {
      const cid = e.target.value;
      crWizardInputs.clientId = cid;
      const matchedClient = state.clients.find(c => c.id === cid);
      if (matchedClient) {
        const activeCampaigns = state.campaigns.filter(c => c.client === cid);
        crWizardInputs.campaignName = activeCampaigns.length > 0 ? activeCampaigns[0].name : (matchedClient.campaignName || 'General');
        crWizardInputs.approvalPerson = matchedClient.primaryContact || 'Irene K.';
        crWizardInputs.agentId = '';
        crWizardInputs.outputType = '';
        crWizardInputs.evidenceId = '';
      }
      selectClient(cid);
    });
  }

  // Bind main CTA button "Create New Work"
  const crCreateWorkCta = document.getElementById('crCreateWorkCta');
  if (crCreateWorkCta) {
    crCreateWorkCta.addEventListener('click', () => {
      crActiveTab = 'create-work';
      crWizardStep = 1;
      notify();
    });
  }

  // Bind dynamic actions for active tab
  bindActiveTabEvents(container, client, briefStatus, clientEvidence, clientOutputs);
}


// --- MODAL CONTROLLERS & MARKUP RENDERERS ---

// 1. AI Pipeline Modal
function openPipelineModal() {
  const modal = document.getElementById('globalModalContainer');
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2>🤖 AI Agent Collaborative Pipeline Running</h2>
          <button class="close-modal-btn" id="closeGlobalModal">×</button>
        </div>
        <div class="modal-body">
          <div class="pipeline-loader-box">
            <div class="pipeline-steps-vertical">
              <div class="step-indicator" id="step-storytelling-indicator">
                <span class="num">1</span>
                <div>
                  <strong>Storytelling Agent:</strong>
                  <span class="desc">Creating human narratives and impact stories...</span>
                </div>
              </div>
              <div class="step-indicator" id="step-socialmedia-indicator">
                <span class="num">2</span>
                <div>
                  <strong>Social Media Agent:</strong>
                  <span class="desc">Drafting and formatting captions (FB, LinkedIn, IG)...</span>
                </div>
              </div>
              <div class="step-indicator" id="step-reporting-indicator">
                <span class="num">3</span>
                <div>
                  <strong>Donor Reporting Agent:</strong>
                  <span class="desc">Generating formal report sections and PDF templates...</span>
                </div>
              </div>
              <div class="step-indicator" id="step-funding-indicator">
                <span class="num">4</span>
                <div>
                  <strong>Funding Agent:</strong>
                  <span class="desc">Cross-checking global grant alignments...</span>
                </div>
              </div>
            </div>

            <!-- Live Output Terminal -->
            <div class="live-pipeline-terminal mt-6">
              <h4>🔍 AI Workspace Output</h4>
              <div class="live-terminal-content" id="liveTerminalOutput">
                Preparing workspace folder templates...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  // Modal close bind
  document.getElementById('closeGlobalModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Track state to update modal steps
  const unsubscribe = subscribe(s => {
    const sim = s.simulation;
    
    // Storytelling
    const stStory = document.getElementById('step-storytelling-indicator');
    if (stStory) {
      if (sim.currentStep === 1) stStory.className = 'step-indicator running';
      if (sim.currentStep > 1) stStory.className = 'step-indicator done';
    }

    // Social Media
    const stSocial = document.getElementById('step-socialmedia-indicator');
    if (stSocial) {
      if (sim.currentStep === 2) stSocial.className = 'step-indicator running';
      if (sim.currentStep > 2) stSocial.className = 'step-indicator done';
    }

    // Reporting
    const stRep = document.getElementById('step-reporting-indicator');
    if (stRep) {
      if (sim.currentStep === 3) stRep.className = 'step-indicator running';
      if (sim.currentStep > 3) stRep.className = 'step-indicator done';
    }

    // Funding
    const stFund = document.getElementById('step-funding-indicator');
    if (stFund) {
      if (sim.currentStep === 4) stFund.className = 'step-indicator running';
      if (sim.currentStep > 4) stFund.className = 'step-indicator done';
    }

    // Output Logger text
    const term = document.getElementById('liveTerminalOutput');
    if (term) {
      let logHtml = '';
      if (sim.currentStep >= 1) {
        logHtml += `<p class="text-info">> Storytelling Agent parsed evidence: "${sim.evidenceText}"</p>`;
      }
      if (sim.currentStep >= 2 && sim.results.story) {
        logHtml += `<p class="text-success">> [Narrative Generated] "${sim.results.story.title}"</p>`;
        logHtml += `<p class="indent-log">${sim.results.story.narrative}</p>`;
      }
      if (sim.currentStep >= 3 && sim.results.posts.length > 0) {
        logHtml += `<p class="text-success">> [Social Media Drafts Ready]</p>`;
        sim.results.posts.forEach(p => {
          logHtml += `<p class="indent-log"><strong>${p.platform}:</strong> ${p.text}</p>`;
        });
      }
      if (sim.currentStep >= 4 && sim.results.report) {
        logHtml += `<p class="text-success">> [Donor Report Draft Compiled]</p>`;
        logHtml += `<p class="indent-log">Report Name: "${sim.results.report.name}" assigned to Donor: ${sim.results.report.donor}</p>`;
      }
      if (sim.currentStep === 5 && sim.results.funding) {
        logHtml += `<p class="text-success">> [Funding Matching Engine Success]</p>`;
        logHtml += `<p class="indent-log">Recommended: <strong>${sim.results.funding.grantName}</strong> by <strong>${sim.results.funding.funder}</strong> (${sim.results.funding.matchReason})</p>`;
        logHtml += `<div class="pipeline-completed-success mt-4">
          <span>✔️ Collaborative AI agent pipeline successfully committed results to state databases. Close modal to inspect updated dashboard elements.</span>
        </div>`;
      }
      term.innerHTML = logHtml;
      term.scrollTop = term.scrollHeight; // Auto scroll
    }

    // Unsubscribe when done
    if (sim.currentStep === 5) {
      unsubscribe();
    }
  });
}

// Source Evidence Modal
export function openSourceEvidenceModal(oppId, onConfirmGenerate = null) {
  const opp = state.fundingOpportunities.find(o => o.id === oppId);
  if (!opp) return;

  const modal = document.getElementById('globalModalContainer');
  
  // Badges styling
  let verificationClass = 'yellow';
  if (opp.verificationStatus === 'Verified') verificationClass = 'green';
  else if (opp.verificationStatus === 'Unverified') verificationClass = 'red';
  
  let confidenceClass = 'red';
  if (opp.confidenceScore >= 90) confidenceClass = 'green';
  else if (opp.confidenceScore >= 70) confidenceClass = 'yellow';

  let amountDisplay = opp.amount ? `${opp.currency === 'USD' ? '$' : '£'}${opp.amount.toLocaleString()} ${opp.currency}` : 'Amount not confirmed';
  let deadlineDisplay = opp.deadline ? opp.deadline : 'Deadline not confirmed';

  modal.innerHTML = `
    <div class="modal-dialog modal-md">
      <div class="modal-content" style="border-radius: 12px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); background: var(--card-bg, #ffffff);">
        <div class="modal-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; margin: 0;">
            <span>🔍</span> Source Evidence Audit
          </h2>
          <button class="close-modal-btn" id="closeGlobalModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem 0; overflow-y: auto; max-height: 70vh;">
          <div style="background: var(--bg-color-alt, #f8fafc); padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem; border: 1px solid var(--border-color);">
            <h3 style="font-size: 1.1rem; margin: 0 0 0.5rem 0; color: var(--primary-color);">${opp.funder}</h3>
            <p style="font-size: 0.9rem; font-weight: 600; margin: 0 0 0.5rem 0;">${opp.grantName}</p>
            <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
              <strong>Official Source URL:</strong> <a href="${opp.sourceUrl}" target="_blank" style="color: var(--primary-color); text-decoration: underline; word-break: break-all;">${opp.sourceUrl}</a>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.25rem;">
            <div style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 6px;">
              <span style="display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Source Type</span>
              <strong style="font-size: 0.85rem; text-transform: capitalize;">${opp.sourceType}</strong>
            </div>
            <div style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 6px;">
              <span style="display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Confidence Score</span>
              <span class="status-badge ${confidenceClass}" style="display: inline-block; margin-top: 0.15rem; font-size: 0.75rem; padding: 0.2rem 0.5rem;">
                ${opp.confidenceScore}% Reliable
              </span>
            </div>
            <div style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 6px;">
              <span style="display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Date Found</span>
              <strong style="font-size: 0.85rem;">${opp.dateFound}</strong>
            </div>
            <div style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 6px;">
              <span style="display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Last Verified</span>
              <strong style="font-size: 0.85rem;">${opp.dateLastVerified}</strong>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.25rem;">
            <div style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 6px; background-color: ${opp.amount ? 'transparent' : 'rgba(217, 119, 6, 0.05)'};">
              <span style="display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Confirmed Amount</span>
              <strong style="font-size: 0.85rem; color: ${opp.amount ? 'inherit' : 'var(--warning-color, #d97706)'};">${amountDisplay}</strong>
            </div>
            <div style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 6px; background-color: ${opp.deadline ? 'transparent' : 'rgba(217, 119, 6, 0.05)'};">
              <span style="display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Confirmed Deadline</span>
              <strong style="font-size: 0.85rem; color: ${opp.deadline ? 'inherit' : 'var(--warning-color, #d97706)'};">${deadlineDisplay}</strong>
            </div>
          </div>

          <div style="margin-bottom: 1.25rem;">
            <span style="display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem; font-weight: 600;">
              📄 Original Source Excerpt
            </span>
            <blockquote style="margin: 0; background: rgba(59, 130, 246, 0.05); border-left: 4px solid var(--primary-color); padding: 0.75rem 1rem; border-radius: 0 6px 6px 0; font-size: 0.85rem; font-style: italic; line-height: 1.4; color: var(--text-color);">
              "${opp.sourceExcerpt}"
            </blockquote>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;">
            <span style="display: flex; align-items: center; gap: 0.35rem;">
              <strong>Verification Status:</strong>
              <span class="status-badge ${verificationClass}" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">
                ${opp.verificationStatus}
              </span>
            </span>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <button class="btn btn-outline" id="closeSourceModalBtn" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;">Close</button>
          ${
            onConfirmGenerate 
              ? `<button class="btn btn-primary" id="confirmGenerateBtn" style="padding: 0.5rem 1.25rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;">
                   <span>📝</span> Generate Concept Note
                 </button>`
              : ''
          }
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';

  const closeModal = () => {
    modal.style.display = 'none';
  };

  document.getElementById('closeGlobalModal').addEventListener('click', closeModal);
  document.getElementById('closeSourceModalBtn').addEventListener('click', closeModal);

  if (onConfirmGenerate) {
    document.getElementById('confirmGenerateBtn').addEventListener('click', () => {
      closeModal();
      onConfirmGenerate();
    });
  }
}

// 2. Draft Proposal Modal
function openDraftModal(draftText, opportunityId) {
  const modal = document.getElementById('globalModalContainer');
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📝 AI Drafted Proposal Document</h2>
          <button class="close-modal-btn" id="closeGlobalModal">×</button>
        </div>
        <div class="modal-body">
          <p class="subtitle mb-4">Review and edit the concept note drafted by the **Funding Agent**.</p>
          <textarea id="proposalTextArea" class="proposal-editor-box">${draftText}</textarea>
          
          <div class="modal-footer mt-4">
            <button class="btn btn-outline" id="copyProposalBtn">Copy Text</button>
            <button class="btn btn-primary" id="saveProposalBtn">Approve & Save Concept</button>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  document.getElementById('closeGlobalModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('copyProposalBtn').addEventListener('click', () => {
    const area = document.getElementById('proposalTextArea');
    area.select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
  });

  document.getElementById('saveProposalBtn').addEventListener('click', () => {
    alert('Concept note saved. The Funding Agent has flagged this grant opportunity as "Applying".');
    const opp = state.fundingOpportunities.find(o => o.id === opportunityId);
    if (opp) {
      opp.status = 'Applying';
      notify();
    }
    modal.style.display = 'none';
  });
}

// 3. Exporter preview modal (Reports Center)
function openReportExportModal(report) {
  const clientName = state.clients.find(c => c.id === report.client)?.name || 'Client NGO';
  const modal = document.getElementById('globalModalContainer');
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📄 Report Export Center: ${report.name}</h2>
          <button class="close-modal-btn" id="closeGlobalModal">×</button>
        </div>
        <div class="modal-body">
          <div class="export-preview-header-row mb-4">
            <span>Client: <strong>${clientName}</strong></span>
            <span>Completion: <strong>${report.completion}%</strong></span>
            <span>Funder Status: <strong>${report.status}</strong></span>
          </div>

          <!-- Document mock display -->
          <div class="document-printable-sheet">
            <h3>DONOR UPDATE SUMMARY</h3>
            <hr />
            <p><strong>Funder / Grantor:</strong> ${report.donor}</p>
            <p><strong>Prepared for:</strong> Project Assessment Review</p>
            <p><strong>Compiled by:</strong> IK Communications AI Donor Agent</p>
            
            <h4 class="mt-6">1. Executive Summary & Impact Analysis</h4>
            <p>During this operational milestone, community outreach efforts were heavily accelerated. Grassroots indicators verify consistent engagement with learners, local schools, and volunteers in support of core deliverables.</p>
            
            <h4 class="mt-4">2. Visual Data Milestones</h4>
            <div class="mock-doc-visual-box">
              [Visual Performance Index Chart Embedded - Verification Compliance: OK]
            </div>

            <h4 class="mt-4">3. Recommended Funder Actions</h4>
            <p>We recommend releasing the subsequent funding tranche in support of localized monitoring devices and educational curriculum deployment schedules.</p>
          </div>

          <div class="export-buttons-group mt-6">
            <span>Export to standard document formats:</span>
            <div class="buttons-row">
              <button class="btn btn-outline pdf-export-trigger">⬇ Download PDF</button>
              <button class="btn btn-outline word-export-trigger">⬇ Download MS Word</button>
              <button class="btn btn-outline ppt-export-trigger">⬇ Download PowerPoint</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  document.getElementById('closeGlobalModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  const triggerDownload = (content, filename, type) => {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  modal.querySelector('.pdf-export-trigger').addEventListener('click', () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${report.name}</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; color: #111827; }
            h3 { font-size: 1.5rem; text-align: center; color: #1D4ED8; }
            hr { border: 0; border-top: 1px solid #E2E8F0; margin: 1.5rem 0; }
            h4 { color: #1E293B; margin-top: 2rem; }
            p { line-height: 1.6; color: #475569; }
          </style>
        </head>
        <body>
          <h3>DONOR UPDATE SUMMARY</h3>
          <hr />
          <p><strong>Report Name:</strong> ${report.name}</p>
          <p><strong>Funder / Grantor:</strong> ${report.donor}</p>
          <p><strong>Prepared for:</strong> Project Assessment Review</p>
          <p><strong>Compiled by:</strong> IK Communications AI Donor Agent</p>
          
          <h4>1. Executive Summary & Impact Analysis</h4>
          <p>During this operational milestone, community outreach efforts were heavily accelerated. Grassroots indicators verify consistent engagement with learners, local schools, and volunteers in support of core deliverables.</p>
          
          <h4>2. Visual Data Milestones</h4>
          <p>[Visual Performance Index Chart Embedded - Verification Compliance: OK]</p>

          <h4>3. Recommended Funder Actions</h4>
          <p>We recommend releasing the subsequent funding tranche in support of localized monitoring devices and educational curriculum deployment schedules.</p>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    modal.style.display = 'none';
  });

  modal.querySelector('.word-export-trigger').addEventListener('click', () => {
    const filename = `${report.name.replace(/ /g, '_')}.doc`;
    const content = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><title>${report.name}</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h2>DONOR UPDATE SUMMARY</h2>
        <p><strong>Report:</strong> ${report.name}</p>
        <p><strong>Funder / Grantor:</strong> ${report.donor}</p>
        <p><strong>Prepared for:</strong> Project Assessment Review</p>
        <p><strong>Compiled by:</strong> IK Communications AI Donor Agent</p>
        <h3>1. Executive Summary & Impact Analysis</h3>
        <p>During this operational milestone, community outreach efforts were heavily accelerated. Grassroots indicators verify consistent engagement with learners, local schools, and volunteers in support of core deliverables.</p>
        <h3>2. Visual Data Milestones</h3>
        <p>[Visual Performance Index Chart Embedded - Verification Compliance: OK]</p>
        <h3>3. Recommended Funder Actions</h3>
        <p>We recommend releasing the subsequent funding tranche in support of localized monitoring devices and educational curriculum deployment schedules.</p>
      </body>
      </html>
    `;
    triggerDownload(content, filename, 'application/msword');
    modal.style.display = 'none';
    alert('Word document (.doc) downloaded successfully!');
  });

  modal.querySelector('.ppt-export-trigger').addEventListener('click', () => {
    const filename = `${report.name.replace(/ /g, '_')}.txt`;
    const content = `IK COMMUNICATIONS AI AGENT PRESENTATION BRIEF
=============================================
Report Title: ${report.name}
Funder Target: ${report.donor}

[SLIDE 1: TITLE SLIDE]
- Header: Donor Update Summary
- Subtitle: Prepared for ${report.donor}
- Compiled by: IK Communications AI Donor Agent

[SLIDE 2: EXECUTIVE SUMMARY]
- Header: 1. Executive Summary & Impact Analysis
- Key Fact: Community outreach efforts heavily accelerated.
- Observation: Grassroots indicators verify consistent engagement.

[SLIDE 3: VISUAL METRICS]
- Header: 2. Visual Data Milestones
- Content: [Visual Performance Index Chart Embedded - Verification Compliance: OK]

[SLIDE 4: RECOMMENDATIONS]
- Header: 3. Recommended Funder Actions
- Action: Release subsequent funding tranche.
- Impact: localized monitoring devices and educational curriculum deployment.
`;
    triggerDownload(content, filename, 'text/plain');
    modal.style.display = 'none';
    alert('PowerPoint presentation outline slide brief downloaded as a text outline file!');
  });
}

// 4. Create Content Idea Modal
function openNewIdeaModal(clientsList, prefill = null) {
  const modal = document.getElementById('globalModalContainer');
  const campaignsList = state.campaigns || [];
  
  // Calculate prefilled values if any
  const prefillTitle = prefill ? (prefill.title || '') : '';
  const prefillClient = prefill ? (prefill.client || state.selectedClientId || '') : (state.selectedClientId || '');
  const prefillCampaignId = prefill ? (prefill.campaignId || '') : '';
  const prefillDescription = prefill ? (prefill.description || '') : '';
  const prefillSourceRequestId = prefill ? (prefill.sourceRequestId || '') : '';

  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2>💡 Create New Content Idea</h2>
          <button class="close-modal-btn" id="closeGlobalModal">×</button>
        </div>
        <div class="modal-body">
          <form id="newIdeaForm" class="modal-form-fields">
            <div class="form-group">
              <label for="ideaTitle">Title</label>
              <input type="text" id="ideaTitle" placeholder="e.g. World Environment Day Outreach" value="${prefillTitle}" required />
            </div>
            <div class="form-group">
              <label for="ideaClient">NGO Client</label>
              <select id="ideaClient">
                ${clientsList.map(c => `<option value="${c.id}" ${c.id === prefillClient ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="ideaCampaign">Campaign</label>
              <select id="ideaCampaign">
                <option value="">None / General</option>
                ${campaignsList.map(c => `<option value="${c.id}" ${c.id === prefillCampaignId ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="ideaPlatform">Platform</label>
              <select id="ideaPlatform">
                <option value="LinkedIn">LinkedIn</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email Newsletter">Email Newsletter</option>
                <option value="Website">Website</option>
              </select>
            </div>
            <div class="form-group">
              <label for="ideaPillar">Content Pillar</label>
              <select id="ideaPillar">
                <option value="Phase 1: Awareness">Phase 1: Awareness</option>
                <option value="Phase 2: Education">Phase 2: Education</option>
                <option value="Phase 3: Action">Phase 3: Action</option>
              </select>
            </div>
            <div class="form-group">
              <label for="ideaContent">Content Caption / Prompt Guideline</label>
              <textarea id="ideaContent" rows="4" style="width:100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; font-family: inherit;" placeholder="Enter post caption or guideline draft...">${prefillDescription}</textarea>
            </div>
            
            <input type="hidden" id="ideaSourceRequestId" value="${prefillSourceRequestId}" />
            <button type="submit" class="btn btn-primary mt-4 w-full">Create Card</button>
          </form>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  document.getElementById('closeGlobalModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('newIdeaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('ideaTitle').value;
    const client = document.getElementById('ideaClient').value;
    const campaignId = document.getElementById('ideaCampaign').value;
    const platform = document.getElementById('ideaPlatform').value;
    const contentPillar = document.getElementById('ideaPillar').value;
    const content = document.getElementById('ideaContent').value;
    const sourceRequestId = document.getElementById('ideaSourceRequestId').value || null;

    addContentCard({
      title,
      client,
      campaignId: campaignId || null,
      platform,
      contentPillar,
      content,
      status: 'Ideas',
      agentId: 'manual',
      sourceRequestId: sourceRequestId || null
    });

    modal.style.display = 'none';
  });
}

function openNewRequestModal() {
  const modal = document.getElementById('globalModalContainer');
  const campaignsList = state.campaigns || [];
  const evidenceList = state.evidence || [];
  
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📥 Request Content</h2>
          <button class="close-modal-btn" id="closeGlobalModal">×</button>
        </div>
        <div class="modal-body">
          <form id="newRequestForm" class="modal-form-fields" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="form-group">
              <label for="reqTitle" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Title / Topic</label>
              <input type="text" id="reqTitle" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;" placeholder="e.g. World Water Day graphic request" required />
            </div>
            <div class="form-group">
              <label for="reqCampaign" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Linked Campaign</label>
              <select id="reqCampaign" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;">
                <option value="">None / General</option>
                ${campaignsList.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="reqEvidence" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Source Evidence Document</label>
              <select id="reqEvidence" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;">
                <option value="">No document attached</option>
                ${evidenceList.map(e => `<option value="${e.id}">${e.originalName || e.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="reqDescription" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Description / Brief Details</label>
              <textarea id="reqDescription" rows="3" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; font-family: inherit;" placeholder="Describe the post requirements..."></textarea>
            </div>
            <div class="form-group">
              <label for="reqAssignee" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Assignee</label>
              <input type="text" id="reqAssignee" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;" placeholder="e.g. Kim or Ivana" />
            </div>
            <div class="form-group">
              <label for="reqDueDate" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Due Date</label>
              <input type="text" id="reqDueDate" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;" placeholder="e.g. Week of 9/02/2026 or 2026-03-20" />
            </div>
            <div class="form-group">
              <label for="reqRequestedBy" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Requested By</label>
              <input type="text" id="reqRequestedBy" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;" placeholder="e.g. Bobby Peek" value="${state.currentUserRole === 'admin' ? 'Irene K.' : 'Bobby Peek'}" />
            </div>
            <div class="form-group">
              <label for="reqSourceMaterial" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Source Material Notes</label>
              <input type="text" id="reqSourceMaterial" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;" placeholder="e.g. Google Docs links or handbook reference" />
            </div>
            
            <button type="submit" class="btn btn-primary mt-4 w-full">Submit Content Request</button>
          </form>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  document.getElementById('closeGlobalModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('newRequestForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('reqTitle').value;
    const campaignId = document.getElementById('reqCampaign').value;
    const sourceEvidenceId = document.getElementById('reqEvidence').value;
    const description = document.getElementById('reqDescription').value;
    const assignee = document.getElementById('reqAssignee').value;
    const dueDate = document.getElementById('reqDueDate').value;
    const requestedBy = document.getElementById('reqRequestedBy').value;
    const sourceMaterial = document.getElementById('reqSourceMaterial').value;

    addContentRequest({
      title,
      campaignId: campaignId || null,
      sourceEvidenceId: sourceEvidenceId || null,
      description,
      assignee,
      dueDate,
      requestedBy,
      sourceMaterial,
      status: 'Awaiting Instruction'
    });

    modal.style.display = 'none';
  });
}

function openNewMediaModal() {
  const modal = document.getElementById('globalModalContainer');
  const campaignsList = state.campaigns || [];
  const evidenceList = state.evidence || [];

  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2>🖼️ Add Media Archive Link</h2>
          <button class="close-modal-btn" id="closeGlobalModal">×</button>
        </div>
        <div class="modal-body">
          <form id="newMediaForm" class="modal-form-fields" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="form-group">
              <label for="medSubject" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Subject / Event Name</label>
              <input type="text" id="medSubject" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;" placeholder="e.g. Vaal Air Quality Workshop Photos" required />
            </div>
            <div class="form-group">
              <label for="medCampaign" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Linked Campaign</label>
              <select id="medCampaign" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;">
                <option value="">None / General</option>
                ${campaignsList.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="medEvidence" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Linked Evidence File</label>
              <select id="medEvidence" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;">
                <option value="">No file linked</option>
                ${evidenceList.map(e => `<option value="${e.id}">${e.originalName || e.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="medLink" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Archive Link (URL or Folder name)</label>
              <input type="text" id="medLink" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;" placeholder="e.g. https://google-drive.com/folder-xyz" required />
            </div>
            <div class="form-group">
              <label for="medType" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Media Type</label>
              <select id="medType" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;">
                <option value="Photos">Photos</option>
                <option value="Video and Photos">Video and Photos</option>
                <option value="Videos">Videos</option>
                <option value="Graphics">Graphics</option>
                <option value="Audio">Audio</option>
              </select>
            </div>
            <div class="form-group">
              <label for="medSource" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Source From (Photographer/Staff)</label>
              <input type="text" id="medSource" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem;" placeholder="e.g. Tsepang" />
            </div>
            <div class="form-group">
              <label for="medUsage" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Usage Rights / Permission Notes</label>
              <textarea id="medUsage" rows="2" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; font-family: inherit;" placeholder="e.g. Consent forms signed. Free for social media."></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary mt-4 w-full">Save Media Link</button>
          </form>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  document.getElementById('closeGlobalModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('newMediaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('medSubject').value;
    const campaignId = document.getElementById('medCampaign').value;
    const evidenceId = document.getElementById('medEvidence').value;
    const archiveLink = document.getElementById('medLink').value;
    const mediaType = document.getElementById('medType').value;
    const sourceFrom = document.getElementById('medSource').value;
    const usageRights = document.getElementById('medUsage').value;

    addMediaAsset({
      subject,
      campaignId: campaignId || null,
      evidenceId: evidenceId || null,
      archiveLink,
      mediaType,
      sourceFrom,
      usageRights
    });

    modal.style.display = 'none';
  });
}


// 5. Add NGO Client Modal
// 5. Add NGO Client Onboarding Wizard
function openNewClientModal() {
  const modal = document.getElementById('globalModalContainer');
  
  let owStep = 1;
  let owIsDemoDataLoaded = false;
  let owMeetingSummaryApproved = false;
  let owLoadingAnalysis = false;
  let owMeetingText = '';
  let owMeetingSummary = null;
  
  let owClient = {
    id: '',
    name: '',
    logo: '🌱',
    website: '',
    country: '',
    sector: '',
    primaryContact: '',
    keyContact: '',
    email: '',
    phone: '',
    monthlyFee: 2500,
    contractValue: 30000,
    startDate: new Date().toISOString().split('T')[0],
    renewalDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
    clientStatus: 'Lead',
    isDemo: false,
    
    // Baseline Social Media Metrics
    fbPageUrl: '',
    fbFollowers: 0,
    fbAvgReach: 0,
    fbAvgEngagement: 0.0,
    igHandle: '',
    igFollowers: 0,
    igAvgReach: 0,
    igAvgEngagement: 0.0,
    baselineTopPosts: '',
    baselineDemographics: '',
    baselineStartDate: new Date().toISOString().split('T')[0],
    
    // Goals
    goalsAchieve: '',
    goalsProblem: '',
    goalsTop3: '',
    goalsSuccess: '',
    goalsChallenges: '',
    goalsSupport: '',

    // Brand
    mission: '',
    shortDesc: '',
    toneOfVoice: '',
    writingStyle: '',
    wordsToUse: '',
    wordsToAvoid: '',
    brandColours: '#15803d, #1e3a8a',
    fonts: 'Inter, Outfit',
    approvedHashtags: '',
    socialHandles: '',
    canvaTemplates: '',
    posterExamples: '',

    // Target Audience
    targetReach: '',
    audienceCommunity: '',
    audienceDonor: '',
    audienceGovernment: '',
    audienceYouth: '',
    audienceMedia: '',
    locations: '',
    ageGroups: '',
    languages: '',
    culturalConsiderations: '',
    audienceUnderstanding: '',
    audienceAction: '',

    // Funders & Reporting
    currentFunders: '',
    grantNames: '',
    reportingDeadlines: '',
    requiredDonorOutputs: '',
    donorLogoRequirements: '',
    funderCommunicationRules: '',
    requiredImpactMetrics: '',
    requiredEvidence: '',
    reportFrequency: 'Monthly'
  };

  let owCampaigns = [];
  let owEvidence = [];

  function getFileIcon(type) {
    if (type === 'PDF') return '📄';
    if (type === 'Word') return '📝';
    if (type === 'Excel') return '📊';
    if (type === 'Image') return '🖼️';
    if (type === 'Video') return '🎥';
    return '📎';
  }

  function renderStepAttachmentsSection(stepLabel, stepNum) {
    const stepFiles = owEvidence.filter(e => e.onboarding_step === stepLabel);
    let filesHtml = '';
    if (stepFiles.length === 0) {
      filesHtml = `<p style="font-size:0.7rem; color:#64748b; font-style:italic; margin:0;">No files attached to this step yet.</p>`;
    } else {
      filesHtml = `<div style="display:flex; flex-direction:column; gap:0.35rem;">
        ${stepFiles.map(f => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:0.4rem 0.6rem; border-radius:4px; border:1px solid #cbd5e1; font-size:0.75rem;">
            <span>📄 <strong>${f.name}</strong> (${f.sourceType})</span>
            <button type="button" class="btn btn-xs btn-outline ow-del-step-file" data-id="${f.id}" style="color:var(--danger-color); border-color:#fca5a5; padding:0.1rem 0.3rem; font-size:0.65rem;">Remove</button>
          </div>
        `).join('')}
      </div>`;
    }

    return `
      <div class="step-attachments-section" style="margin-top:1.25rem; padding:0.75rem; background:#f1f5f9; border-radius:6px; border:1px solid #e2e8f0; width: 100%;">
        <h4 style="margin:0 0 0.4rem 0; font-size:0.75rem; font-weight:700; color:#475569;">📎 Attach Supporting Files</h4>
        
        <div style="margin-bottom:0.5rem;">
          ${filesHtml}
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; margin-bottom:0.4rem;">
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.6rem; margin-bottom:0.1rem; font-weight:600;">Select File</label>
            <input type="file" id="stepUploadFile_${stepNum}" style="font-size:0.7rem; padding:0.25rem 0.4rem; border-radius:4px; height:28px;" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.6rem; margin-bottom:0.1rem; font-weight:600;">File Category</label>
            <select id="stepUploadType_${stepNum}" style="font-size:0.7rem; padding:0.25rem 0.4rem; border-radius:4px; height:28px;">
              <option value="PDF">PDF</option>
              <option value="Word">Word Doc</option>
              <option value="Excel">Excel Sheet</option>
              <option value="Image">Image / Canva Template</option>
              <option value="Text">Text File / Transcript</option>
            </select>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div class="form-group" style="margin-bottom:0; flex-grow:1; margin-right:0.4rem;">
            <label style="font-size:0.6rem; margin-bottom:0.1rem; font-weight:600;">Link to Campaign</label>
            <select id="stepUploadCampaign_${stepNum}" style="font-size:0.7rem; padding:0.25rem 0.4rem; border-radius:4px; height:28px; width:100%;">
              <option value="General">General Workspace (No specific campaign)</option>
              ${owCampaigns.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
            </select>
          </div>
          <button type="button" class="btn btn-xs btn-outline ow-step-upload-btn" data-step="${stepNum}" style="border-color:#4f46e5; color:#4f46e5; height:28px; font-size:0.7rem; font-weight:700; padding:0 0.5rem;">+ Attach</button>
        </div>
      </div>
    `;
  }

  // Helper to compute completeness percentage
  function getCompleteness() {
    let checkedFields = [
      'name', 'logo', 'website', 'country', 'sector', 'primaryContact', 'email', 'phone', 'monthlyFee', 'startDate', 'renewalDate',
      'goalsAchieve', 'goalsProblem', 'goalsTop3', 'goalsSuccess', 'goalsChallenges', 'goalsSupport',
      'mission', 'shortDesc', 'toneOfVoice', 'writingStyle', 'brandColours', 'fonts', 'approvedHashtags', 'socialHandles',
      'targetReach', 'audienceCommunity', 'audienceDonor', 'locations', 'ageGroups', 'languages', 'audienceUnderstanding', 'audienceAction',
      'currentFunders', 'grantNames', 'reportingDeadlines', 'requiredDonorOutputs', 'requiredImpactMetrics', 'requiredEvidence'
    ];
    let filled = 0;
    checkedFields.forEach(f => {
      if (owClient[f] !== undefined && owClient[f] !== null && owClient[f] !== '') {
        filled++;
      }
    });
    return Math.round((filled / checkedFields.length) * 100);
  }

  function getMissingFields() {
    let missing = [];
    if (!owClient.name) missing.push('Organisation Name');
    if (!owClient.logo) missing.push('Logo Emoji');
    if (!owClient.primaryContact) missing.push('Primary Contact');
    if (!owClient.email) missing.push('Contact Email');
    if (!owClient.phone) missing.push('Contact Phone');
    if (!owClient.website) missing.push('Website URL');
    if (!owClient.sector) missing.push('Sector Focus');
    if (!owClient.country) missing.push('Country Base');
    if (!owClient.goalsAchieve) missing.push('What Client Wants to Achieve');
    if (!owClient.goalsTop3) missing.push('Top 3 Communication Goals');
    if (!owClient.mission) missing.push('Mission Statement');
    if (!owClient.targetReach) missing.push('Main Target Audience');
    if (!owClient.currentFunders) missing.push('Current Funders');
    return missing;
  }

  function loadDemoData() {
    owIsDemoDataLoaded = true;
    owClient.name = 'Clean Air Africa (Demo)';
    owClient.logo = '💨';
    owClient.website = 'www.cleanairafrica.org';
    owClient.country = 'Kenya';
    owClient.sector = 'Air Quality Advocacy';
    owClient.primaryContact = 'Dr. John Kiprop';
    owClient.keyContact = 'Dr. John Kiprop';
    owClient.email = 'kiprop@cleanairafrica.org';
    owClient.phone = '+254 20 555 0199';
    owClient.monthlyFee = 3000;
    owClient.contractValue = 36000;
    owClient.clientStatus = 'Active';
    owClient.isDemo = true;
    
    owClient.goalsAchieve = 'Reduce soot and PM2.5 levels in Nairobi school zones.';
    owClient.goalsProblem = 'High diesel emissions near schools causing elevated childhood asthma.';
    owClient.goalsTop3 = '1. Translate raw sensor logs into stories\n2. Mobilize parent advocacy groups\n3. Influence school zoning policies';
    owClient.goalsSuccess = 'Establish clean breathing zones around 10 school boundaries.';
    owClient.goalsChallenges = 'Lack of city air monitors and slow environmental ministry regulations.';
    owClient.goalsSupport = 'Full agency copywriting, social calendars, and Canva design briefs.';
    
    owClient.mission = 'To protect African children\'s right to breathe safe air through local monitoring and advocacy.';
    owClient.shortDesc = 'Clean Air Africa is a Nairobi-based non-profit campaigning for school particulate sensor networks.';
    owClient.toneOfVoice = 'Urgent, Science-backed, Compassionate';
    owClient.writingStyle = 'Clear, youth-centric, action-oriented';
    owClient.wordsToUse = 'Particulate counts, PM2.5, child health, breathing zone';
    owClient.wordsToAvoid = 'Radical disruption, industry blockade';
    owClient.brandColours = '#0284c7, #10b981';
    owClient.fonts = 'Outfit, Roboto';
    owClient.approvedHashtags = '#CleanAirAfrica, #BreatheSafeNairobi';
    owClient.socialHandles = '@cleanairafrica';
    owClient.canvaTemplates = 'https://canva.com/design/CAA_Briefs';
    
    owClient.targetReach = 'Nairobi parents, environment board officers, county health directors';
    owClient.audienceCommunity = 'Mothers and children in heavy transit corridors';
    owClient.audienceDonor = 'Green climate funds and clean air coalitions';
    owClient.locations = 'Nairobi County, Kenya';
    owClient.ageGroups = 'Parents 25-50, school environment clubs';
    owClient.languages = 'English, Swahili';
    owClient.audienceUnderstanding = 'Nairobi soot levels exceed global safety thresholds during morning pick-up hours.';
    owClient.audienceAction = 'Sign the petition to restrict heavy truck transit near schools.';
    
    owClient.currentFunders = 'Clean Air Initiative, UNEP Partners';
    owClient.grantNames = 'Nairobi Breathing Zone Catalyst Award';
    owClient.reportingDeadlines = 'Bi-annual progress review due November 1st';
    owClient.requiredDonorOutputs = 'Monthly raw data logs, 1 case study, biannual PDF report';
    owClient.requiredImpactMetrics = 'Sensors deployed, classrooms checked, parent signatures logged';
    owClient.requiredEvidence = 'Installation photo, signed parent petition log sheets';
    owClient.reportFrequency = 'Quarterly';

    // Social Media Baseline demo metrics
    owClient.fbPageUrl = 'https://facebook.com/cleanairafrica';
    owClient.fbFollowers = 4200;
    owClient.fbAvgReach = 178700;
    owClient.fbAvgEngagement = 4.2;
    owClient.igHandle = '@cleanairafrica';
    owClient.igFollowers = 2100;
    owClient.igAvgReach = 319200;
    owClient.igAvgEngagement = 5.4;
    owClient.baselineTopPosts = '1. Nairobi Rush Hour Dust Levels Post (15.4K reach)\n2. School Sensor Deployment at Kibera (12.2K reach)\n3. Funder announcement (8.4K reach)';
    owClient.baselineDemographics = 'Nairobi County residents, 65% female, 35% male; 18-35 age group 60%, 35-55 age group 40%';
    owClient.baselineStartDate = '2026-06-23';

    // Seed campaign
    owCampaigns = [
      {
        id: 'cmp_caa_1',
        name: 'Nairobi School Breathing Zones',
        goal: 'Deploy 10 PM2.5 air sensors in schoolyards',
        description: 'Provide real-time data readouts to parents and lobby for zoning laws.',
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        priority: 'High',
        targetPlatforms: 'Facebook, WhatsApp',
        monthlyContentTarget: '8 updates per month',
        mainMessage: 'Every child has a right to breathe clean air in school.',
        callToAction: 'Lobby for local school diesel buffer zones.',
        projectLead: 'Dr. John Kiprop',
        relatedFunder: 'Clean Air Initiative'
      }
    ];

    // Seed evidence transcript for Step 8 Meeting Agent
    owMeetingText = `Dr. Kiprop: "We are officially launching the Nairobi School Breathing Zones project on July 1st. Our goal is to set up 10 air sensors in Durban and Nairobi schools. We need to raise parent awareness on Facebook and WhatsApp. The Clean Air Initiative is funding this, and we need bi-annual report summaries sent to them. The Department of Health is our target government body. We must educate parents about rush hour soot hazards."`;

    owEvidence = [
      {
        id: 'ev_caa_notes',
        name: 'nairobi_onboarding_alignment_transcript.txt',
        client_id: 'cleanairafrica-demo',
        contentType: 'Meeting transcript',
        dateUploaded: new Date().toISOString().split('T')[0],
        sourceType: 'Text',
        verificationStatus: 'Verified',
        textExcerpt: owMeetingText,
        isDemoData: true,
        onboarding_step: 'Evidence & Notes',
        source_type: 'Text',
        verification_status: 'Verified',
        uploaded_at: new Date().toISOString()
      }
    ];
  }

  function renderOnboardingStep() {
    let sidebarHtml = `
      <div style="margin-bottom:1.5rem;">
        <h3 style="color:white; font-size:0.95rem; font-weight:700; margin:0;">Create Workspace</h3>
        <span style="font-size:0.65rem; color:#94a3b8; text-transform:uppercase; font-weight:600; letter-spacing:0.5px;">NGO Onboarding Wizard</span>
      </div>
      <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.4rem; flex-grow:1;">
        ${[
          'Basic Details',
          'Client Goals',
          'Brand & Voice',
          'Campaigns & Projects',
          'Target Audience',
          'Funders & Reporting',
          'Social Media Baseline',
          'Evidence & Notes',
          'Meeting Agent Summary',
          'Final Review & Activate'
        ].map((lbl, idx) => {
          const stepNum = idx + 1;
          const isActive = owStep === stepNum;
          const isDone = owStep > stepNum;
          return `
            <li style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; padding:0.4rem 0.5rem; border-radius:6px; background:${isActive ? 'rgba(255,255,255,0.1)' : 'transparent'}; color:${isActive ? 'white' : isDone ? '#4ade80' : '#94a3b8'}; font-weight:${isActive ? '600' : 'normal'};">
              <span style="width:18px; height:18px; border-radius:50%; border:1px solid ${isActive ? 'white' : isDone ? '#4ade80' : '#475569'}; background:${isDone ? '#4ade80' : 'transparent'}; color:${isDone ? '#0f172a' : 'inherit'}; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; flex-shrink:0;">
                ${isDone ? '✓' : stepNum}
              </span>
              <span style="white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${lbl}</span>
            </li>
          `;
        }).join('')}
      </ul>
      <div style="border-top:1px solid #1e293b; padding-top:1rem; font-size:0.75rem; color:#94a3b8; display:flex; flex-direction:column; gap:0.25rem;">
        <span>Brief Completion: <strong style="color:white;">${getCompleteness()}%</strong></span>
        <div style="background:#334155; height:5px; border-radius:3px; overflow:hidden;">
          <div style="background:#10b981; height:100%; width:${getCompleteness()}%;"></div>
        </div>
      </div>
    `;

    let bodyHtml = '';
    let stepTitle = '';
    let stepDesc = '';

    if (owStep === 1) {
      stepTitle = 'STEP 1: Basic Client Details';
      stepDesc = 'Onboard the core institutional information and contact variables.';
      bodyHtml = `
        <div class="modal-form-fields-grid">
          <div class="form-group">
            <label>Organisation Name</label>
            <input type="text" id="owName" value="${owClient.name}" placeholder="e.g. Clean Air Africa" />
          </div>
          <div class="form-group">
            <label>Workspace Logo (Emoji)</label>
            <input type="text" id="owLogo" value="${owClient.logo}" placeholder="e.g. 💨" />
          </div>
          <div class="form-group">
            <label>Website URL</label>
            <input type="text" id="owWebsite" value="${owClient.website}" placeholder="e.g. www.cleanair.org" />
          </div>
          <div class="form-group">
            <label>Country Base</label>
            <input type="text" id="owCountry" value="${owClient.country}" placeholder="e.g. Kenya" />
          </div>
          <div class="form-group">
            <label>Sector Focus</label>
            <input type="text" id="owSector" value="${owClient.sector}" placeholder="e.g. Air Quality" />
          </div>
          <div class="form-group">
            <label>Primary Contact Name</label>
            <input type="text" id="owContact" value="${owClient.primaryContact}" placeholder="e.g. Dr. John Kiprop" />
          </div>
          <div class="form-group">
            <label>Contact Email</label>
            <input type="email" id="owEmail" value="${owClient.email}" placeholder="e.g. contact@cleanair.org" />
          </div>
          <div class="form-group">
            <label>Contact Phone Number</label>
            <input type="text" id="owPhone" value="${owClient.phone}" placeholder="e.g. +254 20 555" />
          </div>
          <div class="form-group">
            <label>Monthly Fee (£)</label>
            <input type="number" id="owFee" value="${owClient.monthlyFee}" placeholder="e.g. 2500" />
          </div>
          <div class="form-group">
            <label>Contract Status</label>
            <select id="owStatus">
              <option value="Lead" ${owClient.clientStatus === 'Lead' ? 'selected' : ''}>Lead Onboarding</option>
              <option value="Active" ${owClient.clientStatus === 'Active' ? 'selected' : ''}>Active Client</option>
              <option value="Paused" ${owClient.clientStatus === 'Paused' ? 'selected' : ''}>Paused Contract</option>
              <option value="Completed" ${owClient.clientStatus === 'Completed' ? 'selected' : ''}>Completed Client</option>
            </select>
          </div>
          <div class="form-group">
            <label>Contract Start Date</label>
            <input type="date" id="owStart" value="${owClient.startDate}" />
          </div>
          <div class="form-group">
            <label>Contract End Date</label>
            <input type="date" id="owEnd" value="${owClient.renewalDate}" />
          </div>
        </div>
        ${renderStepAttachmentsSection('Basic Details', 1)}
      `;
    } else if (owStep === 2) {
      stepTitle = 'STEP 2: Client Goals';
      stepDesc = 'Identify core goals, expectations, and challenges.';
      bodyHtml = `
        <div class="modal-form-fields">
          <div class="form-group">
            <label>What does the client want to achieve?</label>
            <textarea id="owGoalAchieve" placeholder="e.g. Scale school monitoring campaigns...">${owClient.goalsAchieve}</textarea>
          </div>
          <div class="form-group">
            <label>What problem are they trying to solve?</label>
            <textarea id="owGoalProblem" placeholder="e.g. Health impacts from high soot emissions...">${owClient.goalsProblem}</textarea>
          </div>
          <div class="form-group">
            <label>What are their top 3 communication goals?</label>
            <div style="display:flex; gap:0.5rem; margin-bottom:0.25rem; flex-wrap:wrap;">
              <button type="button" class="btn btn-xs btn-outline goal-pill" data-txt="Grow public awareness">• Grow public awareness</button>
              <button type="button" class="btn btn-xs btn-outline goal-pill" data-txt="Improve donor reporting">• Improve donor reporting</button>
              <button type="button" class="btn btn-xs btn-outline goal-pill" data-txt="Turn reports into stories">• Turn reports into stories</button>
              <button type="button" class="btn btn-xs btn-outline goal-pill" data-txt="Communicate impact to funders">• Communicate impact to funders</button>
            </div>
            <textarea id="owGoalTop3" placeholder="List top 3 goals...">${owClient.goalsTop3}</textarea>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>What does success look like?</label>
              <input type="text" id="owGoalSuccess" value="${owClient.goalsSuccess}" placeholder="Success metric..." />
            </div>
            <div class="form-group">
              <label>Biggest challenges?</label>
              <input type="text" id="owGoalChallenges" value="${owClient.goalsChallenges}" placeholder="e.g. Customs delays, regulations..." />
            </div>
          </div>
          <div class="form-group">
            <label>What support do they expect from IK Comms?</label>
            <input type="text" id="owGoalSupport" value="${owClient.goalsSupport}" placeholder="e.g. Social management, Canva briefs..." />
          </div>
        </div>
      `;
    } else if (owStep === 3) {
      stepTitle = 'STEP 3: Brand & Voice';
      stepDesc = 'Align on copywriting parameters, brand colors, and guidelines.';
      bodyHtml = `
        <div class="modal-form-fields">
          <div class="form-group">
            <label>Mission Statement</label>
            <input type="text" id="owMission" value="${owClient.mission}" placeholder="Core mission statement..." />
          </div>
          <div class="form-group">
            <label>Short Organisation Description</label>
            <textarea id="owShortDesc" placeholder="Brief description used in headers...">${owClient.shortDesc}</textarea>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Tone of Voice</label>
              <input type="text" id="owTone" value="${owClient.toneOfVoice}" placeholder="e.g. Urgent, Science-backed" />
            </div>
            <div class="form-group">
              <label>Writing Style</label>
              <input type="text" id="owStyle" value="${owClient.writingStyle}" placeholder="e.g. Clear, youth-centric" />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Words to Use</label>
              <input type="text" id="owWordsUse" value="${owClient.wordsToUse}" placeholder="Comma separated..." />
            </div>
            <div class="form-group">
              <label>Words to Avoid</label>
              <input type="text" id="owWordsAvoid" value="${owClient.wordsToAvoid}" placeholder="Avoid words..." />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Brand Colours (Hex)</label>
              <input type="text" id="owColours" value="${owClient.brandColours}" placeholder="e.g. #0284c7, #10b981" />
            </div>
            <div class="form-group">
              <label>Fonts</label>
              <input type="text" id="owFonts" value="${owClient.fonts}" placeholder="e.g. Outfit, Roboto" />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Approved Hashtags</label>
              <input type="text" id="owHashtags" value="${owClient.approvedHashtags}" placeholder="#CleanAir, #Eco" />
            </div>
            <div class="form-group">
              <label>Social Handles</label>
              <input type="text" id="owHandles" value="${owClient.socialHandles}" placeholder="@handle" />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Canva Templates Link</label>
              <input type="text" id="owCanva" value="${owClient.canvaTemplates}" placeholder="http://canva.com/..." />
            </div>
            <div class="form-group">
              <label>Example Posts Upload / Description</label>
              <input type="text" id="owPoster" value="${owClient.posterExamples}" placeholder="Folder links or file names..." />
            </div>
          </div>
        </div>
        ${renderStepAttachmentsSection('Brand & Voice', 3)}
      `;
    } else if (owStep === 4) {
      stepTitle = 'STEP 4: Campaigns & Projects';
      stepDesc = 'Register campaigns. Link multiple projects directly to the client profile.';
      
      let campaignsListHtml = owCampaigns.length === 0
        ? `<p style="font-size:0.8rem; color:#64748b; font-style:italic; text-align:center; padding:1rem; border:1px dashed #cbd5e1; border-radius:6px;">No campaigns added yet. Add a campaign using the form below.</p>`
        : `<div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
            ${owCampaigns.map((c, i) => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:0.6rem 0.8rem; border-radius:6px; border:1px solid #cbd5e1; font-size:0.8rem;">
                <div>
                  <strong>${c.name}</strong>
                  <span style="color:#64748b; font-size:0.75rem;"> - Goal: ${c.goal} (${c.priority})</span>
                </div>
                <button type="button" class="btn btn-xs btn-outline ow-del-campaign" data-idx="${i}" style="color:var(--danger-color); border-color:#fca5a5;">Delete</button>
              </div>
            `).join('')}
           </div>`;

      bodyHtml = `
        <div class="modal-form-fields">
          <div class="campaign-list-section">
            <h4 style="margin-top:0; font-size:0.85rem; font-weight:600; color:#0f172a; margin-bottom:0.5rem;">Registered Campaigns</h4>
            ${campaignsListHtml}
          </div>

          <div style="background:#f1f5f9; padding:1rem; border-radius:8px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:0.75rem;">
            <h4 style="margin:0 0 0.5rem 0; font-size:0.8rem; font-weight:700; color:#475569; border-bottom:1px solid #cbd5e1; padding-bottom:0.25rem;">Add New Campaign Workspace</h4>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label>Campaign Name</label>
                <input type="text" id="cName" placeholder="e.g. Nairobi School Zones" />
              </div>
              <div class="form-group">
                <label>Campaign Goal</label>
                <input type="text" id="cGoal" placeholder="e.g. Deploy 10 monitors" />
              </div>
            </div>

            <div class="form-group">
              <label>Campaign Description</label>
              <textarea id="cDesc" style="height:60px;" placeholder="Brief description..."></textarea>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label>Priority</label>
                <select id="cPriority">
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" id="cStart" value="${new Date().toISOString().split('T')[0]}" />
              </div>
              <div class="form-group">
                <label>End Date</label>
                <input type="date" id="cEnd" value="${new Date(Date.now() + 15552000000).toISOString().split('T')[0]}" />
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label>Target Platforms</label>
                <input type="text" id="cPlatforms" placeholder="Facebook, WhatsApp..." />
              </div>
              <div class="form-group">
                <label>Content Target (monthly)</label>
                <input type="text" id="cTarget" placeholder="e.g. 8 updates/mo" />
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label>Main Campaign Message</label>
                <input type="text" id="cMessage" placeholder="Every child has a right to breathe..." />
              </div>
              <div class="form-group">
                <label>Call to Action (CTA)</label>
                <input type="text" id="cCta" placeholder="Lobby for buffer zones..." />
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label>Project Lead</label>
                <input type="text" id="cLead" placeholder="Staff lead..." />
              </div>
              <div class="form-group">
                <label>Related Funder</label>
                <input type="text" id="cFunder" placeholder="Funder name..." />
              </div>
            </div>

            <button type="button" class="btn btn-outline" id="owAddCampaignBtn" style="border-color:#4f46e5; color:#4f46e5; margin-top:0.5rem;">+ Add Campaign to Workspace</button>
          </div>
        </div>
        ${renderStepAttachmentsSection('Campaigns & Projects', 4)}
      `;
    } else if (owStep === 5) {
      stepTitle = 'STEP 5: Target Audience';
      stepDesc = 'Identify beneficiary groups, geographies, and cultural contexts.';
      bodyHtml = `
        <div class="modal-form-fields">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Main Target Audience</label>
              <input type="text" id="owAudienceMain" value="${owClient.targetReach}" placeholder="Who is key to reach..." />
            </div>
            <div class="form-group">
              <label>Community Audience</label>
              <input type="text" id="owAudienceComm" value="${owClient.audienceCommunity}" placeholder="Fence-line communities..." />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Donor Audience</label>
              <input type="text" id="owAudienceDonor" value="${owClient.audienceDonor}" placeholder="Clean air foundations..." />
            </div>
            <div class="form-group">
              <label>Government/Policy Audience</label>
              <input type="text" id="owAudienceGov" value="${owClient.audienceGovernment}" placeholder="Health ministries..." />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Youth Audience</label>
              <input type="text" id="owAudienceYouth" value="${owClient.audienceYouth}" placeholder="School environment clubs..." />
            </div>
            <div class="form-group">
              <label>Media Audience</label>
              <input type="text" id="owAudienceMedia" value="${owClient.audienceMedia}" placeholder="Environmental reporters..." />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Geographic Locations</label>
              <input type="text" id="owLocations" value="${owClient.locations}" placeholder="e.g. Nairobi, Kenya" />
            </div>
            <div class="form-group">
              <label>Age Groups</label>
              <input type="text" id="owAgeGroups" value="${owClient.ageGroups}" placeholder="e.g. Parents 25-50" />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Languages Required</label>
              <input type="text" id="owLanguages" value="${owClient.languages}" placeholder="Swahili, English..." />
            </div>
            <div class="form-group">
              <label>Cultural Considerations</label>
              <input type="text" id="owCultural" value="${owClient.culturalConsiderations}" placeholder="e.g. Translation dialects, community leaders..." />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>What must audience understand?</label>
              <input type="text" id="owAudienceUnder" value="${owClient.audienceUnderstanding}" placeholder="Key message hazard..." />
            </div>
            <div class="form-group">
              <label>What action should they take?</label>
              <input type="text" id="owAudienceAct" value="${owClient.audienceAction}" placeholder="Sign petition, join club..." />
            </div>
          </div>
        </div>
        ${renderStepAttachmentsSection('Target Audience', 5)}
      `;
    } else if (owStep === 6) {
      stepTitle = 'STEP 6: Funders & Reporting Needs';
      stepDesc = 'Identify grant requirements, compliance check cadences, and metrics.';
      bodyHtml = `
        <div class="modal-form-fields">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Current Funders</label>
              <input type="text" id="owFunders" value="${owClient.currentFunders}" placeholder="UNEP, Sida..." />
            </div>
            <div class="form-group">
              <label>Grant Names</label>
              <input type="text" id="owGrants" value="${owClient.grantNames}" placeholder="Breathing Zone Grant..." />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Reporting Deadlines</label>
              <input type="text" id="owDeadlines" value="${owClient.reportingDeadlines}" placeholder="Quarterly by 15th..." />
            </div>
            <div class="form-group">
              <label>Required Donor Outputs</label>
              <input type="text" id="owOutputs" value="${owClient.requiredDonorOutputs}" placeholder="CSV logs, monthly brief..." />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Donor Logo Rules</label>
              <input type="text" id="owLogoRules" value="${owClient.donorLogoRequirements}" placeholder="Consultancy logo secondary..." />
            </div>
            <div class="form-group">
              <label>Funder Communication Rules</label>
              <input type="text" id="owCommRules" value="${owClient.funderCommunicationRules}" placeholder="No political lobbying tags..." />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Required Impact Metrics</label>
              <input type="text" id="owImpactMetrics" value="${owClient.requiredImpactMetrics}" placeholder="Sensors, teachers trained..." />
            </div>
            <div class="form-group">
              <label>Evidence Required by Funders</label>
              <input type="text" id="owEvidenceReq" value="${owClient.requiredEvidence}" placeholder="Installation photos, sign registers..." />
            </div>
          </div>
          <div class="form-group">
            <label>Report Frequency</label>
            <select id="owFrequency">
              <option value="Monthly" ${owClient.reportFrequency === 'Monthly' ? 'selected' : ''}>Monthly Report</option>
              <option value="Quarterly" ${owClient.reportFrequency === 'Quarterly' ? 'selected' : ''}>Quarterly Report</option>
              <option value="Annual" ${owClient.reportFrequency === 'Annual' ? 'selected' : ''}>Annual Report</option>
              <option value="Ad hoc" ${owClient.reportFrequency === 'Ad hoc' ? 'selected' : ''}>Ad hoc Report</option>
            </select>
          </div>
        </div>
        ${renderStepAttachmentsSection('Funders & Reporting', 6)}
      `;
    } else if (owStep === 7) {
      stepTitle = 'STEP 7: Social Media Starting Baseline';
      stepDesc = 'Record starting followers, reach, and engagement to measure growth.';
      bodyHtml = `
        <div class="modal-form-fields">
          <div style="background:#e0f2fe; border:1px solid #bae6fd; padding:0.75rem; border-radius:8px; color:#0369a1; font-size:0.8rem; font-weight:600; display:flex; gap:0.4rem; align-items:center; margin-bottom:1rem;">
            <span>📊</span>
            <span>Capture starting growth metrics to calculate future 3-month, 6-month and annual performance reports.</span>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
            <!-- Facebook Column -->
            <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem; display:flex; flex-direction:column; gap:0.5rem;">
              <h4 style="margin:0 0 0.25rem 0; font-size:0.8rem; font-weight:700; color:#1877f2; border-bottom:1px solid #e2e8f0; padding-bottom:0.25rem; text-transform:none;">📘 Facebook Baseline</h4>
              <div class="form-group">
                <label>Page URL</label>
                <input type="text" id="owFbPageUrl" value="${owClient.fbPageUrl || ''}" placeholder="facebook.com/..." />
              </div>
              <div class="form-group">
                <label>Followers</label>
                <input type="number" id="owFbFollowers" value="${owClient.fbFollowers || 0}" />
              </div>
              <div class="form-group">
                <label>Avg Monthly Reach</label>
                <input type="number" id="owFbAvgReach" value="${owClient.fbAvgReach || 0}" />
              </div>
              <div class="form-group">
                <label>Avg Engagement Rate (%)</label>
                <input type="number" step="0.1" id="owFbAvgEngagement" value="${owClient.fbAvgEngagement || 0.0}" />
              </div>
            </div>

            <!-- Instagram Column -->
            <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem; display:flex; flex-direction:column; gap:0.5rem;">
              <h4 style="margin:0 0 0.25rem 0; font-size:0.8rem; font-weight:700; color:#c13584; border-bottom:1px solid #e2e8f0; padding-bottom:0.25rem; text-transform:none;">📸 Instagram Baseline</h4>
              <div class="form-group">
                <label>Handle</label>
                <input type="text" id="owIgHandle" value="${owClient.igHandle || ''}" placeholder="@..." />
              </div>
              <div class="form-group">
                <label>Followers</label>
                <input type="number" id="owIgFollowers" value="${owClient.igFollowers || 0}" />
              </div>
              <div class="form-group">
                <label>Avg Monthly Reach</label>
                <input type="number" id="owIgAvgReach" value="${owClient.igAvgReach || 0}" />
              </div>
              <div class="form-group">
                <label>Avg Engagement Rate (%)</label>
                <input type="number" step="0.1" id="owIgAvgEngagement" value="${owClient.igAvgEngagement || 0.0}" />
              </div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:1rem;">
            <div>
              <div class="form-group">
                <label>Top Social Media Posts (Description & Performance)</label>
                <textarea id="owBaselineTopPosts" style="height:60px;" placeholder="e.g. 1. Post Name (12K reach)...">${owClient.baselineTopPosts || ''}</textarea>
              </div>
              <div class="form-group">
                <label>Audience Demographics</label>
                <textarea id="owBaselineDemographics" style="height:50px;" placeholder="e.g. 60% female, Durban based...">${owClient.baselineDemographics || ''}</textarea>
              </div>
            </div>
            
            <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem; display:flex; flex-direction:column; gap:0.5rem; justify-content:center;">
              <div class="form-group" style="margin:0;">
                <label>Baseline Start Date</label>
                <input type="date" id="owBaselineStartDate" value="${owClient.baselineStartDate || ''}" />
              </div>
              <p style="font-size:0.65rem; color:#64748b; line-height:1.4; margin:0;">
                These values represent the starting benchmark. All future report cards will be compared against these figures.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (owStep === 8) {
      stepTitle = 'STEP 8: Evidence & First Meeting Notes';
      stepDesc = 'Connect files, attendance logs, registers, or alignment transcripts.';
      
      let evidenceListHtml = owEvidence.length === 0
        ? `<p style="font-size:0.8rem; color:#64748b; font-style:italic; text-align:center; padding:1rem; border:1px dashed #cbd5e1; border-radius:6px;">No files connected yet. Simulate a file upload below.</p>`
        : `<div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
            ${owEvidence.map((e, i) => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:0.6rem 0.8rem; border-radius:6px; border:1px solid #cbd5e1; font-size:0.8rem;">
                <div>
                  <strong>${getFileIcon(e.sourceType)} ${e.name}</strong>
                  <span style="color:#64748b; font-size:0.75rem;"> (${e.sourceType} • Step: ${e.onboarding_step || 'General Evidence'} • Campaign: ${e.campaign || 'General'} • ${e.verificationStatus})</span>
                </div>
                <button type="button" class="btn btn-xs btn-outline ow-del-evidence" data-idx="${i}" style="color:var(--danger-color); border-color:#fca5a5;">Remove</button>
              </div>
            `).join('')}
           </div>`;

      bodyHtml = `
        <div class="modal-form-fields">
          <div style="background:#e0f2fe; border:1px solid #bae6fd; padding:0.75rem; border-radius:8px; color:#0369a1; font-size:0.8rem; font-weight:600; display:flex; gap:0.4rem; align-items:center;">
            <span>💡</span>
            <span>[PROTOTYPE ONLY] File uploads are simulated here. Upload transcript files or notes to run the Meeting Agent in Step 9.</span>
          </div>

          <div class="evidence-list-section">
            <h4 style="margin-top:0; font-size:0.85rem; font-weight:600; color:#0f172a; margin-bottom:0.5rem;">Connected Evidence & Notes</h4>
            ${evidenceListHtml}
          </div>

          <div style="background:#f8fafc; padding:1rem; border-radius:8px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:0.75rem;">
            <h4 style="margin:0 0 0.5rem 0; font-size:0.8rem; font-weight:700; color:#475569; border-bottom:1px solid #cbd5e1; padding-bottom:0.25rem;">Simulate File Upload & Tagging</h4>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label>Select File</label>
                <input type="file" id="eFile" style="font-size:0.75rem; padding:0.25rem 0.4rem; border-radius:4px; height:28px;" />
              </div>
              <div class="form-group">
                <label>Source Type / Category</label>
                <select id="eType">
                  <option value="PDF">PDF Reports</option>
                  <option value="Word">Word Document</option>
                  <option value="Text">Meeting Transcript / Notes</option>
                  <option value="Excel">Survey Results / Attendance Register</option>
                  <option value="Image">Project Photo</option>
                  <option value="Video">Meeting Recording</option>
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label>Assign to Campaign</label>
                <select id="eCampaign">
                  <option value="General">General Workspace (No specific campaign)</option>
                  ${owCampaigns.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Verification Status</label>
                <select id="eVerification">
                  <option value="Verified">Verified</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="Unverified">Unverified</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>File Excerpt / Text Content</label>
              <textarea id="eExcerpt" style="height:60px;" placeholder="Paste text summary or transcript details here..."></textarea>
            </div>

            <button type="button" class="btn btn-outline" id="owAddEvidenceBtn" style="border-color:#4f46e5; color:#4f46e5; margin-top:0.5rem;">+ Ingest File to Evidence List</button>
          </div>
        </div>
      `;
    } else if (owStep === 9) {
      stepTitle = 'STEP 9: Meeting Agent Summary';
      stepDesc = 'The Meeting Intelligence Agent extracts alignment objectives, target metrics, and tasks.';
      
      // Auto-detect transcript files from Step 8 (Evidence & Notes)
      const transcripts = owEvidence.filter(e => e.sourceType === 'Text' || e.name.toLowerCase().includes('transcript') || e.contentType === 'Meeting transcript');
      let transcriptInfoHtml = '';
      if (transcripts.length > 0) {
        if (!owMeetingText.trim()) {
          owMeetingText = transcripts.map(t => t.textExcerpt || '').join('\n\n');
        }
        transcriptInfoHtml = `
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:0.75rem; border-radius:8px; color:#065f46; font-size:0.8rem; font-weight:600; display:flex; gap:0.4rem; align-items:center; margin-bottom:0.75rem;">
            <span>✔️</span>
            <span>Auto-detected transcript file(s) attached in Evidence: <strong>${transcripts.map(t => t.name).join(', ')}</strong>. The agent will run on this data.</span>
          </div>
        `;
      } else {
        transcriptInfoHtml = `
          <div style="background:#fffbeb; border:1px solid #fde68a; padding:0.75rem; border-radius:8px; color:#b45309; font-size:0.8rem; font-weight:600; display:flex; gap:0.4rem; align-items:center; margin-bottom:0.75rem;">
            <span>⚠️</span>
            <span>No transcripts were attached in Evidence & Notes. Please paste the meeting transcript manually below to run the agent.</span>
          </div>
        `;
      }

      let analysisResultHtml = '';
      if (owLoadingAnalysis) {
        analysisResultHtml = `
          <div style="text-align:center; padding:2rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; display:flex; flex-direction:column; gap:0.75rem; align-items:center;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
            <strong style="font-size:0.9rem; color:#4f46e5;">🤖 Meeting Intelligence Agent is analyzing transcripts...</strong>
            <span style="font-size:0.75rem; color:#64748b;">Processing project alignment facts, goals, and funding constraints...</span>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </div>
        `;
      } else if (owMeetingSummary) {
        analysisResultHtml = `
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:1.25rem; border-radius:8px; display:flex; flex-direction:column; gap:1rem; font-size:0.8rem; color:#065f46; max-height:400px; overflow-y:auto; line-height:1.4;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #a7f3d0; padding-bottom:0.5rem; margin-bottom:0.25rem;">
              <strong style="font-size:0.9rem;">🤖 Meeting Intelligence Agent Output</strong>
              <span class="badge success" style="background:#10b981; color:white; font-size:0.65rem;">Active & Listening</span>
            </div>
            
            <div>
              <strong style="display:block; font-weight:700; color:#047857; margin-bottom:0.15rem;">📝 Meeting Summary:</strong>
              <span>${owMeetingSummary.summary}</span>
            </div>

            <div>
              <strong style="display:block; font-weight:700; color:#047857; margin-bottom:0.15rem;">🎯 Client Goals Detected:</strong>
              <span style="white-space:pre-wrap;">${owMeetingSummary.goalsDetected}</span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <strong style="display:block; font-weight:700; color:#047857; margin-bottom:0.15rem;">🤝 Key Decisions:</strong>
                <span style="white-space:pre-wrap;">${owMeetingSummary.decisions}</span>
              </div>
              <div>
                <strong style="display:block; font-weight:700; color:#047857; margin-bottom:0.15rem;">⚡ Action Points:</strong>
                <span style="white-space:pre-wrap;">${owMeetingSummary.actionPoints}</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <strong style="display:block; font-weight:700; color:#047857; margin-bottom:0.15rem;">📈 Required Outputs:</strong>
                <span>${owMeetingSummary.outputs}</span>
              </div>
              <div>
                <strong style="display:block; font-weight:700; color:#047857; margin-bottom:0.15rem;">Recommended next steps:</strong>
                <span>${owMeetingSummary.nextSteps}</span>
              </div>
            </div>

            <div>
              <strong style="display:block; font-weight:700; color:#047857; margin-bottom:0.15rem;">🤖 Which AI agents need this information:</strong>
              <span>${owMeetingSummary.agentTargets}</span>
            </div>

            <div style="background:white; border:1px solid #a7f3d0; padding:0.75rem; border-radius:6px; margin-top:0.5rem; display:flex; align-items:center; gap:0.5rem; color:#0f172a;">
              <input type="checkbox" id="owApproveSummaryCheck" ${owMeetingSummaryApproved ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
              <label for="owApproveSummaryCheck" style="font-weight:600; font-size:0.75rem; cursor:pointer; color:#0f172a;">I approve this Meeting Agent summary and the extracted client goals.</label>
            </div>
          </div>
        `;
      } else {
        analysisResultHtml = `
          <div style="text-align:center; padding:1.5rem; background:white; border:1px solid #cbd5e1; border-radius:8px; color:#64748b; font-size:0.8rem;">
            Awaiting transcript data inputs to execute alignment analysis.
          </div>
        `;
      }

      bodyHtml = `
        <div class="modal-form-fields">
          ${transcriptInfoHtml}
          <div class="form-group">
            <label>Meeting notes / raw transcript text</label>
            <textarea id="owMeetingText" style="height:120px;" placeholder="Paste meeting notes, transcript logs, or alignment conversation details here...">${owMeetingText}</textarea>
          </div>
          
          <button type="button" class="btn btn-primary" id="owRunMeetingAgentBtn" style="background:#4f46e5; border-color:#4338ca; font-weight:700; padding:0.6rem 1rem;">🧠 Execute Meeting Intelligence Agent</button>

          <div class="analysis-results-section mt-4">
            <h4 style="margin-top:0; font-size:0.85rem; font-weight:600; color:#0f172a; margin-bottom:0.5rem;">Agent Analysis Overview</h4>
            ${analysisResultHtml}
          </div>
        </div>
      `;
    } else if (owStep === 10) {
      stepTitle = 'STEP 10: Final Review & Activate Workspace';
      stepDesc = 'Confirm client brief parameters and select agent workspace activation level.';
      
      let missingFields = getMissingFields();
      let isBriefReady = missingFields.length === 0;

      bodyHtml = `
        <div class="modal-form-fields">
          <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:1.25rem;">
            
            <!-- Completion Card -->
            <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem;">
              <h4 style="margin:0 0 0.5rem 0; font-size:0.85rem; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:0.25rem;">Onboarding Status Check</h4>
              
              <div style="display:flex; flex-direction:column; gap:0.15rem;">
                <span style="font-size:0.7rem; text-transform:uppercase; color:#64748b; font-weight:600;">Brief Completion Score</span>
                <div style="display:flex; align-items:center; gap:0.5rem; font-size:1.15rem; font-weight:700; color:${getCompleteness() >= 80 ? '#059669' : '#d97706'};">
                  <span>${getCompleteness()}%</span>
                  <span class="badge ${getCompleteness() >= 80 ? 'success' : 'warning'}" style="font-size:0.6rem; padding:0.1rem 0.3rem;">
                    ${getCompleteness() >= 80 ? 'Ready' : 'Under Scope'}
                  </span>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:0.15rem;">
                <span style="font-size:0.7rem; text-transform:uppercase; color:#64748b; font-weight:600;">Campaigns Configured</span>
                <span style="font-size:0.85rem; font-weight:600; color:#0f172a;">${owCampaigns.length} Active Campaigns</span>
              </div>

              <div style="display:flex; flex-direction:column; gap:0.15rem;">
                <span style="font-size:0.7rem; text-transform:uppercase; color:#64748b; font-weight:600;">Evidence Ingested</span>
                <span style="font-size:0.85rem; font-weight:600; color:#0f172a;">${owEvidence.length} Connected files</span>
              </div>

              <div style="display:flex; flex-direction:column; gap:0.15rem;">
                <span style="font-size:0.7rem; text-transform:uppercase; color:#64748b; font-weight:600;">Meeting Alignment Summary</span>
                <span style="font-size:0.85rem; font-weight:600; color:${owMeetingSummaryApproved ? '#059669' : '#dc2626'};">
                  ${owMeetingSummaryApproved ? '✔️ Approved & Locked' : '❌ Summary Approval Pending'}
                </span>
              </div>
            </div>

            <!-- Lock Checklist -->
            <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:1rem; display:flex; flex-direction:column; gap:0.5rem;">
              <h4 style="margin:0 0 0.5rem 0; font-size:0.85rem; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:0.25rem;">Activation Safety Policy</h4>
              
              <ul style="list-style:none; padding:0; margin:0; font-size:0.75rem; display:flex; flex-direction:column; gap:0.4rem; line-height:1.4;">
                <li style="display:flex; align-items:center; gap:0.35rem;">
                  <span>🤖</span>
                  <span>Meeting Intelligence Agent: <strong style="color:#059669;">ACTIVE</strong> (Runs immediately)</span>
                </li>
                <li style="display:flex; align-items:center; gap:0.35rem;">
                  ${owMeetingSummaryApproved ? '<span style="color:#059669;">✔️</span>' : '<span style="color:#dc2626;">❌</span>'}
                  <span>User approved onboarding meeting summary: <strong>${owMeetingSummaryApproved ? 'Yes' : 'No'}</strong></span>
                </li>
                <li style="display:flex; align-items:center; gap:0.35rem;">
                  ${isBriefReady ? '<span style="color:#059669;">✔️</span>' : '<span style="color:#d97706;">⚠️</span>'}
                  <span>Client Brief checklist: <strong>${isBriefReady ? 'All Required Filled' : 'Missing Fields'}</strong></span>
                </li>
              </ul>

              ${missingFields.length > 0 ? `
                <div style="background:#fffbeb; border:1px solid #fde68a; padding:0.5rem; border-radius:6px; font-size:0.7rem; color:#b45309; max-height:100px; overflow-y:auto; margin-top:0.25rem;">
                  <strong>Missing fields:</strong> ${missingFields.join(', ')}
                </div>
              ` : ''}
            </div>

          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:1rem; border-radius:8px; font-size:0.8rem; line-height:1.5; color:#475569; display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
            <strong>Workspace Activation Actions:</strong>
            <ul style="list-style:disc; padding-left:1.25rem; margin:0; display:flex; flex-direction:column; gap:0.25rem;">
              <li><strong>Save Workspace Draft:</strong> Saves onboarding parameters as an unapproved draft. Generative AI agents remain locked.</li>
              <li><strong>Approve Client Brief:</strong> Approves the onboarding parameters. Meeting agent remains active, but other agents are kept in standby mode.</li>
              <li><strong>Activate AI Agents:</strong> Unlocks all generative agents (Storytelling, Social Media, Canva Brief, Calendar, Reporting, Analytics) to immediately begin processing workspace content. (Requires Onboarding Meeting Approval).</li>
            </ul>
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-lg" style="max-width: 900px; width: 95%;">
        <div class="modal-content" style="border:none; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); overflow:hidden;">
          <div class="onboarding-wizard-layout" style="display:flex; height: 80vh; max-height: 700px; border-radius: 12px; overflow: hidden; background: white;">
            <!-- Left steps tracker -->
            <aside class="onboarding-steps-sidebar" style="width: 250px; background: #0f172a; color: white; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; flex-shrink:0;">
              ${sidebarHtml}
            </aside>

            <!-- Main content form panel -->
            <main class="onboarding-wizard-main" style="flex-grow: 1; display: flex; flex-direction: column; background: #f8fafc; height: 100%; overflow:hidden;">
              <!-- Header -->
              <div class="onboarding-wizard-header" style="background: white; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin:0;" id="owStepTitle">${stepTitle}</h2>
                  <p style="font-size: 0.75rem; color: #64748b; margin: 0.25rem 0 0 0;" id="owStepDesc">${stepDesc}</p>
                </div>
                ${!owIsDemoDataLoaded ? `
                  <button class="btn btn-sm btn-ghost" id="owLoadDemoDataBtn" style="color: #4f46e5; border: 1px dashed #c7d2fe; background: #f5f3ff; font-weight:700; border-radius:6px; padding:0.3rem 0.6rem;">⚡ Load Demo Data</button>
                ` : `
                  <span class="badge success" style="background:#e0f2fe; color:#0369a1; font-size:0.7rem; font-weight:700; padding:0.25rem 0.5rem; border-radius:4px;">💨 Demo Data Loaded</span>
                `}
              </div>
              
              <!-- Body (scrollable) -->
              <div class="onboarding-wizard-body" style="flex-grow: 1; padding: 1.5rem; overflow-y: auto;">
                ${bodyHtml}
              </div>

              <!-- Footer -->
              <div class="onboarding-wizard-footer" style="background: white; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <button class="btn btn-outline" id="owPrevBtn" ${owStep === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>← Back</button>
                <div style="display:flex; gap: 0.5rem;">
                  <button class="btn btn-ghost" id="owCloseBtn" style="font-weight:600; padding:0.5rem 1rem;">Cancel</button>
                  ${owStep < 10 
                    ? `<button class="btn btn-primary" id="owNextBtn" style="background:var(--primary-color); color:white; font-weight:600; padding:0.5rem 1.25rem;">Next →</button>`
                    : `
                      <div style="display:flex; gap:0.4rem;">
                        <button class="btn btn-outline" id="owSaveDraftBtn" style="font-weight:600;">Save Draft</button>
                        <button class="btn btn-outline" id="owApproveBriefBtn" style="font-weight:600; color:#059669; border-color:#6ee7b7; background:#ecfdf5;">Approve Brief</button>
                        <button class="btn btn-primary" id="owActivateAgentsBtn" ${!owMeetingSummaryApproved ? 'disabled style="opacity:0.5; cursor:not-allowed; background:#94a3b8; border-color:#94a3b8;"' : 'style="background:#059669; border-color:#059669; color:white; font-weight:700;"'}>Activate AI Agents 🚀</button>
                      </div>
                    `
                  }
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    `;

    bindWizardEvents();
  }

  function bindWizardEvents() {
    // Close button
    const closeBtn = document.getElementById('owCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    // Load Demo Data
    const loadDemoBtn = document.getElementById('owLoadDemoDataBtn');
    if (loadDemoBtn) {
      loadDemoBtn.addEventListener('click', () => {
        loadDemoData();
        renderOnboardingStep();
      });
    }

    // Previous Button
    const prevBtn = document.getElementById('owPrevBtn');
    if (prevBtn && owStep > 1) {
      prevBtn.addEventListener('click', () => {
        saveCurrentStepInputs();
        owStep--;
        renderOnboardingStep();
      });
    }

    // Next Button
    const nextBtn = document.getElementById('owNextBtn');
    if (nextBtn && owStep < 10) {
      nextBtn.addEventListener('click', () => {
        saveCurrentStepInputs();
        owStep++;
        renderOnboardingStep();
      });
    }

    // Inline step file upload
    const stepUploadBtn = modal.querySelector('.ow-step-upload-btn');
    if (stepUploadBtn) {
      stepUploadBtn.addEventListener('click', () => {
        const stepNum = parseInt(stepUploadBtn.getAttribute('data-step'));
        const fileInput = document.getElementById(`stepUploadFile_${stepNum}`);
        const file = fileInput ? fileInput.files[0] : null;
        
        if (!file) {
          alert('Please select a file.');
          return;
        }
        
        const typeSelect = document.getElementById(`stepUploadType_${stepNum}`);
        const campaignSelect = document.getElementById(`stepUploadCampaign_${stepNum}`);
        const sourceType = typeSelect ? typeSelect.value : 'PDF';
        const campaign = campaignSelect ? campaignSelect.value : 'General';
        
        let stepLabel = '';
        if (stepNum === 1) stepLabel = 'Basic Details';
        else if (stepNum === 3) stepLabel = 'Brand & Voice';
        else if (stepNum === 4) stepLabel = 'Campaigns & Projects';
        else if (stepNum === 5) stepLabel = 'Target Audience';
        else if (stepNum === 6) stepLabel = 'Funders & Reporting';
        
        owEvidence.push({
          id: 'ev_ow_' + Math.floor(Math.random() * 10000000),
          name: file.name,
          sourceType,
          campaign,
          campaign_id: campaign === 'General' ? '' : campaign,
          verificationStatus: 'Verified',
          textExcerpt: `File attached in ${stepLabel}: ${file.name}`,
          dateUploaded: new Date().toISOString().split('T')[0],
          uploaded_at: new Date().toISOString(),
          onboarding_step: stepLabel,
          source_type: sourceType,
          verification_status: 'Verified',
          file: file // Store the actual file object
        });
        
        renderOnboardingStep();
      });
    }

    // Inline step file delete
    modal.querySelectorAll('.ow-del-step-file').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        owEvidence = owEvidence.filter(e => e.id !== id);
        renderOnboardingStep();
      });
    });

    // Goal pills appender in Step 2
    if (owStep === 2) {
      modal.querySelectorAll('.goal-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const txt = pill.getAttribute('data-txt');
          const txtarea = document.getElementById('owGoalTop3');
          if (txtarea) {
            let current = txtarea.value.trim();
            if (current) current += '\n';
            txtarea.value = current + txt;
            owClient.goalsTop3 = txtarea.value;
          }
        });
      });
    }

    // Add Campaign button in Step 4
    const addCampBtn = document.getElementById('owAddCampaignBtn');
    if (addCampBtn) {
      addCampBtn.addEventListener('click', () => {
        const name = document.getElementById('cName').value.trim();
        const goal = document.getElementById('cGoal').value.trim();
        const description = document.getElementById('cDesc').value.trim();
        const priority = document.getElementById('cPriority').value;
        const startDate = document.getElementById('cStart').value;
        const endDate = document.getElementById('cEnd').value;
        const targetPlatforms = document.getElementById('cPlatforms').value.trim();
        const monthlyContentTarget = document.getElementById('cTarget').value.trim();
        const mainMessage = document.getElementById('cMessage').value.trim();
        const callToAction = document.getElementById('cCta').value.trim();
        const projectLead = document.getElementById('cLead').value.trim();
        const relatedFunder = document.getElementById('cFunder').value.trim();

        if (!name) {
          alert('Campaign Name is required.');
          return;
        }

        owCampaigns.push({
          id: 'cmp_ow_' + Math.floor(Math.random() * 10000000),
          name, goal, description, startDate, endDate, priority, targetPlatforms, monthlyContentTarget, mainMessage, callToAction, projectLead, relatedFunder
        });

        renderOnboardingStep();
      });
    }

    // Delete campaign row
    modal.querySelectorAll('.ow-del-campaign').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        owCampaigns.splice(idx, 1);
        renderOnboardingStep();
      });
    });

    // Add Evidence button in Step 7
    const addEvBtn = document.getElementById('owAddEvidenceBtn');
    if (addEvBtn) {
      addEvBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('eFile');
        const file = fileInput ? fileInput.files[0] : null;
        if (!file) {
          alert('Please select a file.');
          return;
        }

        const sourceType = document.getElementById('eType').value;
        const campaign = document.getElementById('eCampaign').value;
        const verificationStatus = document.getElementById('eVerification').value;
        const textExcerpt = document.getElementById('eExcerpt').value.trim();

        owEvidence.push({
          id: 'ev_ow_' + Math.floor(Math.random() * 10000000),
          name: file.name,
          sourceType,
          campaign,
          campaign_id: campaign === 'General' ? '' : campaign,
          verificationStatus,
          textExcerpt: textExcerpt || `Ingested file: ${file.name}`,
          dateUploaded: new Date().toISOString().split('T')[0],
          file: file // Store the actual file object
        });

        renderOnboardingStep();
      });
    }

    // Delete evidence row
    modal.querySelectorAll('.ow-del-evidence').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        owEvidence.splice(idx, 1);
        renderOnboardingStep();
      });
    });

    // Run Meeting Agent in Step 8
    const runAgentBtn = document.getElementById('owRunMeetingAgentBtn');
    if (runAgentBtn) {
      runAgentBtn.addEventListener('click', () => {
        const meetingInputText = document.getElementById('owMeetingText').value.trim();
        if (!meetingInputText) {
          alert('Please enter meeting notes or alignment conversation transcript text.');
          return;
        }
        owMeetingText = meetingInputText;
        owLoadingAnalysis = true;
        renderOnboardingStep();

        setTimeout(() => {
          owLoadingAnalysis = false;
          owMeetingSummary = simulateMeetingAgentAnalysis(owMeetingText);
          renderOnboardingStep();
        }, 1500);
      });
    }

    // Approve initial summary checkbox bind in Step 8
    const approveSummaryCheck = document.getElementById('owApproveSummaryCheck');
    if (approveSummaryCheck) {
      approveSummaryCheck.addEventListener('change', (e) => {
        owMeetingSummaryApproved = e.target.checked;
      });
    }

    // Step 9 final activation buttons
    const saveDraftBtn = document.getElementById('owSaveDraftBtn');
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', () => {
        saveClientWorkspace(false, false);
      });
    }

    const approveBriefBtn = document.getElementById('owApproveBriefBtn');
    if (approveBriefBtn) {
      approveBriefBtn.addEventListener('click', () => {
        saveClientWorkspace(true, false);
      });
    }

    const activateAgentsBtn = document.getElementById('owActivateAgentsBtn');
    if (activateAgentsBtn) {
      activateAgentsBtn.addEventListener('click', () => {
        if (!owMeetingSummaryApproved) {
          alert('You must review and approve the Meeting Intelligence Agent summary before activating AI agents.');
          return;
        }
        saveClientWorkspace(true, true);
      });
    }
  }

  function saveCurrentStepInputs() {
    if (owStep === 1) {
      owClient.name = document.getElementById('owName').value.trim();
      owClient.logo = document.getElementById('owLogo').value.trim();
      owClient.website = document.getElementById('owWebsite').value.trim();
      owClient.country = document.getElementById('owCountry').value.trim();
      owClient.sector = document.getElementById('owSector').value.trim();
      owClient.primaryContact = document.getElementById('owContact').value.trim();
      owClient.keyContact = owClient.primaryContact;
      owClient.email = document.getElementById('owEmail').value.trim();
      owClient.phone = document.getElementById('owPhone').value.trim();
      owClient.monthlyFee = parseFloat(document.getElementById('owFee').value) || 0;
      owClient.contractValue = owClient.monthlyFee * 12;
      owClient.clientStatus = document.getElementById('owStatus').value;
      owClient.startDate = document.getElementById('owStart').value;
      owClient.renewalDate = document.getElementById('owEnd').value;
    } else if (owStep === 2) {
      owClient.goalsAchieve = document.getElementById('owGoalAchieve').value.trim();
      owClient.goalsProblem = document.getElementById('owGoalProblem').value.trim();
      owClient.goalsTop3 = document.getElementById('owGoalTop3').value.trim();
      owClient.goalsSuccess = document.getElementById('owGoalSuccess').value.trim();
      owClient.goalsChallenges = document.getElementById('owGoalChallenges').value.trim();
      owClient.goalsSupport = document.getElementById('owGoalSupport').value.trim();
      owClient.notes = owClient.goalsAchieve;
    } else if (owStep === 3) {
      owClient.mission = document.getElementById('owMission').value.trim();
      owClient.shortDesc = document.getElementById('owShortDesc').value.trim();
      owClient.toneOfVoice = document.getElementById('owTone').value.trim();
      owClient.writingStyle = document.getElementById('owStyle').value.trim();
      owClient.wordsToUse = document.getElementById('owWordsUse').value.trim();
      owClient.wordsToAvoid = document.getElementById('owWordsAvoid').value.trim();
      owClient.brandColours = document.getElementById('owColours').value.trim();
      owClient.fonts = document.getElementById('owFonts').value.trim();
      owClient.approvedHashtags = document.getElementById('owHashtags').value.trim();
      owClient.socialHandles = document.getElementById('owHandles').value.trim();
      owClient.canvaTemplates = document.getElementById('owCanva').value.trim();
      owClient.posterExamples = document.getElementById('owPoster').value.trim();
    } else if (owStep === 5) {
      owClient.targetReach = document.getElementById('owAudienceMain').value.trim();
      owClient.audienceCommunity = document.getElementById('owAudienceComm').value.trim();
      owClient.audienceDonor = document.getElementById('owAudienceDonor').value.trim();
      owClient.audienceGovernment = document.getElementById('owAudienceGov').value.trim();
      owClient.audienceYouth = document.getElementById('owAudienceYouth').value.trim();
      owClient.audienceMedia = document.getElementById('owAudienceMedia').value.trim();
      owClient.locations = document.getElementById('owLocations').value.trim();
      owClient.ageGroups = document.getElementById('owAgeGroups').value.trim();
      owClient.languages = document.getElementById('owLanguages').value.trim();
      owClient.culturalConsiderations = document.getElementById('owCultural').value.trim();
      owClient.audienceUnderstanding = document.getElementById('owAudienceUnder').value.trim();
      owClient.audienceAction = document.getElementById('owAudienceAct').value.trim();
    } else if (owStep === 6) {
      owClient.currentFunders = document.getElementById('owFunders').value.trim();
      owClient.grantNames = document.getElementById('owGrants').value.trim();
      owClient.reportingDeadlines = document.getElementById('owDeadlines').value.trim();
      owClient.requiredDonorOutputs = document.getElementById('owOutputs').value.trim();
      owClient.donorLogoRequirements = document.getElementById('owLogoRules').value.trim();
      owClient.funderCommunicationRules = document.getElementById('owCommRules').value.trim();
      owClient.requiredImpactMetrics = document.getElementById('owImpactMetrics').value.trim();
      owClient.requiredEvidence = document.getElementById('owEvidenceReq').value.trim();
      owClient.reportFrequency = document.getElementById('owFrequency').value;
    } else if (owStep === 7) {
      owClient.fbPageUrl = document.getElementById('owFbPageUrl').value.trim();
      owClient.fbFollowers = parseInt(document.getElementById('owFbFollowers').value) || 0;
      owClient.fbAvgReach = parseInt(document.getElementById('owFbAvgReach').value) || 0;
      owClient.fbAvgEngagement = parseFloat(document.getElementById('owFbAvgEngagement').value) || 0.0;
      owClient.igHandle = document.getElementById('owIgHandle').value.trim();
      owClient.igFollowers = parseInt(document.getElementById('owIgFollowers').value) || 0;
      owClient.igAvgReach = parseInt(document.getElementById('owIgAvgReach').value) || 0;
      owClient.igAvgEngagement = parseFloat(document.getElementById('owIgAvgEngagement').value) || 0.0;
      owClient.baselineTopPosts = document.getElementById('owBaselineTopPosts').value.trim();
      owClient.baselineDemographics = document.getElementById('owBaselineDemographics').value.trim();
      owClient.baselineStartDate = document.getElementById('owBaselineStartDate').value;
    } else if (owStep === 9) {
      owMeetingText = document.getElementById('owMeetingText').value.trim();
    }
  }

  function saveClientWorkspace(isBriefApproved, areAgentsActivated) {
    if (!owClient.name) {
      alert('Organisation Name is required to save client workspace.');
      return;
    }

    saveCurrentStepInputs();

    const client_id = owClient.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    
    // Set first campaign as the default properties on the client object itself to pass brief completion checks
    if (owCampaigns.length > 0) {
      const mainCamp = owCampaigns[0];
      owClient.campaignName = mainCamp.name;
      owClient.campaignGoal = mainCamp.goal;
      owClient.campaignStart = mainCamp.startDate;
      owClient.campaignEnd = mainCamp.endDate;
      owClient.campaignMessage = mainCamp.mainMessage;
      owClient.campaignFacts = mainCamp.description;
      owClient.keyFacts = mainCamp.description;
      owClient.campaignCta = mainCamp.callToAction;
      owClient.campaignPlatforms = mainCamp.targetPlatforms;
      owClient.campaignPriority = mainCamp.priority;
      owClient.campaignFrequency = mainCamp.monthlyContentTarget;
    }

    // Set first evidence file upload corresponding type fields on client object
    owEvidence.forEach(e => {
      if (e.sourceType === 'PDF') owClient.evidenceReports = e.name;
      else if (e.sourceType === 'Text') owClient.evidenceNotes = e.name;
      else if (e.sourceType === 'Excel') owClient.evidenceRegisters = e.name;
      else if (e.sourceType === 'Image') owClient.evidencePhotos = e.name;
    });

    const finalClient = {
      ...owClient,
      id: client_id,
      client_id: client_id,
      status: isBriefApproved ? 'green' : 'yellow',
      statusText: isBriefApproved ? 'Healthy' : 'Pending Onboarding',
      isBriefApproved,
      isMeetingSummaryApproved: owMeetingSummaryApproved,
      areAgentsActivated,
      activeProjectsCount: owCampaigns.length || 1,
      reportsDueCount: owClient.reportFrequency === 'Quarterly' ? 1 : 0,
      healthScore: isBriefApproved ? 100 : 50,
      complianceScore: 100,
      projectCompletionScore: 100,
      lastActivity: 'Workspace onboarding completed',
      nextDeadline: owClient.reportingDeadlines || 'None'
    };

    let meetingRecord = null;
    if (owMeetingSummary) {
      meetingRecord = {
        id: 'meet_ow_' + Math.floor(Math.random() * 10000000),
        title: 'Initial Alignment Meeting & Briefing',
        date: new Date().toISOString().split('T')[0],
        notes: owMeetingSummary.summary,
        transcript: owMeetingText,
        status: 'Processed',
        summaryData: owMeetingSummary
      };
      finalClient.onboardingMeetingSummary = owMeetingSummary;
    }

    // Map evidence and campaigns to client_id
    const finalCampaigns = owCampaigns.map(c => ({
      ...c,
      client: client_id,
      client_id: client_id,
      progress: 0,
      assigned: 'Content Calendar Agent',
      status: 'Active'
    }));

    const campaignNameToId = {};
    finalCampaigns.forEach(c => {
      campaignNameToId[c.name] = c.id;
    });

    const finalEvidence = owEvidence.map(e => {
      const campId = campaignNameToId[e.campaign] || '';
      return {
        ...e,
        client: client_id,
        client_id: client_id,
        campaign_id: campId,
        project: e.campaign || 'General',
        uploaded_at: e.uploaded_at || new Date().toISOString()
      };
    });

    // Ingest into central state
    addClientWorkspace(finalClient, finalCampaigns, finalEvidence, meetingRecord);
    
    // Switch to new client
    selectClient(client_id);
    modal.style.display = 'none';

    alert(`Workspace "${finalClient.name}" created successfully!\nBrief Approved: ${isBriefApproved ? 'Yes' : 'No'}\nAI Agents Active: ${areAgentsActivated ? 'Yes' : 'No'}`);
  }

  modal.style.display = 'flex';
  renderOnboardingStep();
}

// 6. Edit Client Profile Modal
export function openEditClientProfileModal(clientId) {
  const client = state.clients.find(c => c.id === clientId);
  if (!client) {
    alert('Client not found.');
    return;
  }

  let clientCampaigns = state.campaigns.filter(c => c.clientId === clientId || c.client === clientId);
  const modal = document.getElementById('globalModalContainer');

  modal.innerHTML = `
    <style>
      .edit-tab-btn {
        color: #64748b;
        background: none;
        border: none;
        padding: 0.6rem 1rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
      }
      .edit-tab-btn:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
      .edit-tab-btn.active {
        color: #4f46e5;
        background: #e0e7ff;
        border-bottom: 2px solid #4f46e5;
      }
      .edit-tab-pane {
        display: none;
      }
      .edit-tab-pane.active {
        display: block;
      }
    </style>
    <div class="modal-dialog modal-lg" style="max-width: 950px; width: 95%;">
      <div class="modal-content" style="border:none; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); overflow:hidden;">
        <div style="background: white; border-radius: 12px; display: flex; flex-direction: column; height: 90vh; max-height: 800px;">
          
          <!-- Modal Header -->
          <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin:0;">Edit Client Profile: ${client.name}</h2>
              <p style="font-size: 0.75rem; color: #64748b; margin: 0.25rem 0 0 0;">Update client briefing parameters, baseline metrics, and active campaigns.</p>
            </div>
            <button type="button" class="btn-close" id="editModalCloseX" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;">&times;</button>
          </div>

          <!-- Tab Headers -->
          <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 0.25rem; padding: 0.5rem 1rem; overflow-x: auto; white-space: nowrap;">
            <button class="edit-tab-btn active" data-tab="basic">📋 Basic & Contact</button>
            <button class="edit-tab-btn" data-tab="goals">🎯 Goals</button>
            <button class="edit-tab-btn" data-tab="brand">🎨 Brand & Voice</button>
            <button class="edit-tab-btn" data-tab="audience">👥 Audience</button>
            <button class="edit-tab-btn" data-tab="funders">💎 Funders & Reports</button>
            <button class="edit-tab-btn" data-tab="baseline">📊 Social Baseline</button>
            <button class="edit-tab-btn" data-tab="campaigns">📁 Campaigns</button>
          </div>

          <!-- Tab Body (Scrollable) -->
          <div style="flex-grow: 1; padding: 1.5rem; overflow-y: auto; background: #f8fafc;" id="editModalBody">
             
             <!-- Tab: Basic & Contact Details -->
             <div class="edit-tab-pane active" id="edit-pane-basic">
               <div class="modal-form-fields-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                 <div class="form-group">
                   <label>Organisation Name</label>
                   <input type="text" id="eName" value="${client.name || ''}" placeholder="e.g. Clean Air Africa" />
                 </div>
                 <div class="form-group">
                   <label>Workspace Logo (Emoji)</label>
                   <input type="text" id="eLogo" value="${client.logo || '🌱'}" placeholder="e.g. 💨" />
                 </div>
                 <div class="form-group">
                   <label>Website URL</label>
                   <input type="text" id="eWebsite" value="${client.website || ''}" placeholder="e.g. www.cleanair.org" />
                 </div>
                 <div class="form-group">
                   <label>Country Base</label>
                   <input type="text" id="eCountry" value="${client.country || ''}" placeholder="e.g. Kenya" />
                 </div>
                 <div class="form-group">
                   <label>Sector Focus</label>
                   <input type="text" id="eSector" value="${client.sector || ''}" placeholder="e.g. Air Quality" />
                 </div>
                 <div class="form-group">
                   <label>Primary Contact Name</label>
                   <input type="text" id="eContact" value="${client.primaryContact || ''}" placeholder="e.g. Dr. John Kiprop" />
                 </div>
                 <div class="form-group">
                   <label>Contact Email</label>
                   <input type="email" id="eEmail" value="${client.email || ''}" placeholder="e.g. contact@cleanair.org" />
                 </div>
                 <div class="form-group">
                   <label>Contact Phone Number</label>
                   <input type="text" id="ePhone" value="${client.phone || ''}" placeholder="e.g. +254 20 555" />
                 </div>
                 <div class="form-group">
                   <label>Monthly Fee (£)</label>
                   <input type="number" id="eFee" value="${client.monthlyFee || 0}" placeholder="e.g. 2500" />
                 </div>
                 <div class="form-group">
                   <label>Contract Value (£)</label>
                   <input type="number" id="eContractValue" value="${client.contractValue || 0}" placeholder="e.g. 30000" />
                 </div>
                 <div class="form-group">
                   <label>Contract Status</label>
                   <select id="eStatus">
                     <option value="Lead" ${client.clientStatus === 'Lead' ? 'selected' : ''}>Lead Onboarding</option>
                     <option value="Active" ${client.clientStatus === 'Active' ? 'selected' : ''}>Active Client</option>
                     <option value="Paused" ${client.clientStatus === 'Paused' ? 'selected' : ''}>Paused Contract</option>
                     <option value="Completed" ${client.clientStatus === 'Completed' ? 'selected' : ''}>Completed Client</option>
                   </select>
                 </div>
                 <div class="form-group">
                   <label>Contract Start Date</label>
                   <input type="date" id="eStart" value="${client.startDate || ''}" />
                 </div>
                 <div class="form-group">
                   <label>Contract Renewal Date</label>
                   <input type="date" id="eEnd" value="${client.renewalDate || ''}" />
                 </div>
               </div>
               <div class="form-group mt-3">
                 <label>Mission Statement</label>
                 <input type="text" id="eMission" value="${client.mission || ''}" placeholder="Core mission statement..." />
               </div>
               <div class="form-group mt-3">
                 <label>Short Organisation Description</label>
                 <textarea id="eShortDesc" style="height:60px;" placeholder="Brief description used in headers...">${client.shortDesc || ''}</textarea>
               </div>
             </div>

             <!-- Tab: Client Goals -->
             <div class="edit-tab-pane" id="edit-pane-goals">
               <div class="modal-form-fields" style="display:flex; flex-direction:column; gap:1rem;">
                 <div class="form-group">
                   <label>What does the client want to achieve?</label>
                   <textarea id="eGoalAchieve" style="height:60px;" placeholder="e.g. Scale school monitoring campaigns...">${client.goalsAchieve || ''}</textarea>
                 </div>
                 <div class="form-group">
                   <label>What problem are they trying to solve?</label>
                   <textarea id="eGoalProblem" style="height:60px;" placeholder="e.g. Health impacts from high soot emissions...">${client.goalsProblem || ''}</textarea>
                 </div>
                 <div class="form-group">
                   <label>What are their top 3 communication goals?</label>
                   <textarea id="eGoalTop3" style="height:60px;" placeholder="List top 3 goals...">${client.goalsTop3 || ''}</textarea>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>What does success look like?</label>
                     <input type="text" id="eGoalSuccess" value="${client.goalsSuccess || ''}" placeholder="Success metric..." />
                   </div>
                   <div class="form-group">
                     <label>Biggest challenges?</label>
                     <input type="text" id="eGoalChallenges" value="${client.goalsChallenges || ''}" placeholder="e.g. Customs delays, regulations..." />
                   </div>
                 </div>
                 <div class="form-group">
                   <label>What support do they expect from IK Comms?</label>
                   <input type="text" id="eGoalSupport" value="${client.goalsSupport || ''}" placeholder="e.g. Social management, Canva briefs..." />
                 </div>
               </div>
             </div>

             <!-- Tab: Brand & Voice -->
             <div class="edit-tab-pane" id="edit-pane-brand">
               <div class="modal-form-fields" style="display:flex; flex-direction:column; gap:1rem;">
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Tone of Voice</label>
                     <input type="text" id="eTone" value="${client.toneOfVoice || ''}" placeholder="e.g. Urgent, Science-backed" />
                   </div>
                   <div class="form-group">
                     <label>Writing Style</label>
                     <input type="text" id="eStyle" value="${client.writingStyle || ''}" placeholder="e.g. Clear, youth-centric" />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Words to Use</label>
                     <input type="text" id="eWordsUse" value="${client.wordsToUse || ''}" placeholder="Comma separated..." />
                   </div>
                   <div class="form-group">
                     <label>Words to Avoid</label>
                     <input type="text" id="eWordsAvoid" value="${client.wordsToAvoid || ''}" placeholder="Avoid words..." />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Brand Colours (Hex)</label>
                     <input type="text" id="eColours" value="${client.brandColours || ''}" placeholder="e.g. #0284c7, #10b981" />
                   </div>
                   <div class="form-group">
                     <label>Fonts</label>
                     <input type="text" id="eFonts" value="${client.fonts || ''}" placeholder="e.g. Outfit, Roboto" />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Approved Hashtags</label>
                     <input type="text" id="eHashtags" value="${client.approvedHashtags || ''}" placeholder="#CleanAir, #Eco" />
                   </div>
                   <div class="form-group">
                     <label>Social Handles</label>
                     <input type="text" id="eHandles" value="${client.socialHandles || ''}" placeholder="@handle" />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Canva Templates Link</label>
                     <input type="text" id="eCanva" value="${client.canvaTemplates || ''}" placeholder="http://canva.com/..." />
                   </div>
                   <div class="form-group">
                     <label>Example Posts Upload / Description</label>
                     <input type="text" id="ePoster" value="${client.posterExamples || ''}" placeholder="Folder links or file names..." />
                   </div>
                 </div>
               </div>
             </div>

             <!-- Tab: Target Audience -->
             <div class="edit-tab-pane" id="edit-pane-audience">
               <div class="modal-form-fields" style="display:flex; flex-direction:column; gap:1rem;">
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Main Target Audience</label>
                     <input type="text" id="eAudienceMain" value="${client.targetReach || ''}" placeholder="Who is key to reach..." />
                   </div>
                   <div class="form-group">
                     <label>Community Audience</label>
                     <input type="text" id="eAudienceComm" value="${client.audienceCommunity || ''}" placeholder="Fence-line communities..." />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Donor Audience</label>
                     <input type="text" id="eAudienceDonor" value="${client.audienceDonor || ''}" placeholder="Clean air foundations..." />
                   </div>
                   <div class="form-group">
                     <label>Government/Policy Audience</label>
                     <input type="text" id="eAudienceGov" value="${client.audienceGovernment || ''}" placeholder="Health ministries..." />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Youth Audience</label>
                     <input type="text" id="eAudienceYouth" value="${client.audienceYouth || ''}" placeholder="School environment clubs..." />
                   </div>
                   <div class="form-group">
                     <label>Media Audience</label>
                     <input type="text" id="eAudienceMedia" value="${client.audienceMedia || ''}" placeholder="Environmental reporters..." />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Geographic Locations</label>
                     <input type="text" id="eLocations" value="${client.locations || ''}" placeholder="e.g. Nairobi, Kenya" />
                   </div>
                   <div class="form-group">
                     <label>Age Groups</label>
                     <input type="text" id="eAgeGroups" value="${client.ageGroups || ''}" placeholder="e.g. Parents 25-50" />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Languages Required</label>
                     <input type="text" id="eLanguages" value="${client.languages || ''}" placeholder="Swahili, English..." />
                   </div>
                   <div class="form-group">
                     <label>Cultural Considerations</label>
                     <input type="text" id="eCultural" value="${client.culturalConsiderations || ''}" placeholder="e.g. Translation dialects, community leaders..." />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>What must audience understand?</label>
                     <input type="text" id="eAudienceUnder" value="${client.audienceUnderstanding || ''}" placeholder="Key message hazard..." />
                   </div>
                   <div class="form-group">
                     <label>What action should they take?</label>
                     <input type="text" id="eAudienceAct" value="${client.audienceAction || ''}" placeholder="Sign petition, join club..." />
                   </div>
                 </div>
               </div>
             </div>

             <!-- Tab: Funders & Reporting -->
             <div class="edit-tab-pane" id="edit-pane-funders">
               <div class="modal-form-fields" style="display:flex; flex-direction:column; gap:1rem;">
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Current Funders</label>
                     <input type="text" id="eFunders" value="${client.currentFunders || ''}" placeholder="UNEP, Sida..." />
                   </div>
                   <div class="form-group">
                     <label>Grant Names</label>
                     <input type="text" id="eGrants" value="${client.grantNames || ''}" placeholder="Breathing Zone Grant..." />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Reporting Deadlines</label>
                     <input type="text" id="eDeadlines" value="${client.reportingDeadlines || ''}" placeholder="Quarterly by 15th..." />
                   </div>
                   <div class="form-group">
                     <label>Required Donor Outputs</label>
                     <input type="text" id="eOutputs" value="${client.requiredDonorOutputs || ''}" placeholder="CSV logs, monthly brief..." />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Donor Logo Rules</label>
                     <input type="text" id="eLogoRules" value="${client.donorLogoRequirements || ''}" placeholder="Consultancy logo secondary..." />
                   </div>
                   <div class="form-group">
                     <label>Funder Communication Rules</label>
                     <input type="text" id="eCommRules" value="${client.funderCommunicationRules || ''}" placeholder="No political lobbying tags..." />
                   </div>
                 </div>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                   <div class="form-group">
                     <label>Required Impact Metrics</label>
                     <input type="text" id="eImpactMetrics" value="${client.requiredImpactMetrics || ''}" placeholder="Sensors, teachers trained..." />
                   </div>
                   <div class="form-group">
                     <label>Evidence Required by Funders</label>
                     <input type="text" id="eEvidenceReq" value="${client.requiredEvidence || ''}" placeholder="Installation photos, sign registers..." />
                   </div>
                 </div>
                 <div class="form-group">
                   <label>Report Frequency</label>
                   <select id="eFrequency">
                     <option value="Monthly" ${client.reportFrequency === 'Monthly' ? 'selected' : ''}>Monthly Report</option>
                     <option value="Quarterly" ${client.reportFrequency === 'Quarterly' ? 'selected' : ''}>Quarterly Report</option>
                     <option value="Annual" ${client.reportFrequency === 'Annual' ? 'selected' : ''}>Annual Report</option>
                     <option value="Ad hoc" ${client.reportFrequency === 'Ad hoc' ? 'selected' : ''}>Ad hoc Report</option>
                   </select>
                 </div>
               </div>
             </div>

             <!-- Tab: Social Media Baseline -->
             <div class="edit-tab-pane" id="edit-pane-baseline">
               <div class="modal-form-fields" style="display:flex; flex-direction:column; gap:1rem;">
                 
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                   <!-- Facebook Column -->
                   <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem; display:flex; flex-direction:column; gap:0.5rem;">
                     <h4 style="margin:0 0 0.25rem 0; font-size:0.8rem; font-weight:700; color:#1877f2; border-bottom:1px solid #e2e8f0; padding-bottom:0.25rem; text-transform:none;">📘 Facebook Baseline</h4>
                     <div class="form-group">
                       <label>Page URL</label>
                       <input type="text" id="eFbPageUrl" value="${client.fbPageUrl || ''}" placeholder="facebook.com/..." />
                     </div>
                     <div class="form-group">
                       <label>Followers</label>
                       <input type="number" id="eFbFollowers" value="${client.fbFollowers || 0}" />
                     </div>
                     <div class="form-group">
                       <label>Avg Monthly Reach</label>
                       <input type="number" id="eFbAvgReach" value="${client.fbAvgReach || 0}" />
                     </div>
                     <div class="form-group">
                       <label>Avg Engagement Rate (%)</label>
                       <input type="number" step="0.1" id="eFbAvgEngagement" value="${client.fbAvgEngagement || 0.0}" />
                     </div>
                   </div>

                   <!-- Instagram Column -->
                   <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem; display:flex; flex-direction:column; gap:0.5rem;">
                     <h4 style="margin:0 0 0.25rem 0; font-size:0.8rem; font-weight:700; color:#c13584; border-bottom:1px solid #e2e8f0; padding-bottom:0.25rem; text-transform:none;">📸 Instagram Baseline</h4>
                     <div class="form-group">
                       <label>Handle</label>
                       <input type="text" id="eIgHandle" value="${client.igHandle || ''}" placeholder="@..." />
                     </div>
                     <div class="form-group">
                       <label>Followers</label>
                       <input type="number" id="eIgFollowers" value="${client.igFollowers || 0}" />
                     </div>
                     <div class="form-group">
                       <label>Avg Monthly Reach</label>
                       <input type="number" id="eIgAvgReach" value="${client.igAvgReach || 0}" />
                     </div>
                     <div class="form-group">
                       <label>Avg Engagement Rate (%)</label>
                       <input type="number" step="0.1" id="eIgAvgEngagement" value="${client.igAvgEngagement || 0.0}" />
                     </div>
                   </div>
                 </div>

                 <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:1rem;">
                   <div>
                     <div class="form-group">
                       <label>Top Social Media Posts (Description & Performance)</label>
                       <textarea id="eBaselineTopPosts" style="height:60px;" placeholder="e.g. 1. Post Name (12K reach)...">${client.baselineTopPosts || ''}</textarea>
                     </div>
                     <div class="form-group">
                       <label>Audience Demographics</label>
                       <textarea id="eBaselineDemographics" style="height:50px;" placeholder="e.g. 60% female, Durban based...">${client.baselineDemographics || ''}</textarea>
                     </div>
                   </div>
                   
                   <div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem; display:flex; flex-direction:column; gap:0.5rem; justify-content:center;">
                     <div class="form-group" style="margin:0;">
                       <label>Baseline Start Date</label>
                       <input type="date" id="eBaselineStartDate" value="${client.baselineStartDate || ''}" />
                     </div>
                     <p style="font-size:0.65rem; color:#64748b; line-height:1.4; margin:0;">
                       These values represent the starting benchmark. All future report cards will be compared against these figures.
                     </p>
                   </div>
                 </div>
               </div>
             </div>

             <!-- Tab: Campaigns -->
             <div class="edit-tab-pane" id="edit-pane-campaigns">
               <div class="modal-form-fields" style="display:flex; flex-direction:column; gap:1rem;">
                 
                 <!-- Active Campaigns List -->
                 <div id="editCampaignsList">
                    <!-- Dynamic rendering -->
                 </div>

                 <!-- Add New Campaign Section -->
                 <div style="background:#f1f5f9; padding:1rem; border-radius:8px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:0.75rem; margin-top:0.5rem;">
                   <h4 style="margin:0 0 0.25rem 0; font-size:0.8rem; font-weight:700; color:#475569; border-bottom:1px solid #cbd5e1; padding-bottom:0.25rem;">Create & Link New Campaign</h4>
                   
                   <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                     <div class="form-group">
                       <label>Campaign Name</label>
                       <input type="text" id="ecName" placeholder="e.g. Nairobi School Zones" />
                     </div>
                     <div class="form-group">
                       <label>Campaign Goal</label>
                       <input type="text" id="ecGoal" placeholder="e.g. Deploy 10 monitors" />
                     </div>
                   </div>

                   <div class="form-group">
                     <label>Campaign Description</label>
                     <textarea id="ecDesc" style="height:45px;" placeholder="Brief description..."></textarea>
                   </div>

                   <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem;">
                     <div class="form-group">
                       <label>Priority</label>
                       <select id="ecPriority">
                         <option value="High">High Priority</option>
                         <option value="Medium">Medium Priority</option>
                         <option value="Low">Low Priority</option>
                       </select>
                     </div>
                     <div class="form-group">
                       <label>Start Date</label>
                       <input type="date" id="ecStart" value="${new Date().toISOString().split('T')[0]}" />
                     </div>
                     <div class="form-group">
                       <label>End Date</label>
                       <input type="date" id="ecEnd" value="${new Date(Date.now() + 15552000000).toISOString().split('T')[0]}" />
                     </div>
                   </div>

                   <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                     <div class="form-group">
                       <label>Target Platforms</label>
                       <input type="text" id="ecPlatforms" placeholder="Facebook, WhatsApp..." />
                     </div>
                     <div class="form-group">
                       <label>Content Target (monthly)</label>
                       <input type="text" id="ecTarget" placeholder="e.g. 8 updates/mo" />
                     </div>
                   </div>

                   <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                     <div class="form-group">
                       <label>Main Campaign Message</label>
                       <input type="text" id="ecMessage" placeholder="Every child has a right to breathe..." />
                     </div>
                     <div class="form-group">
                       <label>Call to Action (CTA)</label>
                       <input type="text" id="ecCta" placeholder="Lobby for buffer zones..." />
                     </div>
                   </div>

                   <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                     <div class="form-group">
                       <label>Project Lead</label>
                       <input type="text" id="ecLead" placeholder="Staff lead..." />
                     </div>
                     <div class="form-group">
                       <label>Related Funder</label>
                       <input type="text" id="ecFunder" placeholder="Funder name..." />
                     </div>
                   </div>

                   <button type="button" class="btn btn-outline" id="btnEditAddCampaign" style="border-color:#4f46e5; color:#4f46e5; margin-top:0.25rem; cursor:pointer;">+ Add Campaign to Database</button>
                 </div>
               </div>
             </div>

          </div>

          <!-- Reason for change (for Approved Briefs) -->
          ${client.isBriefApproved ? `
            <div style="background:#f5f3ff; border:1px solid #c7d2fe; padding:0.75rem 1rem; border-radius:8px; margin: 0 1.5rem 1rem 1.5rem; font-size:0.8rem; color:#3730a3; display:flex; flex-direction:column; gap:0.3rem;">
              <strong style="color:#4f46e5; display:flex; align-items:center; gap:0.25rem; font-size:0.85rem;">📝 Brief is Approved — Reason for Change Required</strong>
              <span style="font-size:0.7rem; color:#6366f1;">Edits will be saved as a proposed Change Log (Manual Profile Change) requiring admin approval before updating the active profile.</span>
              <input type="text" id="editProfileReason" placeholder="e.g. Updated monthly fee and target audience demographics based on contract addendum." style="width:100%; font-size:0.8rem; padding:0.4rem 0.6rem; border-radius:4px; border:1px solid #cbd5e1; outline:none; background:white; margin-top:0.25rem;" required />
            </div>
          ` : ''}

          <!-- Modal Footer -->
          <div style="background: white; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.75rem; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
            <button class="btn btn-outline" id="editModalCancelBtn" style="cursor:pointer;">Cancel</button>
            <button class="btn btn-primary" id="editModalSaveBtn" style="background:var(--primary-color); color:white; font-weight:600; padding:0.5rem 1.5rem; cursor:pointer;">Save Changes</button>
          </div>

        </div>
      </div>
    </div>
  `;

  // Bind Tabs visibility toggle
  modal.querySelectorAll('.edit-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.edit-tab-btn').forEach(b => b.classList.remove('active'));
      modal.querySelectorAll('.edit-tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      const targetPane = modal.querySelector(`#edit-pane-${tabId}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Render campaigns list helper
  const renderCampaignsList = () => {
    const listContainer = document.getElementById('editCampaignsList');
    if (!listContainer) return;
    
    // Refresh campaign data from state
    clientCampaigns = state.campaigns.filter(c => c.clientId === clientId || c.client === clientId);
    
    if (clientCampaigns.length === 0) {
      listContainer.innerHTML = `<p style="font-size:0.8rem; color:#64748b; font-style:italic; text-align:center; padding:1rem; border:1px dashed #cbd5e1; border-radius:6px; margin:0;">No campaigns registered. Add a campaign below.</p>`;
      return;
    }
    
    listContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem; max-height: 200px; overflow-y: auto;">
        ${clientCampaigns.map(c => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:0.6rem 0.8rem; border-radius:6px; border:1px solid #cbd5e1; font-size:0.8rem;">
            <div>
              <strong>${c.name}</strong> <span style="font-size:0.75rem; color:#64748b;">(Goal: ${c.goal || 'None'} • Priority: ${c.priority || 'Medium'} • Status: ${c.status || 'Active'})</span>
            </div>
            <button type="button" class="btn btn-xs btn-outline btn-edit-campaign-del" data-id="${c.id}" style="color:var(--danger-color); border-color:#fca5a5; padding: 0.1rem 0.4rem; font-size: 0.7rem; cursor:pointer;">Delete</button>
          </div>
        `).join('')}
      </div>
    `;
    
    // Bind deletes
    listContainer.querySelectorAll('.btn-edit-campaign-del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const campaign = clientCampaigns.find(c => c.id === id);
        if (confirm(`Are you sure you want to delete campaign "${campaign.name}"?`)) {
          const res = await deleteCampaign(id);
          if (res) {
            const data = await res.json();
            if (data.archived) {
              alert(`Campaign has linked records and has been archived instead of deleted.`);
            } else {
              alert(`Campaign deleted successfully.`);
            }
            renderCampaignsList();
          } else {
            alert('Failed to delete campaign.');
          }
        }
      });
    });
  };

  // Render campaigns list initially
  renderCampaignsList();

  // Add Campaign button
  const addCampBtn = document.getElementById('btnEditAddCampaign');
  if (addCampBtn) {
    addCampBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const name = document.getElementById('ecName').value.trim();
      const goal = document.getElementById('ecGoal').value.trim();
      const description = document.getElementById('ecDesc').value.trim();
      const priority = document.getElementById('ecPriority').value;
      const startDate = document.getElementById('ecStart').value;
      const endDate = document.getElementById('ecEnd').value;
      const targetPlatforms = document.getElementById('ecPlatforms').value.trim();
      const monthlyContentTarget = document.getElementById('ecTarget').value.trim();
      const mainMessage = document.getElementById('ecMessage').value.trim();
      const callToAction = document.getElementById('ecCta').value.trim();
      const projectLead = document.getElementById('ecLead').value.trim();
      const relatedFunder = document.getElementById('ecFunder').value.trim();

      if (!name) {
        alert('Campaign Name is required.');
        return;
      }

      const res = await addCampaign(clientId, {
        name, goal, description, priority, startDate, endDate, targetPlatforms, monthlyContentTarget, mainMessage, callToAction, projectLead, relatedFunder, status: 'Active'
      });

      if (res && res.ok) {
        alert('Campaign added successfully!');
        // Clear inputs
        document.getElementById('ecName').value = '';
        document.getElementById('ecGoal').value = '';
        document.getElementById('ecDesc').value = '';
        document.getElementById('ecPlatforms').value = '';
        document.getElementById('ecTarget').value = '';
        document.getElementById('ecMessage').value = '';
        document.getElementById('ecCta').value = '';
        document.getElementById('ecLead').value = '';
        document.getElementById('ecFunder').value = '';
        
        renderCampaignsList();
      } else {
        alert('Failed to add campaign.');
      }
    });
  }

  // Cancel and Close handlers
  const closeX = document.getElementById('editModalCloseX');
  if (closeX) {
    closeX.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  const cancelBtn = document.getElementById('editModalCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // Save changes handler
  const saveBtn = document.getElementById('editModalSaveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      // Gather input values
      const formValues = {
        name: document.getElementById('eName').value.trim(),
        logo: document.getElementById('eLogo').value.trim(),
        website: document.getElementById('eWebsite').value.trim(),
        country: document.getElementById('eCountry').value.trim(),
        sector: document.getElementById('eSector').value.trim(),
        primaryContact: document.getElementById('eContact').value.trim(),
        email: document.getElementById('eEmail').value.trim(),
        phone: document.getElementById('ePhone').value.trim(),
        monthlyFee: parseFloat(document.getElementById('eFee').value) || 0,
        contractValue: parseFloat(document.getElementById('eContractValue').value) || 0,
        startDate: document.getElementById('eStart').value || null,
        renewalDate: document.getElementById('eEnd').value || null,
        clientStatus: document.getElementById('eStatus').value,
        mission: document.getElementById('eMission').value.trim(),
        shortDesc: document.getElementById('eShortDesc').value.trim(),

        goalsAchieve: document.getElementById('eGoalAchieve').value.trim(),
        goalsProblem: document.getElementById('eGoalProblem').value.trim(),
        goalsTop3: document.getElementById('eGoalTop3').value.trim(),
        goalsSuccess: document.getElementById('eGoalSuccess').value.trim(),
        goalsChallenges: document.getElementById('eGoalChallenges').value.trim(),
        goalsSupport: document.getElementById('eGoalSupport').value.trim(),

        brandColours: document.getElementById('eColours').value.trim(),
        fonts: document.getElementById('eFonts').value.trim(),
        toneOfVoice: document.getElementById('eTone').value.trim(),
        writingStyle: document.getElementById('eStyle').value.trim(),
        wordsToUse: document.getElementById('eWordsUse').value.trim(),
        wordsToAvoid: document.getElementById('eWordsAvoid').value.trim(),
        approvedHashtags: document.getElementById('eHashtags').value.trim(),
        socialHandles: document.getElementById('eHandles').value.trim(),
        canvaTemplates: document.getElementById('eCanva').value.trim(),
        posterExamples: document.getElementById('ePoster').value.trim(),

        targetReach: document.getElementById('eAudienceMain').value.trim(),
        audienceCommunity: document.getElementById('eAudienceComm').value.trim(),
        audienceDonor: document.getElementById('eAudienceDonor').value.trim(),
        audienceGovernment: document.getElementById('eAudienceGov').value.trim(),
        audienceYouth: document.getElementById('eAudienceYouth').value.trim(),
        audienceMedia: document.getElementById('eAudienceMedia').value.trim(),
        locations: document.getElementById('eLocations').value.trim(),
        ageGroups: document.getElementById('eAgeGroups').value.trim(),
        languages: document.getElementById('eLanguages').value.trim(),
        culturalConsiderations: document.getElementById('eCultural').value.trim(),
        audienceUnderstanding: document.getElementById('eAudienceUnder').value.trim(),
        audienceAction: document.getElementById('eAudienceAct').value.trim(),

        currentFunders: document.getElementById('eFunders').value.trim(),
        grantNames: document.getElementById('eGrants').value.trim(),
        reportingDeadlines: document.getElementById('eDeadlines').value.trim(),
        requiredDonorOutputs: document.getElementById('eOutputs').value.trim(),
        donorLogoRequirements: document.getElementById('eLogoRules').value.trim(),
        funderCommunicationRules: document.getElementById('eCommRules').value.trim(),
        requiredImpactMetrics: document.getElementById('eImpactMetrics').value.trim(),
        requiredEvidence: document.getElementById('eEvidenceReq').value.trim(),
        reportFrequency: document.getElementById('eFrequency').value,

        fbPageUrl: document.getElementById('eFbPageUrl').value.trim(),
        fbFollowers: parseInt(document.getElementById('eFbFollowers').value) || 0,
        fbAvgReach: parseInt(document.getElementById('eFbAvgReach').value) || 0,
        fbAvgEngagement: parseFloat(document.getElementById('eFbAvgEngagement').value) || 0.0,
        igHandle: document.getElementById('eIgHandle').value.trim(),
        igFollowers: parseInt(document.getElementById('eIgFollowers').value) || 0,
        igAvgReach: parseInt(document.getElementById('eIgAvgReach').value) || 0,
        igAvgEngagement: parseFloat(document.getElementById('eIgAvgEngagement').value) || 0.0,
        baselineTopPosts: document.getElementById('eBaselineTopPosts').value.trim(),
        baselineDemographics: document.getElementById('eBaselineDemographics').value.trim(),
        baselineStartDate: document.getElementById('eBaselineStartDate').value || null
      };

      if (!formValues.name) {
        alert('Organisation Name is required.');
        return;
      }

      // Fields list for comparison
      const BRIEF_FIELDS = {
        name: "Organisation Name",
        logo: "Workspace Logo (Emoji)",
        website: "Website URL",
        country: "Country Base",
        sector: "Sector Focus",
        primaryContact: "Primary Contact Name",
        email: "Contact Email",
        phone: "Contact Phone Number",
        monthlyFee: "Monthly Fee (£)",
        contractValue: "Contract Value (£)",
        startDate: "Contract Start Date",
        renewalDate: "Contract End/Renewal Date",
        clientStatus: "Contract Status",
        goalsAchieve: "What client wants to achieve",
        goalsProblem: "Problem client is solving",
        goalsTop3: "Top 3 communication goals",
        goalsSuccess: "What success looks like",
        goalsChallenges: "Biggest challenges",
        goalsSupport: "IK support expected",
        mission: "Mission Statement",
        shortDesc: "Short Organisation Description",
        toneOfVoice: "Tone of Voice",
        writingStyle: "Writing Style",
        wordsToUse: "Words to Use",
        wordsToAvoid: "Words to Avoid",
        brandColours: "Brand Colours",
        fonts: "Fonts",
        approvedHashtags: "Approved Hashtags",
        socialHandles: "Social Handles",
        canvaTemplates: "Canva Templates Link",
        posterExamples: "Example Posts Upload / Description",
        targetReach: "Main Target Audience",
        audienceCommunity: "Community Audience",
        audienceDonor: "Donor Audience",
        audienceGovernment: "Government/Policy Audience",
        audienceYouth: "Youth Audience",
        audienceMedia: "Media Audience",
        locations: "Geographic Locations",
        ageGroups: "Age Groups",
        languages: "Languages Required",
        culturalConsiderations: "Cultural Considerations",
        audienceUnderstanding: "What audience must understand",
        audienceAction: "What action audience should take",
        currentFunders: "Current Funders",
        grantNames: "Grant Names",
        reportingDeadlines: "Reporting Deadlines",
        requiredDonorOutputs: "Required Donor Outputs",
        donorLogoRequirements: "Donor Logo Rules",
        funderCommunicationRules: "Funder Communication Rules",
        requiredImpactMetrics: "Required Impact Metrics",
        requiredEvidence: "Evidence Required by Funders",
        reportFrequency: "Report Frequency",
        fbPageUrl: "Facebook Page URL",
        fbFollowers: "Facebook Followers",
        fbAvgReach: "Facebook Average Reach",
        fbAvgEngagement: "Facebook Average Engagement Rate (%)",
        igHandle: "Instagram Handle",
        igFollowers: "Instagram Followers",
        igAvgReach: "Instagram Average Reach",
        igAvgEngagement: "Instagram Average Engagement Rate (%)",
        baselineTopPosts: "Top Social Media Posts",
        baselineDemographics: "Audience Demographics",
        baselineStartDate: "Baseline Start Date"
      };

      const changes = [];
      for (const field in BRIEF_FIELDS) {
        let oldVal = client[field];
        let newVal = formValues[field];

        if (oldVal === undefined || oldVal === null) oldVal = '';
        if (newVal === undefined || newVal === null) newVal = '';

        if (String(oldVal).trim() !== String(newVal).trim()) {
          changes.push({
            field,
            label: BRIEF_FIELDS[field],
            oldVal: String(oldVal),
            newVal: String(newVal)
          });
        }
      }

      if (changes.length === 0) {
        alert('No changes were made to the profile briefing fields.');
        modal.style.display = 'none';
        return;
      }

      if (client.isBriefApproved) {
        const reasonInput = document.getElementById('editProfileReason');
        const reasonText = reasonInput ? reasonInput.value.trim() : '';
        if (!reasonText) {
          alert('Please enter a reason for this change. The client brief is already approved.');
          return;
        }

        // Attach reason to proposed changes
        changes.forEach(c => c.reason = reasonText);

        await proposeClientBriefChangeLog(clientId, changes);
        alert('Proposed changes saved! A proposed Change Log (Manual Profile Change) has been created and requires admin approval.');
      } else {
        // Direct save
        await updateClientBrief(clientId, {
          ...formValues,
          reason: 'Direct profile edit (Brief not yet approved)'
        });
        alert('Client profile updated successfully!');
      }

      modal.style.display = 'none';
      const container = document.getElementById('mainViewContainer');
      renderClientProfile(container, clientId);
    });
  }

  modal.style.display = 'flex';
}
