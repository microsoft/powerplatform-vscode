/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { execSync } from 'child_process';
import fs from 'fs';

function getPacCliVersion() {
  try {
    const gulpfile = fs.readFileSync('gulpfile.mjs', 'utf8');
    const match = gulpfile.match(/const\s+cliVersion\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function getMergedPRsSinceDate(days = 30) {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  try {
    const prsJson = execSync(
      `gh pr list --state merged --base main --json number,title,mergedAt,labels,author --limit 50`,
      { encoding: 'utf8' }
    );
    const prs = JSON.parse(prsJson);
    return prs.filter(pr => new Date(pr.mergedAt) > new Date(sinceDate));
  } catch (e) {
    console.error('Error fetching PRs:', e.message);
    return [];
  }
}

function categorizePRs(prs) {
  const categories = {
    features: [],
    bugFixes: [],
    maintenance: []
  };
  prs.forEach(pr => {
    const labels = pr.labels.map(l => l.name.toLowerCase());
    const title = pr.title.toLowerCase();
    if (labels.includes('bug') || title.includes('fix') || title.includes('bug')) {
      categories.bugFixes.push(pr);
    } else if (labels.includes('enhancement') || labels.includes('feature') || title.includes('add') || title.includes('feature')) {
      categories.features.push(pr);
    } else {
      categories.maintenance.push(pr);
    }
  });
  return categories;
}

function generateReleaseNotes(version) {
  const pacVersion = getPacCliVersion();
  const prs = getMergedPRsSinceDate(30);
  const categorized = categorizePRs(prs);

  let notes = `## ${version}\n`;
  if (pacVersion) {
    notes += `- pac CLI ${pacVersion}, (see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))\n`;
  } else {
    notes += '- pac CLI update\n';
  }

  if (categorized.features.length > 0) {
    notes += '- New Features\n';
    categorized.features.forEach(pr => {
      notes += `  - ${pr.title} [#${pr.number}](https://github.com/microsoft/powerplatform-vscode/pull/${pr.number})\n`;
    });
  }

  if (categorized.bugFixes.length > 0) {
    notes += '- Bug Fixes\n';
    categorized.bugFixes.forEach(pr => {
      notes += `  - ${pr.title} [#${pr.number}](https://github.com/microsoft/powerplatform-vscode/pull/${pr.number})\n`;
    });
  }

  if (categorized.maintenance.length > 0) {
    notes += '- Maintenance\n';
    categorized.maintenance.forEach(pr => {
      notes += `  - ${pr.title} [#${pr.number}](https://github.com/microsoft/powerplatform-vscode/pull/${pr.number})\n`;
    });
  }

  notes += '\n';
  return notes;
}

// CLI usage
if (require.main === module) {
  const version = process.argv[2];
  if (!version) {
    console.error('Usage: node generate-release-notes.js <version>');
    process.exit(1);
  }
  console.log(generateReleaseNotes(version));
}

export { generateReleaseNotes };
