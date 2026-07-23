/**
 * Runtime screen export utility.
 * Captures the current rendered DOM + all active CSS and downloads
 * a standalone HTML file that visually replicates the current screen.
 */

const EXPORT_OVERRIDES_CSS = `
/* ── Export document overrides ───────────────────────────────── */
::-webkit-scrollbar { display: none; }
* { scrollbar-width: none; }

body {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

@media print {
  button:not([data-print-keep]),
  [role="menu"],
  [role="menuitem"],
  [data-toast],
  [role="status"],
  [data-radix-popper-content-wrapper],
  [role="dialog"],
  .animate-ping,
  [aria-label="Filter"],
  [aria-label="Sort"] {
    display: none !important;
  }

  [class*="rounded-xl"],
  [class*="rounded-lg"] {
    page-break-inside: avoid;
  }
}
`;

function collectAllCSS(): string {
  const chunks: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        chunks.push(rule.cssText);
      }
    } catch {
      // Cross-origin or restricted sheet — skip gracefully
    }
  }

  return chunks.join('\n');
}

function captureDOM(): string {
  const root = document.getElementById('root');
  if (root) return root.innerHTML;
  return document.body.innerHTML;
}

function dateStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildExportHTML(screenName: string): string {
  const css = collectAllCSS() + '\n' + EXPORT_OVERRIDES_CSS;
  const dom = captureDOM();
  const now = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="TrackSphere screen export — ${screenName} — generated ${now}">
  <title>${screenName} Export ${dateStamp()}</title>
  <style>
${css}
  </style>
</head>
<body>

<body style="overflow: unset;">
  <div id="root">${dom}</div>

</body>

</body>
</html>`;
}

function triggerDownload(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExportScreenOptions {
  /** Logical name of the screen, used in filename and title. */
  screenName?: string;
}

export function exportCurrentScreen(options?: ExportScreenOptions): void {
  const screenName = options?.screenName || 'TrackSphere';
  const html = buildExportHTML(screenName);
  const filename = `${screenName.replace(/\s+/g, '_')}_Export_${dateStamp()}.html`;
  triggerDownload(html, filename);
}
