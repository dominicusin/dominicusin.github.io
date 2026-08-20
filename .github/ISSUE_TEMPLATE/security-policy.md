---
title: 'Security Policy'
name: Security Policy
about: Report a security vulnerability
labels: security
 assignees: ''
---

## Security Policy

### Supported Versions

| Version | Supported |
| ------- | --------- |
| >= 2.0.0 | :white_check_mark: |
| < 2.0.0 | :x: |

### Reporting a Vulnerability

Please report security vulnerabilities by creating a private security advisory:

1. Go to the **Security** tab of this repository
2. Click **Report a Vulnerability**
3. Fill out the security advisory form

**Important:** Do NOT file public issues for security vulnerabilities.

We will:
- Acknowledge your report within 48 hours
- Provide a more detailed response within 7 days
- Keep you informed of the progress towards resolution
- Credit you in the security advisory (if desired)

### Security Updates

Security fixes are released as patch versions. We recommend:
- Pinning to a specific version in your deployment
- Subscribing to repository releases for security updates
- Reviewing release notes for security patches

### Common Vulnerability Fixes

Our project receives regular security updates through Dependabot. Key updates include:
- **Dependencies**: Regularly updated to address CVEs
- **Build tools**: Hugo, Node.js, and npm packages kept current
- **Content sanitization**: XSS protection for generated content

Thank you for helping keep this project and its users safe!