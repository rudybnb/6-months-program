// Interactive AI Support Assistant for IK Communications
export function initAssistant() {
  const toggleBtn = document.getElementById('chatToggleBtn');
  const chatWindow = document.getElementById('chatWindow');
  const closeBtn = document.getElementById('chatCloseBtn');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatBody = document.getElementById('chatBody');

  if (!toggleBtn || !chatWindow || !closeBtn || !chatInput || !chatSendBtn || !chatBody) return;

  // Toggle chat window
  toggleBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      chatInput.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('open');
  });

  // Handle messages
  const appendMessage = (text, sender) => {
    const msg = document.createElement('div');
    msg.className = `chat-message ${sender}`;
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  const handleSend = () => {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';

    // Show bot typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message bot typing';
    typingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      typingIndicator.remove();
      const botResponse = getBotResponse(text);
      appendMessage(botResponse, 'bot');
    }, 1000);
  };

  chatSendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  });
}

function getBotResponse(query) {
  const q = query.toLowerCase();
  
  if (q.includes('hello') || q.includes('hi ') || q.includes('hey') || q.includes('help')) {
    return `Hello! How can I help you? Ask me about:
- **AI Pipeline / Evidence**
- **Switching Roles / Workspace**
- **Content Pipeline / Kanban Board**
- **Reports Center**
- **Funding & Proposals**
- **AI Agents**`;
  }
  
  if (q.includes('pipeline') || q.includes('evidence') || q.includes('run') || q.includes('execute') || q.includes('input')) {
    return `💡 **How the AI Pipeline Works:**
1. Navigate to the **Dashboard** (under either workspace).
2. Look for the **"AI Impact Evidence Pipeline"** box.
3. Choose one of the preset prompts or type your own raw update from the field (e.g. *"Conducted workshops for 40 local residents"*).
4. Select the target client NGO.
5. Click **"Execute Multi-Agent Pipeline"**.
6. The app will simulate a step-by-step pipeline across multiple AI agents to generate stories, posts, and reports.`;
  }

  if (q.includes('role') || q.includes('workspace') || q.includes('admin') || q.includes('client') || q.includes('switch') || q.includes('change')) {
    return `👥 **Switching Roles & Workspaces:**
1. Look at the bottom of the left sidebar.
2. Under **"Current Workspace"**, you will see a dropdown menu.
3. Select **"💼 IK Admin Console"** to act as Irene (managing clients and viewing overall CEO metrics).
4. Select **"🌱 NGO Client Portal"** to act as a client organization (viewing customized client stats).
5. In client portal mode, you can also select the specific active NGO (like groundWork SA or Clean Air Africa) using the dropdown directly below the workspace switcher.`;
  }

  if (q.includes('content') || q.includes('kanban') || q.includes('post') || q.includes('approve') || q.includes('publish') || q.includes('board')) {
    return `📋 **Using the Content Pipeline Board:**
1. Click **Content Board** in the sidebar.
2. You will see columns representing the publishing workflow (*Draft, Review, Approved, Scheduled, Published*).
3. If you ran the AI Pipeline, your generated posts will appear under the **Review** column.
4. Click **"Approve"** on a card to move it to *Scheduled*.
5. Click **"Publish"** to mark it live. This will automatically increase that client's **Campaign Reach** and **People Reached** metrics on the dashboard.`;
  }

  if (q.includes('report') || q.includes('donor')) {
    return `📝 **Managing Reports:**
1. Click **Reports Center** in the sidebar.
2. Here you can view active reporting deadlines for different donors.
3. Running the AI Pipeline automatically generates a **Field Evidence Report** marked as *Pending Review*.
4. You can click **"Review"** to inspect its details and progress, or **"Download"** to get a generated report layout.`;
  }

  if (q.includes('funding') || q.includes('grant') || q.includes('proposal') || q.includes('concept')) {
    return `💎 **Discovering Funding & Generating Proposals:**
1. Click **Funding Discovery** in the sidebar to search current opportunities.
2. Find a grant in the table and click **"Generate Proposal"**.
3. The platform's **Funding Agent** will automatically draft a custom **Grant Proposal Concept Note** using the active client's metadata (contacts, sector, and goals).
4. You can edit this text directly or copy it for submission.`;
  }

  if (q.includes('agent')) {
    return `🤖 **About the AI Agents:**
Go to the **AI Agents** control room in the sidebar to monitor:
- **Storytelling Agent**: Translates raw text to narratives.
- **Social Media Agent**: Creates tailored posts.
- **Donor Reporting Agent**: Builds formal report drafts.
- **Funding Agent**: Matches programs with grants.
- **Newsletter / Analytics / Content Planner**: Additional support agents.
- **Activity Logs**: Real-time record of all completed activities.`;
  }
  
  if (q.includes('client') || q.includes('ngo')) {
    return `👥 **Managing NGO Clients:**
1. Switch to the **💼 IK Admin Console**.
2. Click **Clients** in the sidebar.
3. Click **"Add NGO Client"** in the top right to create a new client profile.
4. Once created, you can track their health score, active campaigns, and view their dedicated profile page by clicking their row.`;
  }

  return `I'm not sure I fully understand that question. 

You can ask me about:
- **AI Pipeline / Evidence** ("How to run the pipeline?")
- **Switching Roles / Workspace** ("How to switch to client?")
- **Content Pipeline / Kanban Board** ("How do I approve posts?")
- **Reports Center** ("How do I generate reports?")
- **Funding & Proposals** ("How do I draft a grant proposal?")
- **AI Agents** ("What do the agents do?")
- **Managing Clients** ("How do I add a new NGO?")`;
}
