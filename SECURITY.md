# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| < 2.0.0 | :x:                |

We actively maintain security updates for the current major version.

## Reporting a Vulnerability

We take security seriously. Please follow responsible disclosure:

### How to Report

1. **GitHub Security Advisory** (Preferred)
   - Go to the **Security** tab → **Security advisories** → **New security advisory**
   - Report privately; details won't be public until fixed

2. **Email**
   - Send details to: `dominicusin@proton.me`
   - Include: vulnerability description, affected versions, possible exploitation

### What to Expect

- **Initial response**: Within 48 hours
- **Detailed response**: Within 7 days
- **Progress updates**: Regular communication
- **Credit**: Acknowledged in security advisory (with your permission)

### What NOT to Do

- Don't create public issues for vulnerabilities
- Don't attempt to exploit vulnerabilities
- Don't share vulnerability details publicly before resolution

## Security Updates

Security fixes are released as patch versions (SemVer). We recommend:

- Pin to exact versions in production
- Subscribe to GitHub release notifications
- Review changelogs before upgrading

## Vulnerability Management

### Dependency Updates

We use Dependabot for automated dependency updates:

- **npm dependencies**: Weekly updates
- **GitHub Actions**: Weekly updates  
- **Ruby dependencies**: Weekly updates

All dependency updates are tested automatically via CI.

### Known Vulnerabilities & Fixes

Recent security patches include:

| Package | Severity | Fix |
|---------|----------|-----|
| `hardhat` | High | v3.13.0+ |
| `lighthouse` | High | v13.4.1+ |
| `puppeteer-core` | High | v24.43.1+ |
| `undici` | High | v6.28.0+ |
| `html-minifier` | High | Addressed via build config |

### Build-Time Security

Our build pipeline includes multiple security layers:

- **Content sanitization**: Generated GitHub content is filtered for XSS
- **Hugo security config**: Follows Hugo's security guidelines
- **Node.js security**: Modern Node.js with security patches

## Security Best Practices for Contributors

1. **Never commit secrets**: Use GitHub Secrets for sensitive data
2. **Review PRs carefully**: Check for secrets, security issues
3. **Keep dependencies updated**: Accept Dependabot PRs
4. **Validate input**: Always sanitize user-provided content
5. **Use linters**: ESLint catches potential issues

## Security Scanning

This repository uses:

- **GitHub Secret Scanning**: Detects secrets in commits
- **CodeQL**: Static analysis for code vulnerabilities
- **Dependabot**: Automated dependency scanning
- **npm audit**: Dependency vulnerability detection

## Contact

For security matters, contact `dominicusin@proton.me` or use GitHub's
security features.

---

*Last updated: 2025*