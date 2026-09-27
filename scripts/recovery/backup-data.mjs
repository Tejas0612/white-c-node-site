import { createClient } from '@supabase/supabase-js'
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
process.loadEnvFile('.env.local')
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const tables=['products','brochure_crop_profiles','product_images','product_features','products_backup_before_fuzo_dedupe','products_backup_before_fuzo_image_dedupe','products_backup_before_test_product_delete','products_backup_before_remaining_test_delete','products_backup_before_budget_band_update','admin_users','admin_sessions','admin_audit_logs','workflow_team_members','workflow_tasks','workflow_orders','workflow_enquiries','whatsapp_inbound_messages','whatsapp_outbound_messages','product_stock_reports','admin_role_access_matrix','whatsapp_webhook_events','workflow_daily_code_counters','security_rate_limits']
const dir=`.backups/supabase-data-${new Date().toISOString().replaceAll(':','-')}`
await mkdir(dir,{recursive:true,mode:0o700})
const manifest={createdAt:new Date().toISOString(),scope:'Public table rows and storage files. Not a schema, roles or full PostgreSQL dump. Rows captured sequentially, not a transactional snapshot.',tables:[],files:[]}
async function save(name,buffer){await writeFile(`${dir}/${name}`,buffer,{mode:0o600});return createHash('sha256').update(buffer).digest('hex')}
for(const table of tables){let rows=[];for(let from=0;;from+=500){const {data,error}=await client.from(table).select('*').range(from,from+499);if(error)throw new Error(`${table}: ${error.code}`);rows.push(...data);if(data.length<500)break}const buffer=Buffer.from(JSON.stringify(rows));manifest.tables.push({name:table,rows:rows.length,sha256:await save(`${table}.json`,buffer)})}
const {data:buckets,error}=await client.storage.listBuckets();if(error)throw new Error('Bucket list failed')
for(const bucket of buckets){async function walk(prefix=''){for(let offset=0;;offset+=100){const {data,error}=await client.storage.from(bucket.id).list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});if(error)throw new Error('Storage list failed');for(const item of data){const path=prefix?`${prefix}/${item.name}`:item.name;if(!item.id){await walk(path);continue}const {data:blob,error}=await client.storage.from(bucket.id).download(path);if(error)throw new Error('Storage download failed');const buffer=Buffer.from(await blob.arrayBuffer());const name=`asset-${manifest.files.length}.bin`;manifest.files.push({bucket:bucket.id,path,file:name,bytes:buffer.length,sha256:await save(name,buffer)})}if(data.length<100)break}}await walk()}
await save('manifest.json',Buffer.from(JSON.stringify(manifest,null,2)))
console.log(`Verified export written: ${dir}; ${manifest.tables.length} tables, ${manifest.files.length} files. No live data changed.`)
