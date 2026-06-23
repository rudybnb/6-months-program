import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000';
const results = [];

function assert(description, condition) {
  if (condition) {
    results.push({ test: description, status: 'PASS' });
    console.log(`[PASS] ${description}`);
  } else {
    results.push({ test: description, status: 'FAIL' });
    console.error(`[FAIL] ${description}`);
  }
}

async function runTests() {
  console.log('=== STARTING PROGRAMMATIC BACKEND & DB RULES VERIFICATION ===\n');

  let adminToken = '';
  let bobbyToken = '';

  // 1. Admin Login Credentials check
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ikcomms.org', password: 'admin123' })
    });
    const data = await res.json();
    adminToken = data.token;
    assert('1. Login successfully as Irene (Admin)', res.status === 200 && adminToken !== undefined);
  } catch (err) {
    assert('1. Login successfully as Irene (Admin)', false);
  }

  // 2. Client Login check
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bobby@groundwork.org.za', password: 'bobby123' })
    });
    const data = await res.json();
    bobbyToken = data.token;
    assert('2. Login successfully as Bobby (Client User)', res.status === 200 && bobbyToken !== undefined);
  } catch (err) {
    assert('2. Login successfully as Bobby (Client User)', false);
  }

  // Create a workspace for testing lockout and single-source check constraints
  const testClientId = 'lockout-test-' + Math.floor(Math.random() * 1000);
  const testClient = {
    id: testClientId,
    name: 'Lockout Verification NGO',
    isBriefApproved: false,
    areAgentsActivated: false
  };

  try {
    const createRes = await fetch(`${API_BASE}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(testClient)
    });
    assert('Setup: Create lockout-test workspace', createRes.status === 201);
  } catch (err) {
    console.error('Setup workspace failed:', err);
  }

  // 3. AI generation block on unapproved workspace (Lockout verification)
  try {
    const res = await fetch(`${API_BASE}/api/ai-outputs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        agentId: 'socialmedia',
        outputType: 'Facebook post',
        content: 'This generation must block.',
        sourceEvidenceId: 'ev_report_pdf'
      })
    });
    const data = await res.json();
    assert('3. Confirm system blocks AI generation when brief is unapproved', res.status === 403 && data.message.includes('locked'));
  } catch (err) {
    assert('3. Confirm system blocks AI generation when brief is unapproved', false);
  }

  // Approve client brief
  try {
    const res = await fetch(`${API_BASE}/api/clients/${testClientId}/brief`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isBriefApproved: true })
    });
    assert('Setup: Approve test workspace brief status', res.status === 200);
  } catch (err) {
    console.error('Approve brief setup failed:', err);
  }

  // 4. Try generating an AI output without any source evidence references
  try {
    const res = await fetch(`${API_BASE}/api/ai-outputs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        agentId: 'socialmedia',
        outputType: 'Facebook post',
        content: 'This must block due to no source evidence.'
      })
    });
    const data = await res.json();
    assert('4. Confirm system blocks AI output generation with 0 sources', res.status === 400 && data.message.includes('exactly one source'));
  } catch (err) {
    assert('4. Confirm system blocks AI output generation with 0 sources', false);
  }

  // 5. Try generating AI output with multiple source IDs
  try {
    const res = await fetch(`${API_BASE}/api/ai-outputs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        agentId: 'socialmedia',
        outputType: 'Facebook post',
        content: 'This must block due to multiple sources.',
        sourceEvidenceId: 'ev_report_pdf',
        sourceMeetingId: 'meet_gw_onboarding'
      })
    });
    const data = await res.json();
    assert('5. Confirm system blocks AI output generation with multiple sources (>1)', res.status === 400 && data.message.includes('exactly one source'));
  } catch (err) {
    assert('5. Confirm system blocks AI output generation with multiple sources (>1)', false);
  }

  // 6. Generate AI output with exactly one valid source ID
  let validOutputId = '';
  try {
    const res = await fetch(`${API_BASE}/api/ai-outputs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        agentId: 'socialmedia',
        outputType: 'Facebook post',
        content: 'Valid content backed by one source.',
        sourceEvidenceId: 'ev_report_pdf'
      })
    });
    const data = await res.json();
    validOutputId = data.id;
    assert('6. Confirm AI generation succeeds with exactly one source ID', res.status === 201 && data.id !== undefined);
  } catch (err) {
    assert('6. Confirm AI generation succeeds with exactly one source ID', false);
  }

  // 7. Secure Upload: Block zoom transcript upload with invalid format (.exe)
  try {
    // Write a dummy exe file in scratch space to upload
    const dummyExePath = path.join(process.cwd(), 'scratch_dummy.exe');
    fs.writeFileSync(dummyExePath, 'dummy exe data');

    const form = new FormData();
    const blob = new Blob(['dummy exe data'], { type: 'application/x-msdownload' });
    form.append('file', blob, 'malicious.exe');
    form.append('title', 'Intrusion Attempt');

    const res = await fetch(`${API_BASE}/api/clients/${testClientId}/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: form
    });
    const data = await res.json();
    assert('7. Secure Upload: Block Zoom transcript uploads of invalid format (.exe)', res.status === 400 && data.message.includes('Invalid format'));
    
    // Clean up
    fs.unlinkSync(dummyExePath);
  } catch (err) {
    assert('7. Secure Upload: Block Zoom transcript uploads of invalid format (.exe)', false);
  }

  // 8. Secure Upload: Accept zoom transcript upload with valid format (.vtt)
  let meetingId = '';
  try {
    const form = new FormData();
    const blob = new Blob(['Bobby: We want 30 school air quality sensors.'], { type: 'text/vtt' });
    form.append('file', blob, 'meeting_june23.vtt');
    form.append('title', 'Clean Air Strategy Session');
    form.append('attendees', 'Bobby Peek, Irene');

    const res = await fetch(`${API_BASE}/api/clients/${testClientId}/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: form
    });
    const data = await res.json();
    meetingId = data.id;
    assert('8. Secure Upload: Accept valid Zoom transcript (.vtt) & store size/meta', res.status === 201 && data.transcriptFile !== '' && data.transcriptFormat === '.vtt');
  } catch (err) {
    assert('8. Secure Upload: Accept valid Zoom transcript (.vtt) & store size/meta', false);
  }

  // 9. Separate Approval / Scheduling / Publishing tracking on status change
  try {
    const res = await fetch(`${API_BASE}/api/ai-outputs/${validOutputId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Approved', approvedBy: 'CEO Irene' })
    });
    const data = await res.json();
    assert('9. Status Flow: Record separate approvedBy & approvedAt fields', res.status === 200 && data.updates.approvedBy === 'CEO Irene' && data.updates.approvedAt !== null);
  } catch (err) {
    assert('9. Status Flow: Record separate approvedBy & approvedAt fields', false);
  }

  // 10. Propose and approve change logs with database transaction safety
  try {
    // Propose shift
    const proposeRes = await fetch(`${API_BASE}/api/clients/${testClientId}/change-logs/propose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        meetingId,
        changes: [
          { field: 'toneOfVoice', label: 'Tone of Voice', oldVal: 'Urgent', newVal: 'Inspirational', reason: 'Youth focus' }
        ]
      })
    });
    const proposeData = await proposeRes.json();
    const logId = proposeData.id;

    // Approve shift
    const approveRes = await fetch(`${API_BASE}/api/change-logs/${logId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert('10. Change Logs: Propose and apply updates via transaction safety', approveRes.status === 200);
  } catch (err) {
    assert('10. Change Logs: Propose and apply updates via transaction safety', false);
  }

  // 11. Multi-tenant access isolation verification
  try {
    // Client user Bobby (associated only with groundwork-demo) tries to access the new test NGO workspace
    const res = await fetch(`${API_BASE}/api/clients/${testClientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bobbyToken}`
      }
    });
    assert('11. Multi-Tenancy: Block users from accessing unassigned workspaces', res.status === 403);
  } catch (err) {
    assert('11. Multi-Tenancy: Block users from accessing unassigned workspaces', false);
  }

  // 12. Workspace Deletion & Cascade verification
  try {
    const deleteRes = await fetch(`${API_BASE}/api/clients/${testClientId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    // Check workspace no longer exists
    const checkRes = await fetch(`${API_BASE}/api/clients/${testClientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    // Check campaigns/meetings cascade empty
    const checkMeetingsRes = await fetch(`${API_BASE}/api/clients/${testClientId}/meetings-list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const meetingsData = await checkMeetingsRes.json();

    let deleteErrorMsg = '';
    if (deleteRes.status !== 200) {
      try {
        const deleteError = await deleteRes.json();
        deleteErrorMsg = JSON.stringify(deleteError);
      } catch (err) {
        deleteErrorMsg = await deleteRes.text();
      }
      console.log('Delete Error Response:', deleteErrorMsg);
    }

    console.log(`DEBUG Delete: deleteRes.status = ${deleteRes.status}, checkRes.status = ${checkRes.status}, meetingsData.length = ${meetingsData.length}`);

    assert('12. Workspace Deletion: Delete workspace and assert cascading references are deleted', 
      deleteRes.status === 200 && checkRes.status === 404 && meetingsData.length === 0
    );
  } catch (err) {
    console.error('Delete test error:', err);
    assert('12. Workspace Deletion: Delete workspace and assert cascading references are deleted', false);
  }

  console.log('\n=== TESTING COMPLETE ===');
  console.log(`Summary: ${results.filter(r => r.status === 'PASS').length}/${results.length} tests passed.`);

  const failed = results.filter(r => r.status === 'FAIL');
  if (failed.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
