// Fails the build when vercel.json's Content-Security-Policy would break or weaken the app:
//  - the API origin from .env.production must be allowed in connect-src
//  - script-src must not allow inline or eval'd scripts
// Run: npm run check:csp
import { readFileSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const vercel = JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8'))
const env = readFileSync(new URL('.env.production', root), 'utf8')

const problems = []

const csp = (vercel.headers ?? [])
  .flatMap((rule) => rule.headers)
  .find((header) => header.key.toLowerCase() === 'content-security-policy')?.value

if (!csp) {
  problems.push('vercel.json has no Content-Security-Policy header')
} else {
  const directives = Object.fromEntries(
    csp.split(';').map((part) => part.trim().split(/\s+/)).filter((words) => words[0]).map(([name, ...values]) => [name, values])
  )

  const apiUrl = env.match(/^VITE_API_URL=(.+)$/m)?.[1]?.trim()
  if (!apiUrl) {
    problems.push('.env.production does not define VITE_API_URL')
  } else if (/^https?:\/\//.test(apiUrl)) {
    const origin = new URL(apiUrl).origin
    if (!(directives['connect-src'] ?? []).includes(origin)) {
      problems.push(`connect-src does not allow the API origin ${origin} (update vercel.json when the API URL changes)`)
    }
  } else if (!(directives['connect-src'] ?? []).includes("'self'")) {
    problems.push("VITE_API_URL is same-origin but connect-src does not include 'self'")
  }

  for (const unsafe of ["'unsafe-inline'", "'unsafe-eval'", '*', 'data:', 'http:', 'https:']) {
    if ((directives['script-src'] ?? directives['default-src'] ?? []).includes(unsafe)) {
      problems.push(`script-src allows ${unsafe}`)
    }
  }
  for (const [name, expected] of [['object-src', "'none'"], ['frame-ancestors', "'none'"], ['base-uri', "'self'"]]) {
    if (!(directives[name] ?? []).includes(expected)) problems.push(`${name} should be ${expected}`)
  }
}

if (problems.length) {
  console.error('CSP check failed:\n' + problems.map((p) => '  - ' + p).join('\n'))
  process.exit(1)
}
console.log('CSP check passed')
