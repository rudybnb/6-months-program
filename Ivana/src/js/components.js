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
  setCurrency
} from './state.js';

import { renderLineChart, renderBarChart } from './chart.js';

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
                <span class="amount">Value: <strong>£${f.amount.toLocaleString()}</strong></span>
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
      const draft = generateProposalDraft(oppId);
      openDraftModal(draft, oppId);
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
                    <span class="amount">Value: <strong>£${f.amount.toLocaleString()}</strong></span>
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
      const draft = generateProposalDraft(oppId);
      openDraftModal(draft, oppId);
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
    <div class="section-header-row mb-6">
      <div>
        <h1>Grant Discovery & Funding Tracker</h1>
        <p class="subtitle">AI matches international environmental and human-rights grants to active NGO scopes</p>
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
              <th>Status</th>
              <th>Proposal Draft</th>
            </tr>
          </thead>
          <tbody>
            ${grants.map(g => {
              let probClass = g.probabilityScore > 80 ? 'green' : g.probabilityScore > 65 ? 'yellow' : 'red';
              let statusClass = g.status.toLowerCase();
              
              // Dynamic conversion based on selected state.currency
              let displayAmountStr = '';
              const originalValGBP = g.amount;
              if (state.currency === 'ZAR') {
                const convertedZar = originalValGBP * state.gbpToZarRate;
                const prevConvertedZar = originalValGBP * state.prevGbpToZarRate;
                const differenceZar = convertedZar - prevConvertedZar;
                
                let diffStr = '';
                if (differenceZar > 0) {
                  diffStr = `<span style="color: var(--success-color); font-size: 0.7rem; font-weight: 600; margin-left: 0.25rem;">(+R${differenceZar.toFixed(0)})</span>`;
                } else if (differenceZar < 0) {
                  diffStr = `<span style="color: var(--danger-color); font-size: 0.7rem; font-weight: 600; margin-left: 0.25rem;">(R${differenceZar.toFixed(0)})</span>`;
                }
                
                displayAmountStr = `<strong>R ${convertedZar.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong>${diffStr}`;
              } else {
                displayAmountStr = `<strong>£${originalValGBP.toLocaleString()}</strong>`;
              }

              return `
                <tr>
                  <td>
                    <strong>${g.funder}</strong>
                    <div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 0.35rem; display: flex; flex-direction: column; gap: 0.15rem; line-height: 1.3;">
                      <span style="display: flex; align-items: center; gap: 0.25rem;">
                        <span>🌐</span> <a href="https://${g.website}" target="_blank" style="color: var(--primary-color); text-decoration: underline;">${g.website}</a>
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
                  <td>${displayAmountStr}</td>
                  <td>${g.deadline}</td>
                  <td><span class="tag">${g.sector}</span></td>
                  <td>📍 ${g.country}</td>
                  <td>
                    <span class="status-badge ${probClass}">
                      ${g.probabilityScore}% Match
                    </span>
                  </td>
                  <td><span class="status-badge ${statusClass}">${g.status}</span></td>
                  <td>
                    <button class="btn btn-xs btn-primary generate-proposal-btn" data-opportunity-id="${g.id}">
                      Draft proposal
                    </button>
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
      const draft = generateProposalDraft(oppId);
      openDraftModal(draft, oppId);
    });
  });

  // Bind currency selector buttons
  container.querySelectorAll('.currency-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const currency = btn.getAttribute('data-currency');
      setCurrency(currency);
    });
  });
}

// RENDER AI AGENTS DASHBOARD
export function renderAgentsDashboard(container) {
  container.innerHTML = `
    <div class="section-header-row mb-6">
      <div>
        <h1>AI Agents Control Room</h1>
        <p class="subtitle">Manage autonomous workflow loops, check response metrics and inspect execution histories</p>
      </div>
    </div>

    <!-- Agent Cards Grid -->
    <div class="agents-grid">
      ${state.agents.map(a => {
        let statusClass = a.status.toLowerCase().replace(' ', '-');
        return `
          <div class="agent-card card">
            <div class="agent-card-header">
              <h3>🤖 ${a.name}</h3>
              <span class="status-badge ${statusClass}">
                <span class="dot pulse"></span> ${a.status}
              </span>
            </div>
            <p class="agent-description">${a.description}</p>
            
            <div class="agent-metrics mt-4">
              <div class="agent-metric-item">
                <span class="lbl">Last Active</span>
                <span class="val">${a.lastRun}</span>
              </div>
              <div class="agent-metric-item">
                <span class="lbl">Jobs Finished</span>
                <span class="val">${a.tasksCompleted}</span>
              </div>
              <div class="agent-metric-item">
                <span class="lbl">Accuracy Index</span>
                <span class="val">${a.successRate}%</span>
              </div>
            </div>

            <div class="agent-footer-meta mt-4">
              <strong>Next Task:</strong>
              <p class="next-task-text">${a.nextTask}</p>
            </div>
            
            <div class="agent-actions-row mt-4">
              <button class="btn btn-sm btn-outline run-agent-manual-btn" data-agent-id="${a.id}">Trigger Execution</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Terminal Log Stream -->
    <div class="dashboard-section card mt-6">
      <div class="section-header">
        <h2>📜 AI Stream Activity Log</h2>
        <span class="tag">Console Monitor</span>
      </div>
      <div class="terminal-log-container">
        <div class="terminal-header">
          <span class="term-dot red"></span>
          <span class="term-dot yellow"></span>
          <span class="term-dot green"></span>
          <span class="term-title">ik-communications-agent-stream.log</span>
        </div>
        <div class="terminal-body" id="agentTerminalBody">
          ${state.agentActivityLogs.map(l => `
            <div class="log-line">
              <span class="log-time">[${l.timestamp}]</span> 
              <span class="log-agent">[${l.agent}]</span> 
              <span class="log-client">@${l.client}:</span> 
              <span class="log-msg ${l.status}">${l.message}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Manual run agent bind
  container.querySelectorAll('.run-agent-manual-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const agentId = btn.getAttribute('data-agent-id');
      const agent = state.agents.find(a => a.id === agentId);
      if (agent) {
        agent.status = 'Running';
        notify();
        setTimeout(() => {
          agent.status = 'Waiting';
          agent.tasksCompleted += 1;
          agent.lastRun = 'Just now';
          
          state.agentActivityLogs.unshift({
            timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            agent: agent.name,
            client: 'System Sync',
            message: 'Manual routine check finished. Accuracy verification complete.',
            status: 'success'
          });
          
          notify();
        }, 1000);
      }
    });
  });
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

  const exportSuccess = (format) => {
    alert(`Generating files... Mock file downloaded in background: "${report.name.replace(/ /g, '_')}.${format}"`);
    modal.style.display = 'none';
  };

  modal.querySelector('.pdf-export-trigger').addEventListener('click', () => exportSuccess('pdf'));
  modal.querySelector('.word-export-trigger').addEventListener('click', () => exportSuccess('docx'));
  modal.querySelector('.ppt-export-trigger').addEventListener('click', () => exportSuccess('pptx'));
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
