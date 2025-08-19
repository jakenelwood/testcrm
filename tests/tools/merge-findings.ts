import fs from 'fs';
import path from 'path';

type Finding = {
  category: string;
  severity: 'low' | 'medium' | 'high';
  page?: string;
  field?: string;
  issue: string;
  details?: string;
  browser?: string;
  generatedAt?: string;
};

type Summary = {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
};

function mergeFindings() {
  const ART_DIR = path.join(process.cwd(), 'tests', 'artifacts');
  const out = path.join(ART_DIR, 'ui-ux-audit-merged.json');

  if (!fs.existsSync(ART_DIR)) {
    console.error('Artifacts directory not found:', ART_DIR);
    process.exit(1);
  }

  const ndjsonFiles = fs
    .readdirSync(ART_DIR)
    .filter((f) => f.startsWith('ui-ux-audit-findings-') && f.endsWith('.ndjson'))
    .map((f) => path.join(ART_DIR, f));

  const findings: Finding[] = [];

  for (const file of ndjsonFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed) as Finding;
        findings.push(obj);
      } catch (e) {
        console.warn('Skipping malformed line in', file);
      }
    }
  }

  const summary: Summary = {
    total: findings.length,
    byCategory: {},
    bySeverity: {},
  };

  for (const f of findings) {
    summary.byCategory[f.category] = (summary.byCategory[f.category] || 0) + 1;
    summary.bySeverity[f.severity] = (summary.bySeverity[f.severity] || 0) + 1;
  }

  const result = { generatedAt: new Date().toISOString(), summary, findings };
  fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf-8');
  console.log('Merged findings written to:', out);
}

mergeFindings();

