const https = require('https');

const apiKey = process.argv[2];

// First list available models
const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${apiKey}`,
  method: 'GET',
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const j = JSON.parse(d);
    if (j.error) {
      console.log('API KEY ERROR:', j.error.message);
    } else {
      const models = j.models?.map(m => m.name) || [];
      console.log('Available models:\n' + models.join('\n'));
      const flash = models.find(m => m.includes('flash'));
      console.log('\nRecommended:', flash || 'none found');
    }
  });
});
req.end();

