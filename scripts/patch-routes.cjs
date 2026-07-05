const fs = require('fs');
const dir = 'app/routes/';
const files = fs.readdirSync(dir).filter(f => 
  f.endsWith('.jsx') && 
  !f.endsWith('sitemap.xml.jsx') && 
  !f.endsWith('rss.xml.jsx') && 
  !f.endsWith('section-redirect.jsx') && 
  !f.startsWith('api.')
);

for (const file of files) {
  const path = dir + file;
  let code = fs.readFileSync(path, 'utf8');
  
  if (code.includes('export function meta({ data }) {') || code.includes('export const meta = ({ data }) => {')) {
    code = code.replace(/export function meta\(\{ data \}\) \{/, 'export function meta({ data, matches }) {');
    code = code.replace(/export const meta = \(\{ data \}\) => \{/, 'export const meta = ({ data, matches }) => {');
  }

  if (code.includes('meta({ data, matches }) {') || code.includes('meta = ({ data, matches }) => {')) {
    const metaBlockStart = code.includes('meta({ data, matches }) {') 
      ? 'meta({ data, matches }) {' 
      : 'meta = ({ data, matches }) => {';
      
    if (!code.includes('const currentOrigin = matches')) {
      code = code.replace(
        metaBlockStart, 
        metaBlockStart + '\n  const currentOrigin = matches?.find(m => m.id === "root")?.data?.currentOrigin || DEFAULT_SITE_URL;'
      );
      
      // Replace only non-import DEFAULT_SITE_URL
      code = code.replace(/DEFAULT_SITE_URL/g, 'currentOrigin');
      // Fix import back
      code = code.replace(/import {([^}]*)currentOrigin([^}]*)} from/, 'import {$1DEFAULT_SITE_URL$2} from');
    }
  }
  fs.writeFileSync(path, code);
}
console.log('Patched routes for dynamic origin!');
