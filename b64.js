const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*?)'/s);
if (match) {
  console.log(Buffer.from(match[1]).toString('base64'));
}
