const http = require('http');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const updateEnvFile = (filePath, token) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('MEET_GOOGLE_REFRESH_TOKEN=')) {
    content = content.replace(/MEET_GOOGLE_REFRESH_TOKEN=.*/g, `MEET_GOOGLE_REFRESH_TOKEN="${token}"`);
  } else {
    content += `\nMEET_GOOGLE_REFRESH_TOKEN="${token}"\n`;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${path.basename(filePath)} with new refresh token!`);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<h1>Authorization Error: ${error}</h1>`);
    return;
  }

  if (code) {
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      if (tokens.refresh_token) {
        updateEnvFile(path.join(__dirname, '..', '.env'), tokens.refresh_token);
        updateEnvFile(path.join(__dirname, '..', '.env.local'), tokens.refresh_token);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <div style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #10B981; font-size: 32px;">🎉 Google Meet Authorized Successfully!</h1>
            <p style="font-size: 18px; color: #374151;">Your refresh token has been automatically saved to <b>.env</b> and <b>.env.local</b>.</p>
            <p style="font-size: 14px; color: #6B7280;">You can now close this tab and return to HelpSathi!</p>
          </div>
        `);
        console.log('\n✅ SUCCESS! Refresh token saved:', tokens.refresh_token);
        setTimeout(() => process.exit(0), 2000);
        return;
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Google did not return a refresh token. Revoke app permissions at https://myaccount.google.com/permissions and try again.</h1>');
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error retrieving token: ${err.message}</h1>`);
      console.error('Error exchanging token:', err);
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>HelpSathi Google OAuth Listener Running...</h1><p>Please complete Google consent in your browser.</p>');
  }
});

server.listen(80, () => {
  console.log('----------------------------------------------------');
  console.log('✅ Automatic Google OAuth Listener Running on http://localhost:80');
  console.log('----------------------------------------------------');
}).on('error', (err) => {
  console.error('Failed to start server on port 80:', err.message);
  process.exit(1);
});
