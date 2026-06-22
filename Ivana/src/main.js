import './style.css';
import { state, subscribe, changeUserRole, selectClient } from './js/state.js';
import { initRouter } from './js/router.js';
import { initAssistant } from './js/assistant.js';

document.addEventListener('DOMContentLoaded', () => {
  const viewContainer = document.getElementById('mainViewContainer');
  const roleSelector = document.getElementById('roleSelector');
  const clientScoper = document.getElementById('sidebarClientScoper');
  const scoperClientSelect = document.getElementById('scoperClientSelect');
  
  const headerTitle = document.getElementById('pageViewTitle');
  const headerAvatar = document.getElementById('headerUserAvatar');
  const headerUserName = document.getElementById('headerUserName');
  const headerUserRoleName = document.getElementById('headerUserRoleName');

  // Initialize client-side SPA router
  const triggerRouterRefresh = initRouter(viewContainer);

  // Initialize interactive support assistant
  initAssistant();

  // Sync header metadata with state
  const syncHeaderAndNavigation = () => {
    const hash = window.location.hash || '#dashboard';
    const cleanHash = hash.split('?')[0];

    // Set page header title
    const titleMap = {
      '#dashboard': state.currentUserRole === 'admin' ? 'IK Admin Dashboard' : 'NGO Client Dashboard',
      '#clients': 'NGO Clients Database',
      '#content': 'Content Pipeline Board',
      '#reports': 'Donor Reporting Center',
      '#impact': 'Impact & Analytics Index',
      '#funding': 'Grant Opportunity Discoverer',
      '#agents': 'AI Agents Control Room',
      '#settings': 'Platform Settings',
      '#guide': 'System Workflow Guide'
    };
    headerTitle.textContent = titleMap[cleanHash] || 'Dashboard';

    // Show/hide admin links
    const adminLinks = document.querySelectorAll('.admin-only');
    if (state.currentUserRole === 'admin') {
      adminLinks.forEach(l => l.style.display = 'block');
      clientScoper.classList.remove('show');
      
      headerAvatar.textContent = 'IK';
      headerAvatar.style.backgroundColor = '#DBEAFE';
      headerAvatar.style.color = '#1D4ED8';
      headerUserName.textContent = 'Irene K.';
      headerUserRoleName.textContent = 'Platform Owner';
    } else {
      adminLinks.forEach(l => l.style.display = 'none');
      clientScoper.classList.add('show');

      // Populate client selector dynamically
      scoperClientSelect.innerHTML = state.clients.map(c => `
        <option value="${c.id}" ${c.id === state.selectedClientId ? 'selected' : ''}>
          ${c.logo} ${c.name}
        </option>
      `).join('') || '<option value="">No clients</option>';

      // Get target client info
      const client = state.clients.find(c => c.id === state.selectedClientId) || state.clients[0];
      if (client) {
        headerAvatar.textContent = client.logo;
        headerAvatar.style.backgroundColor = '#ECFDF5';
        headerAvatar.style.color = '#065F46';
        headerUserName.textContent = client.primaryContact;
        headerUserRoleName.textContent = client.name;
      } else {
        headerAvatar.textContent = '👤';
        headerAvatar.style.backgroundColor = '#E2E8F0';
        headerAvatar.style.color = '#475569';
        headerUserName.textContent = 'No client selected';
        headerUserRoleName.textContent = 'NGO Client Portal';
      }

      // In client mode, if they navigate to an admin-only path, redirect them to dashboard
      if (cleanHash === '#clients' || cleanHash === '#settings') {
        window.location.hash = '#dashboard';
      }
    }
  };

  // Subscribe to state updates to automatically redraw current view
  subscribe(() => {
    syncHeaderAndNavigation();
    triggerRouterRefresh();
  });

  // Handle workspace switcher (Admin vs NGO Client)
  roleSelector.addEventListener('change', (e) => {
    const val = e.target.value;
    changeUserRole(val);
  });

  // Handle active client switcher in portal
  scoperClientSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    selectClient(val);
  });

  // Listen to hash changes to keep headers synced
  window.addEventListener('hashchange', () => {
    syncHeaderAndNavigation();
  });

  // Initial Sync
  syncHeaderAndNavigation();
});
