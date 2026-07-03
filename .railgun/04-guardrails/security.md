# Security Rail

## Secrets & Credentials
- NEVER hardcode API keys, passwords, tokens, or database connection strings in source code
- All secrets MUST be injected via environment variables or a dedicated secrets manager
- Never commit `.env` files or local configuration containing real credentials
- Rotate exposed secrets immediately if accidental commit occurs

## User Input
- Treat all user input as untrusted
- Validate input at the system boundary (API layer, form handler) before processing
- Sanitize data before rendering or storage to prevent injection attacks
- Use parameterized queries; never concatenate user input into SQL or shell commands

## Authentication & Authorization
- Verify identity on every protected endpoint or action
- Check authorization AFTER authentication — know WHO they are, then WHAT they can do
- Never rely on client-side checks alone; enforce access control server-side

## Logging & Errors
- NEVER log sensitive data: passwords, tokens, credit card numbers, SSNs
- Error messages sent to the client MUST be generic; log detailed stack traces server-side only
- Include correlation IDs in logs for traceability without exposing user identity

## Dependencies
- Review new dependencies for known vulnerabilities before adding them
- Pin dependency versions; avoid wildcard or auto-update ranges in production
- Keep dependencies updated; stale dependencies are a common attack vector
