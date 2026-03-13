const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/kemphearum/kemphearum.github.io/commits/8469cc280686c0d388661b7daf435a848471414d/check-runs',
  headers: {
    'User-Agent': 'Node.js',
    'Accept': 'application/vnd.github+json'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (!json.check_runs) { console.log('No runs found'); return; }
      json.check_runs.forEach(run => {
        console.log(`Run: ${run.name} | Status: ${run.status} | Conclusion: ${run.conclusion}`);
      });
    } catch (e) {
      console.error('Failed to parse JSON', e);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
