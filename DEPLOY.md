# Deployment Guide — birthday.coltonessig.com

## Architecture

```
Internet → Cloudflare Tunnel → your server:3000 → Express (serves React app + API)
```

The Express server serves both the static React build AND the API endpoints (guest verification, email sending). It runs on a single port.

---

## Step 1: Prepare the Server

SSH into your server and clone the repo:

```bash
cd /opt  # or wherever you keep your apps
git clone https://github.com/jmessig/laser-birthday.git
cd laser-birthday
npm install --production=false   # need devDeps for build step
npm run build                    # builds React app into ./dist
```

## Step 2: Configure Environment

Create a `.env` file (this file is gitignored):

```bash
cat > .env << 'EOF'
PORT=3000

# Microsoft Graph API — Azure AD App Registration
GRAPH_TENANT_ID=your-tenant-id
GRAPH_CLIENT_ID=your-client-id
GRAPH_CLIENT_SECRET=your-client-secret
SEND_FROM_EMAIL=birthday@coltonessig.com
EOF
```

The `.env` file is required for email functionality. Get the Graph credentials from the Azure AD app registration (shared with skitabor.com).

**Important**: The Azure AD app registration must have `Mail.Send` application permission for `birthday@coltonessig.com`. If it was only configured for `mo@skitabor.com`, you need to grant `Mail.Send` permission for the new mailbox in the Azure portal (or grant org-wide `Mail.Send` if not already done).

To load the `.env` at runtime, install dotenv or source it:

```bash
# Option A: install dotenv
npm install dotenv
# Then add this as the FIRST line of server.js:
#   import 'dotenv/config';

# Option B: use Node's --env-file flag (Node 20.6+)
node --env-file=.env server.js

# Option C: source it
export $(cat .env | xargs) && node server.js
```

## Step 3: Populate the Guest List

Edit `guests.json` to add all invited guests:

```json
{
  "guests": [
    { "firstName": "Colton", "lastName": "Essig" },
    { "firstName": "Emma", "lastName": "Smith" },
    { "firstName": "Jake", "lastName": "Johnson" }
  ]
}
```

The name matching is case-insensitive. When a user enters their "agent codename":
- If it matches any guest's first name → they're in
- If no match → they must enter their exact first + last name
- If that doesn't match → **ACCESS DENIED**

## Step 4: Run with PM2 (Recommended)

Use PM2 to keep the server running and auto-restart on crash:

```bash
# Install PM2 globally if you haven't
npm install -g pm2

# Start the app
cd /opt/laser-birthday
pm2 start server.js --name laser-birthday --env production

# Load .env vars
pm2 start server.js --name laser-birthday --node-args="--env-file=.env"
# OR if your Node version doesn't support --env-file:
pm2 start ecosystem.config.cjs --only laser-birthday

# Save PM2 config so it survives reboot
pm2 save
pm2 startup  # follow the printed instructions
```

If you prefer an ecosystem file, create `ecosystem.config.cjs`:

```js
module.exports = {
  apps: [{
    name: 'laser-birthday',
    script: 'server.js',
    cwd: '/opt/laser-birthday',
    env: {
      PORT: 3000,
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 587,
      SMTP_SECURE: 'false',
      SMTP_USER: 'your-email@gmail.com',
      SMTP_PASS: 'xxxx-xxxx-xxxx-xxxx',
    },
  }],
};
```

Verify it's running:

```bash
curl http://localhost:3000
# Should return the HTML of the React app
```

## Step 5: Configure Cloudflare Tunnel

You already have cloudflared running for other sites. Add a new route for the birthday subdomain.

Edit your cloudflared config (usually `~/.cloudflared/config.yml`):

```yaml
# ... your existing ingress rules ...

ingress:
  # ADD THIS RULE (before the catch-all)
  - hostname: birthday.coltonessig.com
    service: http://localhost:3000

  # ... your other rules ...

  # Catch-all (must be last)
  - service: http_status:404
```

**Important**: The new rule must go BEFORE any catch-all rule. Order matters — cloudflared processes rules top to bottom.

Then restart cloudflared:

```bash
# If running as a service:
sudo systemctl restart cloudflared

# If running manually:
cloudflared tunnel run <your-tunnel-name>
```

## Step 6: DNS (Cloudflare Dashboard)

In Cloudflare DNS for `coltonessig.com`, add a CNAME record:

| Type  | Name     | Target                             | Proxy |
|-------|----------|------------------------------------|-------|
| CNAME | birthday | `<your-tunnel-id>.cfargotunnel.com` | Yes   |

If your tunnel already has a wildcard or other records set up, this may already resolve. Verify:

```bash
curl https://birthday.coltonessig.com
```

## Step 7: Verify Everything

1. **Guest gate**: Visit the site, enter a name NOT on the guest list → should be prompted for full name → denied
2. **Guest pass**: Enter a first name that IS on the list → goes right in
3. **Games**: Play all 3 → decrypt button appears → invitation reveals
4. **Email** (if SMTP configured): Enter an email on the invitation screen → check inbox
5. **Mobile**: Test on a phone — share the link via text

---

## Updating

To update the site after code changes:

```bash
cd /opt/laser-birthday
git pull
npm run build
pm2 restart laser-birthday
```

To update the guest list, just edit `guests.json` — no rebuild needed (it's read fresh on each API call).

---

## Ports & Conflicts

The app runs on port **3000** by default. If that conflicts with another service, change it via the `PORT` env var. Update the cloudflared config to match.

The app does NOT need ports 80/443 — cloudflared handles TLS termination and proxies to your local port.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `EADDRINUSE` port 3000 | Another service is on port 3000. Change `PORT` in .env |
| Email not sending | Check Graph credentials. Ensure the Azure AD app has `Mail.Send` permission for `birthday@coltonessig.com` |
| Guest not recognized | Check `guests.json` — names must match exactly (first AND last for the full-name check) |
| Cloudflared not routing | Ensure the rule is BEFORE the catch-all. Restart cloudflared after config changes |
| Site loads but API 404s | You're hitting the Vite dev server, not the Express server. Run `npm run build && npm start` |
