const http = require('http');
http.get('http://localhost:5173/', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf('DEBUG');
    const start = data.indexOf('{', idx);
    const end = data.indexOf('</div>', start);
    const jsonStr = data.substring(start, end).replace(/&quot;/g, '\"');
    try {
      const config = JSON.parse(jsonStr);
      console.log('siteStatus =', config.siteStatus);
      console.log('site =', !!config.site);
      if (config.site) console.log('site.siteStatus =', config.site.siteStatus);
    } catch(e) { console.log('Parse error', e.message); }
  });
});
