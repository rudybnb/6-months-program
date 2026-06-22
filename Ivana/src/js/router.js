import { state } from './state.js';
import { 
  renderAdminDashboard, 
  renderClientDashboard,
  renderClientsModule, 
  renderContentModule, 
  renderReportsCenter, 
  renderImpactDashboard, 
  renderFundingTracker, 
  renderAgentsDashboard 
} from './components.js';

export function initRouter(container) {
  const handleRoute = () => {
    const hash = window.location.hash || '#dashboard';
    const cleanHash = hash.split('?')[0];

    // Highlight active sidebar navigation item
    updateActiveSidebar(cleanHash);

    // If User role is 'client', force scoping in certain ways
    if (state.currentUserRole === 'client') {
      // NGO Client only sees Campaigns (Clients profile sub-view), Reports, Impact, Funding, Content approvals
      if (cleanHash === '#dashboard') {
        renderClientDashboard(container);
      } else if (cleanHash === '#content') {
        renderContentModule(container);
      } else if (cleanHash === '#reports') {
        renderReportsCenter(container);
      } else if (cleanHash === '#impact') {
        renderImpactDashboard(container);
      } else if (cleanHash === '#funding') {
        renderFundingTracker(container);
      } else if (cleanHash === '#agents') {
        renderAgentsDashboard(container);
      } else {
        // Fallback for settings or clients (hide or redirect to client portal main)
        renderClientDashboard(container);
      }
      return;
    }

    // Admin Routing
    switch (cleanHash) {
      case '#dashboard':
        renderAdminDashboard(container);
        break;
      case '#clients':
        renderClientsModule(container);
        break;
      case '#content':
        renderContentModule(container);
        break;
      case '#reports':
        renderReportsCenter(container);
        break;
      case '#impact':
        renderImpactDashboard(container);
        break;
      case '#funding':
        renderFundingTracker(container);
        break;
      case '#agents':
        renderAgentsDashboard(container);
        break;
      case '#settings':
        renderSettingsPage(container);
        break;
      default:
        renderAdminDashboard(container);
    }
  };

  window.addEventListener('hashchange', handleRoute);
  
  // Initial run
  handleRoute();

  return handleRoute;
}

function updateActiveSidebar(hash) {
  const sidebarLinks = document.querySelectorAll('.nav-links a');
  sidebarLinks.forEach(link => {
    const linkHash = link.getAttribute('href');
    if (linkHash === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function renderSettingsPage(container) {
  container.innerHTML = `
    <div class="section-header-row mb-6">
      <div>
        <h1>IK Communications Settings</h1>
        <p class="subtitle">Configure AI model selections, API triggers, and consultancy configurations</p>
      </div>
    </div>

    <div class="dashboard-split">
      <div class="card">
        <h3>🔧 Platform Configuration</h3>
        <form class="modal-form-fields mt-4" onsubmit="event.preventDefault(); alert('Settings saved successfully!');">
          <div class="form-group">
            <label>AI Orchestration Model</label>
            <select>
              <option>Gemini 1.5 Pro (Recommended)</option>
              <option>Gemini 1.5 Flash</option>
              <option>Claude 3.5 Sonnet</option>
              <option>GPT-4o</option>
            </select>
          </div>
          <div class="form-group">
            <label>Weekly Autopilot Runs</label>
            <input type="number" value="3" />
          </div>
          <div class="form-group">
            <label>OCR Evidence Parsing</label>
            <select>
              <option>Enabled (Standard)</option>
              <option>Disabled</option>
            </select>
          </div>
          <button class="btn btn-primary mt-4">Save Changes</button>
        </form>
      </div>

      <div class="card">
        <h3>⚡ Integration Webhooks</h3>
        <p class="subtitle">Link external data providers for automatic evidence collection</p>
        <div class="detail-fields mt-4">
          <div class="field-item">
            <span>WhatsApp Evidence Bot</span>
            <span class="badge success">Connected</span>
          </div>
          <div class="field-item">
            <span>Google Drive Sync</span>
            <span class="badge success">Active</span>
          </div>
          <div class="field-item">
            <span>Facebook Marketing API</span>
            <span class="badge warning">Needs Attention</span>
          </div>
          <div class="field-item">
            <span>LinkedIn Organization Page</span>
            <span class="badge success">Connected</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
