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
  updateClientBrief
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
                    <span class="status-badge ${c.status}">
                      <span class="dot"></span> ${c.statusText}
                    </span>
                  </td>
                  <td>${c.activeProjectsCount}</td>
                  <td>${c.reportsDueCount}</td>
                  <td><strong>£${c.monthlyFee.toLocaleString()}</strong></td>
                  <td><span class="deadline-txt ${c.status === 'red' ? 'danger' : ''}">${c.nextDeadline}</span></td>
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
      ${state.clients.map(c => `
        <div class="client-card card hover-card-clickable" data-client-id="${c.id}">
          <div class="client-card-top">
            <span class="client-card-logo">${c.logo}</span>
            <span class="status-badge ${c.status}">
              <span class="dot"></span> ${c.statusText}
            </span>
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
      `).join('')}
    </div>
  `;

  // Attach search/filter logic
  const searchInput = document.getElementById('clientSearchInput');
  const statusFilter = document.getElementById('clientStatusFilter');
  const gridContainer = document.getElementById('clientsGridContainer');

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

    gridContainer.innerHTML = filtered.length > 0 ? filtered.map(c => `
      <div class="client-card card hover-card-clickable" data-client-id="${c.id}">
        <div class="client-card-top">
          <span class="client-card-logo">${c.logo}</span>
          <span class="status-badge ${c.status}">
            <span class="dot"></span> ${c.statusText}
          </span>
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
    `).join('') : '<div class="chart-empty w-full">No matching NGO clients found.</div>';

    // Rebind cards
    gridContainer.querySelectorAll('.client-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-client-id');
        selectClient(id);
        window.location.hash = `#clients?id=${id}`;
      });
    });
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
    <div class="profile-back-row">
      <a href="#clients" class="back-link">← Back to Clients Database</a>
    </div>

    <div class="profile-header-card card mt-4">
      <div class="profile-header-main">
        <span class="profile-lg-logo">${client.logo}</span>
        <div>
          <div class="profile-title-badges">
            <h1>${client.name}</h1>
            <span class="status-badge ${client.status}">
              <span class="dot"></span> ${client.statusText}
            </span>
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
}

// RENDER CONTENT PIPELINE KANBAN BOARD
let activePlatformFilter = 'All';

export function renderContentModule(container) {
  const columns = ['Ideas', 'Drafting', 'Review', 'Approval', 'Scheduled', 'Published'];
  const clientsFilter = state.currentUserRole === 'admin' ? state.clients : state.clients.filter(c => c.id === state.selectedClientId);
  const platforms = ['All', 'LinkedIn', 'Facebook', 'Instagram', 'WhatsApp', 'Email Newsletter', 'Website'];

  container.innerHTML = `
    <div class="section-header-row mb-6">
      <div>
        <h1>Content Pipeline Board</h1>
        <p class="subtitle">Review and schedule AI social media drafts, newsletters, and stories</p>
      </div>
      <button class="btn btn-primary" id="addContentIdeaBtn">+ Create Content Idea</button>
    </div>

    <!-- Buffer-style platform filter bar -->
    <div class="kanban-filters-row">
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
                let appStatusClass = c.approvalStatus.toLowerCase();
                
                return `
                  <div class="content-card card" draggable="true" data-card-id="${c.id}">
                    <div class="card-tag-row">
                      <span class="platform-badge">${c.platform}</span>
                      ${c.aiGenerated ? '<span class="ai-badge">🤖 AI</span>' : ''}
                    </div>
                    <h4 class="card-title">${c.title}</h4>
                    <p class="card-campaign">${c.campaign}</p>
                    
                    <div class="card-client-row">
                      <span class="mini-logo">${ngo.logo}</span>
                      <span class="mini-name">${ngo.name}</span>
                    </div>

                    <div class="card-footer mt-4">
                      <span class="approval-tag ${appStatusClass}">${c.approvalStatus}</span>
                      
                      <div class="card-actions">
                        ${col === 'Approval' ? `
                          <button class="btn btn-xs btn-outline kanban-approve-btn" data-card-id="${c.id}">Approve</button>
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

  // Bind Actions
  const addIdeaBtn = document.getElementById('addContentIdeaBtn');
  if (addIdeaBtn) {
    addIdeaBtn.addEventListener('click', () => {
      openNewIdeaModal(clientsFilter);
    });
  }

  // Platform Filter buttons bind
  container.querySelectorAll('.platform-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activePlatformFilter = btn.getAttribute('data-platform');
      renderContentModule(container);
    });
  });

  // Content card click (opens Buffer style composer)
  container.querySelectorAll('.content-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.shift-btn') || e.target.closest('.kanban-approve-btn')) return;
      const cardId = card.getAttribute('data-card-id');
      const item = state.content.find(c => c.id === cardId);
      if (item) {
        openBufferComposerModal(item);
      }
    });
  });

  // Column shift handlers
  container.querySelectorAll('.shift-btn').forEach(btn => {
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
  container.querySelectorAll('.kanban-approve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cardId = btn.getAttribute('data-card-id');
      approveContentCard(cardId);
    });
  });
}

// 6. Buffer Composer & Preview Modal
function openBufferComposerModal(item) {
  const modal = document.getElementById('globalModalContainer');
  const ngo = state.clients.find(cl => cl.id === item.client) || { name: 'Client NGO', logo: '🌱', primaryContact: 'Bobby Peek' };
  
  let activePreviewPlatform = item.platform;
  if (!['LinkedIn', 'Facebook', 'Instagram'].includes(activePreviewPlatform)) {
    activePreviewPlatform = 'LinkedIn';
  }

  let initialText = getSocialDraftText(item, ngo);

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
              <div class="composer-editor-side">
                <div class="form-group">
                  <label>Edit Post Draft</label>
                  <textarea id="composerTextarea" class="composer-input-textarea" placeholder="Type social copy here...">${initialText}</textarea>
                </div>
                <div class="composer-meta-details">
                  <div class="detail-row"><span>NGO Client:</span> <strong>${ngo.name}</strong></div>
                  <div class="detail-row"><span>Campaign Scope:</span> <strong>${item.campaign}</strong></div>
                  <div class="detail-row"><span>Target Channel:</span> <span class="platform-badge">${item.platform}</span></div>
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

            <div class="modal-footer mt-6">
              <button class="btn btn-outline" id="copyComposerTextBtn">Copy Text</button>
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
                <span>${ngo.primaryContact} • 1st</span>
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

    document.getElementById('approveComposerScheduleBtn').addEventListener('click', () => {
      const text = document.getElementById('composerTextarea').value;
      item.title = text.split('\n')[0].substring(0, 30) + '...';
      
      updateContentStatus(item.id, 'Scheduled');
      approveContentCard(item.id);
      
      alert('Draft approved! Moved to Buffer Queue schedule.');
      modal.style.display = 'none';
      
      const viewContainer = document.getElementById('mainViewContainer');
      renderContentModule(viewContainer);
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

  // Global KPI calculations for top cards
  const activeAgentsCount = state.agents.filter(a => a.status !== 'Disabled').length;
  const contentDraftsCount = state.aiOutputs.filter(o => o.approvalStatus === 'Draft').length;
  const waitingApprovalCount = state.aiOutputs.filter(o => o.approvalStatus === 'Internal Review' || o.approvalStatus === 'Sent to Client').length;
  const evidenceCount = state.evidence.length;
  const reportsDueCount = state.reports.filter(r => r.status !== 'Submitted').length;
  const activeCampaignsCount = state.campaigns.filter(c => c.status === 'Active' || c.status === 'Running').length;

  // Render Layout HTML
  container.innerHTML = `
    <div class="control-room-layout">
      <!-- Section Header -->
      <div class="section-header-row mb-2">
        <div>
          <h1>AI Agent Control Room</h1>
          <p class="subtitle">Manage client content creation, storytelling, donor communication and campaign delivery from one workspace.</p>
        </div>
      </div>

      <!-- Top KPI Summary Row (Dashboard Layout #8) -->
      <div class="kpi-row-6 mb-4">
        <div class="kpi-card">
          <div class="kpi-icon primary">🤖</div>
          <div class="kpi-info">
            <span class="kpi-label">Active Agents</span>
            <span class="kpi-value">${activeAgentsCount} Running</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon info">📝</div>
          <div class="kpi-info">
            <span class="kpi-label">Content Drafts</span>
            <span class="kpi-value">${contentDraftsCount} Drafts</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon warning">⏳</div>
          <div class="kpi-info">
            <span class="kpi-label">Waiting Approval</span>
            <span class="kpi-value">${waitingApprovalCount} Items</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon success">📥</div>
          <div class="kpi-info">
            <span class="kpi-label">Evidence Uploaded</span>
            <span class="kpi-value">${evidenceCount} Sources</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon danger">📋</div>
          <div class="kpi-info">
            <span class="kpi-label">Reports Due</span>
            <span class="kpi-value">${reportsDueCount} Required</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon secondary">🔥</div>
          <div class="kpi-info">
            <span class="kpi-label">Active Campaigns</span>
            <span class="kpi-value">${activeCampaignsCount} Active</span>
          </div>
        </div>
      </div>

      <!-- Workspace switcher dropdown (Dashboard Layout #8 & Client selectors) -->
      <div class="card mb-4" style="padding: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.25rem;">🏢</span>
            <div>
              <strong style="font-size: 0.95rem; display: block;">Active Client Workspace</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Switch to view score, documents, and trigger campaigns</span>
            </div>
          </div>
          <div>
            <select id="crClientSelector" class="form-select" style="min-width: 250px; padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); font-weight: 500;">
              ${state.clients.map(c => `
                <option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>
                  ${c.logo} ${c.name} (${c.isDemo ? 'Demo Data' : 'Real Client'})
                </option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Main Columns Grid -->
      <div class="cr-grid">
        
        <!-- Left Side Column -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- 1. Client Brief Completion Score Panel (Section #1) -->
          <div class="card brief-completion-card status-${briefStatus.status.toLowerCase()}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <div>
                <h3 style="font-size: 1.1rem; font-weight: 600;">Client Brief Completion: <span class="text-${briefStatus.status.toLowerCase()}">${briefStatus.score}%</span></h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">Check list of requirements for AI generation capabilities</p>
              </div>
              <span class="badge-status ${briefStatus.status.toLowerCase()}">${briefStatus.statusText}</span>
            </div>
            
            <div class="brief-progress-bar-container">
              <div class="brief-progress-bar bg-${briefStatus.status.toLowerCase()}" style="width: ${briefStatus.score}%;"></div>
            </div>

            <!-- Missing information Alerts (Section #1 & #8) -->
            <div style="margin-top: 1rem;">
              <h4 style="font-size: 0.85rem; font-weight: 600; color: var(--text-color);">Missing Information Alert Summary</h4>
              ${briefStatus.score === 100 ? `
                <p style="font-size: 0.8rem; color: var(--success-color); font-weight: 500; margin-top: 0.5rem;">🎉 Client brief is 100% complete! Agents have maximum contextual accuracy.</p>
              ` : `
                <div class="missing-info-grid">
                  ${Object.keys(briefStatus.missing).map(sec => {
                    const missingFields = briefStatus.missing[sec];
                    if (missingFields.length === 0) return '';
                    const sectionTitles = {
                      ngoProfile: 'A. NGO Profile',
                      brandIdentity: 'B. Brand Identity',
                      targetAudience: 'C. Target Audience',
                      campaignInfo: 'D. Campaign Information',
                      projectEvidence: 'E. Project Evidence',
                      donorInfo: 'F. Donor & Funder Info',
                      contentRequirements: 'G. Content Requirements'
                    };
                    return `
                      <div class="missing-info-section">
                        <h4>${sectionTitles[sec] || sec}</h4>
                        <ul class="missing-fields-list">
                          ${missingFields.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
              <button class="btn btn-primary" id="editBriefBtn">✏️ Edit Client Brief</button>
            </div>
          </div>

          <!-- 2. Agent Cards Grid (Section #2) -->
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.75rem;">🤖 AI Agent Co-workers</h2>
            <div class="agents-sub-grid">
              ${state.agents.map(a => {
                let checklist = [];
                let isReady = true;

                if (a.id === 'storytelling') {
                  checklist = [
                    { name: 'Campaign brief completed', met: !!client.campaignName && !!client.campaignGoal },
                    { name: 'Reports / Research available', met: !!client.evidenceReports || !!client.evidenceResearch },
                    { name: 'Project evidence attached', met: !!client.evidenceNotes || !!client.evidenceRegisters || clientEvidence.length > 0 },
                    { name: 'Target audience selected', met: !!client.targetReach },
                    { name: 'Tone of voice selected', met: !!client.toneOfVoice },
                    { name: 'Key message completed', met: !!client.campaignMessage },
                    { name: 'Photos / evidence available', met: !!client.evidencePhotos || !!client.evidenceVideos }
                  ];
                } else if (a.id === 'socialmedia') {
                  checklist = [
                    { name: 'Client profile completed', met: !!client.name && !!client.website },
                    { name: 'Campaign brief completed', met: !!client.campaignGoal },
                    { name: 'Target audience selected', met: !!client.targetReach },
                    { name: 'Brand voice selected', met: !!client.toneOfVoice },
                    { name: 'Platform selected', met: !!client.contentPlatforms || !!client.campaignPlatforms },
                    { name: 'Source evidence attached', met: clientEvidence.length > 0 },
                    { name: 'Approval person selected', met: !!client.primaryContact }
                  ];
                } else if (a.id === 'canva-brief') {
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
                } else if (a.id === 'calendar') {
                  checklist = [
                    { name: 'Campaign dates ready', met: !!client.campaignStart && !!client.campaignEnd },
                    { name: 'Awareness days ready', met: true },
                    { name: 'Posting frequency configured', met: !!client.campaignFrequency },
                    { name: 'Platforms selected', met: !!client.contentPlatforms },
                    { name: 'Campaign priorities active', met: !!client.campaignPriority },
                    { name: 'Donor deadlines tagged', met: !!client.reportingDeadlines }
                  ];
                } else if (a.id === 'reporting') {
                  checklist = [
                    { name: 'Project data / Impact ready', met: !!client.requiredImpactMetrics },
                    { name: 'Photos / Media ready', met: !!client.evidencePhotos },
                    { name: 'Attendance records ready', met: !!client.evidenceRegisters },
                    { name: 'Survey results configured', met: !!client.evidenceSurveys || clientEvidence.some(ev => ev.contentType === 'Survey results') },
                    { name: 'Donor requirements defined', met: !!client.requiredDonorOutputs },
                    { name: 'Reporting period active', met: !!client.reportingDeadlines }
                  ];
                } else if (a.id === 'analytics') {
                  checklist = [
                    { name: 'Social metrics available', met: true },
                    { name: 'Reach & engagement track', met: true },
                    { name: 'Website clicks log', met: true },
                    { name: 'Top-performing posts list', met: clientOutputs.length > 0 }
                  ];
                } else if (a.id === 'funding-comm') {
                  checklist = [
                    { name: 'Funder details verified', met: !!client.currentFunders },
                    { name: 'Project results compiled', met: !!client.requiredImpactMetrics },
                    { name: 'Impact stories generated', met: true },
                    { name: 'Evidence documents linked', met: clientEvidence.length > 0 },
                    { name: 'Funding goals clear', met: !!client.campaignGoal },
                    { name: 'Grant requirements defined', met: !!client.grantNames }
                  ];
                }

                isReady = checklist.every(item => item.met);

                return `
                  <div class="card agent-card">
                    <div>
                      <div class="agent-card-header">
                        <h3 style="display:flex; align-items:center; gap:0.4rem;">🤖 ${a.name}</h3>
                        <span class="badge ${a.status === 'Running' ? 'success' : 'info'}">${a.status}</span>
                      </div>
                      <p class="agent-desc">${a.purpose}</p>
                      
                      <div class="agent-meta-section">
                        <strong>📥 Needs:</strong> <span>${checklist.map(n => n.name.split(' ')[0]).join(', ')}...</span>
                      </div>
                      <div class="agent-meta-section">
                        <strong>📤 Outputs:</strong> <span>${getAgentOutputsList(a.id)}</span>
                      </div>

                      <div class="agent-checklist-box">
                        <div class="agent-checklist-title">Agent Readiness Checklist</div>
                        <ul class="agent-checklist">
                          ${checklist.map(c => `
                            <li class="${c.met ? 'checked' : 'missing'}">
                              ${c.met ? '✅' : '❌'} ${c.name}
                            </li>
                          `).join('')}
                        </ul>
                      </div>
                    </div>

                    <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                      ${isReady ? `
                        <button class="btn btn-sm btn-primary w-full run-agent-trigger-btn" data-agent-id="${a.id}">Configure & Run</button>
                      ` : `
                        <div style="font-size: 0.72rem; color: var(--danger-color); font-weight: 600; text-align: center; margin-bottom: 0.5rem; line-height:1.3;">
                          ⚠️ Missing information required before generating final content.
                        </div>
                        <button class="btn btn-sm btn-outline w-full edit-brief-shortcut" style="color: var(--primary-color); border-color: var(--primary-color);">Complete Brief</button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- 3. Generate Work Panel (Section #5) -->
          <div class="card" id="generateWorkPanel">
            <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; display:flex; align-items:center; gap:0.5rem;"><span>🚀</span> Generate Content Work</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Instruct AI agents to generate structured campaigns, stories, or briefs.</p>
            
            <form id="generateWorkForm" style="display:flex; flex-direction:column; gap:1rem;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label style="font-size:0.75rem; font-weight:600;">Active Client NGO</label>
                  <select id="gwClient" class="form-select" disabled style="background:#f1f5f9;">
                    <option value="${client.id}">${client.logo} ${client.name}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label style="font-size:0.75rem; font-weight:600;">Active Campaign</label>
                  <select id="gwCampaign" class="form-select" required>
                    ${state.campaigns.filter(c => c.client === client.id).map(c => `
                      <option value="${c.name}">${c.name}</option>
                    `).join('') || `<option value="${client.campaignName || 'General'}">${client.campaignName || 'General'}</option>`}
                  </select>
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label style="font-size:0.75rem; font-weight:600;">AI Agent Co-worker</label>
                  <select id="gwAgent" class="form-select" required>
                    ${state.agents.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label style="font-size:0.75rem; font-weight:600;">Output Format Required</label>
                  <select id="gwOutputType" class="form-select" required>
                    <option value="Generate 5 Facebook posts">Generate 5 Facebook posts</option>
                    <option value="Generate Instagram carousel copy">Generate Instagram carousel copy</option>
                    <option value="Generate Canva poster brief">Generate Canva poster brief</option>
                    <option value="Generate donor impact story">Generate donor impact story</option>
                    <option value="Generate monthly content calendar">Generate monthly content calendar</option>
                    <option value="Generate funder update">Generate funder update</option>
                    <option value="Generate analytics report">Generate analytics report</option>
                  </select>
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label style="font-size:0.75rem; font-weight:600;">Primary Target Platform</label>
                  <select id="gwPlatform" class="form-select" required>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email newsletter">Email newsletter</option>
                    <option value="Website">Website</option>
                  </select>
                </div>
                <div class="form-group">
                  <label style="font-size:0.75rem; font-weight:600;">Tone of Voice</label>
                  <select id="gwTone" class="form-select" required>
                    <option value="Grassroots, Encouraging">Grassroots, Encouraging</option>
                    <option value="Urgent, Empowering">Urgent, Empowering</option>
                    <option value="Professional, Fact-based">Professional, Fact-based</option>
                    <option value="Informative, Accessible">Informative, Accessible</option>
                  </select>
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label style="font-size:0.75rem; font-weight:600;">Source Evidence Document (Inbox)</label>
                  <select id="gwEvidence" class="form-select" required>
                    <option value="">-- Choose verified source document --</option>
                    ${clientEvidence.map(e => `
                      <option value="${e.id}">${e.name} (${e.verificationStatus})</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label style="font-size:0.75rem; font-weight:600;">Due Date</label>
                  <input type="date" id="gwDueDate" class="form-control" value="${new Date(Date.now() + 604800000).toISOString().split('T')[0]}" required />
                </div>
              </div>

              <div class="form-group">
                <label style="font-size:0.75rem; font-weight:600;">Approval Reviewer</label>
                <input type="text" id="gwApprovalPerson" class="form-control" value="${client.primaryContact || 'Irene K.'}" required />
              </div>

              <div id="simGenProgress" style="display:none; background:#f1f5f9; padding:0.75rem; border-radius:6px; border:1px solid #e2e8f0; margin-top:0.5rem;">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;">
                  <strong id="simGenStatusText">AI Agent compiling inputs...</strong>
                  <span id="simGenPercent">0%</span>
                </div>
                <div style="background:#cbd5e1; height:6px; border-radius:3px; overflow:hidden;">
                  <div id="simGenProgressBar" style="background:var(--primary-color); height:100%; width:0%; transition:width 0.1s linear;"></div>
                </div>
              </div>

              <button type="submit" class="btn btn-primary mt-2" style="width:100%;">🚀 Generate Content Draft</button>
            </form>
          </div>

        </div>

        <!-- Right Side Column -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- 4. Evidence Inbox (Section #3) -->
          <div class="card evidence-inbox-card">
            <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; display:flex; align-items:center; justify-content:space-between;">
              <span>📥 Evidence Inbox</span>
              <span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.7rem;">${clientEvidence.length} Files Available</span>
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Connect files, audit sheets, and reports to serve as fact-checked source evidence for AI campaigns.</p>
            
            <!-- Upload Simulator Area (Section #3) -->
            <div class="upload-simulator-area" id="uploadSimulatorZone">
              <span style="font-size: 1.75rem; display:block; margin-bottom:0.25rem;">📄</span>
              <strong style="font-size: 0.85rem; display:block; color:var(--primary-color);">Click to Sim Upload / Connect Source</strong>
              <span style="font-size: 0.7rem; color:var(--text-muted);">PDF, Excel, Word, Image, CSV, Email, Link</span>
              
              <!-- Simulated progress -->
              <div class="upload-progress-container" id="inboxUploadProgressContainer">
                <div class="upload-progress-bar" id="inboxUploadProgressBar"></div>
              </div>
            </div>

            <!-- List of Evidence (Section #3 & #6) -->
            <div class="evidence-list">
              ${clientEvidence.length === 0 ? `
                <div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.85rem;">
                  No evidence uploaded for this client yet. Click above to simulate a new upload.
                </div>
              ` : clientEvidence.map(e => `
                <div class="evidence-item">
                  <div class="evidence-item-header">
                    <span style="display:flex; align-items:center; gap:0.35rem;">
                      ${getFileIcon(e.sourceType)} 
                      <a href="/${e.name}" target="_blank" style="text-decoration: underline; color: var(--primary-color); font-weight: 500; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;" title="Click to view file: ${e.name}">${e.name}</a>
                      ${e.isDemoData ? '<span class="demo-badge">Demo Data</span>' : ''}
                    </span>
                    <span class="badge-status ${e.verificationStatus.toLowerCase().replace(' ', '-')}">
                      ${e.verificationStatus}
                    </span>
                  </div>
                  
                  <div class="evidence-item-excerpt" title="Factual Excerpt">
                    "${e.textExcerpt || 'No excerpt available.'}"
                  </div>

                  <div class="evidence-item-meta">
                    <span>📁 <strong>Project:</strong> ${e.project || 'General'}</span>
                    <span>📢 <strong>Campaign:</strong> ${e.campaign || 'None'}</span>
                    <span>📅 <strong>Uploaded:</strong> ${e.dateUploaded}</span>
                  </div>

                  <!-- Verification triggers -->
                  ${e.verificationStatus !== 'Verified' ? `
                    <div style="display:flex; justify-content:flex-end; margin-top:0.5rem; gap:0.4rem; border-top:1px solid #f1f5f9; padding-top:0.4rem;">
                      <button class="btn btn-xs btn-outline verify-evidence-btn" data-ev-id="${e.id}" style="color:var(--success-color); border-color:var(--success-color); font-size:0.65rem; padding:0.15rem 0.4rem;">Verify Source</button>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 5. Approval Workflow Queue (Section #7) -->
          <div class="card approval-queue-card">
            <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; display:flex; align-items:center; justify-content:space-between;">
              <span>⏳ Approval Queue</span>
              <span class="badge" style="background:#fef3c7; color:#b45309; font-size:0.7rem;">${clientOutputs.length} Outputs</span>
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Track generated outputs through approval stages prior to publishing. Metrics are locked until client approved.</p>

            <div class="approval-list">
              ${clientOutputs.length === 0 ? `
                <div style="text-align:center; padding:3rem; color:var(--text-muted); font-size:0.85rem;">
                  No generated drafts found. Setup parameters and hit "Generate Content Draft" to initiate.
                </div>
              ` : clientOutputs.map(o => {
                let statusStep = 1;
                if (o.approvalStatus === 'Internal Review') statusStep = 2;
                else if (o.approvalStatus === 'Sent to Client') statusStep = 3;
                else if (o.approvalStatus === 'Client Approved') statusStep = 4;
                else if (o.approvalStatus === 'Scheduled') statusStep = 5;
                else if (o.approvalStatus === 'Published') statusStep = 6;

                return `
                  <div class="approval-item">
                    <div class="approval-item-header">
                      <div>
                        <strong style="font-size:0.85rem; color:var(--primary-color);">${getAgentNameById(o.agentId)}</strong>
                        <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.25rem;">➔ ${o.outputType}</span>
                        ${o.isDemoData ? '<span class="demo-badge" style="margin-left:0.4rem;">Demo Data</span>' : ''}
                      </div>
                      <span class="badge-status ${getApprovalStatusClass(o.approvalStatus)}">${o.approvalStatus}</span>
                    </div>

                    <!-- Workflow Stage Map Visual -->
                    <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:var(--text-muted); margin:0.5rem 0 0.75rem 0; padding:0.25rem; background:#f8fafc; border-radius:4px; border:1px solid #f1f5f9;">
                      <span style="font-weight:${statusStep === 1 ? '700' : '400'}; color:${statusStep >= 1 ? 'var(--primary-color)' : 'inherit'};">1. Draft</span>
                      <span>➔</span>
                      <span style="font-weight:${statusStep === 2 ? '700' : '400'}; color:${statusStep >= 2 ? 'var(--primary-color)' : 'inherit'};">2. Internal</span>
                      <span>➔</span>
                      <span style="font-weight:${statusStep === 3 ? '700' : '400'}; color:${statusStep >= 3 ? 'var(--primary-color)' : 'inherit'};">3. Sent</span>
                      <span>➔</span>
                      <span style="font-weight:${statusStep === 4 ? '700' : '400'}; color:${statusStep >= 4 ? 'var(--primary-color)' : 'inherit'};">4. Approved</span>
                      <span>➔</span>
                      <span style="font-weight:${statusStep === 5 ? '700' : '400'}; color:${statusStep >= 5 ? 'var(--primary-color)' : 'inherit'};">5. Scheduled</span>
                      <span>➔</span>
                      <span style="font-weight:${statusStep === 6 ? '700' : '400'}; color:${statusStep >= 6 ? 'var(--primary-color)' : 'inherit'};">6. Published</span>
                    </div>

                    <!-- Edit Content Block -->
                    <div class="approval-content-box" id="contentBox-${o.id}">${o.content}</div>
                    <textarea class="form-control" id="contentEdit-${o.id}" style="display:none; font-size:0.8rem; margin-bottom:0.75rem; height:120px; font-family:inherit; border-left: 3px solid var(--primary-color);">${o.content}</textarea>

                    <!-- Source Evidence Trace Panel (Section #6) -->
                    <div class="evidence-trace-box">
                      <div class="evidence-trace-header">
                        <span>🔍 EVIDENCE TRACE [Score: ${o.confidenceScore}%]</span>
                        <span class="text-${o.verificationStatus === 'Verified' ? 'green' : 'yellow'}">${o.verificationStatus} Evidence</span>
                      </div>
                      <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.25rem;">
                        <strong>Source:</strong> ${o.sourceDocName || 'None'} (${o.sourceDocType || 'Unknown'}) | Uploaded: ${o.sourceDocUploadDate || 'N/A'}
                      </div>
                      <div class="evidence-trace-quote">
                        "${o.sourceEvidence || 'Evidence missing. Please upload or verify source information.'}"
                      </div>
                      <!-- Guard message warning against invention of facts -->
                      <div style="font-size:0.65rem; color:#b45309; font-weight:600; margin-top:0.25rem; display:flex; align-items:center; gap:0.2rem;">
                        ⚠️ Strictly evidence-based. No facts, numbers, dates or campaign results were invented by AI.
                      </div>
                    </div>

                    <!-- Approval Buttons (Section #7) -->
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:0.75rem; flex-wrap:wrap; gap:0.5rem;">
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
                        <button class="btn btn-xs btn-outline export-output-btn" data-out-id="${o.id}">📤 Export</button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

      </div>
    </div>
  `;

  // --- EVENT BINDINGS ---

  // Dropdown client switcher
  const crClientSelector = document.getElementById('crClientSelector');
  if (crClientSelector) {
    crClientSelector.addEventListener('change', (e) => {
      selectClient(e.target.value);
    });
  }

  // Edit brief modal trigger
  const editBriefBtn = document.getElementById('editBriefBtn');
  if (editBriefBtn) {
    editBriefBtn.addEventListener('click', () => {
      openEditBriefModal(client.id);
    });
  }

  // Complete Brief shortcut on agent cards
  container.querySelectorAll('.edit-brief-shortcut').forEach(btn => {
    btn.addEventListener('click', () => {
      openEditBriefModal(client.id);
    });
  });

  // Configure & Run shortcut from agent cards to fill the work generator form
  container.querySelectorAll('.run-agent-trigger-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const agentId = btn.getAttribute('data-agent-id');
      const gwAgent = document.getElementById('gwAgent');
      if (gwAgent) {
        gwAgent.value = agentId;
        gwAgent.dispatchEvent(new Event('change'));
      }
      const gwPanel = document.getElementById('generateWorkPanel');
      if (gwPanel) {
        gwPanel.scrollIntoView({ behavior: 'smooth' });
        gwPanel.style.border = '2px solid var(--primary-color)';
        setTimeout(() => { gwPanel.style.border = '1px solid var(--border-color)'; }, 1500);
      }
    });
  });

  // Verify evidence source manually from inbox
  container.querySelectorAll('.verify-evidence-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const evId = btn.getAttribute('data-ev-id');
      const evItem = state.evidence.find(e => e.id === evId);
      if (evItem) {
        evItem.verificationStatus = 'Verified';
        alert(`Source evidence "${evItem.name}" is now marked as Verified and is eligible for final content generation!`);
        notify();
      }
    });
  });

  // Upload Evidence simulation trigger
  const uploadSimulatorZone = document.getElementById('uploadSimulatorZone');
  if (uploadSimulatorZone) {
    uploadSimulatorZone.addEventListener('click', () => {
      openSimulateUploadModal(client.id);
    });
  }

  // Work Generator form submission handler
  const generateWorkForm = document.getElementById('generateWorkForm');
  if (generateWorkForm) {
    generateWorkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const agentId = document.getElementById('gwAgent').value;
      const campaignName = document.getElementById('gwCampaign').value;
      const outputType = document.getElementById('gwOutputType').value;
      const platform = document.getElementById('gwPlatform').value;
      const tone = document.getElementById('gwTone').value;
      const evId = document.getElementById('gwEvidence').value;
      const dueDate = document.getElementById('gwDueDate').value;
      const approvalPerson = document.getElementById('gwApprovalPerson').value;

      // Validate checklist readiness for selected agent
      const agent = state.agents.find(a => a.id === agentId);
      let checklistMet = true;
      
      if (agentId === 'storytelling') {
        checklistMet = !!client.campaignName && !!client.campaignGoal && (!!client.evidenceReports || !!client.evidenceResearch) && !!client.targetReach && !!client.toneOfVoice && !!client.campaignMessage && (!!client.evidencePhotos || !!client.evidenceVideos);
      } else if (agentId === 'socialmedia') {
        checklistMet = !!client.name && !!client.website && !!client.campaignGoal && !!client.targetReach && !!client.toneOfVoice && (!!client.contentPlatforms || !!client.campaignPlatforms) && clientEvidence.length > 0 && !!client.primaryContact;
      } else if (agentId === 'canva-brief') {
        checklistMet = !!client.campaignName && !!client.campaignMessage && !!client.contentPlatforms && !!client.logo && !!client.brandColours && !!client.evidencePhotos && !!client.posterSizes && !!client.campaignCta && (!!client.phone || !!client.email);
      } else if (agentId === 'calendar') {
        checklistMet = !!client.campaignStart && !!client.campaignEnd && !!client.campaignFrequency && !!client.contentPlatforms && !!client.campaignPriority && !!client.reportingDeadlines;
      } else if (agentId === 'reporting') {
        checklistMet = !!client.requiredImpactMetrics && !!client.evidencePhotos && !!client.evidenceRegisters && (!!client.evidenceSurveys || clientEvidence.some(ev => ev.contentType === 'Survey results')) && !!client.requiredDonorOutputs && !!client.reportingDeadlines;
      } else if (agentId === 'funding-comm') {
        checklistMet = !!client.currentFunders && !!client.requiredImpactMetrics && clientEvidence.length > 0 && !!client.campaignGoal && !!client.grantNames;
      }

      if (!checklistMet) {
        alert(`Missing information required before generating final content. Please check the Agent Readiness Checklist for ${agent ? agent.name : 'the agent'} and complete the client brief.`);
        return;
      }

      if (!evId) {
        alert('Please select a source evidence document to feed the factual context of this generation.');
        return;
      }

      const selectedEv = state.evidence.find(ev => ev.id === evId);
      if (!selectedEv) return;

      // Gate unverified evidence (Section #3 & #6)
      if (selectedEv.verificationStatus === 'Unverified') {
        const approveUnverified = confirm(`⚠️ Warning: Selected source evidence is currently Unverified. Generating content using unverified statistics or facts is against accuracy rules.\n\nDo you want to proceed with unverified evidence anyway?`);
        if (!approveUnverified) {
          return;
        }
      }

      // Start simulation progress loader
      const progressBox = document.getElementById('simGenProgress');
      const progressBar = document.getElementById('simGenProgressBar');
      const progressText = document.getElementById('simGenStatusText');
      const progressPercent = document.getElementById('simGenPercent');
      
      progressBox.style.display = 'block';
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = `${progress}%`;
        progressPercent.textContent = `${progress}%`;
        
        if (progress === 20) progressText.textContent = `Feeding source document "${selectedEv.name}" context...`;
        else if (progress === 50) progressText.textContent = `Applying target brand voice "${client.toneOfVoice}"...`;
        else if (progress === 80) progressText.textContent = `Verifying factual alignment against source excerpt...`;
        
        if (progress >= 100) {
          clearInterval(interval);
          
          const generatedContent = generateSimulatedAiOutputContent(agentId, client, campaignName, selectedEv.textExcerpt, tone, outputType, platform);
          
          const matchedCampaign = state.campaigns.find(c => c.name === campaignName && c.client === client.id);
          addAiOutput({
            clientId: client.id,
            client_id: client.id,
            campaignName: campaignName,
            campaignId: matchedCampaign ? matchedCampaign.id : 'cmp_gen',
            campaign_id: matchedCampaign ? matchedCampaign.id : 'cmp_gen',
            projectId: selectedEv.project || 'General',
            project_id: selectedEv.project || 'General',
            evidenceId: selectedEv.id,
            evidence_id: selectedEv.id,
            agentId: agentId,
            agent_id: agentId,
            approvalStatus: 'Draft',
            approval_status: 'Draft',
            createdAt: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            outputType: outputType,
            platform: platform,
            tone: tone,
            dueDate: dueDate,
            sourceEvidence: selectedEv.textExcerpt,
            sourceDocName: selectedEv.name,
            sourceDocType: selectedEv.sourceType,
            sourceDocUploadDate: selectedEv.dateUploaded,
            confidenceScore: Math.floor(Math.random() * 8) + 92, // 92-99%
            verificationStatus: selectedEv.verificationStatus,
            content: generatedContent,
            approvalPerson: approvalPerson
          });

          // Log in terminal activity logs in state
          state.agentActivityLogs.unshift({
            timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            agent: agent ? agent.name : 'AI Agent',
            client: client.name,
            message: `Completed execution for campaign "${campaignName}". Generated ${outputType} successfully.`,
            status: 'success'
          });

          // Boost tasks completed count
          if (agent) {
            agent.tasksCompleted += 1;
            agent.lastRun = 'Just now';
            agent.status = 'Waiting';
          }

          progressBox.style.display = 'none';
          progressBar.style.width = '0%';
          alert(`🎉 Success! ${outputType} has been generated and pushed to the Approval Queue below.`);
          notify();
        }
      }, 150);
    });
  }
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
function openNewIdeaModal(clientsList) {
  const modal = document.getElementById('globalModalContainer');
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
              <input type="text" id="ideaTitle" placeholder="e.g. World Environment Day Outreach" required />
            </div>
            <div class="form-group">
              <label for="ideaClient">NGO Client</label>
              <select id="ideaClient">
                ${clientsList.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="ideaCampaign">Campaign</label>
              <input type="text" id="ideaCampaign" placeholder="e.g. Clean Air Fund" required />
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
    const campaign = document.getElementById('ideaCampaign').value;
    const platform = document.getElementById('ideaPlatform').value;

    addContentCard({
      title,
      client,
      campaign,
      platform,
      status: 'Ideas',
      author: 'Owner Manual'
    });

    modal.style.display = 'none';
  });
}

// 5. Add NGO Client Modal
function openNewClientModal() {
  const modal = document.getElementById('globalModalContainer');
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h2>➕ Add New NGO Client Profile</h2>
          <button class="close-modal-btn" id="closeGlobalModal">×</button>
        </div>
        <div class="modal-body">
          <form id="newClientForm" class="modal-form-fields-grid">
            <div class="form-group">
              <label>Organisation Name</label>
              <input type="text" id="ncName" placeholder="groundWork SA" required />
            </div>
            <div class="form-group">
              <label>Logo (Emoji)</label>
              <input type="text" id="ncLogo" placeholder="🌱" required />
            </div>
            <div class="form-group">
              <label>Primary Contact</label>
              <input type="text" id="ncContact" placeholder="Bobby Peek" required />
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="ncEmail" placeholder="contact@org.org" required />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="text" id="ncPhone" placeholder="+27 33 123" required />
            </div>
            <div class="form-group">
              <label>Website URL</label>
              <input type="text" id="ncWebsite" placeholder="www.org.org" required />
            </div>
            <div class="form-group">
              <label>Sector Focus</label>
              <input type="text" id="ncSector" placeholder="Environmental" required />
            </div>
            <div class="form-group">
              <label>Country Base</label>
              <input type="text" id="ncCountry" placeholder="South Africa" required />
            </div>
            <div class="form-group">
              <label>Funding Partners</label>
              <input type="text" id="ncFunding" placeholder="Sida, UNEP" required />
            </div>
            <div class="form-group">
              <label>Monthly Fee (£)</label>
              <input type="number" id="ncFee" placeholder="2500" required />
            </div>
            <div class="form-group full-width">
              <label>Notes / Overview Directive</label>
              <textarea id="ncNotes" placeholder="Describe client goals..." required></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary full-width mt-4">Save NGO Profile</button>
          </form>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  document.getElementById('closeGlobalModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('newClientForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('ncName').value;
    const logo = document.getElementById('ncLogo').value;
    const contact = document.getElementById('ncContact').value;
    const email = document.getElementById('ncEmail').value;
    const phone = document.getElementById('ncPhone').value;
    const website = document.getElementById('ncWebsite').value;
    const sector = document.getElementById('ncSector').value;
    const country = document.getElementById('ncCountry').value;
    const funding = document.getElementById('ncFunding').value;
    const fee = parseFloat(document.getElementById('ncFee').value);
    const notes = document.getElementById('ncNotes').value;

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');

    state.clients.push({
      id,
      name,
      logo,
      status: 'green',
      statusText: 'Healthy',
      sector,
      primaryContact: contact,
      email,
      phone,
      website,
      country,
      fundingPartners: funding,
      activeProjectsCount: 1,
      reportsDueCount: 0,
      monthlyFee: fee,
      contractValue: fee * 12,
      startDate: new Date().toISOString().split('T')[0],
      renewalDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
      lastActivity: 'Just added',
      nextDeadline: 'None',
      notes,
      healthScore: 100,
      complianceScore: 100,
      projectCompletionScore: 100
    });

    // Populate empty impact metrics
    state.impactMetrics[id] = {
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
      monthlyTrends: [
        { month: 'Jan', reached: 0, funding: 0 },
        { month: 'Feb', reached: 0, funding: 0 },
        { month: 'Mar', reached: 0, funding: 0 },
        { month: 'Apr', reached: 0, funding: 0 },
        { month: 'May', reached: 0, funding: 0 },
        { month: 'Jun', reached: 0, funding: 0 }
      ],
      customMetrics: []
    };

    modal.style.display = 'none';
    notify();
  });
}
