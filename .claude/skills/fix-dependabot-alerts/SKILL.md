---
name: fix-dependabot-alerts
description: Fix Dependabot security alerts by updating vulnerable npm dependencies. Use when the user mentions "dependabot", "security alerts", "vulnerability", "CVE", or wants to update packages with security issues.
argument-hint: "[alert-number or package-name]"
---

# Fix Dependabot Security Alerts

You are tasked with fixing Dependabot security alerts for this repository. Follow these steps carefully to resolve vulnerabilities while minimizing risk.

## Step 1: Identify the Vulnerability

If a specific alert number or package name was provided, focus on that. Otherwise, check for open alerts:

```bash
gh api repos/microsoft/powerplatform-vscode/dependabot/alerts --jq '.[] | select(.state=="open") | {number, package: .security_vulnerability.package.name, severity: .security_vulnerability.severity, vulnerable_versions: .security_vulnerability.vulnerable_version_range, patched_versions: .security_vulnerability.first_patched_version.identifier, summary: .security_advisory.summary}'
```

To get details on a specific alert:
```bash
gh api repos/microsoft/powerplatform-vscode/dependabot/alerts/<alert-number>
```

## Step 2: Analyze the Dependency

Determine if the vulnerable package is:
- A **direct dependency** (listed in `package.json`)
- A **transitive dependency** (dependency of a dependency)

Check where the package appears:
```bash
npm ls <package-name>
```

## Step 3: Choose the Fix Strategy

### For Direct Dependencies

1. Check the current version in `package.json`
2. Review the changelog/release notes for breaking changes between versions
3. Update using:
   ```bash
   npm install <package-name>@<patched-version> --save
   ```

### For Transitive Dependencies

1. Identify which direct dependency brings in the vulnerable package
2. Check if the direct dependency has a newer version that uses the patched transitive dependency
3. If yes, update the direct dependency
4. If no, add a resolution/override in `package.json`:
   ```json
   {
     "overrides": {
       "<vulnerable-package>": "<patched-version>"
     }
   }
   ```

## Step 4: Verify the Fix

1. Run `npm ls <package-name>` to confirm the new version
2. Run the build to ensure no breaking changes:
   ```bash
   npm run build
   ```
3. Run the test suite:
   ```bash
   npm test
   ```

## Step 5: Handle Common Issues

### Version Conflicts

If npm reports peer dependency conflicts:
- Check if `--legacy-peer-deps` or `--force` resolves it (use cautiously)
- Consider if the conflicting package needs updating first

### Breaking Changes

If the update introduces breaking changes:
1. Read the migration guide from the package
2. Update code to accommodate API changes
3. Update tests if needed

### Multiple Vulnerabilities in Same Package

If multiple CVEs affect the same package, ensure the patched version addresses all of them before updating.

## Step 6: Commit the Changes

After verification passes, commit with a descriptive message:
```
Fix Dependabot security vulnerability in <package-name>

- Updated <package-name> from <old-version> to <new-version>
- Addresses CVE-XXXX-XXXXX (<severity>)
- <any additional context about breaking changes handled>
```

## Important Notes

- **Never skip tests** - security fixes should not break functionality
- **Review changelogs** - understand what changed between versions
- **Check for multiple alerts** - sometimes one update fixes multiple vulnerabilities
- **Document workarounds** - if you use overrides, add a comment explaining why
- For this codebase, run `npm run build` which uses gulp to build the extension
