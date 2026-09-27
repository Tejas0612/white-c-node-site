# WHITEC hosting migration

Status: local migration preparation. No replacement deployed, no GoDaddy DNS changed, and no Vercel subscription cancelled.

## Current service

- Site: https://white-c.in
- Domain/DNS: GoDaddy (confirmed by owner).
- Repository: https://github.com/Tejas0612/white-c-node-site
- Database, product images and team sessions: existing Supabase project, retained.
- Target candidate: Render Free, Docker runtime, Singapore region.

## Free-plan decision

Render Free can run the Node.js app and native Poppler PDF converter. It sleeps after 15 idle minutes and can take about a minute to restart. Render explicitly recommends free instances for previews, not production. Bandwidth/build limits, restart behaviour, and outbound external-database traffic limits also apply. This is a zero-monthly-compute-cost candidate, not a promise of unlimited hosting or production reliability. Do not add a paid plan or enable spend without owner approval.

Keep the existing Supabase database. Render's free PostgreSQL expires after 30 days and is not a replacement for production customer data. OpenAI, WhatsApp and email provider usage remain separate from web-hosting fees.

Sources checked 2026-09-21:
- https://render.com/docs/free
- https://render.com/docs/docker
- https://render.com/docs/custom-domains
- https://developers.cloudflare.com/workers/platform/limits/
- https://docs.netlify.com/build/functions/configuration/

## Deploy staging

1. Review the changes, commit the hosting files to the WHITEC repository and push the chosen branch. Do not include personal invitation files, backups, .env files or generated mobile build folders.
2. Sign into Render. Create a Blueprint from this repository and branch using `render.yaml`. Confirm **Free** before creating a service. Automatic deployment is disabled so other work does not unexpectedly release.
3. Copy the existing environment values into Render's private environment settings. Never put secrets in a document, chat, repository, Docker build argument or screenshot. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public configuration and must be present at build time as well as runtime. The service-role, OpenAI, Resend and WhatsApp credentials are runtime-only. The Dockerfile uses inert placeholders during build.
4. Preserve the actual WhatsApp API version/template language from the current deployment, including `WHATSAPP_API_VERSION` if set. If the current webhook uses `META_APP_SECRET`, set the equivalent value as `WHATSAPP_APP_SECRET`. Preserve any optional provider settings listed by `hosting:check`.
5. Build the Docker service. Poppler is installed in the runtime image; Next.js runs as a non-root user on `$PORT` and `0.0.0.0`.
6. Run `npm run hosting:check -- --url https://ACTUAL-SERVICE.onrender.com` against the URL Render assigns. The script never prints secret values or submits enquiries.
7. Test individual team login and logout, catalog images/filtering, inquiry creation, AI/fallback GiftMatch, brochure conversion/import, quotation generation and private order access. Messaging tests must use explicitly approved recipients. Verify the first request after 15 idle minutes and decide whether that experience is acceptable before routing clients here.

## Cutover gate

- Obtain a hosted preview that passes checks.
- Back up current GoDaddy DNS records, particularly apex/www, MX and mail-related TXT/CNAME records.
- Add `white-c.in` and the chosen `www` alias to Render. Use only the DNS records issued by Render for this service; do not guess IPs.
- Change only the relevant website records at GoDaddy. Preserve email and domain-verification records. Verify HTTPS, apex/www behaviour, and the same application tests on the live domain.
- Confirm Meta's WhatsApp callback still reaches `/api/whatsapp/webhook` on the correct HTTPS domain. If the current callback uses a Vercel hostname, update it and verify its challenge after the new deployment is live. Retain email sender domain settings.
- Keep Vercel available for rollback during DNS propagation. Only after successful live verification should the owner downgrade/cancel the paid Vercel plan. Deploying to Render by itself does not stop Vercel billing.

## Rollback

Restore the exact saved GoDaddy website DNS records to the existing Vercel deployment and restore any changed callback URL. No database migration is involved. Preserve both deployments and the verified local backup until the cutover is stable.

## Next phases (in the owner's order)

2. Team login: link workflow members to actual admin accounts, password recovery, WhatsApp OTP, account/session controls and enforced access rules.
3. Client experience: guided gifting, real inventory/brand matching, concierge handoff, delivery/recipient feedback, and configurable reward milestones.
4. Android/iOS: replace the placeholder app URL, implement/test device flows and prepare signed releases. Store accounts and review are separate launch gates.

## Recovery investigation — 27 September 2026

- Verified local source backup: `.backups/whitec-before-cost-recovery-20260927-150014.tar.gz` (1,614 files, includes Git and local configuration).
- Supabase notice dated 25 September reports **egress**, not storage: 13.11 GB / 5.5 GB, restriction warning after 28 September. This is a dated reading, not a live meter. Optimizing cannot reverse egress already consumed; the current billing period/reset or provider support must resolve the restriction.
- Read-only storage metadata: 37 files, 3,280,945 bytes. Database size: 13,995,155 bytes.
- `pg_stat_statements`: 3,476,234 calls to the active-products catalogue query since stats reset 14 June. This identifies a heavily repeated query; it does not prove whether bots or real customers caused the requests.
- Both live homepage and catalogue returned HTTP 200 during investigation. Vercel still serves the domain; its 24 September email warns of failed payment and shutdown. This is not proof of full application health.
- Changes: cache only public catalogue reads for 300 seconds; explicit public fields; 24 cards per page; disable catalogue prefetch; lazy images; lower generated JPEG quality and long cache lifetime for versioned image paths. Invalidate public cache on catalogue writes.
- Paid GiftMatch AI now requires `GIFTMATCH_AI_ENABLED=true`; default matching does not call a paid model. When enabled, failed or exhausted per-IP rate checks fall back to built-in matching. This is not an account-wide provider spending cap. Brochure extraction remains an explicit, authenticated paid action.
- `/admin/control-center` is Owner-only (Admin role alone is insufficient). Live checks are bounded; historic provider readings are dated. Budget entries are browser-local estimates with JSON export, not real billing sync. No private credentials are displayed.
- No production database rows, files, plans, or DNS records were deleted/changed by this investigation.
