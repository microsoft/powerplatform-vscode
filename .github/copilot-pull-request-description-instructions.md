# Pull Request Description Guidelines

Title Format: `<type>(<scope>): <description>`

- `<type>`: One of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.
- `<scope>`: Required. Affected module or feature (e.g., `auth`, `api`). Use `kebab-case`.
- `<description>`: Required. See [Description](#description) for details on how to write it.

## Examples

- `feat(auth): Add OAuth2 Login`
- `fix(db): Resolve Transaction Deadlock`
- `chore(ci): Update GitHub Actions`

---

## Description

1. Explain what has changed in this PR.
2. Explain why was was this change done.
3. Use bullet points for description.

---

## Testing

Describe how this was tested.

Example:

- Unit tests added for OAuth2.
- Manual login tests with Google and Facebook.

---

### Strict Best Practices

- Keep it technical and concise.
- No vague or generic descriptions.
