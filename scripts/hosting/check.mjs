import { existsSync, readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

try { process.loadEnvFile('.env.local') } catch {}
const required = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY']
const integrations = ['OPENAI_API_KEY','RESEND_API_KEY','RESEND_FROM_EMAIL','INQUIRY_RECEIVER_EMAIL','WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_ACCESS_TOKEN','WHATSAPP_APP_SECRET','WHATSAPP_VERIFY_TOKEN','WHATSAPP_TASK_TEMPLATE_NAME','WHATSAPP_ENQUIRY_TEMPLATE_NAME','WHATSAPP_PROPOSAL_TEMPLATE_NAME']
let failed = false
for (const key of required) {
  const present = Boolean(process.env[key]?.trim())
  console.log(`${present ? 'PASS' : 'FAIL'} required setting: ${key}`)
  if (!present) failed = true
}
for (const key of integrations) console.log(`${process.env[key]?.trim() ? 'SET' : 'MISSING'} integration setting: ${key}`)
for (const file of ['Dockerfile','.dockerignore','render.yaml']) {
  assert.ok(existsSync(file), `${file} is missing`)
}
const dockerIgnore = readFileSync('.dockerignore','utf8').split('\n')
for (const entry of ['.backups','.env','.env.*','wedding-invites','.git']) assert.ok(dockerIgnore.includes(entry), `Docker context must exclude ${entry}`)
assert.match(readFileSync('Dockerfile','utf8'), /poppler-utils/)
assert.match(readFileSync('render.yaml','utf8'), /plan: free/)
console.log('PASS deployment configuration and private-file exclusions')
const urlIndex = process.argv.indexOf('--url')
if (urlIndex !== -1) {
  const url = new URL(process.argv[urlIndex+1])
  assert.ok(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname)), 'Use HTTPS or local HTTP')
  for (const path of ['/api/health','/','/catalog','/admin/login']) {
    const r = await fetch(new URL(path,url), {signal:AbortSignal.timeout(90_000), redirect:"manual"})
    assert.equal(r.status,200,`${path}: ${r.status}`)
    if (path === '/api/health') assert.equal((await r.json()).status,'ok')
    else assert.match(r.headers.get('content-type')||'',/text\/html/)
    assert.equal(r.headers.get('x-content-type-options'),'nosniff')
    console.log(`PASS ${path}`)
  }
  console.log('Read-only route checks passed. Login, PDF import, messaging and cold-start checks still require an authenticated staging session.')
}
if (failed) process.exitCode = 1
