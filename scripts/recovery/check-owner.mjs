import assert from 'node:assert/strict'
import ts from 'typescript'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
const require=createRequire(import.meta.url)
let role='Owner';let reads=0
const redirects=[]
const mocks={
 'next/link':({children,href,prefetch,...props})=>React.createElement('a',{href,...props},children),
 'next/navigation':{redirect:path=>{redirects.push(path);throw new Error('redirect')}},
 '@/lib/admin-auth':{requireAdminUser:async()=>({id:'test-owner',role,roles:[]})},
 '@/lib/supabase-admin':{supabaseAdmin:{from:()=>({select:()=>({limit:()=>({abortSignal:async()=>{reads++;return {error:null}}})})})}},
 './actions':{refreshCatalogue:async()=>{}},
}
function load(path){const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const module={exports:{}};vm.runInNewContext(code,{module,exports:module.exports,require:id=>id in mocks?mocks[id]:require(id),process:{env:{}},fetch:async()=>({ok:true,status:200,headers:new Headers({server:'Test fixture'})}),AbortSignal,Date,console});return module.exports}
mocks['./planner']=load('app/admin/control-center/planner.tsx')
const Page=load('app/admin/control-center/page.tsx').default
role='Admin';await assert.rejects(Page(),/redirect/);assert.equal(reads,0);assert.deepEqual(redirects,['/admin/workflow'])
console.log('PASS Admin without Owner role cannot load owner service data')
role='Owner';const element=await Page();const html=renderToStaticMarkup(element);assert.equal(reads,1);assert.match(html,/Your service &amp; cost centre/);assert.match(html,/not connected invoices/)
console.log('PASS Owner dashboard renders; estimates are clearly labelled')
mkdirSync('/tmp/whitec-dashboard-qa',{recursive:true})
const css=readdirSync('.next/static/css').filter(f=>f.endsWith('.css'))
for(const f of css)copyFileSync(`.next/static/css/${f}`,`/tmp/whitec-dashboard-qa/${f}`)
writeFileSync('/tmp/whitec-dashboard-qa/index.html',`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css.map(f=>`<link rel="stylesheet" href="/${f}">`).join('')}</head><body>${html}</body></html>`)
