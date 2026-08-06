# Premium bypass hardening

## Context / key findings

- Premium state lives on `IAdsService` subjects (`hasPremiumSub$$`, `enablePremiumFeatures$$`, `currentPlan$$`) in [ads-service.interface.ts](../libs/shared/framework/core/src/lib/services/ads-service.interface.ts) — NOT on `user$$` (identity only). The crack's unlock module flips these subjects.
- The crack (FirestoneAzai) is Overwolf-specific (it byte-patches `OverWolf.Client.Core.dll` to open the CEF debug port, then attaches over CDP and injects JS), so the Overwolf [ad.service.ts](../libs/legacy/feature-shell/src/lib/js/services/ad.service.ts) is the primary target.
- Detection already exists but only reports: [membership-integrity.service.ts](../libs/shared/common/service/src/lib/services/subscription/membership-integrity.service.ts) already reconciles `hasPremiumSub$$===true` against a fresh Tebex+legacy check, probes debug ports 9222/9223/9229, runs a devtools heuristic, and POSTs to a logging lambda. It never changes behavior.
- Almost all premium features only gate _display_ of data fetched from public CDN JSON (`static.zerotoheroes.com/api/...`) — not server-hardenable without a costly re-architecture.

## Expectations / honesty

- These are **speed bumps**: an attacker running JS in the renderer can eventually neutralize them. Their value is raising attacker cost and forcing the seller to keep re-shipping payloads.
- Degrade is gated behind N consecutive server checks confirming no-sub, so SSO-hint / Tebex latency races and transient network errors can't cause a false degrade of legit premium users. Because HS games/sessions run several minutes, a slow (multi-poll) degrade is acceptable.

## Work item 1 (client) — Active degrade via IAdsService latch

- Add a latch to `IAdsService` (e.g. `bypassDetected$$` + `forceNonPremium(reason)`) in [ads-service.interface.ts](../libs/shared/framework/core/src/lib/services/ads-service.interface.ts).
- Implement in Overwolf [ad.service.ts](../libs/legacy/feature-shell/src/lib/js/services/ad.service.ts) (and mirror in [standalone-ad.service.ts](../libs/shared/common/service/src/lib/services/standalone-ad.service.ts) for completeness): when latched, force `hasPremiumSub$$` and `enablePremiumFeatures$$` to `false`, and re-assert `false` on every `currentPlan$$` / lottery emission so a one-shot re-flip is undone.
- Acceptance: once latched, injected premium flags cannot re-enable premium features.

## Work item 2 (client) — Confirm-over-multiple-polls before degrading

- In [membership-integrity.service.ts](../libs/shared/common/service/src/lib/services/subscription/membership-integrity.service.ts), track a `consecutiveMismatches` counter. On each `verify()` poll: increment only when `hasPremiumSub$$===true` AND a fresh `serverHasPremium()` returns `false`; reset to 0 on any premium result OR any network/error (`serverHasPremium` already returns `true` on error, so errors won't count as mismatches).
- Keep the existing `report()` on first confirmed mismatch (so telemetry still fires early), but only call `ads.forceNonPremium('membership-bypass')` once `consecutiveMismatches >= 4`.
- Cadence: lower `CHECK_INTERVAL` to 30–60s and require **4** consecutive failing checks -> degrade lands ~2–4 min into a session (acceptable given HS games run several minutes). The existing `RECHECK_DELAY` second-check can be dropped since the counter now provides the debounce.
- Confirm `MembershipIntegrityService` is actually instantiated on the Overwolf build (the crack's target) before relying on degrade there.
- Acceptance: a single transient "no premium" reply never degrades; N consecutive confirmed no-sub replies do.

## Work item 3 (client, speed bumps) — Tamper resistance

- Periodic re-assertion loop in the ad service that recomputes `enablePremiumFeatures$$` from the authoritative `currentPlan$$` (server truth) on an interval, so a bare `.next(true)` on the public subject is overwritten within N seconds.
- Optional: add a non-enumerable honeypot property on the exposed services/user object and report reads that match the crack's `findUserService` scan pattern (iterate `Object.keys`, probe `.user$$.subscribe`). Report via the existing membership-bypass endpoint.
- Note explicitly in code comments that these are anti-tamper speed bumps, not a security boundary.

## Explicitly out of scope

- Remote BGS sim endpoint authentication (dropped — not important).
- Server-side entitlement gating of the public-CDN premium data (stats/meta/mulligan/comps): data is already public and small; re-architecting it behind authenticated endpoints is high-cost / low-durability.
- Overwolf DLL integrity (the port patch) — belongs to Overwolf; file a coordinated report separately.

## Support reply (quiet)

English reference: `app.premium.third-party-auth-tools-unsupported` in firestone-translations.

Suggested wording for support: Premium requires an official Firestone subscription. Third-party “authorization repair” or unlock tools are unsupported and unsafe — they typically request administrator rights and change hosts/firewall rules. Please remove them and subscribe through the official Premium page. Do not name or link specific crack tools in public changelogs.

## Implemented follow-ups (F2G / 2026)

- Membership integrity prefers Firestone `checkStatus` (cached lambda) then Tebex/legacy; expires premium after prolonged unverifiable status; reports `f2gArtifacts` fingerprints.
- Lambda `api-log-membership-bypass`: L1/L2 subscription-check cache + `UPSTREAM_RATE_LIMIT` logging; `action: checkStatus` endpoint.
- Overwolf `AdService` / `StandaloneAdService`: `forceNonPremium` latch + periodic re-assert already wired; `MembershipIntegrityService` bootstrapped from `bootstrap-store-services.service.ts`.
