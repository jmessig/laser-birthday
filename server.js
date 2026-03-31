import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// ============================================
// CONFIGURATION
// ============================================
const PORT = process.env.PORT || 3000;

// Microsoft Graph — Azure AD App Registration
const GRAPH_TENANT_ID = process.env.GRAPH_TENANT_ID || '46a82ce8-787c-4948-8f35-dd04c9135ae8';
const GRAPH_CLIENT_ID = process.env.GRAPH_CLIENT_ID || 'a8d2b0fe-484f-4030-b434-0555e634394f';
const GRAPH_CLIENT_SECRET = process.env.GRAPH_CLIENT_SECRET || 'fAW8Q~WPXvIlC3WRm444NiWb_2kfdUn7-Wccoag-';
const SEND_FROM_EMAIL = process.env.SEND_FROM_EMAIL || 'birthday@coltonessig.com';

// Initialize Graph client
let graphClient = null;
try {
  const credential = new ClientSecretCredential(GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });
  graphClient = Client.initWithMiddleware({ authProvider });
  console.log(`[email] MS Graph configured, sending from ${SEND_FROM_EMAIL}`);
} catch (err) {
  console.error('[email] Failed to initialize MS Graph client:', err.message);
  console.log('[email] Email sending disabled');
}

// Load guest list
function loadGuests() {
  const raw = readFileSync(join(__dirname, 'guests.json'), 'utf-8');
  return JSON.parse(raw).guests;
}

// Party config (duplicated from frontend for email template)
const PARTY = {
  birthdayKidName: "Colton Essig",
  kidAge: 6,
  partyDate: "Saturday, May 30th, 2026",
  partyTimeStart: "11:00 AM",
  partyTimeEnd: "2:00 PM",
  venueName: "Apex Entertainment",
  venueAddress: "Albany, NY",
  rsvpName: "Shana",
  rsvpPhone: "201-519-4933",
  rsvpEmail: "smg6980@gmail.com",
  rsvpDeadline: "May 18th",
  missionDetails: "Laser Tag \u2022 Pizza \u2022 Cake \u2022 Fun!",
};

// ============================================
// API: Verify Guest
// ============================================
app.post('/api/verify-guest', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.json({ authorized: false, reason: 'no-name' });
  }

  const guests = loadGuests();
  const input = name.trim().toLowerCase();

  const match = guests.find(g => {
    const first = g.firstName.toLowerCase();
    const last = g.lastName.toLowerCase();
    const full = `${first} ${last}`;
    return input === first || input === last || input === full
      || input.includes(first) || first.includes(input);
  });

  if (match) {
    return res.json({
      authorized: true,
      guestName: `${match.firstName} ${match.lastName}`,
    });
  }

  return res.json({ authorized: false, reason: 'not-found' });
});

// ============================================
// API: Verify Full Name (second chance)
// ============================================
app.post('/api/verify-fullname', (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) {
    return res.json({ authorized: false, reason: 'incomplete' });
  }

  const guests = loadGuests();
  const fIn = firstName.trim().toLowerCase();
  const lIn = lastName.trim().toLowerCase();

  const match = guests.find(g => {
    const first = g.firstName.toLowerCase();
    const last = g.lastName.toLowerCase();
    return fIn === first && lIn === last;
  });

  if (match) {
    return res.json({
      authorized: true,
      guestName: `${match.firstName} ${match.lastName}`,
    });
  }

  return res.json({ authorized: false, reason: 'not-on-list' });
});

// ============================================
// API: Send Invitation Email (via MS Graph)
// ============================================
app.post('/api/send-invite', async (req, res) => {
  if (!graphClient) {
    return res.status(503).json({ error: 'Email not configured on server' });
  }

  const { email, agentName } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const p = PARTY;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a1a;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:500px;margin:20px auto;padding:30px;background:#0d0d24;border:2px solid #39FF14;border-radius:16px;">
    <h1 style="text-align:center;color:#39FF14;font-size:22px;letter-spacing:2px;margin:0 0 8px;">
      &#127919; MISSION BRIEFING: BIRTHDAY PARTY! &#127919;
    </h1>
    <p style="text-align:center;color:#00FFFF;font-size:16px;margin:0 0 16px;">
      Agent ${agentName || 'Recruit'}, you have proven yourself worthy!
    </p>
    <p style="text-align:center;color:#ffffffaa;font-size:14px;margin:0 0 16px;">
      You are hereby invited to join the ultimate mission:
    </p>
    <h2 style="text-align:center;color:#FF00FF;font-size:20px;margin:0 0 20px;">
      &#127874; ${p.birthdayKidName}'s ${p.kidAge}th Birthday Party! &#127874;
    </h2>
    <div style="background:#ffffff0a;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="margin:4px 0;font-size:14px;">&#128197; <span style="color:#ffffff88;">DATE:</span> <strong>${p.partyDate}</strong></p>
      <p style="margin:4px 0;font-size:14px;">&#128336; <span style="color:#ffffff88;">TIME:</span> <strong>${p.partyTimeStart} &ndash; ${p.partyTimeEnd}</strong></p>
      <p style="margin:4px 0;font-size:14px;">&#128205; <span style="color:#ffffff88;">LOCATION:</span> <strong>${p.venueName}</strong></p>
      <p style="margin:4px 0;font-size:14px;">&#128205; <span style="color:#ffffff88;">ADDRESS:</span> <strong>${p.venueAddress}</strong></p>
    </div>
    <p style="text-align:center;color:#FFD700;font-size:15px;margin:0 0 16px;">
      &#9889; ${p.missionDetails} &#9889;
    </p>
    <div style="background:#ffffff0a;border-radius:8px;padding:16px;margin:0 0 20px;">
      <p style="margin:4px 0;font-size:14px;">&#128100; <span style="color:#ffffff88;">RSVP TO:</span> <strong>${p.rsvpName}</strong></p>
      <p style="margin:4px 0;font-size:14px;">&#128241; <span style="color:#ffffff88;">CALL/TEXT:</span> <a href="tel:${p.rsvpPhone}" style="color:#00FFFF;">${p.rsvpPhone}</a></p>
      <p style="margin:4px 0;font-size:14px;">&#128231; <span style="color:#ffffff88;">EMAIL:</span> <a href="mailto:${p.rsvpEmail}" style="color:#00FFFF;">${p.rsvpEmail}</a></p>
      <p style="margin:4px 0;font-size:14px;">&#9200; <span style="color:#ffffff88;">RSVP BY:</span> <strong>${p.rsvpDeadline}</strong></p>
    </div>
    <div style="text-align:center;margin:0 0 16px;">
      <a href="sms:${p.rsvpPhone}" style="display:inline-block;padding:10px 24px;background:#39FF1420;border:2px solid #39FF14;color:#39FF14;text-decoration:none;border-radius:6px;font-weight:bold;margin:4px;">&#128241; TEXT RSVP</a>
      <a href="mailto:${p.rsvpEmail}?subject=RSVP%20-%20${encodeURIComponent(p.birthdayKidName)}%27s%20Birthday" style="display:inline-block;padding:10px 24px;background:#00FFFF20;border:2px solid #00FFFF;color:#00FFFF;text-decoration:none;border-radius:6px;font-weight:bold;margin:4px;">&#128231; EMAIL RSVP</a>
    </div>
    <p style="text-align:center;color:#00FFFF;font-style:italic;font-size:14px;margin:0;">
      "See you on the battlefield, Agent!"
    </p>
  </div>
</body>
</html>`;

  try {
    await graphClient.api(`/users/${SEND_FROM_EMAIL}/sendMail`).post({
      message: {
        subject: `\u{1F3AF} You're Invited \u2014 ${p.birthdayKidName}'s ${p.kidAge}th Birthday Party!`,
        body: {
          contentType: 'HTML',
          content: html,
        },
        toRecipients: [
          { emailAddress: { address: email } },
        ],
      },
      saveToSentItems: true,
    });
    console.log(`[email] Sent invitation to ${email} for agent "${agentName}"`);
    res.json({ success: true });
  } catch (err) {
    console.error('[email] Send failed:', err.message || err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ============================================
// SERVE STATIC FRONTEND (production build)
// ============================================
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — Express 5 uses '{*path}' instead of '*'
app.get('{*path}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[server] Operation: Laser Birthday running on port ${PORT}`);
  console.log(`[server] Serving static files from ./dist`);
});
