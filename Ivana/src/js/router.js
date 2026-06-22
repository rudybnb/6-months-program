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
      } else if (cleanHash === '#guide') {
        renderSystemGuide(container);
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
      case '#guide':
        renderSystemGuide(container);
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

export function renderSystemGuide(container) {
  container.innerHTML = `
    <div class="section-header-row mb-6">
      <div>
        <h1>📖 System Workflow Guide</h1>
        <p class="subtitle">Detailed point-by-point manual on how the IK Communications NGO Operating System works</p>
      </div>
    </div>

    <div class="card command-center mb-6">
      <h3 style="color: var(--primary-color); display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem; margin-bottom: 0.75rem;">
        <span>🚀</span> 1. Core Architecture & Reactive State
      </h3>
      <ul style="margin-left: 1.5rem; line-height: 1.6; font-size: 0.9rem; color: var(--text-color); display: flex; flex-direction: column; gap: 0.5rem;">
        <li><strong>Single-Page Application Router:</strong> The system manages views dynamically without page reloads using hash-based routing. Navigating changes the URL hash (e.g. <code>#dashboard</code>), triggering the router to inject the target component into the main panel.</li>
        <li><strong>Centralized Reactive State:</strong> App data (client lists, metrics, campaigns, activity logs) lives in an in-memory state tree. View components subscribe to changes, forcing an automatic redrawing of indicators, cards, and charts when updates occur.</li>
      </ul>
    </div>

    <div class="card command-center mb-6" style="border-left-color: var(--secondary-color);">
      <h3 style="color: var(--secondary-color); display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem; margin-bottom: 0.75rem;">
        <span>👥</span> 2. Dual-Role Workspaces
      </h3>
      <ul style="margin-left: 1.5rem; line-height: 1.6; font-size: 0.9rem; color: var(--text-color); display: flex; flex-direction: column; gap: 0.5rem;">
        <li><strong>💼 IK Admin Console:</strong> Tailored for lead consultant Irene K. It highlights global performance metrics (Business Health, Revenue Score, Reporting Compliance) and opens up client creation tools.</li>
        <li><strong>🌱 NGO Client Portal:</strong> Customized view for individual NGO workspace contacts. Restricts access to admin sections and exposes dedicated client dashboards showing campaign reach, workshops held, and active proposal generation.</li>
      </ul>
    </div>

    <div class="card command-center mb-6" style="border-left-color: var(--warning-color);">
      <h3 style="color: var(--warning-color); display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem; margin-bottom: 0.75rem;">
        <span>🤖</span> 3. The AI-Driven Impact Pipeline
      </h3>
      <ul style="margin-left: 1.5rem; line-height: 1.6; font-size: 0.9rem; color: var(--text-color); display: flex; flex-direction: column; gap: 0.5rem;">
        <li><strong>Raw Evidence Input:</strong> Enter field update logs (e.g. <em>"Registered 40 users for clean air sensor kits"</em>) into the pipeline box.</li>
        <li><strong>Step 1 - Storytelling Agent:</strong> Converts raw data into an engaging stakeholder impact story.</li>
        <li><strong>Step 2 - Social Media Agent:</strong> Generates tailored posts for LinkedIn, Facebook, and Instagram.</li>
        <li><strong>Step 3 - Donor Reporting Agent:</strong> Compiles a new formal report draft and creates a priority review task.</li>
        <li><strong>Step 4 - Funding Agent:</strong> Scopes matching grants and updates overall command center KPIs.</li>
      </ul>
    </div>

    <div class="card command-center mb-6" style="border-left-color: var(--danger-color);">
      <h3 style="color: var(--danger-color); display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem; margin-bottom: 0.75rem;">
        <span>⏳</span> 4. Kanban & Publishing Workflow
      </h3>
      <ul style="margin-left: 1.5rem; line-height: 1.6; font-size: 0.9rem; color: var(--text-color); display: flex; flex-direction: column; gap: 0.5rem;">
        <li><strong>Content Pipeline Board:</strong> Tracks social media and campaign content cards from Draft/Review to Scheduled/Published.</li>
        <li><strong>AI Output Staging:</strong> Newly run pipeline posts land automatically under the <em>Review</em> column.</li>
        <li><strong>Metrics Integration:</strong> When content is marked as <em>Published</em>, the system automatically simulates real-time traction, boosting the client’s Reach and active participants metrics.</li>
      </ul>
    </div>

    <div class="card command-center mb-6" style="border-left-color: #0284C7;">
      <h3 style="color: #0284C7; display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem; margin-bottom: 0.75rem;">
        <span>💎</span> 5. Funding Opportunity & Proposal Generator
      </h3>
      <ul style="margin-left: 1.5rem; line-height: 1.6; font-size: 0.9rem; color: var(--text-color); display: flex; flex-direction: column; gap: 0.5rem;">
        <li><strong>Matching Database:</strong> Contains available global grant options matching sector categories (e.g. Environmental, human rights).</li>
        <li><strong>Proposal Compilation:</strong> Select a grant and trigger the Generator. The app pulls contact, country focus, and sector targets from the active NGO metadata to draft a fully styled Concept Note ready for download.</li>
      </ul>
    </div>
  `;
}

