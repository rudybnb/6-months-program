import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'ik-communications-jwt-key-2026';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://ik-communications.onrender.com'
];

// Enable CORS and cookie parsing
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      /^http:\/\/localhost:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static frontend files from 'dist' directory
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Initialize file uploads folders
const uploadsDir = path.join(__dirname, 'storage', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ----------------------------------------------------
// SECURE FILE UPLOAD MODULE (MULTER SETUP)
// ----------------------------------------------------

const ALLOWED_EXTENSIONS = [
  '.pdf', '.docx', '.xlsx', '.xls', '.vtt', '.txt', '.srt', '.png', '.jpg', '.jpeg'
];

const ZOOM_TRANSCRIPT_EXTENSIONS = [
  '.vtt', '.txt', '.docx', '.pdf', '.srt'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 10000000)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (req.path.includes('/meetings')) {
    if (ZOOM_TRANSCRIPT_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid format. Zoom transcript files must be one of: ${ZOOM_TRANSCRIPT_EXTENSIONS.join(', ')}`), false);
    }
  } else {
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid format. Allowed file types are: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
    }
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ----------------------------------------------------
// CORE SECURITY MIDDLEWARE
// ----------------------------------------------------

function authenticateToken(req, res, next) {
  let token = req.cookies.token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts[0] === 'Bearer') token = parts[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Access expired or invalid token.' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
  }
  next();
}

async function checkClientAccess(req, res, next) {
  const clientId = req.params.id || req.body.clientId || req.body.client_id || req.query.clientId || req.query.client_id;
  
  if (!clientId) {
    return res.status(400).json({ message: 'Missing clientId query or parameter context.' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const linkage = await db('client_users')
    .where({ userId: req.user.id, clientId: clientId })
    .first();

  if (!linkage) {
    return res.status(403).json({ message: 'Unauthorized. You do not have access to this client workspace.' });
  }
  next();
}

async function logAudit(userId, action, clientId, targetId, details, req) {
  const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '';
  await db('audit_logs').insert({
    id: 'aud-' + Math.floor(Math.random() * 10000000),
    userId: userId,
    action: action,
    clientId: clientId,
    targetId: targetId,
    details: details,
    ipAddress: ipAddress
  });
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const validPass = await bcrypt.compare(password, user.passwordHash);
    if (!validPass) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    let assignedClientId = null;
    if (user.role === 'client') {
      const link = await db('client_users').where({ userId: user.id }).first();
      if (link) assignedClientId = link.clientId;
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, clientId: assignedClientId },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

    await logAudit(user.id, 'LOGIN', assignedClientId, user.id, `User logged in from web application.`, req);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: assignedClientId,
      token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  await logAudit(req.user.id, 'LOGOUT', req.user.clientId, req.user.id, 'User signed out.', req);
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// ----------------------------------------------------
// NGO WORKSPACE ENDPOINTS
// ----------------------------------------------------

app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    let clients;
    if (req.user.role === 'admin') {
      clients = await db('client_workspaces').select('*');
    } else {
      const clientIds = await db('client_users')
        .where({ userId: req.user.id })
        .pluck('clientId');
      clients = await db('client_workspaces').whereIn('id', clientIds);
    }
    console.log(`[TEMP DEBUG] GET /api/clients - returning ${clients.length} clients:`, clients.map(c => ({ id: c.id, name: c.name })));
    res.json(clients);
  } catch (err) {
    console.error('[TEMP DEBUG] GET /api/clients error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/clients', authenticateToken, requireAdmin, async (req, res) => {
  const clientObj = req.body;
  if (!clientObj.name) {
    return res.status(400).json({ message: 'Organisation Name is required.' });
  }

  const clientId = clientObj.id || clientObj.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

  try {
    const finalClient = {
      id: clientId,
      name: clientObj.name,
      logo: clientObj.logo || '🌱',
      website: clientObj.website,
      country: clientObj.country,
      sector: clientObj.sector,
      primaryContact: clientObj.primaryContact,
      email: clientObj.email,
      phone: clientObj.phone,
      monthlyFee: parseFloat(clientObj.monthlyFee) || 0.0,
      contractValue: parseFloat(clientObj.contractValue) || 0.0,
      startDate: clientObj.startDate,
      renewalDate: clientObj.renewalDate,
      clientStatus: clientObj.clientStatus || 'Lead',
      isBriefApproved: clientObj.isBriefApproved || false,
      isMeetingSummaryApproved: clientObj.isMeetingSummaryApproved || false,
      areAgentsActivated: clientObj.areAgentsActivated || false,
      
      fbPageUrl: clientObj.fbPageUrl,
      fbFollowers: parseInt(clientObj.fbFollowers) || 0,
      fbAvgReach: parseInt(clientObj.fbAvgReach) || 0,
      fbAvgEngagement: parseFloat(clientObj.fbAvgEngagement) || 0.0,
      igHandle: clientObj.igHandle,
      igFollowers: parseInt(clientObj.igFollowers) || 0,
      igAvgReach: parseInt(clientObj.igAvgReach) || 0,
      igAvgEngagement: parseFloat(clientObj.igAvgEngagement) || 0.0,
      baselineTopPosts: clientObj.baselineTopPosts,
      baselineDemographics: clientObj.baselineDemographics,
      baselineStartDate: clientObj.baselineStartDate,

      goalsAchieve: clientObj.goalsAchieve,
      goalsProblem: clientObj.goalsProblem,
      goalsTop3: clientObj.goalsTop3,
      goalsSuccess: clientObj.goalsSuccess,
      goalsChallenges: clientObj.goalsChallenges,
      goalsSupport: clientObj.goalsSupport,

      mission: clientObj.mission,
      shortDesc: clientObj.shortDesc,
      toneOfVoice: clientObj.toneOfVoice,
      writingStyle: clientObj.writingStyle,
      wordsToUse: clientObj.wordsToUse,
      wordsToAvoid: clientObj.wordsToAvoid,
      brandColours: clientObj.brandColours,
      fonts: clientObj.fonts,
      approvedHashtags: clientObj.approvedHashtags,
      socialHandles: clientObj.socialHandles,
      canvaTemplates: clientObj.canvaTemplates,
      posterExamples: clientObj.posterExamples,

      targetReach: clientObj.targetReach,
      audienceCommunity: clientObj.audienceCommunity,
      audienceDonor: clientObj.audienceDonor,
      audienceGovernment: clientObj.audienceGovernment,
      audienceYouth: clientObj.audienceYouth,
      audienceMedia: clientObj.audienceMedia,
      locations: clientObj.locations,
      ageGroups: clientObj.ageGroups,
      languages: clientObj.languages,
      culturalConsiderations: clientObj.culturalConsiderations,
      audienceUnderstanding: clientObj.audienceUnderstanding,
      audienceAction: clientObj.audienceAction,

      currentFunders: clientObj.currentFunders,
      grantNames: clientObj.grantNames,
      reportingDeadlines: clientObj.reportingDeadlines,
      requiredDonorOutputs: clientObj.requiredDonorOutputs,
      donorLogoRequirements: clientObj.donorLogoRequirements,
      funderCommunicationRules: clientObj.funderCommunicationRules,
      requiredImpactMetrics: clientObj.requiredImpactMetrics,
      requiredEvidence: clientObj.requiredEvidence,
      reportFrequency: clientObj.reportFrequency || 'Monthly'
    };

    await db('client_workspaces').insert(finalClient);
    await logAudit(req.user.id, 'WORKSPACE_CREATION', clientId, clientId, `Workspace "${finalClient.name}" created as draft.`, req);

    res.status(201).json(finalClient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/clients/:id', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const client = await db('client_workspaces').where({ id: req.params.id }).first();
    if (!client) {
      return res.status(404).json({ message: 'Client workspace not found.' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/clients/:id/brief', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const client = await db('client_workspaces').where({ id: req.params.id }).first();
    if (!client) {
      return res.status(404).json({ message: 'Client workspace not found.' });
    }

    const updates = req.body;
    // Map camelCase body fields directly to identical camelCase DB columns
    const dbUpdates = {};
    const stringFields = [
      'name', 'logo', 'website', 'country', 'sector', 'email', 'phone', 'mission',
      'goalsAchieve', 'goalsProblem', 'goalsTop3', 'goalsSuccess', 'goalsChallenges', 'goalsSupport',
      'shortDesc', 'toneOfVoice', 'writingStyle', 'wordsToUse', 'wordsToAvoid',
      'brandColours', 'fonts', 'approvedHashtags', 'socialHandles', 'canvaTemplates', 'posterExamples',
      'targetReach', 'audienceCommunity', 'audienceDonor', 'audienceGovernment', 'audienceYouth', 'audienceMedia',
      'locations', 'ageGroups', 'languages', 'culturalConsiderations', 'audienceUnderstanding', 'audienceAction',
      'currentFunders', 'grantNames', 'reportingDeadlines', 'requiredDonorOutputs', 'donorLogoRequirements',
      'funderCommunicationRules', 'requiredImpactMetrics', 'requiredEvidence', 'reportFrequency', 'clientStatus',
      'isBriefApproved', 'areAgentsActivated'
    ];

    stringFields.forEach(f => {
      if (updates[f] !== undefined) dbUpdates[f] = updates[f];
    });

    await db('client_workspaces').where({ id: req.params.id }).update(dbUpdates);
    
    if (dbUpdates.isBriefApproved !== undefined) {
      const act = dbUpdates.isBriefApproved ? 'BRIEF_APPROVAL' : 'BRIEF_UNAPPROVAL';
      await logAudit(req.user.id, act, req.params.id, req.params.id, `Brief approved status set to ${dbUpdates.isBriefApproved}.`, req);
    } else {
      await logAudit(req.user.id, 'BRIEF_UPDATE', req.params.id, req.params.id, `Brief details updated by user.`, req);
    }

    res.json({ message: 'Client brief updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
  const clientId = req.params.id;
  console.log(`[TEMP DEBUG] DELETE /api/clients/:id - request received for ID: ${clientId}`);
  try {
    const client = await db('client_workspaces').where({ id: clientId }).first();
    console.log(`[TEMP DEBUG] Database lookup for ID ${clientId} returned:`, client ? { id: client.id, name: client.name } : 'null');
    if (!client) {
      console.log(`[TEMP DEBUG] DELETE /api/clients/:id - ID ${clientId} not found, returning 404`);
      return res.status(404).json({ message: 'Client workspace not found.' });
    }

    await logAudit(req.user.id, 'WORKSPACE_DELETION', clientId, clientId, `Workspace "${client.name}" deleted by admin.`, req);
    const delResult = await db('client_workspaces').where({ id: clientId }).del();
    console.log(`[TEMP DEBUG] DELETE /api/clients/:id - delete query completed. Rows affected: ${delResult}`);

    res.json({ message: 'Client workspace deleted successfully.' });
  } catch (err) {
    console.error(`[TEMP DEBUG] DELETE /api/clients/:id error for ID ${clientId}:`, err);
    res.status(500).json({ message: err.message });
  }
});

// ----------------------------------------------------
// FILE INGESTION ENDPOINTS
// ----------------------------------------------------

app.post('/api/clients/:id/evidence/upload', authenticateToken, checkClientAccess, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file received.' });
    }

    try {
      const evidenceId = 'ev_upload_' + Math.floor(Math.random() * 10000000);
      const originalName = req.file.originalname;
      const safeName = req.file.filename;
      const sizeBytes = req.file.size;
      const mimeType = req.file.mimetype;
      const step = req.body.onboardingStep || 'General Evidence';
      const campaignId = req.body.campaignId || null;

      const newEvidence = {
        id: evidenceId,
        clientId: req.params.id,
        campaignId: campaignId,
        name: safeName,
        originalName: originalName,
        filePath: `storage/uploads/${safeName}`,
        fileSize: sizeBytes,
        contentType: mimeType,
        onboardingStep: step,
        sourceType: req.body.sourceType || 'PDF',
        verificationStatus: req.body.verificationStatus || 'Verified',
        textExcerpt: req.body.textExcerpt || `Ingested file: ${originalName}`,
        uploadedBy: req.user.id
      };

      await db('evidence').insert(newEvidence);
      await logAudit(req.user.id, 'FILE_UPLOAD', req.params.id, evidenceId, `Uploaded evidence file "${originalName}" (Size: ${sizeBytes} bytes).`, req);

      res.status(201).json(newEvidence);
    } catch (dbErr) {
      res.status(500).json({ message: dbErr.message });
    }
  });
});

app.post('/api/clients/:id/meetings', authenticateToken, checkClientAccess, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const ext = req.file ? path.extname(req.file.originalname).toLowerCase() : '.txt';
      const meetingId = 'meet_upload_' + Math.floor(Math.random() * 10000000);
      
      const newMeeting = {
        id: meetingId,
        clientId: req.params.id,
        campaignId: req.body.campaignId || null,
        title: req.body.title || 'Alignment Meeting',
        date: req.body.date || new Date().toISOString().split('T')[0],
        notes: req.body.notes || 'Zoom transcript processed.',
        transcript: req.body.transcript || (req.file ? `[Transcript contents of ${req.file.originalname}]` : ''),
        status: 'Processed',
        recordingFile: req.body.recordingFile || '',
        transcriptFile: req.file ? req.file.filename : '',
        transcriptFormat: ext,
        attendees: req.body.attendees || ''
      };

      await db('meetings').insert(newMeeting);
      
      if (req.file) {
        await logAudit(req.user.id, 'FILE_UPLOAD', req.params.id, meetingId, `Uploaded Zoom meeting transcript "${req.file.originalname}".`, req);
      }
      await logAudit(req.user.id, 'MEETING_INGESTION', req.params.id, meetingId, `Ingested meeting record "${newMeeting.title}".`, req);

      res.status(201).json(newMeeting);
    } catch (dbErr) {
      res.status(500).json({ message: dbErr.message });
    }
  });
});

// ----------------------------------------------------
// AI GENERATION & OUTPUTS (ENFORCED DB CHECKS)
// ----------------------------------------------------

app.post('/api/ai-outputs', authenticateToken, async (req, res) => {
  const output = req.body;
  const targetClientId = output.clientId || output.client_id;

  if (!targetClientId) {
    return res.status(400).json({ message: 'clientId is required.' });
  }

  try {
    const client = await db('client_workspaces').where({ id: targetClientId }).first();
    if (!client) {
      return res.status(404).json({ message: 'Client workspace not found.' });
    }

    if (!client.isBriefApproved) {
      return res.status(403).json({
        message: `Lockout Error: AI content generation is locked for client "${client.name}" until their workspace brief is approved.`
      });
    }

    let final_source_evidence_id = output.sourceEvidenceId || output.source_evidence_id || null;
    let final_source_meeting_id = output.sourceMeetingId || output.source_meeting_id || null;
    let final_source_manual_entry_id = output.sourceManualEntryId || output.source_manual_entry_id || null;

    // Auto-create manual evidence source if no sources are provided (e.g. for manually created idea cards)
    const agentId = output.agentId || output.agent_id || 'socialmedia';
    if (!final_source_evidence_id && !final_source_meeting_id && !final_source_manual_entry_id && agentId === 'manual') {
      const manualId = 'ev_manual_' + Math.floor(Math.random() * 10000000);
      await db('evidence').insert({
        id: manualId,
        clientId: targetClientId,
        name: `Manual Entry: ${output.title || 'Untitled Idea'}`,
        contentType: 'Manual Entry',
        sourceType: 'Manual Entry',
        dateUploaded: new Date().toISOString().split('T')[0],
        verificationStatus: req.user.role === 'admin' ? 'Verified by Admin' : 'Needs Review',
        textExcerpt: output.content || 'Manually created content idea.',
        uploadedBy: req.user.id || req.user.name,
        uploadedAt: new Date().toISOString()
      });
      final_source_manual_entry_id = manualId;
    }

    let sourcesCount = 0;
    if (final_source_evidence_id) sourcesCount++;
    if (final_source_meeting_id) sourcesCount++;
    if (final_source_manual_entry_id) sourcesCount++;

    if (sourcesCount !== 1) {
      return res.status(400).json({
        message: 'Validation failure: Every AI output must reference exactly one source ID from: sourceEvidenceId, sourceMeetingId, or sourceManualEntryId.'
      });
    }

    const outputId = 'out_' + Math.floor(Math.random() * 10000000);
    const newOut = {
      id: outputId,
      clientId: targetClientId,
      campaignId: output.campaignId || output.campaign_id || null,
      agentId: output.agentId || output.agent_id || 'socialmedia',
      outputType: output.outputType || output.output_type || 'Social Post',
      content: output.content || 'Draft content text.',
      confidenceScore: parseInt(output.confidenceScore || output.confidence_score) || 95,
      verificationStatus: output.verificationStatus || 'Verified',
      approvalStatus: output.approvalStatus || 'Draft',
      sourceEvidenceId: final_source_evidence_id,
      sourceMeetingId: final_source_meeting_id,
      sourceManualEntryId: final_source_manual_entry_id,
      sourceRequestId: output.sourceRequestId || output.source_request_id || null,
      contentPillar: output.contentPillar || output.content_pillar || null,
      internalNotes: req.user.role === 'admin' ? (output.internalNotes || output.internal_notes || null) : null,
      clientNotes: output.clientNotes || output.client_notes || null,
      platform: output.platform || null,
      title: output.title || null
    };

    await db('ai_outputs').insert(newOut);
    await logAudit(req.user.id, 'CONTENT_DRAFT_GEN', targetClientId, outputId, `AI Agent compiled new draft of type "${newOut.outputType}".`, req);

    if (req.user.role !== 'admin') {
      delete newOut.internalNotes;
    }
    res.status(201).json(newOut);
  } catch (err) {
    if (err.message.includes('chk_single_source')) {
      return res.status(400).json({ message: 'Validation failure: Database level check failed. Exactly one source column must be set.' });
    }
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/ai-outputs/:id/status', authenticateToken, async (req, res) => {
  const { status, approvedBy = 'Irene K.' } = req.body;
  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  try {
    const out = await db('ai_outputs').where({ id: req.params.id }).first();
    if (!out) {
      return res.status(404).json({ message: 'AI Output not found.' });
    }

    const timestamp = new Date().toISOString();
    const updates = {
      approvalStatus: status,
      updated_at: timestamp
    };

    if (status === 'Approved' || status === 'Client Approved') {
      updates.approvedBy = approvedBy;
      updates.approvedAt = timestamp;
      await logAudit(req.user.id, 'CONTENT_APPROVAL', out.clientId, out.id, `Approved draft. Status changed to "${status}".`, req);
    } else if (status === 'Scheduled') {
      updates.scheduledBy = approvedBy;
      updates.scheduledAt = timestamp;
      await logAudit(req.user.id, 'SCHEDULING', out.clientId, out.id, `Scheduled post.`, req);
    } else if (status === 'Published') {
      updates.publishedBy = approvedBy;
      updates.publishedAt = timestamp;
      await logAudit(req.user.id, 'PUBLISHING', out.clientId, out.id, `Published content post live.`, req);
    } else {
      updates.approvedBy = null;
      updates.approvedAt = null;
      updates.scheduledBy = null;
      updates.scheduledAt = null;
      updates.publishedBy = null;
      updates.publishedAt = null;
    }

    await db('ai_outputs').where({ id: req.params.id }).update(updates);
    res.json({ message: 'Status updated successfully.', updates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----------------------------------------------------
// PROPOSED SHIFTS & TRANSACTIONAL VERSION CONTROL
// ----------------------------------------------------

app.post('/api/clients/:id/change-logs/propose', authenticateToken, async (req, res) => {
  const { meetingId, changes = [] } = req.body;
  const mId = meetingId || req.body.meeting_id;
  
  try {
    await db('change_logs').where({ clientId: req.params.id, status: 'Pending' }).del();

    const changeLogId = 'log-' + Math.floor(Math.random() * 10000000);
    
    await db.transaction(async trx => {
      await trx('change_logs').insert({
        id: changeLogId,
        clientId: req.params.id,
        meetingId: mId,
        status: 'Pending'
      });

      const detailsRows = changes.map(c => ({
        id: 'det-' + Math.floor(Math.random() * 10000000),
        changeLogId: changeLogId,
        field: c.field,
        label: c.label,
        oldVal: c.oldVal || c.old_value || '',
        newVal: c.newVal || c.new_value || '',
        reason: c.reason || ''
      }));

      if (detailsRows.length > 0) {
        await trx('change_log_details').insert(detailsRows);
      }
    });

    res.status(201).json({ id: changeLogId, message: 'Proposed change log registered.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/change-logs/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  const logId = req.params.id;
  const username = req.user.name;

  try {
    const log = await db('change_logs').where({ id: logId }).first();
    if (!log) {
      return res.status(404).json({ message: 'Change log not found.' });
    }

    const proposedDetails = await db('change_log_details').where({ changeLogId: logId });

    await db.transaction(async trx => {
      await trx('change_logs').where({ id: logId }).update({
        status: 'Approved',
        approvedBy: username,
        approvedAt: new Date().toISOString()
      });

      for (const d of proposedDetails) {
        await trx('client_workspaces')
          .where({ id: log.clientId })
          .update({ [d.field]: d.newVal });

        await trx('change_log_history').insert({
          id: 'hist-' + Math.floor(Math.random() * 10000000),
          clientId: log.clientId,
          meetingId: log.meetingId,
          field: d.field,
          label: d.label,
          oldValue: d.oldVal,
          newValue: d.newVal,
          reason: d.reason,
          approvedBy: username,
          approvedAt: new Date().toISOString()
        });
      }
    });

    await logAudit(req.user.id, 'CHANGE_LOG_APPROVAL', log.clientId, logId, `Approved proposed brief updates from alignment meeting.`, req);
    res.json({ message: 'Proposed Change Log approved and successfully applied to client brief.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/clients/:id/change-logs', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const logs = await db('change_logs').where({ clientId: req.params.id });
    const fullLogs = [];
    for (const l of logs) {
      const details = await db('change_log_details').where({ changeLogId: l.id });
      fullLogs.push({ ...l, changes: details });
    }
    res.json(fullLogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/clients/:id/change-log-history', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const hist = await db('change_log_history').where({ clientId: req.params.id }).orderBy('approvedAt', 'desc');
    res.json(hist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----------------------------------------------------
// READ SPECIFIC ARTIFACT LISTS (DASHBOARD VIEWS)
// ----------------------------------------------------

app.get('/api/clients/:id/evidence', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const data = await db('evidence').where({ clientId: req.params.id }).orderBy('uploadedAt', 'desc');
    const mapped = data.map(e => ({
      ...e,
      createdBy: e.uploadedBy,
      createdAt: e.uploadedAt || e.created_at || e.dateUploaded
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/clients/:id/meetings-list', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const data = await db('meetings').where({ clientId: req.params.id }).orderBy('date', 'desc');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



app.get('/api/clients/:id/ai-outputs', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const data = await db('ai_outputs').where({ clientId: req.params.id }).orderBy('created_at', 'desc');
    if (req.user.role !== 'admin') {
      data.forEach(o => {
        delete o.internalNotes;
        delete o.internal_notes;
      });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/clients/:id/reports', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const data = await db('reports').where({ clientId: req.params.id }).orderBy('dueDate', 'asc');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/clients/:id/campaigns', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const data = await db('campaigns').where({ clientId: req.params.id }).orderBy('created_at', 'desc');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/clients/:id/campaigns', authenticateToken, checkClientAccess, async (req, res) => {
  const c = req.body;
  if (!c.name) {
    return res.status(400).json({ message: 'Campaign Name is required.' });
  }
  try {
    const newCamp = {
      id: c.id || 'cmp_' + Math.floor(Math.random() * 10000000),
      clientId: req.params.id,
      name: c.name,
      goal: c.goal || '',
      description: c.description || '',
      priority: c.priority || 'Medium',
      startDate: c.startDate || null,
      endDate: c.endDate || null,
      targetPlatforms: c.targetPlatforms || '',
      monthlyContentTarget: c.monthlyContentTarget || '',
      mainMessage: c.mainMessage || '',
      callToAction: c.callToAction || '',
      projectLead: c.projectLead || '',
      relatedFunder: c.relatedFunder || '',
      status: c.status || 'Active'
    };
    await db('campaigns').insert(newCamp);
    res.status(201).json(newCamp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/clients/:id/audit-logs', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const data = await db('audit_logs').where({ clientId: req.params.id }).orderBy('createdAt', 'desc');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----------------------------------------------------
// OPERATIONAL TRACKER ENDPOINTS
// ----------------------------------------------------

// Content Requests
app.get('/api/clients/:id/content-requests', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const data = await db('content_requests').where({ clientId: req.params.id }).orderBy('createdAt', 'desc');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/clients/:id/content-requests', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const { title, contentFor, description, assignee, dueDate, status, sourceMaterial, requestedBy, campaignId, sourceEvidenceId } = req.body;
    const reqId = 'req_' + Math.floor(Math.random() * 10000000);
    const newReq = {
      id: reqId,
      clientId: req.params.id,
      campaignId: campaignId || null,
      sourceEvidenceId: sourceEvidenceId || null,
      title: title || 'Untitled Request',
      contentFor: contentFor || '',
      description: description || '',
      assignee: assignee || '',
      dueDate: dueDate || '',
      status: status || 'Awaiting Instruction',
      sourceMaterial: sourceMaterial || '',
      requestedBy: requestedBy || req.user.name || 'Admin'
    };
    await db('content_requests').insert(newReq);
    await logAudit(req.user.id, 'CONTENT_REQUEST_CREATE', req.params.id, reqId, `Created content request "${newReq.title}".`, req);
    res.status(201).json(newReq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/content-requests/:id', authenticateToken, async (req, res) => {
  try {
    const { status, assignee, title, contentFor, description, dueDate, sourceMaterial, requestedBy, campaignId, sourceEvidenceId } = req.body;
    const item = await db('content_requests').where({ id: req.params.id }).first();
    if (!item) {
      return res.status(404).json({ message: 'Request not found.' });
    }
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (assignee !== undefined) updates.assignee = assignee;
    if (title !== undefined) updates.title = title;
    if (contentFor !== undefined) updates.contentFor = contentFor;
    if (description !== undefined) updates.description = description;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (sourceMaterial !== undefined) updates.sourceMaterial = sourceMaterial;
    if (requestedBy !== undefined) updates.requestedBy = requestedBy;
    if (campaignId !== undefined) updates.campaignId = campaignId;
    if (sourceEvidenceId !== undefined) updates.sourceEvidenceId = sourceEvidenceId;

    await db('content_requests').where({ id: req.params.id }).update(updates);
    await logAudit(req.user.id, 'CONTENT_REQUEST_UPDATE', item.clientId, item.id, `Updated content request details.`, req);
    res.json({ message: 'Content request updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Media Library
app.get('/api/clients/:id/media-library', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const data = await db('media_library').where({ clientId: req.params.id }).orderBy('createdAt', 'desc');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/clients/:id/media-library', authenticateToken, checkClientAccess, async (req, res) => {
  try {
    const { subject, mediaType, archiveLink, sourceFrom, campaignId, evidenceId, usageRights } = req.body;
    const mediaId = 'med_' + Math.floor(Math.random() * 10000000);
    const newMedia = {
      id: mediaId,
      clientId: req.params.id,
      campaignId: campaignId || null,
      evidenceId: evidenceId || null,
      subject: subject || 'Untitled Media Link',
      mediaType: mediaType || 'Photos',
      archiveLink: archiveLink || '',
      sourceFrom: sourceFrom || '',
      usageRights: usageRights || ''
    };
    await db('media_library').insert(newMedia);
    await logAudit(req.user.id, 'MEDIA_ASSET_ADD', req.params.id, mediaId, `Added media asset link for "${newMedia.subject}".`, req);
    res.status(201).json(newMedia);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Awareness Days Calendar
app.get('/api/awareness-days', authenticateToken, async (req, res) => {
  try {
    const data = await db('awareness_days').orderBy('id', 'asc');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/awareness-days', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { occasion, date, contentType, drivingCampaign, numberOfPosts, possiblePhotos, status, globalOrClientSpecific, clientId, campaignId, createPostAction } = req.body;
    const dayId = 'aw_' + Math.floor(Math.random() * 10000000);
    const newDay = {
      id: dayId,
      occasion,
      date,
      contentType,
      drivingCampaign,
      numberOfPosts,
      possiblePhotos,
      status: status || 'Draft',
      globalOrClientSpecific: globalOrClientSpecific || 'global',
      clientId: clientId || null,
      campaignId: campaignId || null,
      createPostAction: createPostAction || ''
    };
    await db('awareness_days').insert(newDay);
    res.status(201).json(newDay);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit/Save AI Output Details (Full update)
app.put('/api/ai-outputs/:id', authenticateToken, async (req, res) => {
  try {
    const { title, platform, contentPillar, content, internalNotes, clientNotes, approvalStatus, sourceRequestId } = req.body;
    const out = await db('ai_outputs').where({ id: req.params.id }).first();
    if (!out) {
      return res.status(404).json({ message: 'AI Output not found.' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (platform !== undefined) updates.platform = platform;
    if (contentPillar !== undefined) updates.contentPillar = contentPillar;
    if (content !== undefined) updates.content = content;
    if (internalNotes !== undefined && req.user.role === 'admin') updates.internalNotes = internalNotes;
    if (clientNotes !== undefined) updates.clientNotes = clientNotes;
    if (approvalStatus !== undefined) updates.approvalStatus = approvalStatus;
    if (sourceRequestId !== undefined) updates.sourceRequestId = sourceRequestId;

    updates.updated_at = new Date().toISOString();

    await db('ai_outputs').where({ id: req.params.id }).update(updates);
    await logAudit(req.user.id, 'CONTENT_DRAFT_UPDATE', out.clientId, out.id, `Saved edits for draft "${title || out.title || out.id}".`, req);
    res.json({ message: 'AI Output updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Serve SPA frontend index.html fallback for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  const indexHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.status(404).send('Static frontend not built yet.');
  }
});

// ----------------------------------------------------

app.listen(PORT, async () => {
  console.log(`Express API Server listening on port ${PORT}`);
  try {
    await initDb();
  } catch (dbErr) {
    console.error('Failed to initialize database tables on startup:', dbErr);
  }
});
