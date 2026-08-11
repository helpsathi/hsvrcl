// Run this script using Node.js to get your Google Refresh Token
// Command: node get-google-token.js

const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

// ==========================================
// Using the Web Application credentials you provided
// ==========================================
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost'; // As specified in your JSON

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('----------------------------------------------------');
console.log('1. Open this URL in your browser and log in with helpsathi9119@gmail.com:');
console.log('\n', authUrl, '\n');
console.log('----------------------------------------------------');
console.log('2. After you click "Allow", your browser will try to go to http://localhost/?code=...');
console.log('   The page will probably say "This site can’t be reached". THAT IS NORMAL!');
console.log('3. Look at the URL bar in your browser. Copy everything AFTER "code=" (and stop if you see a "&")');
console.log('----------------------------------------------------');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('4. Paste that code here: ', async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    if (!tokens.refresh_token) {
      console.error('\n⚠️ WARNING: Google did not return a new refresh_token.');
      console.error('Make sure to go to https://myaccount.google.com/permissions and revoke access for this app, then run this script again!');
      rl.close();
      return;
    }
    console.log('\n✅ SUCCESS! Received Refresh Token:\n');
    console.log(tokens.refresh_token);

    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');
    const envLocalPath = path.join(__dirname, '.env.local');

    const updateEnvFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('MEET_GOOGLE_REFRESH_TOKEN=')) {
        content = content.replace(/MEET_GOOGLE_REFRESH_TOKEN=.*/g, `MEET_GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
      } else {
        content += `\nMEET_GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"\n`;
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${path.basename(filePath)} successfully!`);
    };

    updateEnvFile(envPath);
    updateEnvFile(envLocalPath);
    console.log('\n🎉 ALL DONE! Your Google Meet integration is now fully active with valid Google credentials!');
  } catch (err) {
    console.error('Error retrieving access token', err);
  }
  rl.close();
});
