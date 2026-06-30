const http = require('http');
http.get('http://localhost:5173/', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf('DEBUG');
    const end = data.indexOf('</div>', idx);
    console.log(data.substring(idx, end));
  });
});
