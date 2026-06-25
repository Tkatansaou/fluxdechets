import { readFileSync } from 'fs'
import { spawnSync } from 'child_process'

const env = { ...process.env }
try {
  const lines = readFileSync('.env.local', 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$/)
    if (m) env[m[1]] = m[2]
  }
} catch {}

const args = process.argv.slice(2)
const result = spawnSync('npx', ['prisma', ...args], { stdio: 'inherit', env, shell: true })
process.exit(result.status ?? 1)
