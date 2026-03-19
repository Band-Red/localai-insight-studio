# Security Policy

## Supported Versions

Currently supported versions for security updates.

| Version | Supported          |
| ------- | ------------------ |
| 6.0.x   | :white_check_mark: |
| < 6.0.x | :x:                |

## Reporting a Vulnerability

We take the security of LocalAI Insight Studio seriously. If you discover a security vulnerability, please do NOT open a public issue. Instead, follow the process below:

1. **Email us**: Send a detailed report to security@localai-insight-studio.com.
2. **Details to include**:
   - Description of the vulnerability.
   - Steps to reproduce.
   - Potential impact.
   - (Optional) Suggested fix or mitigation.

Alternatively, you can report vulnerabilities via the GitHub "Report a vulnerability" button on the security tab of this repository.

### Response Time
We will acknowledge your report within 48 hours and provide a timeline for a resolution. We request you to follow responsible disclosure practices and give us time to address the issue before making it public.

---

### Recent Advisory: CVE-2026-26996 (minimatch)
We are aware of the ReDoS vulnerability in `minimatch` (fixed in versions 3.1.2+, 5.1.0+, 9.0.5+, and 10.2.2+). We are actively updating our dependency tree to ensure the project remains secure.
