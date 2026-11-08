// Server-side flags for the UI: which OAuth providers are configured.
export function isGithubEnabled(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}
