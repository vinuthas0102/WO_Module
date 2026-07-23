import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist-offline');

function findFiles(dir, ext, results = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findFiles(fullPath, ext, results);
    } else if (entry.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  if (!existsSync(distDir)) {
    console.error('dist-offline directory not found. Run vite build first.');
    process.exit(1);
  }

  let html = readFileSync(join(distDir, 'index.html'), 'utf-8');

  // Inline CSS files
  const cssFiles = findFiles(distDir, '.css');
  for (const cssPath of cssFiles) {
    const cssContent = readFileSync(cssPath, 'utf-8');
    const baseName = cssPath.split('/').pop();
    const styleTag = `<style>\n${cssContent}\n</style>`;
    const pattern = new RegExp(
      `<link[^>]*href=["'][^"']*${escapeRegex(baseName)}["'][^>]*>`,
      'g'
    );
    html = html.replace(pattern, styleTag);
  }

  // Inline JS files
  const jsFiles = findFiles(distDir, '.js');
  for (const jsPath of jsFiles) {
    const jsContent = readFileSync(jsPath, 'utf-8');
    const baseName = jsPath.split('/').pop();
    const scriptTag = `<script type="module">\n${jsContent}\n</script>`;
    const pattern = new RegExp(
      `<script[^>]*src=["'][^"']*${escapeRegex(baseName)}["'][^>]*>\\s*</script>`,
      'g'
    );
    html = html.replace(pattern, scriptTag);
  }

  // Inline favicon as data URI
  const faviconSvg = join(projectRoot, 'public', 'favicon.svg');
  if (existsSync(faviconSvg)) {
    const faviconContent = readFileSync(faviconSvg, 'utf-8');
    const faviconDataUri = `data:image/svg+xml;base64,${Buffer.from(faviconContent).toString('base64')}`;
    html = html.replace(/<link[^>]*favicon[^>]*>/gi, `<link rel="icon" type="image/svg+xml" href="${faviconDataUri}" />`);
  }

  // Write the final single-file HTML
  const outputPath = join(distDir, 'tracksphere-offline.html');
  writeFileSync(outputPath, html);
  const sizeMB = Buffer.byteLength(html) / 1024 / 1024;
  console.log(`\nSingle-file HTML created: ${outputPath}`);
  console.log(`Size: ${sizeMB.toFixed(2)} MB`);

  // Verify no external file references remain in the HTML head
  const headEnd = html.indexOf('</head>');
  if (headEnd > 0) {
    const head = html.substring(0, headEnd);
    const remainingScripts = (head.match(/<script[^>]*src=/g) || []).length;
    const remainingLinks = (head.match(/<link[^>]*href=["']\.?\//g) || []).length;
    if (remainingScripts > 0) {
      console.warn(`WARNING: ${remainingScripts} external script references still remain in <head>`);
    }
    if (remainingLinks > 0) {
      console.warn(`WARNING: ${remainingLinks} external link references still remain in <head>`);
    }
    if (remainingScripts === 0 && remainingLinks === 0) {
      console.log('All assets inlined successfully - no external references in <head>.');
    }
  }
}

main();
