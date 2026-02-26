# Security Policy

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

If you discover a security vulnerability, please disclose it privately using
[GitHub's private vulnerability reporting](../../security/advisories/new).

Include as much of the following as possible:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You can expect an initial response within **5 business days**.

## Scope

Vulnerabilities we want to hear about:

- Credential or API key leakage
- SQL injection in `backend/models.py`
- Unauthorized access to run history or provider configuration
- Server-side request forgery via LLM provider endpoints

## Out of Scope

- Rate limiting / DoS on a self-hosted instance
- Issues that require physical access to the server
- Vulnerabilities in third-party LLM provider APIs (report those to the provider)

## Credential Safety Note for Self-Hosters

Never commit your `backend/.env` file. It is excluded by `.gitignore`. If you
accidentally expose credentials (database URL, Flask secret key, or API keys),
rotate them immediately:

- **Supabase**: Dashboard → Settings → Database → Reset password
- **Flask secret key**: Generate a new random value with
  `python -c "import secrets; print(secrets.token_hex(32))"`
- **LLM API keys**: Rotate in each provider's dashboard
