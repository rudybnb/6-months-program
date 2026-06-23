import {
  state,
  addClientWorkspace,
  addMeeting,
  addAiOutput,
  proposeMeetingChangeLog,
  approveMeetingChangeLog,
  simulateMeetingAgentAnalysis
} from './src/js/state.js';

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
  console.log('=== STARTING PROGRAMMATIC STATE & RULES VERIFICATION ===\n');

  // Test client details
  const testClientId = 'temp-test-client-123';
  const testClientObj = {
    id: testClientId,
    client_id: testClientId,
    name: 'Temporary Test NGO',
    isDemo: false,
    isBriefApproved: false, // Start as unapproved
    isMeetingSummaryApproved: false,
    areAgentsActivated: false,
    clientStatus: 'Lead',
    logo: '🧪',
    primaryContact: 'Test Contact',
    email: 'test@ngo.org',
    monthlyFee: 1000,
    contractValue: 12000,
    startDate: '2026-06-23',
    renewalDate: '2027-06-23'
  };

  // 1. Create a new client workspace with isBriefApproved = false
  addClientWorkspace(testClientObj, [], [], null);
  const clientObj = state.clients.find(c => c.id === testClientId);
  assert('1. Create new client workspace with isBriefApproved = false', clientObj !== undefined && clientObj.isBriefApproved === false);

  // 2. Try to generate an AI output for that client
  // 3. Confirm the system blocks generation
  let blockedOnUnapproved = false;
  try {
    addAiOutput({
      clientId: testClientId,
      client_id: testClientId,
      agentId: 'storytelling',
      outputType: 'Story update',
      source_evidence_id: 'ev_report_pdf',
      content: 'This should not be generated.'
    });
  } catch (error) {
    if (error.message.includes('locked') || error.message.includes('Blocked')) {
      blockedOnUnapproved = true;
    } else {
      console.log('Unexpected error message:', error.message);
    }
  }
  assert('2 & 3. Confirm system blocks AI generation when brief is unapproved', blockedOnUnapproved);

  // 4. Approve the client brief
  clientObj.isBriefApproved = true;
  assert('4. Approve the client brief (isBriefApproved = true)', clientObj.isBriefApproved === true);

  // 5. Try generating an AI output without source evidence
  // 6. Confirm the system blocks it
  let blockedOnNoEvidence = false;
  try {
    addAiOutput({
      clientId: testClientId,
      client_id: testClientId,
      agentId: 'storytelling',
      outputType: 'Story update',
      content: 'Missing source evidence.'
    });
  } catch (error) {
    if (error.message.includes('linked source') || error.message.includes('exactly one source')) {
      blockedOnNoEvidence = true;
    } else {
      console.log('Unexpected error message:', error.message);
    }
  }
  assert('5 & 6. Confirm system blocks AI generation without source evidence', blockedOnNoEvidence);

  // 7. Generate an AI output with exactly one valid source
  // 8. Confirm the output is created successfully
  let outputCreatedSuccess = false;
  try {
    addAiOutput({
      clientId: testClientId,
      client_id: testClientId,
      agentId: 'storytelling',
      outputType: 'Story update',
      source_evidence_id: 'ev_report_pdf', // Exactly one source
      content: 'Valid story draft backed by ev_report_pdf.'
    });
    // Check if added to state
    const createdOut = state.aiOutputs.find(o => o.client_id === testClientId && o.source_evidence_id === 'ev_report_pdf');
    if (createdOut) {
      outputCreatedSuccess = true;
    }
  } catch (error) {
    console.error('Error during valid generation:', error.message);
  }
  assert('7 & 8. Confirm generation succeeds with exactly one source ID', outputCreatedSuccess);

  // 9. Try generating an output with two source IDs
  // 10. Confirm the system blocks it
  let blockedOnMultipleSources = false;
  try {
    addAiOutput({
      clientId: testClientId,
      client_id: testClientId,
      agentId: 'storytelling',
      outputType: 'Story update',
      source_evidence_id: 'ev_report_pdf',
      source_meeting_id: 'meet_gw_onboarding', // Dual source
      content: 'Invalid dual source.'
    });
  } catch (error) {
    if (error.message.includes('exactly one source')) {
      blockedOnMultipleSources = true;
    } else {
      console.log('Unexpected error message:', error.message);
    }
  }
  assert('9 & 10. Confirm system blocks generation when multiple sources are attached', blockedOnMultipleSources);

  // 11. Upload/ingest a meeting transcript
  // 12. Confirm it creates a meeting record linked to client_id
  const meetingName = 'Transcript Test Alignment';
  const newMeeting = addMeeting({
    client_id: testClientId,
    title: meetingName,
    date: '2026-06-23',
    notes: 'Testing transcript ingestion',
    transcript: 'John: "We need 30 sensors and primary school focus."',
    recording_file: 'zoom_0.mp4',
    transcript_file: 'transcript.txt',
    transcript_format: '.txt',
    attendees: 'John, Irene',
    campaign_id: 'cmp1'
  });

  const checkMeeting = state.meetings.find(m => m.id === newMeeting.id && m.client_id === testClientId);
  assert('11 & 12. Confirm meeting transcript record is ingested and linked to client_id', checkMeeting !== undefined);

  // 13. Simulate a meeting change
  // 14. Confirm it creates a proposed Change Log
  const analysisResult = simulateMeetingAgentAnalysis(newMeeting.transcript);
  const proposedLog = proposeMeetingChangeLog(testClientId, newMeeting.id, analysisResult.changes);
  
  const checkLog = state.changeLogs.find(l => l.id === proposedLog.id && l.client_id === testClientId && l.meeting_id === newMeeting.id);
  assert('13 & 14. Confirm Meeting Agent analysis creates a proposed Change Log linked to meeting_id', checkLog !== undefined && checkLog.changes.length > 0);

  // 15. Approve the Change Log
  // 16. Confirm version history records old value, new value, approval user and approval date
  approveMeetingChangeLog(proposedLog.id, 'Tester Irene');
  
  const checkHistory = state.changeLogHistory.filter(h => h.client_id === testClientId && h.meeting_id === newMeeting.id);
  const hasVersionLogs = checkHistory.length > 0;
  let allFieldsValid = true;
  
  if (hasVersionLogs) {
    checkHistory.forEach(h => {
      if (!h.oldValue || !h.newValue || h.approvedBy !== 'Tester Irene' || !h.approvedAt) {
        allFieldsValid = false;
      }
    });
  } else {
    allFieldsValid = false;
  }
  
  assert('15 & 16. Confirm version history records all fields upon Change Log approval', hasVersionLogs && allFieldsValid);

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
