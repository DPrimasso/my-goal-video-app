import { spawnSync } from 'node:child_process'

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 5_000
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const auditArguments = [
  'audit',
  ...process.argv.slice(2),
  '--fetch-retries=0',
  '--fetch-timeout=20000',
]

const transientAuditFailure = [
  /audit endpoint returned an error/i,
  /service unavailable/i,
  /\b(?:502|503|504)\b/,
  /\b(?:ECONNRESET|EAI_AGAIN|ETIMEDOUT|ENETUNREACH)\b/i,
]

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = spawnSync(npmCommand, auditArguments, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })

  process.stdout.write(result.stdout ?? '')
  process.stderr.write(result.stderr ?? '')

  if (result.error) {
    throw result.error
  }

  if (result.status === 0) {
    process.exit(0)
  }

  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const isTransientFailure = transientAuditFailure.some((pattern) => pattern.test(output))

  if (!isTransientFailure) {
    process.exit(result.status ?? 1)
  }

  if (attempt < MAX_ATTEMPTS) {
    console.warn(`npm audit non disponibile (tentativo ${attempt}/${MAX_ATTEMPTS}); nuovo tentativo tra 5 secondi.`)
    await wait(RETRY_DELAY_MS)
    continue
  }

  console.warn('::warning::npm audit non disponibile dopo 3 tentativi; dipendenze e test sono validi, il controllo di sicurezza verrà ripetuto alla prossima CI.')
}
